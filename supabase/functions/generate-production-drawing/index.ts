import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageUrl, productName, category, dimensions } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let absoluteImageUrl = imageUrl as string;
    if (absoluteImageUrl.startsWith("/")) {
      const origin = req.headers.get("origin") || "https://nyzora.ai";
      absoluteImageUrl = `${origin}${absoluteImageUrl}`;
    }

    const dimsText = dimensions
      ? `Approximate dimensions: ${dimensions.length}cm (W) × ${dimensions.breadth}cm (D) × ${dimensions.height}cm (H).`
      : "";

    const prompt = `Convert the supplied furniture reference image into a clean, professional engineering shop drawing sheet on a pure white background.

Layout: a single A3-style technical drawing sheet showing three orthographic projections of the SAME piece:
  • FRONT VIEW (large, top-left)
  • SIDE VIEW (top-right)
  • TOP VIEW (bottom-left)
  • Small ISOMETRIC reference thumbnail (bottom-right)

Each view must include:
  • Black linework on white background (no shading, no color fill, no perspective distortion)
  • Dimension lines with arrowheads and clear numeric labels in centimetres
  • Light dashed construction/hidden lines where appropriate
  • A simple title block at the bottom: "${productName}" — ${category ?? "furniture"} — Nyzora Manufacturing Reference

${dimsText}

Style: precise architectural / industrial design blueprint look, monochrome, like a CAD plot. No people, no environment, no rendering, no shadows, no marketing copy.

Important: keep proportions faithful to the supplied product image; treat it as the source of truth for geometry.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: absoluteImageUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate drawing" }), {
        status: response.status === 429 || response.status === 402 ? response.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const drawingUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!drawingUrl) {
      console.error("No image in response:", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "No drawing generated" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl: drawingUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-production-drawing error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});