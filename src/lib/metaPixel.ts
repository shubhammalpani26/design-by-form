/**
 * Meta (Facebook/Instagram) Pixel tracking.
 *
 * Fully inert until VITE_META_PIXEL_ID is set, so nothing third-party ships
 * until the ad account and pixel exist.
 *
 * Env:
 *   VITE_META_PIXEL_ID - numeric pixel id from Meta Events Manager
 */

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

declare global {
  interface Window {
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[] };
    _fbq?: unknown;
  }
}

let loaded = false;

/** Injects the pixel base code once and fires PageView. No-op without a pixel id. */
export function initMetaPixel() {
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
  initMetaPixel();
  window.fbq?.("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
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
  track("InitiateCheckout", {
    content_ids: [skuSlug],
    content_type: "product",
    num_items: pieces,
    value: valueUsd,
    currency: "USD",
  });
}

/** Fire once per confirmed, paid order. eventID = order id so server events dedupe. */
export function trackPurchase(orderId: string, valueUsd: number, skuSlugs: string[]) {
  track(
    "Purchase",
    { content_ids: skuSlugs, content_type: "product", value: valueUsd, currency: "USD" },
    orderId,
  );
}
