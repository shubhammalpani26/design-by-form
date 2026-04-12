import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, product } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a knowledgeable product consultant for Nyzora, a premium furniture platform. You're helping a customer learn about a specific product. Be concise, warm, and helpful. Keep responses short (2-4 sentences max unless asked for detail).

Product details:
- Name: ${product.name}
- Designer/Creator: ${product.designer}
- Price: ${product.price}
- Category: ${product.category}
- Description: ${product.description}
- Dimensions: ${product.dimensions}
- Weight: ${product.weight} kg
- Materials: Crafted using high-grade resin reinforced with composite fibre, engineered for lasting strength and a refined finish. Weather-resistant for indoor and outdoor use.
- Maker: ${product.makerName} (${product.makerLocation})

Available customizations:
- Sheen Finishes: Matte, Satin, Glossy, High-Gloss
- Textural Finishes: Brushed, Pebbled, Embossed, Sandblasted, Bouclé
- Stone & Mineral Effects: Marble, Onyx, Concrete, Terrazzo, Granite-like
- Wood & Organic Effects: Faux Woodgrain, Bamboo/Straw, Leaf Imprints
- Metallic & Reflective: Gold, Silver, Bronze, Copper, Chrome, Patina
- Artistic & Decorative: Gradient/Ombre, Speckled, Splatter-paint, Hand-painted motifs
- Sustainable & Raw: Raw/Unfinished, Earth Pigment tones, Clay-like textures
- Specialty: Iridescent, Pearlescent, Glow-in-the-dark, Custom Designer Artwork
- Sizes: Standard (1×), Large (1.2×), Extra Large (1.5×)

Production: Produced through a hybrid fabrication process and completed with meticulous hand-finishing.

You can answer about customizations, materials, care instructions, shipping, sizing, outdoor suitability, and design inspiration. If asked about pricing for custom options, say the team will provide a quote. Never reveal manufacturing costs or margins.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("product-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
