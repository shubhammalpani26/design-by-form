/**
 * Pure rules for "You may also like" on catalog product pages. The AI picks
 * by catalog line number (never by id) so it cannot invent products; these
 * helpers turn its picks into a clean, valid list and fill gaps sensibly.
 */

export const RECS_COUNT = 4;
/** AI picks are reused for a week; a fallback (AI unavailable) for a day. */
export const AI_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const FALLBACK_TTL_MS = 24 * 60 * 60 * 1000;

export interface CatalogItem {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  designerId: string;
}

const oneLine = (s: string | null | undefined, max: number) =>
  (s ?? "").replace(/\s+/g, " ").replace(/\|/g, "/").trim().slice(0, max);

/** Numbered catalog listing sent to the model (1-based line numbers). */
export function catalogLines(items: CatalogItem[]): string {
  return items
    .map((p, i) => `${i + 1} | ${oneLine(p.name, 80)} | ${oneLine(p.category, 40)} | $${Math.round(p.price)} | ${oneLine(p.description, 140)}`)
    .join("\n");
}

/**
 * Maps the model's line numbers back to product ids: drops out-of-range and
 * duplicate picks and the current product, then tops up from the fallback.
 */
export function resolvePicks(
  picks: number[],
  catalog: CatalogItem[],
  current: { id: string; category: string; designerId: string },
  count = RECS_COUNT,
): string[] {
  const out: string[] = [];
  for (const n of picks) {
    if (!Number.isInteger(n) || n < 1 || n > catalog.length) continue;
    const id = catalog[n - 1].id;
    if (id === current.id || out.includes(id)) continue;
    out.push(id);
    if (out.length >= count) return out;
  }
  for (const id of fallbackPicks(catalog, current, count + out.length)) {
    if (out.length >= count) break;
    if (!out.includes(id)) out.push(id);
  }
  return out;
}

/** Deterministic fallback: same category first, then other categories; other creators before the same one. */
export function fallbackPicks(
  catalog: CatalogItem[],
  current: { id: string; category: string; designerId: string },
  count = RECS_COUNT,
): string[] {
  const rank = (p: CatalogItem) =>
    (p.category === current.category ? 0 : 2) + (p.designerId === current.designerId ? 1 : 0);
  return catalog
    .filter((p) => p.id !== current.id)
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .slice(0, count)
    .map(({ p }) => p.id);
}

export function isFresh(generatedAt: Date, source: string, now: Date): boolean {
  const ttl = source === "ai" ? AI_TTL_MS : FALLBACK_TTL_MS;
  return now.getTime() - generatedAt.getTime() < ttl;
}

/**
 * The only items "You may also like" may show: Nyzora's US-made gift pieces.
 * Keep in step with src/data/originalsSkus.ts (slugs must match).
 * Furniture is never recommended — it isn't made in the USA.
 */
export const GIFT_ITEMS: CatalogItem[] = [
  {
    id: "pet-silhouette-keepsake",
    name: "Custom Pet Memorial Sculpture",
    category: "pet gifts",
    description: "Pet's head sculpted in 3D from a photo, name and dates on the plinth. Remembrance / pet-loss gift. From $59.",
    price: 59,
    designerId: "nyzora",
  },
  {
    id: "pet-portrait-sculpture",
    name: "Custom Pet Portrait Sculpture",
    category: "pet gifts",
    description: "Happy, celebratory 3D bust of a living pet from a photo, with their name. Gift for pet lovers. From $59.",
    price: 59,
    designerId: "nyzora",
  },
  {
    id: "nursery-name-date",
    name: "Baby Name & Date Piece",
    category: "milestone gifts",
    description: "Sculptural nursery keepsake with a baby's name and birth date. New baby / baby shower gift. $60.",
    price: 60,
    designerId: "nyzora",
  },
  {
    id: "wedding-coordinates",
    name: "Wedding Coordinates Piece",
    category: "milestone gifts",
    description: "Sculpture carrying the coordinates and date of a wedding or special place. Wedding / anniversary gift. $85.",
    price: 85,
    designerId: "nyzora",
  },
];

export const isGiftSlug = (slug: unknown): slug is string =>
  typeof slug === "string" && GIFT_ITEMS.some((g) => g.id === slug);
