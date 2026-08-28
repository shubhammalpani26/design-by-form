/**
 * Typical finished weight per size, so buyers know what lands in their hand
 * before they pay. These are solid single-part PLA prints; actual pieces vary
 * a little with the sculpted volume of each animal or form.
 */
export const SIZE_GRAMS: Record<string, number> = {
  petite: 110,
  standard: 180,
  statement: 340,
};

const oz = (g: number) => (g / 28.3495).toFixed(1);

/** e.g. "approx. 180 g (6.3 oz)" — null when we have no figure for the size. */
export function sizeWeightLabel(sizeKey?: string | null): string | null {
  const g = sizeKey ? SIZE_GRAMS[sizeKey] : undefined;
  if (!g) return null;
  return `approx. ${g} g (${oz(g)} oz)`;
}
