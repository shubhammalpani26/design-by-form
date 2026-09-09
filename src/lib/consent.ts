/**
 * Region-gated tracking consent.
 *
 * Visitors in regions that require consent (EEA, UK, Switzerland, and a few
 * other opt-in regimes) see a banner and are not tracked until they accept.
 * Everyone else is tracked as normal and never sees a banner.
 *
 * The region check reads the visitor's country client-side from Cloudflare's
 * same-origin /cdn-cgi/trace endpoint and fails open (banner shown, tracking
 * denied) on any doubt.
 */

const STORAGE_KEY = "nyzora_consent_v1";

/** Countries where prior consent is required before analytics/ads tracking. */
const CONSENT_REQUIRED = new Set([
  // EEA
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IS", "IE", "IT", "LV", "LI", "LT", "LU", "MT", "NL", "NO", "PL",
  "PT", "RO", "SK", "SI", "ES", "SE",
  // UK + Switzerland
  "GB", "CH",
  // Unknown / anonymised — fail open
  "XX", "T1",
]);

export type ConsentChoice = "granted" | "denied";

let allowed = false;
const listeners = new Set<() => void>();

/** True when tracking scripts may run right now. */
export function isTrackingAllowed() {
  return allowed;
}

/** Runs cb once tracking becomes allowed (immediately if it already is). */
export function onTrackingAllowed(cb: () => void) {
  if (allowed) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function allow() {
  if (allowed) return;
  allowed = true;
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      /* ignore */
    }
  });
}

export function getStoredConsent(): ConsentChoice | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function setConsent(choice: ConsentChoice) {
  try {
    localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    /* ignore */
  }
  if (choice === "granted") allow();
}

/** Reads the visitor's country. Returns null when it can't be determined. */
async function detectCountry(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch("/cdn-cgi/trace", { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/^loc=([A-Z0-9]{2})$/m);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Decides whether tracking runs and whether the banner is shown.
 * Resolves to true when the consent banner should be rendered.
 */
export async function resolveConsent(): Promise<boolean> {
  const stored = getStoredConsent();
  if (stored === "granted") {
    allow();
    return false;
  }

  const country = await detectCountry();
  const regulated = country === null || CONSENT_REQUIRED.has(country);

  if (!regulated) {
    // Outside the consent regimes: track as normal, no banner ever.
    allow();
    return false;
  }

  if (stored === "denied") return false;
  return true;
}
