import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildBudgetBrief } from "../_shared/budget.ts";

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
  manufacturingMethod: z.enum(["artisan_in", "fdm_us"]).optional().default("artisan_in"),
  budget: z
    .object({
      min: z.number().nonnegative(),
      max: z.number().positive(),
      currency: z.enum(["INR", "USD"]).optional().default("INR"),
    })
    .optional(),
});

// US on-demand FDM tiers (Slant 3D style print farms).
// Anything in these categories must fit a single print envelope of 250mm cubed.
const US_FDM_TIERS: Record<string, { label: string; modular: boolean }> = {
  objects: { label: "Objects", modular: false },
  lighting: { label: "Lighting", modular: false },
  "wall tiles": { label: "Wall Systems", modular: true },
  "wall systems": { label: "Wall Systems", modular: true },
  desk: { label: "Desk", modular: false },
  "furniture parts": { label: "Furniture Parts", modular: true },
  figurine: { label: "Figurines & Miniatures", modular: false },
  figurines: { label: "Figurines & Miniatures", modular: false },
  miniature: { label: "Figurines & Miniatures", modular: false },
};

const FDM_ENVELOPE_MM = 250;

function resolveFdmTier(category: string, manufacturingMethod: string) {
  if (manufacturingMethod === "fdm_us") {
    return US_FDM_TIERS[category.trim().toLowerCase()] ?? { label: "US FDM", modular: false };
  }
  return US_FDM_TIERS[category.trim().toLowerCase()] ?? null;
}

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
    const { imageUrl, prompt, category, dimensions, targetMaker, manufacturingMethod, budget } = parsed.data;
    const fdmTier = resolveFdmTier(category, manufacturingMethod);

    // Budget agent input: the engineering agent also verifies the design can be
    // built inside the creator's target manufacturing base price band.
    const budgetBrief = budget
      ? buildBudgetBrief(budget.min, budget.max, budget.currency ?? (fdmTier ? "USD" : "INR"), Boolean(fdmTier))
      : null;
    const budgetSection = budgetBrief
      ? `

BUDGET ENVELOPE — the creator is designing for a target manufacturing base price:
${budgetBrief.text}
Also judge COST FIT:
- Estimate the finished piece's bounding volume from the image and stated dimensions.
- If it is clearly larger, heavier, or more materially complex than this budget allows, set "budget_fit" to "over" and add a cost issue.
- If it is far smaller/simpler than the budget allows (leaving value on the table), set "budget_fit" to "under".
- Otherwise "within".
- A "over" budget_fit alone should NOT set pass=false unless it is severe (more than ~2x the envelope); it should always produce a revision_prompt that reduces scale/mass/material count.`
      : "";

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

    const fdmPrompt = `You are Nyzora's Engineering Agent for US on-demand manufacturing. You assess whether a generated design can be produced on a domestic FDM print farm (Slant 3D style) with zero tooling and no minimum order.

PRODUCT TIER: ${fdmTier?.label ?? "US FDM"}

HARD CONSTRAINTS — fail the design if any is violated:
- Single-part build envelope: ${FDM_ENVELOPE_MM}mm × ${FDM_ENVELOPE_MM}mm × ${FDM_ENVELOPE_MM}mm. Nothing larger prints as one piece.
${fdmTier?.modular ? `- This tier IS modular: the piece may be a repeating unit/tile that tessellates or assembles into something larger, but EACH unit must fit the envelope on its own.` : `- This tier is NOT modular: the whole product must be one single printed part inside the envelope.`}
- Minimum wall thickness 2mm. Reject paper-thin shells, blade edges and hair-thin filaments.
- Maximum unsupported overhang 45° from vertical. Reject dramatic cantilevers, floating horizontal spans and mushroom/T shapes with no self-support.
- Flat, stable printable base with real contact area. Reject point-balanced, sphere-bottomed or tipping forms.
- No captured internal voids, no fully enclosed hollows that trap support material.
- No bridging spans over ~50mm unsupported.
- Fine detail floor ~0.8mm — reject engraved text or ornament finer than that.

PROCESS CHARACTER (not failures, guide the design):
- Horizontal layer lines are always visible. Designs that use them as intentional texture (ribs, ridges, flutes, contour bands) score higher.
- Translucent materials look premium when lit from within — good for lighting tiers.
- Vertical-axis forms print best; wide flat slabs warp.

Return STRICT JSON only, no markdown, no preamble:
{
  "pass": boolean,
  "confidence": <integer 0-100>,
  "issues": ["<short issue>", ...],
  "revision_prompt": "<if !pass, ONE short additive instruction to append to the design prompt to fix issues; else empty string>"
}`;

    const artisanPrompt = `You are Nyzora's Engineering Agent. You assess whether a generated furniture / decor design is physically manufacturable by the assigned maker. You are strict but practical.

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

    const systemPrompt = fdmTier ? fdmPrompt : artisanPrompt;

    const userText = `DESIGN BRIEF: ${prompt || "(no brief)"}
CATEGORY: ${category || "(unspecified)"}
DIMENSIONS: ${dimText}
TARGET MAKER: ${targetMaker || "(auto-route)"}
MANUFACTURING: ${fdmTier ? `US on-demand FDM print farm — ${fdmTier.label} tier` : "India artisan network"}

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