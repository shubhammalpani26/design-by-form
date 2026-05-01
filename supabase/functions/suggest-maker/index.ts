import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Static maker capability descriptors (mirrors src/data/makers.ts but kept here so the
// edge function is self-contained — Deno can't import from src/).
const MAKERS = [
  {
    name: "Cyanique",
    process: "FGF (pellet-extrusion) 3D printed + hand finished",
    bestFor:
      "Sculptural, sweeping, monolithic forms — vases, accent furniture, statement decor, organic curved pieces, outdoor-friendly resin/composite work.",
    materials: ["PETG-CF pellet", "high-grade composite", "resin"],
    categories: ["vases", "decor", "sculptures", "accent-furniture", "outdoor", "lamps", "benches", "side-tables", "seating", "stools", "planters"],
    leadDays: 14,
  },
  {
    name: "Beni Enterprise",
    process: "Solid wood + hand finished",
    bestFor:
      "Dining tables, consoles, shelving, pedestal/turned pieces, joinery-driven furniture, framed seating with upholstery pairing.",
    materials: ["Sheesham", "Teak", "premium hardwoods"],
    categories: ["tables", "dining-tables", "consoles", "wood-furniture", "shelving", "benches", "chairs", "seating", "coffee-tables", "sofas", "beds"],
    leadDays: 21,
  },
  {
    name: "U.G. Agawane Studio",
    process: "Hand-painted canvas",
    bestFor: "Wall art, paintings, murals, hand-painted decor, framed canvases.",
    materials: ["cotton canvas", "artist-grade pigments", "UV varnish"],
    categories: ["paintings", "art", "murals", "wall-art", "hand-painted", "canvas", "artwork"],
    leadDays: 18,
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { product_id } = await req.json();
    if (!product_id || typeof product_id !== "string") {
      return new Response(JSON.stringify({ error: "product_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1. Fetch the product
    const { data: product, error: pErr } = await supabase
      .from("designer_products")
      .select("id, name, description, category, image_url, dimensions, weight")
      .eq("id", product_id)
      .single();
    if (pErr || !product) {
      return new Response(JSON.stringify({ error: "product not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Pull the most relevant manufacturing intelligence (top 12 by confidence,
    //    biased to category keyword if present)
    const catKey = (product.category ?? "").toLowerCase().split(/[\s-]+/)[0] ?? "";
    const { data: rawLearnings } = await supabase
      .from("manufacturing_intelligence")
      .select("maker, process, signal, value, learning, confidence, category")
      .order("confidence", { ascending: false })
      .limit(40);

    const learnings = (rawLearnings ?? [])
      .sort((a, b) => {
        const aMatch = (a.category ?? "").toLowerCase().includes(catKey) ? 1 : 0;
        const bMatch = (b.category ?? "").toLowerCase().includes(catKey) ? 1 : 0;
        return bMatch - aMatch;
      })
      .slice(0, 12);

    // 3. Build the prompt
    const learningsBlock = learnings
      .map(
        (l, i) =>
          `${i + 1}. [${l.maker} • ${l.process}] ${l.signal}: ${l.value}${l.learning ? ` → Lesson: ${l.learning}` : ""} (confidence ${l.confidence}%)`,
      )
      .join("\n");

    const makersBlock = MAKERS.map(
      (m) =>
        `- ${m.name} | Process: ${m.process} | Best for: ${m.bestFor} | Materials: ${m.materials.join(", ")} | Typical lead: ${m.leadDays} days`,
    ).join("\n");

    const dim = (product.dimensions as { width?: number; height?: number; depth?: number } | null) ?? {};
    const designBrief = `
PRODUCT NAME: ${product.name}
CATEGORY: ${product.category}
DESCRIPTION: ${product.description ?? "(none)"}
DIMENSIONS (cm): W${dim.width ?? "?"} × H${dim.height ?? "?"} × D${dim.depth ?? "?"}
WEIGHT (kg): ${product.weight ?? "?"}
`.trim();

    const userPrompt = `You are Nyzora's manufacturing routing AI. Pick the single best maker for this design and explain why in plain language a non-engineer could understand.

AVAILABLE MAKERS:
${makersBlock}

RELEVANT LEARNINGS FROM PAST COMPLETED ORDERS:
${learningsBlock || "(no prior learnings yet — rely on maker capabilities only)"}

THE NEW DESIGN:
${designBrief}

Return ONLY valid JSON with this exact shape:
{
  "maker": "<one of: Cyanique | Beni Enterprise | U.G. Agawane Studio>",
  "process": "<short process label, e.g. 'FGF 3D printed + hand finished'>",
  "confidence": <integer 60-99>,
  "headline": "<one short plain-English sentence — why this maker, no jargon>",
  "rationale": [
    "<bullet 1 — form/material reasoning>",
    "<bullet 2 — reference to a past order or learning, by maker name>",
    "<bullet 3 — practical fit (lead time, scale, finish)>"
  ],
  "runner_up": { "maker": "<other maker>", "why_not": "<one short reason it's the second choice>" }
}`;

    // 4. Call Lovable AI Gateway (Gemini 2.5 Flash — fast, structured)
    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messages: Array<{ role: string; content: unknown }> = [
      {
        role: "system",
        content:
          "You are an expert manufacturing routing AI. You always return strict valid JSON, no preamble, no markdown fences.",
      },
    ];
    if (product.image_url) {
      messages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: product.image_url } },
        ],
      });
    } else {
      messages.push({ role: "user", content: userPrompt });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(
        JSON.stringify({ error: "AI gateway failed", detail: txt }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiJson = await aiRes.json();
    const raw: string = aiJson?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let suggestion: unknown;
    try {
      suggestion = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "AI returned non-JSON", raw: cleaned }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        suggestion,
        signals_used: learnings.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("suggest-maker error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});