import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "npm:zod@4.4.3";
import { generateStructured } from "../_shared/responses.ts";
import {
  catalogLines,
  fallbackPicks,
  isFresh,
  RECS_COUNT,
  resolvePicks,
  type CatalogItem,
} from "../_shared/productRecs.ts";

/**
 * "You may also like" for catalog product pages. Lovable AI picks related
 * pieces from the live, approved catalog; picks are cached per product for a
 * week so page views never spend AI credits. If AI is unavailable, a
 * same-category fallback is shown and retried after a day.
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

const INSTRUCTIONS = `You are the merchandiser for Nyzora, a curated marketplace of original, made-to-order designer pieces (furniture, lighting, decor, sculptural objects).
A shopper is viewing one product. From the numbered catalog, choose the ${RECS_COUNT} products they are most likely to also want.
Prefer, in order: pieces that complement it in the same space or share its style, form language or material; then strong alternatives in the same category; then similar price range.
Mix creators when quality is equal. Never pick the viewed product itself. Answer only with catalog line numbers from the list, best first.`;

interface ProductRow {
  id: string;
  slug: string | null;
  name: string;
  category: string;
  description: string | null;
  designer_price: number;
  designer_id: string;
  image_url: string | null;
  studio_image_url: string | null;
  designer_profiles: { name: string } | null;
}

const toCard = (p: ProductRow) => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  category: p.category,
  price: Number(p.designer_price),
  image: p.studio_image_url || p.image_url || "",
  creator: p.designer_profiles?.name ?? null,
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let productId: string | null = null;
  try {
    const body = await req.json();
    productId = typeof body?.productId === "string" && UUID.test(body.productId) ? body.productId : null;
  } catch { /* handled below */ }
  if (!productId) return json({ error: "productId is required" }, 400);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const { data: rows, error } = await admin
      .from("designer_products")
      .select("id, slug, name, category, description, designer_price, designer_id, image_url, studio_image_url, created_at, designer_profiles(name)")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw error;
    const all = (rows ?? []) as unknown as ProductRow[];
    const current = all.find((p) => p.id === productId);
    if (!current) return json({ products: [] });

    const byId = new Map(all.map((p) => [p.id, p]));
    const catalog: CatalogItem[] = all
      .filter((p) => p.id !== current.id && (p.studio_image_url || p.image_url))
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        description: p.description,
        price: Number(p.designer_price),
        designerId: p.designer_id,
      }));
    const currentRef = { id: current.id, category: current.category, designerId: current.designer_id };
    const respond = (ids: string[], source: string) =>
      json({
        source,
        products: ids.map((id) => byId.get(id)).filter((p): p is ProductRow => Boolean(p)).map(toCard),
      });

    // Cached picks: reuse while fresh and still mostly live.
    const { data: cached } = await admin
      .from("product_recommendations")
      .select("recommended_ids, source, generated_at")
      .eq("product_id", current.id)
      .maybeSingle();
    if (cached && isFresh(new Date(cached.generated_at), cached.source, new Date())) {
      const live = (cached.recommended_ids as string[]).filter((id) => catalog.some((c) => c.id === id));
      if (live.length >= Math.min(3, catalog.length)) {
        const topped = resolvePicks([], catalog.filter((c) => !live.includes(c.id)), currentRef, RECS_COUNT - live.length);
        return respond([...live, ...topped].slice(0, RECS_COUNT), cached.source);
      }
    }

    if (catalog.length <= RECS_COUNT) {
      return respond(fallbackPicks(catalog, currentRef), "fallback");
    }

    let ids: string[];
    let source = "ai";
    try {
      const apiKey = Deno.env.get("LOVABLE_API_KEY");
      if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");
      const viewed = `${current.name} | ${current.category} | $${Math.round(Number(current.designer_price))} | ${(current.description ?? "").replace(/\s+/g, " ").slice(0, 300)}`;
      const out = await generateStructured(
        req,
        { apiKey, model: MODEL, reasoningEffort: "low" },
        PicksSchema,
        [{
          role: "user",
          content: `Viewed product:\n${viewed}\n\nCatalog (line | name | category | price | description):\n${catalogLines(catalog)}`,
        }],
        INSTRUCTIONS,
      );
      ids = resolvePicks(out.picks.map((p) => p.line), catalog, currentRef);
    } catch (e) {
      // Credits, rate limits or outages: show a sensible list, retry tomorrow.
      console.error("product-recommendations AI failed", { productId, message: e instanceof Error ? e.message : String(e) });
      ids = fallbackPicks(catalog, currentRef);
      source = "fallback";
    }

    await admin.from("product_recommendations").upsert({
      product_id: current.id,
      recommended_ids: ids,
      source,
      model: source === "ai" ? MODEL : null,
      generated_at: new Date().toISOString(),
    });
    return respond(ids, source);
  } catch (e) {
    console.error("product-recommendations error", e);
    return json({ error: "Could not load recommendations" }, 500);
  }
});
