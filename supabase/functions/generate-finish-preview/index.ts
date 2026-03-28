import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productId, productImageUrl, productName, finishName } = await req.json();

    if (!productId || !productImageUrl || !finishName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check cache first
    const { data: cached } = await supabase
      .from("product_finish_images")
      .select("image_url")
      .eq("product_id", productId)
      .eq("finish_name", finishName)
      .maybeSingle();

    if (cached?.image_url) {
      return new Response(
        JSON.stringify({ imageUrl: cached.image_url, cached: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate with AI
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const finishDescriptions: Record<string, string> = {
      "Matte Black": "a sleek matte black finish with no shine, deep charcoal-black color",
      "Glossy White": "a bright glossy white lacquered finish with subtle reflections",
      "Walnut": "a rich warm walnut wood grain finish with natural wood texture",
      "Concrete": "a raw industrial concrete/cement grey finish with subtle texture",
    };

    const finishDesc = finishDescriptions[finishName] || finishName;

    const prompt = `You are a professional product photographer and 3D rendering expert. 
Take this furniture product image and re-render it with ${finishDesc}. 

CRITICAL RULES:
- Keep the EXACT same furniture shape, angle, proportions, and pose
- Keep the EXACT same background - do NOT change, add, or modify the background in any way
- Only change the surface material/finish/color of the furniture piece itself
- Maintain all shadows and lighting direction
- The result should look like a professional product photo of the same piece in the new finish
- Product name: ${productName || "furniture piece"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: productImageUrl } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate finish preview" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    let generatedImageUrl: string | null = null;

    // Extract image URL from response
    const choices = result.choices || [];
    for (const choice of choices) {
      const content = choice.message?.content;
      if (Array.isArray(content)) {
        for (const part of content) {
          if (part.type === "image_url" && part.image_url?.url) {
            generatedImageUrl = part.image_url.url;
            break;
          }
        }
      }
      if (generatedImageUrl) break;
    }

    if (!generatedImageUrl) {
      console.error("No image in AI response:", JSON.stringify(result).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "AI did not return an image. Try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Cache the result
    await supabase
      .from("product_finish_images")
      .upsert({
        product_id: productId,
        finish_name: finishName,
        image_url: generatedImageUrl,
      }, { onConflict: "product_id,finish_name" });

    return new Response(
      JSON.stringify({ imageUrl: generatedImageUrl, cached: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-finish-preview error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
