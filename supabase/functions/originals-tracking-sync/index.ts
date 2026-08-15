import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTracking } from "../_shared/slant3d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const OPEN = ["in_production", "queued", "awaiting_shipment", "pending"];

/**
 * Pulls partner tracking onto Originals orders. Safe to call from the buyer's
 * order page (anon) — it only ever writes partner-sourced tracking data and
 * returns nothing.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const groupId = typeof body?.group_id === "string" ? body.group_id : null;

    let query = admin
      .from("originals_orders")
      .select("id, partner_order_id, production_status")
      .not("partner_order_id", "is", null)
      .limit(60);
    query = groupId ? query.eq("group_id", groupId) : query.in("production_status", OPEN);

    const { data: rows, error } = await query;
    if (error) throw error;

    // One partner order can back several rows — sync each partner order once.
    const seen = new Map<string, { status: string; trackingNumbers: unknown[] }>();
    let synced = 0;

    for (const row of rows ?? []) {
      const key = row.partner_order_id!;
      try {
        if (!seen.has(key)) seen.set(key, await getTracking(key));
        const { status, trackingNumbers } = seen.get(key)!;
        const numbers = trackingNumbers.map((t) => String(t)).filter(Boolean);
        await admin
          .from("originals_orders")
          .update({
            production_status: status === "awaiting_shipment" ? "in_production" : status,
            tracking_numbers: numbers,
            ...(status === "shipped" ? { shipped_at: new Date().toISOString() } : {}),
            ...(status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        synced += 1;
      } catch (e) {
        console.error("originals tracking sync failed", row.id, e instanceof Error ? e.message : e);
      }
    }

    return json({ synced });
  } catch (e) {
    console.error("originals-tracking-sync error", e);
    return json({ error: "Could not sync tracking" }, 500);
  }
});
