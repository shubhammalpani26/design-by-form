/**
 * Meta Conversions API sender (server-side backup for the browser pixel).
 * Events share their event_id with the pixel so Meta deduplicates them.
 * Only called when the visitor's browser had tracking consent (the client
 * sends tracking context only then). Never throws — tracking must never
 * break checkout or payment.
 */
export const META_PIXEL_ID = "2121773078407819";
const GATEWAY = "https://connector-gateway.lovable.dev/meta_ads";

export type MetaTracking = {
  fbp?: string | null;
  fbc?: string | null;
  sourceUrl?: string | null;
  userAgent?: string | null;
  ip?: string | null;
};

export function trackingFromRequest(req: Request, raw: unknown): MetaTracking | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const s = (v: unknown, max = 500) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const ip = (req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  return {
    fbp: s(r.fbp, 200),
    fbc: s(r.fbc, 300),
    sourceUrl: s(r.sourceUrl),
    userAgent: s(req.headers.get("user-agent")),
    ip,
  };
}

export async function sendMetaEvent(ev: {
  eventName: "Purchase" | "InitiateCheckout";
  eventId: string;
  eventTime?: number;
  tracking: MetaTracking;
  valueUsd?: number;
  contentIds?: string[];
  numItems?: number;
}): Promise<boolean> {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const connKey = Deno.env.get("META_ADS_API_KEY");
  if (!lovableKey || !connKey) {
    console.error("meta capi: missing gateway keys");
    return false;
  }
  if (!ev.tracking.userAgent) return false; // required for website events
  const user_data: Record<string, unknown> = { client_user_agent: ev.tracking.userAgent };
  if (ev.tracking.ip) user_data.client_ip_address = ev.tracking.ip;
  if (ev.tracking.fbp) user_data.fbp = ev.tracking.fbp;
  if (ev.tracking.fbc) user_data.fbc = ev.tracking.fbc;

  const body = {
    data: [{
      event_name: ev.eventName,
      event_time: ev.eventTime ?? Math.floor(Date.now() / 1000),
      event_id: ev.eventId,
      action_source: "website",
      event_source_url: ev.tracking.sourceUrl ?? "https://nyzora.ai/",
      user_data,
      custom_data: {
        currency: "USD",
        ...(ev.valueUsd != null ? { value: Math.round(ev.valueUsd * 100) / 100 } : {}),
        ...(ev.contentIds?.length ? { content_ids: ev.contentIds, content_type: "product" } : {}),
        ...(ev.numItems ? { num_items: ev.numItems } : {}),
      },
    }],
  };
  try {
    const res = await fetch(`${GATEWAY}/v26.0/${META_PIXEL_ID}/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error(`meta capi ${ev.eventName} failed [${res.status}]: ${text.slice(0, 500)}`);
      return false;
    }
    console.log(`meta capi ${ev.eventName} ok ${ev.eventId}: ${text.slice(0, 200)}`);
    return true;
  } catch (e) {
    console.error("meta capi error", e);
    return false;
  }
}
