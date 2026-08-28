/**
 * Typical finished weight per size (solid single-part PLA). Mirrors
 * src/lib/originalsWeight.ts so the confirmation email states the same figure
 * the buyer saw at the size ladder.
 */
export const SIZE_GRAMS: Record<string, number> = {
  petite: 110,
  standard: 180,
  statement: 340,
};

const oz = (g: number) => (g / 28.3495).toFixed(1);

export function sizeWeightLabel(sizeKey?: string | null): string | null {
  const g = sizeKey ? SIZE_GRAMS[sizeKey] : undefined;
  if (!g) return null;
  return `approx. ${g} g (${oz(g)} oz)`;
}
