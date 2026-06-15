import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Orchestrator (invisible to UI):
 *   1) Design Agent       → generate-design
 *   2) Engineering Agent  → engineering-check (skipped for 3D-only conversion calls)
 *      - if fail and a text prompt exists: re-run Design once with an additive revision hint
 *   3) Returns the generate-design payload shape, with an extra `engineering` field
 *
 * Maker (suggest-maker) and Costing (recalculate-pricing) agents already run inside
 * generate-design's existing flywheel + pricing logic, so we don't double-invoke here.
 */

const FN_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;

async function callFunction(name: string, body: unknown, authHeader: string | null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authHeader) headers["Authorization"] = authHeader;
  // Pass apikey for verify_jwt routing parity
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  if (anon) headers["apikey"] = anon;

  const res = await fetch(`${FN_BASE}/${name}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* leave null */ }
  return { ok: res.ok, status: res.status, json, raw: text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    const requestBody = await req.json();

    // 1) Design Agent
    const design = await callFunction("generate-design", requestBody, authHeader);
    if (!design.ok) {
      return new Response(design.raw || JSON.stringify({ error: "design failed" }), {
        status: design.status || 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const designPayload = (design.json as Record<string, unknown>) ?? {};
    const imageUrl = designPayload.imageUrl as string | undefined;

    // If this is a 3D-only conversion request, skip engineering check entirely.
    const is3DOnly = Boolean(requestBody?.generate3D && requestBody?.imageUrl);
    if (is3DOnly || !imageUrl) {
      return new Response(JSON.stringify(designPayload), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Engineering Agent
    const pricing = (designPayload.pricing as Record<string, unknown>) ?? {};
    const inferredCategory = (requestBody?.category as string)
      || (pricing?.category as string)
      || "";
    const inferredDims = (requestBody?.dimensions as Record<string, number>)
      || (pricing?.dimensions as Record<string, number>)
      || {};

    const eng = await callFunction("engineering-check", {
      imageUrl,
      prompt: requestBody?.prompt ?? "",
      category: inferredCategory,
      dimensions: inferredDims,
      targetMaker: requestBody?.targetMaker ?? "",
    }, authHeader);

    const engResult = (eng.json as {
      pass?: boolean;
      confidence?: number;
      issues?: string[];
      revision_prompt?: string;
      skipped?: boolean;
    }) ?? { pass: true, confidence: 0, issues: [], skipped: true };

    // 3) Optional one-shot revision when engineering fails and we have a text prompt
    let revisedPayload: Record<string, unknown> | null = null;
    const canRevise = engResult.pass === false
      && typeof requestBody?.prompt === "string"
      && requestBody.prompt.trim().length >= 10
      && (engResult.revision_prompt?.trim().length ?? 0) > 0;

    if (canRevise) {
      const revisedPrompt = `${requestBody.prompt}\n\nMANUFACTURABILITY REVISION: ${engResult.revision_prompt}`;
      const revised = await callFunction(
        "generate-design",
        { ...requestBody, prompt: revisedPrompt },
        authHeader,
      );
      if (revised.ok && revised.json && (revised.json as Record<string, unknown>).imageUrl) {
        revisedPayload = revised.json as Record<string, unknown>;
      }
    }

    const finalPayload = revisedPayload ?? designPayload;
    finalPayload.engineering = {
      ...engResult,
      revised: Boolean(revisedPayload),
    };

    return new Response(JSON.stringify(finalPayload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("orchestrate-design error:", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});