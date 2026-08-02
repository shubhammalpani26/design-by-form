// Mirror of src/lib/budgetTiers.ts — keep the two in sync.
// Budget-first design brief.
//
// Creators pick a manufacturing base price (MBP) band for their audience, and we
// back-track it into a physical brief the design agent can actually hit:
//   MBP  =  rate per cubic foot  ×  volume (ft³)
// so   volume  =  MBP / rate, and the size envelope follows from the volume.
//
// The rate band doubles as a complexity signal: a low MBP has to buy a simpler,
// single-material piece; a high MBP can afford sculptural, multi-material work.

export const CUBIC_FEET_TO_CM3 = 28316.8;

// Artisan (India) rate window used by the pricing agent, ₹ per cubic foot.
export const INR_RATE_MIN = 8000;
export const INR_RATE_MAX = 18000;

export interface BudgetBand {
  key: string;
  label: string;
  min: number;
  max: number;
  currency: "INR" | "USD";
  audience: string;
}

export const INR_BUDGET_BANDS: BudgetBand[] = [
  { key: "entry", label: "₹5k–15k", min: 5000, max: 15000, currency: "INR", audience: "First-time buyers, accent pieces" },
  { key: "core", label: "₹15k–35k", min: 15000, max: 35000, currency: "INR", audience: "Mainstream premium home" },
  { key: "premium", label: "₹35k–75k", min: 35000, max: 75000, currency: "INR", audience: "Design-led collectors" },
  { key: "statement", label: "₹75k–1.5L", min: 75000, max: 150000, currency: "INR", audience: "Statement / gallery pieces" },
];

// US on-demand FDM tiers price by part size, not cubic feet — bands are retail-ish USD.
export const USD_BUDGET_BANDS: BudgetBand[] = [
  { key: "impulse", label: "$10–25", min: 10, max: 25, currency: "USD", audience: "Impulse gifting, small objects" },
  { key: "shelf", label: "$25–60", min: 25, max: 60, currency: "USD", audience: "Considered decor buyers" },
  { key: "collector", label: "$60–150", min: 60, max: 150, currency: "USD", audience: "Collectible / limited runs" },
];

export interface BudgetBrief {
  min: number;
  max: number;
  currency: "INR" | "USD";
  /** Suggested volume window in cubic feet (INR/artisan only). */
  volumeMinFt3?: number;
  volumeMaxFt3?: number;
  /** Equivalent cube edge in cm, a easy-to-read size envelope. */
  cubeMinCm: number;
  cubeMaxCm: number;
  complexity: "low" | "medium" | "high";
  /** Human-readable brief injected into the design prompt. */
  text: string;
}

function cubeEdgeCm(volumeFt3: number) {
  return Math.cbrt(volumeFt3 * CUBIC_FEET_TO_CM3);
}

export function formatMoney(value: number, currency: "INR" | "USD") {
  if (currency === "USD") return `$${Math.round(value).toLocaleString("en-US")}`;
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

/**
 * Back-track a manufacturing base price window into a size + complexity brief.
 * `fdm` = US on-demand print tier (fixed 250mm envelope, priced by part size).
 */
export function buildBudgetBrief(
  min: number,
  max: number,
  currency: "INR" | "USD",
  fdm: boolean,
): BudgetBrief {
  const lo = Math.max(0, Math.min(min, max));
  const hi = Math.max(min, max);

  if (fdm || currency === "USD") {
    // US FDM: material volume drives cost. Roughly $1 per 10cm³ of printed part
    // at collectible density, capped by the 250mm single-part envelope.
    const cubeMinCm = Math.max(6, Math.min(25, Math.cbrt(lo * 10)));
    const cubeMaxCm = Math.max(8, Math.min(25, Math.cbrt(hi * 10)));
    const complexity = hi >= 60 ? "high" : hi >= 25 ? "medium" : "low";
    return {
      min: lo,
      max: hi,
      currency: "USD",
      cubeMinCm,
      cubeMaxCm,
      complexity,
      text: [
        `BUDGET-DRIVEN BRIEF (design backwards from price):`,
        `- Target manufacturing base price: ${formatMoney(lo, "USD")}–${formatMoney(hi, "USD")} per unit, US on-demand print.`,
        `- Keep the part roughly ${cubeMinCm.toFixed(0)}–${cubeMaxCm.toFixed(0)} cm in its largest dimension (hard ceiling 25 cm).`,
        `- Cost is driven by printed material volume and time: favour ${complexity === "low"
          ? "hollow-feeling, thin-walled, compact forms with minimal mass"
          : complexity === "medium"
            ? "moderate mass with expressive surface texture rather than bulk"
            : "a larger, more sculptural presence that justifies the collector price"}.`,
        `- Do not over-design past the budget: no secondary parts, inserts, or assembly hardware.`,
      ].join("\n"),
    };
  }

  // Artisan India: MBP = rate/ft³ × volume.
  const volumeMinFt3 = lo / INR_RATE_MAX;
  const volumeMaxFt3 = hi / INR_RATE_MIN;
  const complexity: BudgetBrief["complexity"] = hi >= 75000 ? "high" : hi >= 25000 ? "medium" : "low";
  const cubeMinCm = cubeEdgeCm(volumeMinFt3);
  const cubeMaxCm = cubeEdgeCm(volumeMaxFt3);

  return {
    min: lo,
    max: hi,
    currency: "INR",
    volumeMinFt3,
    volumeMaxFt3,
    cubeMinCm,
    cubeMaxCm,
    complexity,
    text: [
      `BUDGET-DRIVEN BRIEF (design backwards from price):`,
      `- Target manufacturing base price: ${formatMoney(lo, "INR")}–${formatMoney(hi, "INR")} per unit.`,
      `- That buys roughly ${volumeMinFt3.toFixed(2)}–${volumeMaxFt3.toFixed(2)} cubic feet of finished volume`,
      `  (about a ${cubeMinCm.toFixed(0)}–${cubeMaxCm.toFixed(0)} cm cube equivalent). Scale the piece to land inside that.`,
      `- Craft level for this budget: ${complexity.toUpperCase()} complexity — ${complexity === "low"
        ? "simple forms, one primary material, matte single-tone finish, no hardware"
        : complexity === "medium"
          ? "curved or organic form, one primary material plus one accent, dual finish, light hardware"
          : "sculptural or intricate form, multi-material, premium hand-finishing, bespoke detailing"}.`,
      `- If the requested piece is inherently larger than the budget allows, keep the silhouette but reduce`,
      `  mass, thickness and material count rather than exceeding the price.`,
    ].join("\n"),
  };
}
