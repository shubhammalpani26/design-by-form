import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logPartnerEvent } from "../_shared/partnerEvents.ts";
import { detectCarrier } from "../_shared/transactional-email-templates/originals-order-shipped.tsx";

/**
 * Receives lifecycle callbacks from the US manufacturing partner and writes an
 * admin-only timeline entry for every step (processed, printing, printed,
 * packed, label created, shipped, delivered...). Buyers never see this log —
 * their tracker only moves on the coarse production_status.
 *
 * Auth: shared secret in `x-partner-secret` or `?secret=` (the partner cannot
 * send Supabase JWTs). Configure PARTNER_WEBHOOK_SECRET.
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-partner-secret, apikey",
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

/** Coarse buyer-facing state for a partner event; unknown steps keep us in production. */
const toProductionStatus = (event: string): string | null => {
  const e = event.toLowerCase();
  if (e.includes("deliver")) return "delivered";
  if (e.includes("ship") || e.includes("pickup") || e.includes("label")) return "shipped";
  if (e.includes("cancel")) return "cancelled";
  if (e.includes("fail") || e.includes("reject")) return "failed";
  return "in_production";
};

const pick = (o: Record<string, unknown>, keys: string[]): string | null => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const expected = Deno.env.get("PARTNER_WEBHOOK_SECRET");
  const provided = req.headers.get("x-partner-secret") ??
    new URL(req.url).searchParams.get("secret");
  if (!expected || provided !== expected) return json({ error: "Unauthorized" }, 401);

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const payload = ((body.data ?? body.order ?? body) ?? {}) as Record<string, unknown>;

    const partnerOrderId = pick(payload, ["publicId", "orderId", "public_id", "id"]) ??
      pick(body, ["publicId", "orderId", "public_id", "id"]);
    const event = pick(body, ["event", "type", "eventType", "status"]) ??
      pick(payload, ["status"]) ?? "update";
    const message = pick(body, ["message", "description"]);
    const occurredAt = pick(body, ["timestamp", "occurredAt", "created_at"]);

    const rawTracking = (payload.trackingNumbers ?? payload.tracking_numbers ??
      payload.trackingNumber ?? (payload.fulfillment as Record<string, unknown> | undefined)
        ?.trackingNumbers) as unknown;
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
        details: { payload: body, tracking },
        occurredAt: occurredAt ?? now,
      });

      // Never walk a buyer's tracker backwards.
      const terminal = ["shipped", "delivered", "cancelled", "failed"];
      const shouldUpdate = production &&
        (terminal.includes(production) || !terminal.includes(row.production_status));
      if (!shouldUpdate) continue;

      await admin
        .from("originals_orders")
        .update({
          production_status: production,
          ...(tracking.length ? { tracking_numbers: tracking, carrier: detectCarrier(tracking[0]).name } : {}),
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
        details: { payload: body },
        occurredAt: occurredAt ?? now,
      });
    }

    // A shipped/delivered callback is also the cheapest trigger for a full sync
    // (tracking numbers + buyer emails) — best effort.
    if (production === "shipped" || production === "delivered") {
      admin.functions
        .invoke("originals-tracking-sync", { body: { group_id: rows?.[0]?.group_id } })
        .catch(() => {});
    }

    return json({ ok: true, matched: rows?.length ?? 0 });
  } catch (e) {
    console.error("partner-webhook error", e);
    return json({ error: "Could not record partner event" }, 500);
  }
});
