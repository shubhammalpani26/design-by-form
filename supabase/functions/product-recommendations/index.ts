import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.4.3";
import { generateStructured } from "../_shared/responses.ts";
import {
  catalogLines,
  fallbackPicks,
  GIFT_ITEMS,
  isFresh,
  isGiftSlug,
  RECS_COUNT,
  resolvePicks,
} from "../_shared/productRecs.ts";

/**
 * "You may also like": Lovable AI orders Nyzora's US-made gift pieces for the
 * page being viewed (a catalog product or a gift page). Only gift items are
 * ever returned — never furniture. Picks are cached per page for a week so
 * page views never spend AI credits; if AI is unavailable a sensible default
 * order is shown and retried after a day.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const MODEL = "openai/gpt-6-astra";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PicksSchema = z.object({
  picks: z.array(z.object({ line: z.number().int() })),
});

const INSTRUCTIONS = `You are the gift merchandiser for Nyzora, which makes personalised, US-made sculptural gift pieces.
A shopper is viewing one page. Order the numbered gift items from most to least likely to appeal to this shopper,
based on who they might be shopping for and the style of what they're viewing. Never include the viewed item itself.
Answer only with line numbers from the list, best first.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let productId: string | null = null;
  let giftSlug: string | null = null;
  try {
    const body = await req.json();
    productId = typeof body?.productId === "string" && UUID.test(body.productId) ? body.productId : null;
    giftSlug = isGiftSlug(body?.giftSlug) ? body.giftSlug : null;
  } catch { /* handled below */ }
  if (!productId && !giftSlug) return json({ error: "productId or giftSlug is required" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    // Describe the page being viewed.
    let viewed: string;
    let current: { id: string; category: string; designerId: string };
    let pageKey: string;
    if (giftSlug) {
      const g = GIFT_ITEMS.find((x) => x.id === giftSlug)!;
      viewed = `${g.name} | ${g.category} | ${g.description}`;
      current = { id: g.id, category: g.category, designerId: g.designerId };
      pageKey = `gift:${g.id}`;
    } else {
      const { data: p } = await admin
        .from("designer_products")
        .select("id, name, category, description, designer_price")
        .eq("id", productId!)
        .eq("status", "approved")
        .maybeSingle();
      if (!p) return json({ slugs: [] });
      viewed = `${p.name} | ${p.category} | $${Math.round(Number(p.designer_price))} | ${(p.description ?? "").replace(/\s+/g, " ").slice(0, 300)}`;
      current = { id: p.id, category: p.category, designerId: "" };
      pageKey = `product:${p.id}`;
    }

    const { data: cached } = await admin
      .from("gift_recommendations")
      .select("slugs, source, generated_at")
      .eq("page_key", pageKey)
      .maybeSingle();
    if (cached && isFresh(new Date(cached.generated_at), cached.source, new Date())) {
      const slugs = (cached.slugs as string[]).filter((s) => isGiftSlug(s) && s !== current.id);
      if (slugs.length) return json({ slugs, source: cached.source });
    }

    let slugs: string[];
    let source = "ai";
    try {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
      const out = await generateStructured(
        req,
        { apiKey, model: MODEL, reasoningEffort: "low" },
        PicksSchema,
        [{
          role: "user",
          content: `Viewed page:\n${viewed}\n\nGift items (line | name | category | price | description):\n${catalogLines(GIFT_ITEMS)}`,
        }],
        INSTRUCTIONS,
      );
      slugs = resolvePicks(out.picks.map((p) => p.line), GIFT_ITEMS, current, RECS_COUNT);
    } catch (e) {
      console.error("product-recommendations AI failed", { pageKey, message: e instanceof Error ? e.message : String(e) });
      slugs = fallbackPicks(GIFT_ITEMS, current, RECS_COUNT);
      source = "fallback";
    }

    await admin.from("gift_recommendations").upsert({
      page_key: pageKey,
      slugs,
      source,
      model: source === "ai" ? MODEL : null,
      generated_at: new Date().toISOString(),
    });
    return json({ slugs, source });
  } catch (e) {
    console.error("product-recommendations error", e);
    return json({ error: "Could not load recommendations" }, 500);
  }
});
