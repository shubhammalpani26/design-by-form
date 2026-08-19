/**
 * Google Ads conversion tracking.
 *
 * Fully inert until VITE_GOOGLE_ADS_ID is set (e.g. "AW-1234567890"), so the
 * app ships no third-party script until the Ads account exists.
 *
 * Env:
 *   VITE_GOOGLE_ADS_ID              - conversion account id, "AW-XXXXXXXXXX"
 *   VITE_GOOGLE_ADS_PURCHASE_LABEL  - conversion label for a completed order
 *   VITE_GOOGLE_ADS_LEAD_LABEL      - optional, label for begin-checkout / lead
 */

const ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined;
const PURCHASE_LABEL = import.meta.env.VITE_GOOGLE_ADS_PURCHASE_LABEL as string | undefined;
const LEAD_LABEL = import.meta.env.VITE_GOOGLE_ADS_LEAD_LABEL as string | undefined;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

let loaded = false;

/** Injects gtag.js once. No-op when no Ads id is configured. */
export function initGoogleAds() {
  if (loaded || !ADS_ID || typeof document === "undefined") return;
  loaded = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ADS_ID)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", ADS_ID);
}

function fire(label: string | undefined, params: Record<string, unknown>) {
  if (!ADS_ID || !label) return;
  initGoogleAds();
  window.gtag?.("event", "conversion", {
    send_to: `${ADS_ID}/${label}`,
    ...params,
  });
}

/** Fire once per confirmed, paid order. */
export function trackPurchaseConversion(orderId: string, valueUsd: number) {
  fire(PURCHASE_LABEL, {
    value: Number.isFinite(valueUsd) ? valueUsd : undefined,
    currency: "USD",
    transaction_id: orderId,
  });
}

/** Fire when a visitor starts checkout — useful as an early optimisation signal. */
export function trackCheckoutStart(valueUsd?: number) {
  fire(LEAD_LABEL, { value: valueUsd, currency: "USD" });
}
