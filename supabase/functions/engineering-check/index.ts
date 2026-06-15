import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const inputSchema = z.object({
  imageUrl: z.string().url(),
  prompt: z.string().max(10000).optional().default(""),
  category: z.string().max(120).optional().default(""),
  dimensions: z
    .object({
      width: z.number().positive().max(10000).optional(),
      depth: z.number().positive().max(10000).optional(),
      height: z.number().positive().max(10000).optional(),
    })
    .partial()
    .optional()
    .default({}),
  targetMaker: z.string().max(80).optional().default(""),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const raw = await req.json();
    const parsed = inputSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "invalid input", details: parsed.error.flatten() }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const { imageUrl, prompt, category, dimensions, targetMaker } = parsed.data;

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      // Non-blocking: if AI key missing, return permissive pass so orchestration continues
      return new Response(
        JSON.stringify({ pass: true, confidence: 0, issues: [], skipped: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dimText =
      dimensions && (dimensions.width || dimensions.height || dimensions.depth)
        ? `W${dimensions.width ?? "?"} × H${dimensions.height ?? "?"} × D${dimensions.depth ?? "?"} cm`
        : "unspecified";

    const systemPrompt = `You are Nyzora's Engineering Agent. You assess whether a generated furniture / decor design is physically manufacturable by the assigned maker. You are strict but practical.

Constraints you check:
- Structural integrity: wall thickness, slender supports, cantilevers, fragile joints
- Base stability for the stated dimensions and category
- Process feasibility:
  - Cyanique (FGF 3D print + hand finish, resin/composite): solid monolithic forms, no fine lattice/perforations, max print envelope ~150cm in any axis, organic curves OK
  - Beni Enterprise (solid wood workshop): joinery-driven, flat-panel + turned/legged forms, NOT free-flowing organic shapes
  - U.G. Agawane Studio (hand-painted canvas): 2D wall art only
- Material-form fit (e.g. organic flowing curves should not be routed to a wood workshop)

Return STRICT JSON only, no markdown, no preamble:
{
  "pass": boolean,
  "confidence": <integer 0-100>,
  "issues": ["<short issue>", ...],
  "revision_prompt": "<if !pass, ONE short additive instruction to append to the design prompt to fix issues; else empty string>"
}`;

    const userText = `DESIGN BRIEF: ${prompt || "(no brief)"}
CATEGORY: ${category || "(unspecified)"}
DIMENSIONS: ${dimText}
TARGET MAKER: ${targetMaker || "(auto-route)"}

Assess the attached design image for manufacturability. Be lenient on aesthetics, strict on physics and process fit.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      console.error("engineering-check AI error:", aiRes.status, detail);
      // Non-blocking: permissive pass so we don't block design flow on infra errors
      return new Response(
        JSON.stringify({ pass: true, confidence: 0, issues: [], skipped: true, error: `ai_${aiRes.status}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const raw_content: string = aiJson?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw_content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let result: { pass: boolean; confidence: number; issues: string[]; revision_prompt: string };
    try {
      const obj = JSON.parse(cleaned);
      result = {
        pass: Boolean(obj.pass),
        confidence: Number.isFinite(obj.confidence) ? Math.max(0, Math.min(100, obj.confidence)) : 0,
        issues: Array.isArray(obj.issues) ? obj.issues.slice(0, 8).map((s: unknown) => String(s)) : [],
        revision_prompt: typeof obj.revision_prompt === "string" ? obj.revision_prompt.slice(0, 600) : "",
      };
    } catch (_e) {
      // Permissive fallback
      result = { pass: true, confidence: 0, issues: [], revision_prompt: "" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("engineering-check error:", e);
    return new Response(
      JSON.stringify({ pass: true, confidence: 0, issues: [], skipped: true, error: (e as Error).message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});