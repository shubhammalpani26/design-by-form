/**
 * Maps Nyzora plans and credit packs to Stripe price ids.
 * INR for India, USD everywhere else — must stay in sync with
 * supabase/functions/_shared/plans.ts.
 */
export type BillingCurrency = "inr" | "usd";

export function billingCurrency(currency: string): BillingCurrency {
  return currency === "INR" ? "inr" : "usd";
}

export const SUBSCRIPTION_PRICE_IDS = {
  creator: { monthly: { inr: "creator_monthly_inr", usd: "creator_monthly_usd" }, yearly: { inr: "creator_yearly_inr", usd: "creator_yearly_usd" } },
  pro: { monthly: { inr: "pro_studio_monthly_inr", usd: "pro_studio_monthly_usd" }, yearly: { inr: "pro_studio_yearly_inr", usd: "pro_studio_yearly_usd" } },
} as const;

export const CREDIT_PACKS = [
  { id: "starter", name: "Starter", credits: 10, inr: 299, usd: 5, priceIds: { inr: "credits_starter_inr", usd: "credits_starter_usd" } },
  { id: "creator", name: "Creator", credits: 20, inr: 499, usd: 9, popular: true, priceIds: { inr: "credits_creator_inr", usd: "credits_creator_usd" } },
  { id: "pro", name: "Pro", credits: 50, inr: 999, usd: 19, priceIds: { inr: "credits_pro_inr", usd: "credits_pro_usd" } },
] as const;

export function subscriptionPriceId(
  plan: "creator" | "pro",
  cycle: "monthly" | "yearly",
  currency: BillingCurrency,
): string {
  return SUBSCRIPTION_PRICE_IDS[plan][cycle][currency];
}
