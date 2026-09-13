/**
 * Typical finished weight per SKU + size (solid single-part PLA). Mirrors
 * src/lib/originalsWeight.ts so the confirmation email states the same figure
 * the buyer saw at the size ladder. Busts and flat plaques differ, so the
 * table is keyed per SKU — never one shared bust weight for everything.
 */
const BUST_GRAMS: Record<string, number> = {
  petite: 165,
  standard: 265,
  statement: 730,
};

const PLAQUE_GRAMS: Record<string, number> = {
  standard: 110,
};

export const SKU_SIZE_GRAMS: Record<string, Record<string, number>> = {
  "pet-silhouette-keepsake": BUST_GRAMS,
  "pet-portrait-sculpture": BUST_GRAMS,
  "nursery-name-date": PLAQUE_GRAMS,
  "wedding-coordinates": PLAQUE_GRAMS,
};

const oz = (g: number) => (g / 28.3495).toFixed(1);

export function sizeWeightLabel(skuSlug?: string | null, sizeKey?: string | null): string | null {
  const table = skuSlug ? SKU_SIZE_GRAMS[skuSlug] : undefined;
  const g = table && sizeKey ? table[sizeKey] : undefined;
  if (!g) return null;
  return `approx. ${g} g (${oz(g)} oz)`;
}

/**
 * Label from the partner slicer's own figure when we have it, else the table.
 * Rounded down to 5 g so the piece never weighs less than promised.
 */
export function actualWeightLabel(
  grams?: number | null,
  skuSlug?: string | null,
  sizeKey?: string | null,
): string | null {
  const g = typeof grams === "number" && grams > 0 ? Math.floor(grams / 5) * 5 : 0;
  if (g > 0) return `approx. ${g} g (${oz(g)} oz)`;
  return sizeWeightLabel(skuSlug, sizeKey);
}
