import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { isPrintableFileUrl, sliceModel, Slant3DError } from "../_shared/slant3d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: userData } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const productId = typeof body?.product_id === "string" ? body.product_id : null;
    let fileUrl = typeof body?.file_url === "string" ? body.file_url : null;

    let product: {
      id: string;
      designer_id: string;
      print_file_url: string | null;
      model_url: string | null;
      manufacturing_method: string;
    } | null = null;

    if (productId) {
      const { data, error } = await admin
        .from("designer_products")
        .select("id, designer_id, print_file_url, model_url, manufacturing_method")
        .eq("id", productId)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "Product not found" }, 404);
      product = data;
      fileUrl = fileUrl ?? data.print_file_url ?? data.model_url;
    }

    if (!fileUrl) {
      return json({ error: "No printable file available for this design" }, 400);
    }
    if (!/^https:\/\//i.test(fileUrl)) {
      return json({ error: "File URL must be a public https URL" }, 400);
    }
    if (!isPrintableFileUrl(fileUrl)) {
      return json(
        {
          error:
            "Slant 3D needs an .stl, .3mf or .obj file. Upload a print-ready mesh for this design first.",
        },
        400,
      );
    }

    let price: number;
    try {
      price = await sliceModel(fileUrl);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (product) {
        await admin
          .from("designer_products")
          .update({ slant3d_quote_error: message.slice(0, 500), slant3d_quoted_at: new Date().toISOString() })
          .eq("id", product.id);
      }
      return json({ error: message }, e instanceof Slant3DError ? e.status : 502);
    }

    if (product) {
      // Persist only for the owning creator or an admin.
      const [{ data: profile }, { data: isAdmin }] = await Promise.all([
        admin.from("designer_profiles").select("id").eq("id", product.designer_id).eq("user_id", user.id).maybeSingle(),
        admin.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      if (profile || isAdmin === true) {
        await admin
          .from("designer_products")
          .update({
            slant3d_price_usd: price,
            slant3d_quoted_at: new Date().toISOString(),
            slant3d_quote_error: null,
            print_file_url: fileUrl,
          })
          .eq("id", product.id);
      }
    }

    return json({ price_usd: price, file_url: fileUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("slant3d-quote error:", message);
    return json({ error: message }, e instanceof Slant3DError ? e.status : 500);
  }
});