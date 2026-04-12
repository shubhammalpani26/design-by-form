import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all products with base64 image_urls
    const { data: products, error } = await supabase
      .from("designer_products")
      .select("id, name, image_url")
      .not("image_url", "is", null)
      .like("image_url", "data:%");

    if (error) throw error;

    const results: { id: string; name: string; status: string; newUrl?: string }[] = [];

    for (const product of products || []) {
      try {
        const base64String = product.image_url as string;
        
        // Parse the data URI
        const matches = base64String.match(/^data:([^;]+);base64,(.+)$/s);
        if (!matches) {
          results.push({ id: product.id, name: product.name, status: "skip: invalid format" });
          continue;
        }

        const mimeType = matches[1];
        const base64Data = matches[2];
        const extension = mimeType.split("/")[1] === "png" ? "png" : "jpg";
        const fileName = `products/${product.id}.${extension}`;

        // Decode base64 to binary
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(fileName, bytes.buffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (uploadError) {
          results.push({ id: product.id, name: product.name, status: `upload error: ${uploadError.message}` });
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);

        // Update product record
        const { error: updateError } = await supabase
          .from("designer_products")
          .update({ image_url: urlData.publicUrl })
          .eq("id", product.id);

        if (updateError) {
          results.push({ id: product.id, name: product.name, status: `update error: ${updateError.message}` });
          continue;
        }

        results.push({ id: product.id, name: product.name, status: "migrated", newUrl: urlData.publicUrl });
      } catch (e) {
        results.push({ id: product.id, name: product.name, status: `error: ${e.message}` });
      }
    }

    return new Response(JSON.stringify({ migrated: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
