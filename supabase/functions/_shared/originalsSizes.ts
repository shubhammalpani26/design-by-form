/**
 * Longest printed edge (mm) per SKU + size. Used both when converting a mesh
 * into a print file and when we slice it with the US partner, so the cost we
 * quote is the cost of the piece the buyer actually receives.
 */
export const ORIGINALS_SIZE_MM: Record<string, Record<string, number>> = {
  "pet-silhouette-keepsake": { petite: 120, standard: 140, statement: 196 },
  "pet-portrait-sculpture": { petite: 120, standard: 140, statement: 196 },
  "nursery-name-date": { standard: 155 },
  "wedding-coordinates": { standard: 155 },
};

export function sizeMm(skuSlug: string, sizeKey: string): number {
  return ORIGINALS_SIZE_MM[skuSlug]?.[sizeKey] ?? 140;
}
