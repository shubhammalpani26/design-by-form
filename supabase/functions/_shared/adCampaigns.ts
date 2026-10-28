/**
 * Turns anonymous page-view records into "which ad campaign brought this
 * visitor", so the admin dashboard can show previews and checkouts per campaign.
 *
 * New page views carry `campaign` (the link's utm_campaign, or "meta_untagged"
 * for a Facebook/Instagram click with no tag). Older rows only have `source`
 * and `path`, so known campaigns are recognised from those as a fallback.
 */

export type PageViewMeta = {
  campaign?: string | null;
  source?: string | null;
  landing?: string | null;
  path?: string | null;
};

export const NOT_FROM_AD = "not_from_ad";
export const META_OTHER = "meta_other";

/** Known campaigns: dashboard label plus a fragment of the Meta campaign name for spend matching. */
export const KNOWN_CAMPAIGNS: Record<string, { label: string; metaName: string }> = {
  holiday_gift: { label: "Holiday Gift — US Sales", metaName: "Holiday Gift" },
  city_new_visitors: { label: "New visitors — Austin, Denver, Portland", metaName: "New Visitors" },
};

// The holiday ads went live on 2026-10-25 India time with utm_source=meta.
const HOLIDAY_START = "2026-10-24T18:30:00Z";
// The untagged city ad lands on this page (Facebook adds fbclid → source "facebook").
const CITY_LANDING = "pet-silhouette-keepsake";
const META_SOURCES = new Set([
  "meta", "facebook", "fb", "ig", "instagram",
  "facebook.com", "m.facebook.com", "l.facebook.com", "lm.facebook.com",
  "instagram.com", "l.instagram.com",
]);

export function campaignForPageView(meta: PageViewMeta, createdAt: string): string | null {
  const campaign = (meta.campaign ?? "").trim();
  const source = (meta.source ?? "").trim().toLowerCase();
  const landing = String(meta.landing ?? meta.path ?? "");

  if (campaign && campaign !== "meta_untagged") return campaign.slice(0, 60);
  // Untagged Facebook/Instagram click (new rows) or fbclid-derived source (old rows).
  if (campaign === "meta_untagged" || source === "facebook") {
    return landing.includes(CITY_LANDING) ? "city_new_visitors" : META_OTHER;
  }
  if (source === "meta") return createdAt >= HOLIDAY_START ? "holiday_gift" : META_OTHER;
  if (META_SOURCES.has(source)) return META_OTHER;
  return null;
}

/**
 * One campaign per visitor: their most recent specific campaign; "other
 * Facebook/Instagram" only when nothing more specific was seen.
 * Page views must be passed oldest first.
 */
export function attributeSessions(
  pageViews: { session_id: string; metadata: PageViewMeta | null; created_at: string }[],
): Map<string, string> {
  const out = new Map<string, string>();
  for (const pv of pageViews) {
    const c = campaignForPageView(pv.metadata ?? {}, pv.created_at);
    if (!c) continue;
    if (c === META_OTHER && out.has(pv.session_id)) continue;
    out.set(pv.session_id, c);
  }
  return out;
}

export function campaignLabel(key: string): string {
  if (key === NOT_FROM_AD) return "Not from an ad";
  if (key === META_OTHER) return "Facebook/Instagram — other links";
  if (key === "meta_untagged") return "Facebook/Instagram — untagged";
  return KNOWN_CAMPAIGNS[key]?.label ?? key;
}
