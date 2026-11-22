/**
 * Display mirror of the server-side second-copy price in
 * supabase/functions/_shared/originalsPricing.ts — the server is the source
 * of truth and re-prices every order; this only renders the offer.
 * Owner decision 2026-11-22: 35% off → $39 Petite / $58 Standard / $90 Statement.
 */
export const SECOND_COPY_RATIO = 0.65;

export function secondCopyUsd(unitUsd: number): number {
  return Math.max(39, Math.round(unitUsd * SECOND_COPY_RATIO));
}
