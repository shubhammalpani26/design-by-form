import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { buildBudgetBrief, formatMoney } from "../_shared/budget.ts";

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

// US on-demand FDM tiers (domestic print-farm envelope).
// Anything in these categories must fit a single print envelope of 220mm cubed.
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

const FDM_ENVELOPE_MM = 220;

function resolveFdmTier(category: string, manufacturingMethod: string) {
  if (manufacturingMethod === "fdm_us") {
    return US_FDM_TIERS[category.trim().toLowerCase()] ?? { label: "US FDM", modular: false };
  }
  return US_FDM_TIERS[category.trim().toLowerCase()] ?? null;
}

type PrintSpec = {
  layer_height_mm: number;
  infill_percent: number;
  infill_pattern: "gyroid" | "grid" | "cubic";
  wall_loops: number;
  top_bottom_layers: number;
  print_orientation: string;
  supports_required: boolean;
  solid_or_hollow: "solid" | "shelled";
  rationale: string;
};

const clamp = (n: unknown, lo: number, hi: number, fallback: number) =>
  Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Number(n))) : fallback;

/**
 * The engineering agent always ships a resolved, optimised build spec — never a
 * question for the user. This normalises the model's answer and back-fills a
 * sane default when it omits or mangles a field.
 */
function normalisePrintSpec(raw: unknown, opts: { fdm: boolean; longestMm: number }): PrintSpec {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const big = opts.longestMm >= 120;
  const pattern = ["gyroid", "grid", "cubic"].includes(String(o.infill_pattern))
    ? (String(o.infill_pattern) as PrintSpec["infill_pattern"])
    : "gyroid";
  return {
    layer_height_mm: clamp(o.layer_height_mm, 0.08, 0.32, big ? 0.24 : 0.16),
    infill_percent: Math.round(clamp(o.infill_percent, 5, 100, big ? 12 : 18)),
    infill_pattern: pattern,
    wall_loops: Math.round(clamp(o.wall_loops, 2, 8, 3)),
    top_bottom_layers: Math.round(clamp(o.top_bottom_layers, 3, 10, 5)),
    print_orientation:
      typeof o.print_orientation === "string" && o.print_orientation.trim()
        ? o.print_orientation.slice(0, 200)
        : "Flat base on the build plate, engraved/visible face vertical and away from supports",
    supports_required: Boolean(o.supports_required),
    solid_or_hollow: o.solid_or_hollow === "solid" ? "solid" : big ? "shelled" : "solid",
    rationale:
      typeof o.rationale === "string" && o.rationale.trim()
        ? o.rationale.slice(0, 300)
        : opts.fdm
          ? "Balanced for a premium hand-feel and crisp detail at the lowest material cost."
          : "Balanced for finish quality against build effort.",
  };
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
        JSON.stringify({ pass: true, confidence: 0, issues: [], skipped: true, print_spec: normalisePrintSpec(null, { fdm: Boolean(fdmTier), longestMm: 0 }) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dimText =
      dimensions && (dimensions.width || dimensions.height || dimensions.depth)
        ? `W${dimensions.width ?? "?"} × H${dimensions.height ?? "?"} × D${dimensions.depth ?? "?"} cm`
        : "unspecified";

    const fdmPrompt = `You are Nyzora's Engineering Agent for US on-demand manufacturing. You assess whether a generated design can be produced on a domestic FDM print farm with zero tooling and no minimum order.

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

PROCESS OPTIMISATION — you MUST decide these yourself. Never ask, never hedge, never offer options.
Choose the single best-value settings that hold the aesthetic intent (surface quality, perceived mass, engraved detail) at the lowest material/time cost:
- layer_height_mm: 0.12 (fine detail / engraved text / figurines), 0.2 (default), 0.28 (large simple masses)
- infill_percent: 8-12 decorative low-load, 15-20 default, 25-40 load-bearing/tall or top-heavy, 60+ only if genuinely structural
- infill_pattern: "gyroid" (curved organic, needs isotropic strength), "grid" (fast, flat slabs), "cubic" (impact/heavy)
- wall_loops: 2 default, 3-4 when walls carry load or must feel solid when tapped, 5 for polished/sanded finishes
- top_bottom_layers: 4 default, 5-6 for wide flat visible tops
- print_orientation: the exact face on the build plate, chosen so engraved/visible faces avoid supports and layer lines read as intentional
- supports_required: true/false, plus where
- solid_or_hollow: "solid" only when small; otherwise "shelled" with the wall/infill above
- rationale: one sentence tying the choice to the aesthetic requirement

Return STRICT JSON only, no markdown, no preamble:
{
  "pass": boolean,
  "confidence": <integer 0-100>,
  "issues": ["<short issue>", ...],
  "revision_prompt": "<if !pass, ONE short additive instruction to append to the design prompt to fix issues; else empty string>",
  "print_spec": {
    "layer_height_mm": number,
    "infill_percent": number,
    "infill_pattern": "gyroid" | "grid" | "cubic",
    "wall_loops": number,
    "top_bottom_layers": number,
    "print_orientation": string,
    "supports_required": boolean,
    "solid_or_hollow": "solid" | "shelled",
    "rationale": string
  }
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

PROCESS OPTIMISATION — decide these yourself, never ask and never offer options. For FGF/print-based makers give slicing settings; for wood/canvas makers give the equivalent build spec (stock thickness, joinery, finish passes) using the same field names where they apply.

Return STRICT JSON only, no markdown, no preamble:
{
  "pass": boolean,
  "confidence": <integer 0-100>,
  "issues": ["<short issue>", ...],
  "revision_prompt": "<if !pass, ONE short additive instruction to append to the design prompt to fix issues; else empty string>",
  "print_spec": {
    "layer_height_mm": number,
    "infill_percent": number,
    "infill_pattern": "gyroid" | "grid" | "cubic",
    "wall_loops": number,
    "top_bottom_layers": number,
    "print_orientation": string,
    "supports_required": boolean,
    "solid_or_hollow": "solid" | "shelled",
    "rationale": string
  }
}`;

    const systemPrompt = `${fdmTier ? fdmPrompt : artisanPrompt}${budgetSection}${
      budgetBrief
        ? `\nAdd "budget_fit": "within" | "over" | "under" to the JSON object.`
        : ""
    }`;

    const userText = `DESIGN BRIEF: ${prompt || "(no brief)"}
CATEGORY: ${category || "(unspecified)"}
DIMENSIONS: ${dimText}
TARGET MAKER: ${targetMaker || "(auto-route)"}
MANUFACTURING: ${fdmTier ? `US on-demand FDM print farm — ${fdmTier.label} tier` : "India artisan network"}
${budgetBrief ? `TARGET BASE PRICE: ${formatMoney(budgetBrief.min, budgetBrief.currency)}–${formatMoney(budgetBrief.max, budgetBrief.currency)} per unit (~${budgetBrief.cubeMinCm.toFixed(0)}–${budgetBrief.cubeMaxCm.toFixed(0)} cm scale, ${budgetBrief.complexity} complexity)` : ""}

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
        JSON.stringify({ pass: true, confidence: 0, issues: [], skipped: true, error: `ai_${aiRes.status}`, print_spec: normalisePrintSpec(null, { fdm: Boolean(fdmTier), longestMm: 0 }) }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const raw_content: string = aiJson?.choices?.[0]?.message?.content ?? "";
    const cleaned = raw_content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

    let result: {
      pass: boolean;
      confidence: number;
      issues: string[];
      revision_prompt: string;
      budget_fit?: "within" | "over" | "under";
      print_spec: PrintSpec;
    };
    const longestMm =
      Math.max(dimensions.width ?? 0, dimensions.depth ?? 0, dimensions.height ?? 0) * 10 || 0;
    try {
      const obj = JSON.parse(cleaned);
      result = {
        pass: Boolean(obj.pass),
        confidence: Number.isFinite(obj.confidence) ? Math.max(0, Math.min(100, obj.confidence)) : 0,
        issues: Array.isArray(obj.issues) ? obj.issues.slice(0, 8).map((s: unknown) => String(s)) : [],
        revision_prompt: typeof obj.revision_prompt === "string" ? obj.revision_prompt.slice(0, 600) : "",
        print_spec: normalisePrintSpec(obj.print_spec, { fdm: Boolean(fdmTier), longestMm }),
      };
      if (budgetBrief) {
        result.budget_fit = ["within", "over", "under"].includes(obj.budget_fit)
          ? obj.budget_fit
          : "within";
      }
    } catch (_e) {
      // Permissive fallback
      result = {
        pass: true,
        confidence: 0,
        issues: [],
        revision_prompt: "",
        print_spec: normalisePrintSpec(null, { fdm: Boolean(fdmTier), longestMm }),
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("engineering-check error:", e);
    return new Response(
      JSON.stringify({ pass: true, confidence: 0, issues: [], skipped: true, error: (e as Error).message, print_spec: normalisePrintSpec(null, { fdm: true, longestMm: 0 }) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});