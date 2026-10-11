/**
 * Meta (Facebook/Instagram) Pixel tracking.
 *
 * Fully inert until VITE_META_PIXEL_ID is set, so nothing third-party ships
 * until the ad account and pixel exist.
 *
 * Env:
 *   VITE_META_PIXEL_ID - numeric pixel id from Meta Events Manager
 */

// Live Nyzora pixel. A pixel id is public (it ships in the page anyway), so it
// is safe as a default; the env var still wins for staging/other accounts.
const PIXEL_ID = (import.meta.env.VITE_META_PIXEL_ID as string | undefined) || "2121773078407819";

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[] };
    _fbq?: unknown;
  }
}

import { isTrackingAllowed, onTrackingAllowed } from "./consent";
import { supabase } from "@/integrations/supabase/client";

let loaded = false;

/** Injects the pixel base code once and fires PageView. No-op without a pixel id. */
export function initMetaPixel() {
  if (!isTrackingAllowed()) return;
  if (loaded || !PIXEL_ID || typeof document === "undefined") return;
  loaded = true;

  const n: Window["fbq"] = function fbq(...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const self = window.fbq as any;
    if (self.callMethod) self.callMethod(...args);
    else self.queue.push(args);
  } as Window["fbq"];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (n as any).queue = [];
  window.fbq = n;
  window._fbq = n;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  window.fbq("init", PIXEL_ID);
  window.fbq("track", "PageView");
}

function track(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (!PIXEL_ID) return;
  // Defer until consent has resolved. Events fired on component mount (e.g.
  // ViewContent) can race the async region check and be silently dropped
  // otherwise — the pixel stub does not exist yet, so the call is a no-op.
  onTrackingAllowed(() => {
    initMetaPixel();
    window.fbq?.("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
  });
}

/** Buyer landed on a product / personalization flow. */
export function trackViewContent(skuSlug: string, valueUsd?: number) {
  track("ViewContent", { content_ids: [skuSlug], content_type: "product", value: valueUsd, currency: "USD" });
}

/** Buyer rendered a personalized preview — the strongest mid-funnel intent signal. */
export function trackCustomize(skuSlug: string) {
  track("CustomizeProduct", { content_ids: [skuSlug], content_type: "product" });
}

/** Buyer opened checkout. */
export function trackInitiateCheckout(skuSlug: string, valueUsd: number, pieces: number) {
  const eventId = `ic-${crypto.randomUUID()}`;
  track(
    "InitiateCheckout",
    { content_ids: [skuSlug], content_type: "product", num_items: pieces, value: valueUsd, currency: "USD" },
    eventId,
  );
  // Server-side copy (Conversions API), same event id so Meta dedupes.
  onTrackingAllowed(() => {
    const tracking = metaTrackingContext();
    if (!tracking) return;
    void supabase.functions
      .invoke("meta-capi", { body: { eventName: "InitiateCheckout", eventId, skuSlug, valueUsd, numItems: pieces, tracking } })
      .catch(() => {});
  });
}

function readCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/**
 * Browser context for server-side Meta events. Returns null unless the
 * visitor may be tracked, so no consent → nothing is stored or sent.
 */
export function metaTrackingContext() {
  if (!isTrackingAllowed() || typeof document === "undefined") return null;
  let fbc = readCookie("_fbc");
  if (!fbc) {
    const clid = new URLSearchParams(window.location.search).get("fbclid") ?? sessionStorage.getItem("nyzora_fbclid");
    if (clid) fbc = `fb.1.${Date.now()}.${clid}`;
  }
  return { fbp: readCookie("_fbp"), fbc, sourceUrl: window.location.origin + window.location.pathname };
}

// Remember the ad click id for the session so checkout pages can still attribute it.
if (typeof window !== "undefined") {
  try {
    const clid = new URLSearchParams(window.location.search).get("fbclid");
    if (clid) sessionStorage.setItem("nyzora_fbclid", clid);
  } catch {
    /* ignore */
  }
}

/** Fire once per confirmed, paid order. eventID = order id so server events dedupe. */
export function trackPurchase(orderId: string, valueUsd: number, skuSlugs: string[]) {
  track(
    "Purchase",
    { content_ids: skuSlugs, content_type: "product", value: valueUsd, currency: "USD" },
    orderId,
  );
}
