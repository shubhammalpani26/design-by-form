/**
 * Single source of truth for what each Stripe price unlocks inside Nyzora.
 * Keyed by the human-readable price id (Stripe `lookup_key`), which is stable
 * across sandbox and live — never key off Stripe's internal `price_...` id.
 */

export interface PlanEntitlement {
  planType: "creator" | "pro";
  tier: "creator" | "pro_studio";
  billingCycle: "monthly" | "yearly";
  /** null = unlimited */
  listingsLimit: number | null;
  threeDModelsLimit: number;
  /** AI credits granted on activation and refilled every billing period */
  monthlyCredits: number;
  label: string;
}

export const SUBSCRIPTION_PRICES: Record<string, PlanEntitlement> = {
  creator_monthly_inr: { planType: "creator", tier: "creator", billingCycle: "monthly", listingsLimit: null, threeDModelsLimit: 5, monthlyCredits: 100, label: "Creator" },
  creator_yearly_inr: { planType: "creator", tier: "creator", billingCycle: "yearly", listingsLimit: null, threeDModelsLimit: 5, monthlyCredits: 100, label: "Creator" },
  creator_monthly_usd: { planType: "creator", tier: "creator", billingCycle: "monthly", listingsLimit: null, threeDModelsLimit: 5, monthlyCredits: 100, label: "Creator" },
  creator_yearly_usd: { planType: "creator", tier: "creator", billingCycle: "yearly", listingsLimit: null, threeDModelsLimit: 5, monthlyCredits: 100, label: "Creator" },
  pro_studio_monthly_inr: { planType: "pro", tier: "pro_studio", billingCycle: "monthly", listingsLimit: null, threeDModelsLimit: 20, monthlyCredits: 400, label: "Pro Studio" },
  pro_studio_yearly_inr: { planType: "pro", tier: "pro_studio", billingCycle: "yearly", listingsLimit: null, threeDModelsLimit: 20, monthlyCredits: 400, label: "Pro Studio" },
  pro_studio_monthly_usd: { planType: "pro", tier: "pro_studio", billingCycle: "monthly", listingsLimit: null, threeDModelsLimit: 20, monthlyCredits: 400, label: "Pro Studio" },
  pro_studio_yearly_usd: { planType: "pro", tier: "pro_studio", billingCycle: "yearly", listingsLimit: null, threeDModelsLimit: 20, monthlyCredits: 400, label: "Pro Studio" },
};

export const CREDIT_PACK_PRICES: Record<string, { credits: number; label: string }> = {
  credits_starter_inr: { credits: 10, label: "Starter Credit Pack" },
  credits_starter_usd: { credits: 10, label: "Starter Credit Pack" },
  credits_creator_inr: { credits: 20, label: "Creator Credit Pack" },
  credits_creator_usd: { credits: 20, label: "Creator Credit Pack" },
  credits_pro_inr: { credits: 50, label: "Pro Credit Pack" },
  credits_pro_usd: { credits: 50, label: "Pro Credit Pack" },
};

/** Free-tier ceiling applied when a paid period lapses (soft-cap). */
export const FREE_TIER = {
  listingsLimit: 5,
  threeDModelsLimit: 0,
};

export function isSubscriptionPrice(priceId: string): boolean {
  return priceId in SUBSCRIPTION_PRICES;
}

export function isCreditPackPrice(priceId: string): boolean {
  return priceId in CREDIT_PACK_PRICES;
}
