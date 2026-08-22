import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTracking } from "../_shared/slant3d.ts";
import { detectCarrier } from "../_shared/transactional-email-templates/originals-order-shipped.tsx";

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
 * Once a partner order exists the piece IS in production — the partner's own
 * "queued"/"pending"/"awaiting_shipment" are internal queue states and must
 * never push the buyer's tracker back to "Order confirmed".
 */
const toProductionStatus = (partnerStatus: string) =>
  ["shipped", "delivered", "cancelled", "failed"].includes(partnerStatus)
    ? partnerStatus
    : "in_production";

const PRODUCT_NAME: Record<string, string> = {
  "pet-silhouette-keepsake": "Pet Memorial Sculpture",
  "pet-portrait-sculpture": "Pet Portrait Sculpture",
  "nursery-name-date": "Nursery Name & Date Piece",
  "wedding-coordinates": "Wedding Coordinates Piece",
};

/** Emails the buyer their tracking, then stamps the row so it never repeats. */
async function notifyShipped(
  row: {
    id: string;
    customer_email: string | null;
    sku_slug: string | null;
    size_label: string | null;
    carrier: string | null;
  },
  numbers: string[],
) {
  const templateData = {
    orderId: row.id,
    productName: (row.sku_slug && PRODUCT_NAME[row.sku_slug]) || "Your Nyzora piece",
    sizeLabel: row.size_label ?? undefined,
    carrier: row.carrier ?? undefined,
    trackingNumbers: numbers,
  };

  const { error } = await admin.functions.invoke("send-transactional-email", {
    body: {
      templateName: "originals-order-shipped",
      recipientEmail: row.customer_email,
      idempotencyKey: `originals-shipped-${row.id}`,
      templateData,
    },
  });
  if (error) {
    console.error("shipping email failed", row.id, error);
    return;
  }

  // Internal copy so the team sees every shipment go out.
  await admin.functions
    .invoke("send-transactional-email", {
      body: {
        templateName: "originals-order-shipped",
        recipientEmail: "contact@nyzora.ai",
        idempotencyKey: `originals-shipped-internal-${row.id}`,
        templateData,
      },
    })
    .catch(() => {});

  await admin
    .from("originals_orders")
    .update({ shipping_notified_at: new Date().toISOString() })
    .eq("id", row.id);
}

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
      .select(
        "id, group_id, partner_order_id, production_status, customer_email, sku_slug, size_label, carrier, shipping_notified_at",
      )
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
        const shipped = status === "shipped";
        // Infer the carrier from the tracking number so the buyer's tracker
        // and the shipping email link to the carrier's own page.
        const carrier = numbers.length ? detectCarrier(numbers[0]).name : null;
        await admin
          .from("originals_orders")
          .update({
            production_status: toProductionStatus(status),
            tracking_numbers: numbers,
            ...(carrier ? { carrier } : {}),
            ...(status === "shipped" ? { shipped_at: new Date().toISOString() } : {}),
            ...(status === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        synced += 1;

        // One shipping notification per order, only once tracking exists.
        if (shipped && numbers.length && !row.shipping_notified_at && row.customer_email) {
          await notifyShipped(row, numbers);
        }
      } catch (e) {
        console.error("originals tracking sync failed", row.id, e instanceof Error ? e.message : e);
      }
    }

    // Nudge any paid piece that is still waiting on its model / partner order.
    // Best-effort: the buyer's page must never wait on it.
    fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/originals-model`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      },
      body: JSON.stringify(groupId ? { group_id: groupId } : { sweep: true }),
    }).catch(() => {});

    return json({ synced });
  } catch (e) {
    console.error("originals-tracking-sync error", e);
    return json({ error: "Could not sync tracking" }, 500);
  }
});
