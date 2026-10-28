/**
 * Remembers which ad campaign brought this visitor (from the link's
 * utm_campaign, or a Facebook/Instagram click id when the link has no tag).
 * No personal data: only the campaign tag, source and landing page are kept,
 * for 30 days, so later page views still credit the right campaign.
 */
const KEY = "nyz_ad_touch";
const TTL_MS = 30 * 86400_000;

export type AdTouch = { campaign: string; source: string; landing: string; at: number };

export function touchFromUrl(search: string, pathname: string, now = Date.now()): AdTouch | null {
  const p = new URLSearchParams(search);
  const utmCampaign = (p.get("utm_campaign") ?? "").trim();
  const utmSource = (p.get("utm_source") ?? "").trim();
  let campaign = utmCampaign;
  if (!campaign && p.get("fbclid")) campaign = "meta_untagged";
  if (!campaign && p.get("gclid")) campaign = "google_untagged";
  if (!campaign) return null;
  return {
    campaign: campaign.slice(0, 60),
    source: (utmSource || (p.get("fbclid") ? "facebook" : p.get("gclid") ? "google" : "")).slice(0, 60),
    landing: pathname.slice(0, 200),
    at: now,
  };
}

/** Returns the current ad visit (fresh from the URL, or remembered) and whether it's a new click. */
export function getAdTouch(search: string, pathname: string): { touch: AdTouch | null; fresh: boolean } {
  const fromUrl = touchFromUrl(search, pathname);
  try {
    if (fromUrl) {
      localStorage.setItem(KEY, JSON.stringify(fromUrl));
      return { touch: fromUrl, fresh: true };
    }
    const raw = localStorage.getItem(KEY);
    if (!raw) return { touch: null, fresh: false };
    const stored = JSON.parse(raw) as AdTouch;
    if (!stored?.campaign || Date.now() - Number(stored.at) > TTL_MS) return { touch: null, fresh: false };
    return { touch: stored, fresh: false };
  } catch {
    return { touch: fromUrl, fresh: !!fromUrl };
  }
}
