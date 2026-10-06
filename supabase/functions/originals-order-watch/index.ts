import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendAppEmail } from "../_shared/appEmail.ts";

/**
 * Daily watchdog over paid Originals orders. Flags any paid piece that has not
 * moved on schedule (waiting on admin, stuck at the partner, late in transit,
 * or cancelled/failed and never re-placed) and sends ONE digest email plus a
 * dashboard notification. Read-only: it never places, cancels or charges.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCT_NAME: Record<string, string> = {
  "pet-silhouette-keepsake": "Pet Memorial Sculpture",
  "pet-portrait-sculpture": "Pet Portrait Sculpture",
  "nursery-name-date": "Nursery Name & Date Piece",
  "wedding-coordinates": "Wedding Coordinates Piece",
};

const DAY = 86_400_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const since = new Date(Date.now() - 60 * DAY).toISOString();
  const { data: rows, error } = await admin
    .from("originals_orders")
    .select("id, status, production_status, partner_order_id, created_at, shipped_at, sku_slug, size_label, customer_email, amount_usd")
    .in("status", ["paid", "fulfilled"])
    .gt("amount_usd", 0)
    .gte("created_at", since)
    .limit(500);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500, headers: corsHeaders });
  }

  const now = Date.now();
  const items = [] as Array<Record<string, unknown>>;
  for (const r of rows ?? []) {
    const days = Math.floor((now - new Date(r.created_at).getTime()) / DAY);
    const ps = r.production_status;
    let problem: string | null = null;
    if (ps === "cancelled" || ps === "failed") {
      problem = `Manufacturer reported this paid piece as ${ps} and it has not been re-placed.`;
    } else if (["awaiting_admin_approval", "needs_file", "pending", "queued"].includes(ps) && days >= 1) {
      problem = ps === "awaiting_admin_approval"
        ? "Waiting for your approval before it goes to manufacturing."
        : ps === "needs_file"
        ? "The print file needs attention before it can be sent."
        : "Paid but not yet with the manufacturer.";
    } else if (ps === "in_production" && days >= 5) {
      problem = "Still in production — not shipped yet. Ask the manufacturer for a status.";
    } else if (ps === "shipped" && r.shipped_at && now - new Date(r.shipped_at).getTime() > 7 * DAY) {
      problem = "Shipped over a week ago but not marked delivered. Check the tracking.";
    }
    if (!problem) continue;
    items.push({
      orderId: r.id,
      customerEmail: r.customer_email,
      partnerOrderId: r.partner_order_id,
      product: `${PRODUCT_NAME[r.sku_slug ?? ""] ?? "Piece"}${r.size_label ? ` — ${r.size_label}` : ""}`,
      days,
      problem,
    });
  }

  if (!items.length) {
    return new Response(JSON.stringify({ ok: true, flagged: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const date = new Date().toISOString().slice(0, 10);
  try {
    const { data: admins } = await admin.from("user_roles").select("user_id").eq("role", "admin");
    if (admins?.length) {
      await admin.from("notifications").insert(admins.map((a: { user_id: string }) => ({
        user_id: a.user_id,
        title: `Daily order check: ${items.length} need attention`,
        message: items.map((i) => `${String(i.orderId).slice(0, 8)}: ${i.problem}`).join(" · ").slice(0, 900),
        type: "order_watch",
        link: "/admin?tab=orders",
        metadata: { date, order_ids: items.map((i) => i.orderId) },
      })));
    }
  } catch (e) {
    console.error("order watch: notification failed", e);
  }
  try {
    await sendAppEmail("order-watch-digest", "contact@nyzora.ai", {
      idempotencyKey: `order-watch-${date}`,
      templateData: { items, date },
    });
  } catch (e) {
    console.error("order watch: email failed", e);
  }

  return new Response(JSON.stringify({ ok: true, flagged: items.length, items }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
