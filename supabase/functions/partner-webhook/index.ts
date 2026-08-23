import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logPartnerEvent } from "../_shared/partnerEvents.ts";
import { detectCarrier } from "../_shared/transactional-email-templates/originals-order-shipped.tsx";

/**
 * Receives lifecycle callbacks from the US manufacturing partner and writes an
 * admin-only timeline entry for every step (processed, printing, printed,
 * packed, label created, shipped, delivered...). Buyers never see this log —
 * their tracker only moves on the coarse production_status.
 *
 * Auth: the partner signs every request with HMAC-SHA256 using the
 * platform's `webhookSecret` (auto-generated on the partner account). We
 * re-compute the signature over `${timestamp}.${rawBody}` and verify it against
 * the `X-Webhook-Signature-256` header, plus a 5-minute freshness window.
 * `PARTNER_WEBHOOK_SECRET` must equal the platform's `webhookSecret`
 * (visible in the partner dashboard under the platform record).
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-webhook-timestamp, x-webhook-signature-256, apikey",
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

/** Constant-time hex string compare to avoid timing oracles. */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Coarse buyer-facing state for a partner event; unknown steps keep us in production. */
const toProductionStatus = (event: string): string | null => {
  const e = event.toLowerCase();
  if (e.includes("deliver")) return "delivered";
  if (e.includes("ship") || e.includes("pickup") || e.includes("label")) return "shipped";
  if (e.includes("cancel")) return "cancelled";
  if (e.includes("fail") || e.includes("reject")) return "failed";
  if (e.includes("process") || e.includes("print") || e.includes("pack")) return "in_production";
  return null;
};

const pick = (o: Record<string, unknown>, keys: string[]): string | null => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number") return String(v);
  }
  return null;
};

/** Normalises a partner timestamp (millis or ISO) into an ISO string. */
function toIso(v: string | null): string {
  if (!v) return new Date().toISOString();
  if (/^\d+$/.test(v)) return new Date(Number(v)).toISOString();
  return v;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  // ---- HMAC-SHA256 signature verification ----
  const secret = Deno.env.get("PARTNER_WEBHOOK_SECRET");
  if (!secret) return json({ error: "Webhook secret not configured" }, 500);

  const rawBody = await req.text();
  const timestamp = req.headers.get("x-webhook-timestamp");
  const signatureHeader = req.headers.get("x-webhook-signature-256");
  const userAgent = req.headers.get("user-agent") ?? "";

  if (!timestamp || !signatureHeader) {
    return json({ error: "Missing signature headers" }, 401);
  }

  // Freshness: reject anything older than 5 minutes (or implausibly in the future).
  const ts = Number(timestamp);
  const age = Date.now() - ts;
  if (!Number.isFinite(ts) || age > 5 * 60 * 1000 || age < -60_000) {
    return json({ error: "Stale or invalid timestamp" }, 401);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const provided = signatureHeader.replace(/^sha256=/i, "").toLowerCase();
  if (!timingSafeEqualHex(provided, computed.toLowerCase())) {
    return json({ error: "Invalid signature" }, 401);
  }

  // ---- Parse + route the event ----
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  // Slant 3D event shape: { event_type, service, platform_id, timestamp,
  //   data: { order: { public_id, status, tracking_number, shipment_status } } }
  const dataField = (body.data ?? {}) as Record<string, unknown>;
  const order = (dataField.order ?? dataField ?? body) as Record<string, unknown>;

  const partnerOrderId = pick(order, ["public_id", "publicId", "orderId", "id"]) ??
    pick(body, ["publicId", "orderId", "public_id", "id"]);
  const event = pick(body, ["event_type", "eventType", "event", "type", "status"]) ??
    pick(order, ["status"]) ?? "update";
  const message = pick(body, ["message", "description"]);
  const occurredAt = toIso(pick(body, ["timestamp", "occurredAt", "created_at"]));

  const rawTracking = order.tracking_number ?? order.trackingNumbers ??
    order.tracking_numbers ?? order.tracking;
  const tracking = (Array.isArray(rawTracking) ? rawTracking : rawTracking ? [rawTracking] : [])
    .map((t) => String(t))
    .filter(Boolean);

  // Match the partner order back to our pieces.
  const { data: rows } = partnerOrderId
    ? await admin
      .from("originals_orders")
      .select("id, group_id, production_status")
      .eq("partner_order_id", partnerOrderId)
    : { data: [] as Array<{ id: string; group_id: string | null; production_status: string }> };

  const production = toProductionStatus(event);
  const now = new Date().toISOString();

  for (const row of rows ?? []) {
    await logPartnerEvent(admin, {
      orderId: row.id,
      groupId: row.group_id,
      partnerOrderId,
      source: "partner_webhook",
      stage: "production",
      event,
      status: production,
      message,
      details: { payload: body, tracking, userAgent },
      occurredAt,
    });

    // Only move the buyer's tracker on a known production state, and never
    // walk it backwards once it has reached a terminal state.
    const terminal = ["shipped", "delivered", "cancelled", "failed"];
    const shouldUpdate = production &&
      (terminal.includes(production) || !terminal.includes(row.production_status));
    if (!shouldUpdate) continue;

    await admin
      .from("originals_orders")
      .update({
        production_status: production,
        ...(tracking.length
          ? { tracking_numbers: tracking, carrier: detectCarrier(tracking[0]).name }
          : {}),
        ...(production === "shipped" ? { shipped_at: now } : {}),
        ...(production === "delivered" ? { delivered_at: now } : {}),
        updated_at: now,
      })
      .eq("id", row.id);
  }

  if (!rows?.length) {
    // Unmatched callbacks still belong in the timeline for triage.
    await logPartnerEvent(admin, {
      partnerOrderId,
      source: "partner_webhook",
      stage: "production",
      event,
      message: message ?? "No Nyzora order matched this partner order id",
      details: { payload: body, userAgent },
      occurredAt,
    });
  }

  // A shipped/delivered callback is also the cheapest trigger for a full sync
  // (tracking numbers + buyer emails) — best effort.
  if (production === "shipped" || production === "delivered") {
    admin.functions
      .invoke("originals-tracking-sync", { body: { group_id: rows?.[0]?.group_id } })
      .catch(() => {});
  }

  return json({ ok: true, matched: rows?.length ?? 0, event });
});
