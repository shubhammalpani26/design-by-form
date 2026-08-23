// deno-lint-ignore-file no-explicit-any
/**
 * Internal, admin-only timeline for US-made orders. Every partner interaction
 * (draft, process, status change, tracking, failure) is appended here so the
 * admin panel can show exactly what happened when. Never surfaced to buyers.
 */
export interface PartnerEvent {
  orderId?: string | null;
  groupId?: string | null;
  partnerOrderId?: string | null;
  /** where in the pipeline: quote | print file | partner order | production | shipping */
  stage: string;
  /** short machine-ish name, e.g. draft_created, order_processed, tracking_synced */
  event: string;
  status?: string | null;
  message?: string | null;
  details?: Record<string, unknown>;
  source?: "internal" | "partner_webhook" | "tracking_sync";
  occurredAt?: string;
}

export async function logPartnerEvent(admin: any, e: PartnerEvent): Promise<void> {
  try {
    await admin.from("partner_order_events").insert({
      originals_order_id: e.orderId ?? null,
      group_id: e.groupId ?? null,
      partner_order_id: e.partnerOrderId ?? null,
      source: e.source ?? "internal",
      stage: e.stage,
      event: e.event,
      status: e.status ?? null,
      message: e.message ? String(e.message).slice(0, 800) : null,
      details: e.details ?? {},
      occurred_at: e.occurredAt ?? new Date().toISOString(),
    });
  } catch (err) {
    // Observability must never break fulfillment.
    console.error("logPartnerEvent failed", err);
  }
}

/** Logs the same event once per row of an order group. */
export async function logPartnerEvents(
  admin: any,
  orderIds: string[],
  e: Omit<PartnerEvent, "orderId">,
): Promise<void> {
  await Promise.all(orderIds.map((id) => logPartnerEvent(admin, { ...e, orderId: id })));
}
