import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * Signed-in shoppers' own Originals previews, on any device.
 *  - list:    their previews, newest first (rejected uploads hidden).
 *  - restore: one of their previews, to reopen it on the product page.
 * Only ever returns previews whose user_id is the caller.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const str = (v: unknown) => (typeof v === "string" ? v : "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const { data: auth } = token ? await admin.auth.getUser(token) : { data: null };
  const userId = auth?.user?.id;
  if (!userId) return json({ error: "Please sign in to see your previews." }, 401);

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body = list */ }

  try {
    if (body.action === "restore") {
      const previewId = typeof body.previewId === "string" && UUID.test(body.previewId) ? body.previewId : null;
      if (!previewId) return json({ error: "Not found" }, 404);
      const { data: p } = await admin
        .from("originals_previews")
        .select("id, user_id, sku_slug, personalization, preview_image_url, source_image_url, photo_screen")
        .eq("id", previewId)
        .maybeSingle();
      if (!p || p.user_id !== userId || !p.preview_image_url || str(p.photo_screen).startsWith("rejected")) {
        return json({ error: "Not found" }, 404);
      }
      const pz = (p.personalization ?? {}) as Record<string, unknown>;
      return json({
        previewId: p.id,
        previewUrl: p.preview_image_url,
        skuSlug: p.sku_slug,
        mode: p.source_image_url ? "photo" : "template",
        heading: str(pz.heading),
        footnote: str(pz.footnote),
        colorKey: str(pz.color) || null,
        sizeKey: null,
      });
    }

    const { data: rows, error } = await admin
      .from("originals_previews")
      .select("id, sku_slug, personalization, preview_image_url, photo_screen, created_at")
      .eq("user_id", userId)
      .not("preview_image_url", "is", null)
      .or("photo_screen.is.null,photo_screen.not.like.rejected%")
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw error;

    const ids = (rows ?? []).map((r) => r.id);
    const ordered = new Set<string>();
    if (ids.length) {
      const { data: orders } = await admin
        .from("originals_orders")
        .select("preview_id")
        .in("preview_id", ids)
        .in("status", ["paid", "fulfilled"]);
      for (const o of orders ?? []) if (o.preview_id) ordered.add(o.preview_id);
    }

    return json({
      previews: (rows ?? []).map((r) => {
        const pz = (r.personalization ?? {}) as Record<string, unknown>;
        return {
          id: r.id,
          skuSlug: r.sku_slug,
          imageUrl: r.preview_image_url,
          name: str(pz.heading) || str(pz.petName) || null,
          colorLabel: str(pz.colorLabel) || null,
          createdAt: r.created_at,
          ordered: ordered.has(r.id),
        };
      }),
    });
  } catch (e) {
    console.error("originals-my-previews error", e);
    return json({ error: "Could not load your previews." }, 500);
  }
});
