import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendAppEmail } from "../_shared/appEmail.ts";
import { getTracking } from "../_shared/slant3d.ts";
import { detectCarrier } from "../_shared/transactional-email-templates/originals-order-shipped.tsx";
import { logPartnerEvent } from "../_shared/partnerEvents.ts";
import { requireCaller, unauthorized } from "../_shared/requireCaller.ts";

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

const OPEN = ["in_production", "queued", "awaiting_shipment", "pending", "shipped"];

/**
 * Once a partner order exists the piece IS in production — the partner's own
 * "queued"/"pending"/"awaiting_shipment" are internal queue states and must
 * never push the buyer's tracker back to "Order confirmed".
 *
 * A tracking number is the point of no return: once a label exists the piece
 * has shipped, whatever the partner's own queue says, and a later sync must
 * never walk the buyer's tracker back from shipped/delivered.
 */
const RANK: Record<string, number> = {
  queued: 0,
  pending: 0,
  awaiting_shipment: 0,
  in_production: 1,
  shipped: 2,
  delivered: 3,
};

const toProductionStatus = (
  partnerStatus: string,
  hasTracking: boolean,
  current: string | null,
) => {
  if (["cancelled", "failed"].includes(partnerStatus)) return partnerStatus;
  let next = ["shipped", "delivered"].includes(partnerStatus)
    ? partnerStatus
    : hasTracking
    ? "shipped"
    : "in_production";
  const cur = current ?? "";
  if ((RANK[cur] ?? -1) > (RANK[next] ?? -1)) next = cur;
  return next;
};


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

  const result = await sendAppEmail("originals-order-shipped", row.customer_email ?? "", {
    idempotencyKey: `originals-shipped-${row.id}`,
    templateData,
  });
  if (result.sent === false && result.reason === "failed") {
    console.error("shipping email failed", row.id, result.error);
    return;
  }

  // Internal copy so the team sees every shipment go out.
  await sendAppEmail("originals-order-shipped", "contact@nyzora.ai", {
    idempotencyKey: `originals-shipped-internal-${row.id}`,
    templateData,
  });

  await admin
    .from("originals_orders")
    .update({ shipping_notified_at: new Date().toISOString() })
    .eq("id", row.id);
}

/** Asks the buyer for a review once the piece has actually landed. */
async function notifyReviewRequest(
  row: { id: string; customer_email: string | null; sku_slug: string | null; size_label: string | null },
) {
  const result = await sendAppEmail("originals-review-request", row.customer_email ?? "", {
    idempotencyKey: `originals-review-${row.id}`,
    templateData: {
      orderId: row.id,
      productName: (row.sku_slug && PRODUCT_NAME[row.sku_slug]) || "Your Nyzora piece",
      sizeLabel: row.size_label ?? undefined,
    },
  });
  if (result.sent === false && result.reason === "failed") {
    console.error("review request email failed", row.id, result.error);
  }

  await admin
    .from("originals_orders")
    .update({ review_requested_at: new Date().toISOString() })
    .eq("id", row.id);
}

/**
 * Pulls partner tracking onto Originals orders. Safe to call from the buyer's
 * order page (anon) — it only ever writes partner-sourced tracking data and
 * returns nothing.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Triggers partner API calls and buyer emails — never open to anonymous callers.
  const caller = await requireCaller(req);
  if (!caller) return unauthorized(corsHeaders);

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const groupId = typeof body?.group_id === "string" ? body.group_id : null;

    let query = admin
      .from("originals_orders")
      .select(
        "id, group_id, partner_order_id, production_status, customer_email, sku_slug, size_label, carrier, shipping_notified_at, review_requested_at",
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
        // The partner sometimes hands back the numbers JSON-encoded, or nested
        // one level deep — flatten it all down to plain tracking strings.
        const flatten = (v: unknown): string[] => {
          if (Array.isArray(v)) return v.flatMap(flatten);
          const s = String(v ?? "").trim();
          if (!s) return [];
          if (s.startsWith("[")) {
            try {
              return flatten(JSON.parse(s));
            } catch {
              /* fall through to the raw string */
            }
          }
          return [s];
        };
        const numbers = flatten(trackingNumbers);

        const nextStatus = toProductionStatus(status, numbers.length > 0, row.production_status);
        const shipped = nextStatus === "shipped" || nextStatus === "delivered";
        // Infer the carrier from the tracking number so the buyer's tracker
        // and the shipping email link to the carrier's own page.
        const carrier = numbers.length ? detectCarrier(numbers[0]).name : null;
        await admin
          .from("originals_orders")
          .update({
            production_status: nextStatus,
            tracking_numbers: numbers,
            ...(carrier ? { carrier } : {}),
            ...(shipped ? { shipped_at: new Date().toISOString() } : {}),
            ...(nextStatus === "delivered" ? { delivered_at: new Date().toISOString() } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        synced += 1;

        // Only log real movement so the admin timeline stays signal, not noise.
        if (nextStatus !== row.production_status || numbers.length) {
          await logPartnerEvent(admin, {
            orderId: row.id,
            groupId: row.group_id,
            partnerOrderId: key,
            source: "tracking_sync",
            stage: shipped ? "shipping" : "production",
            event: `partner_status_${status}`,
            status: nextStatus,
            message: numbers.length ? `Tracking: ${numbers.join(", ")}` : null,
            details: { partnerStatus: status, tracking: numbers, carrier },
          });
        }

        // One shipping notification per order, only once tracking exists.
        if (shipped && numbers.length && !row.shipping_notified_at && row.customer_email) {
          await notifyShipped(row, numbers);
        }


        // One review request per order, sent when the piece is actually in hand.
        if (status === "delivered" && !row.review_requested_at && row.customer_email) {
          await notifyReviewRequest(row);
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
