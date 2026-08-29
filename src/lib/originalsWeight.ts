/**
 * Typical finished weight per SKU + size, so buyers know what lands in their
 * hand before they pay. These are solid single-part PLA prints; actual pieces
 * vary a little with the sculpted volume of each animal or form.
 *
 * Sculpted busts and flat plaques are very different forms — a 155 mm wide
 * plaque is nowhere near a 140 mm bust — so weights are keyed per SKU.
 */
const BUST_GRAMS: Record<string, number> = {
  petite: 110,
  standard: 180,
  statement: 340,
};

const PLAQUE_GRAMS: Record<string, number> = {
  standard: 115,
};

export const SKU_SIZE_GRAMS: Record<string, Record<string, number>> = {
  "pet-silhouette-keepsake": BUST_GRAMS,
  "pet-portrait-sculpture": BUST_GRAMS,
  "nursery-name-date": PLAQUE_GRAMS,
  "wedding-coordinates": PLAQUE_GRAMS,
};

const oz = (g: number) => (g / 28.3495).toFixed(1);

/** e.g. "approx. 180 g (6.3 oz)" — null when we have no figure for the piece. */
export function sizeWeightLabel(skuSlug?: string | null, sizeKey?: string | null): string | null {
  const table = skuSlug ? SKU_SIZE_GRAMS[skuSlug] : undefined;
  const g = table && sizeKey ? table[sizeKey] : undefined;
  if (!g) return null;
  return `approx. ${g} g (${oz(g)} oz)`;
}
