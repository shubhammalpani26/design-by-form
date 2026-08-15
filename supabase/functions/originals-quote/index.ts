/**
 * Live price + feasibility for Nyzora Originals.
 *
 * Called from the size ladder and again at checkout. Every line is priced by
 * slicing the real production file with our US manufacturing partner; if that
 * is unavailable we return the agreed list price instead of failing.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { PRICE_BOOK, quoteLine } from "../_shared/originalsPricing.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const MAX_LINES = 12;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request." }, 400);

    const skuSlug = String(body.skuSlug ?? "");
    const previewId = typeof body.previewId === "string" ? body.previewId : null;

    // Either quote explicit lines, or every size of one SKU (the size ladder).
    const requested: Array<{ skuSlug: string; sizeKey: string; previewId: string | null }> =
      Array.isArray(body.items) && body.items.length
        ? body.items.slice(0, MAX_LINES).map((i: Record<string, unknown>) => ({
          skuSlug: String(i.skuSlug ?? ""),
          sizeKey: String(i.sizeKey ?? "standard"),
          previewId: typeof i.previewId === "string" ? i.previewId : null,
        }))
        : Object.keys(PRICE_BOOK[skuSlug] ?? {}).map((sizeKey) => ({ skuSlug, sizeKey, previewId }));

    if (!requested.length) return json({ error: "Nothing to price." }, 400);

    const quotes = await Promise.all(
      requested.map(async (line) => {
        try {
          const q = await quoteLine(admin, line);
          // `reason` is internal diagnostics — strip it before it leaves the edge.
          const { reason: _reason, partnerCostUsd: _cost, printFileUrl: _file, ...safe } = q;
          return safe;
        } catch (_e) {
          return null;
        }
      }),
    );

    return json({ quotes: quotes.filter(Boolean) });
  } catch (e) {
    console.error("originals-quote error", e);
    return json({ error: "Pricing is temporarily unavailable." }, 500);
  }
});
