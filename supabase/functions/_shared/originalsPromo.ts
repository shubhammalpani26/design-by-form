/**
 * Promo codes for Nyzora Originals.
 *
 * Codes are always validated and applied server-side against the real
 * subtotal — the browser only ever gets told the resulting discount.
 */
export interface PromoResult {
  code: string;
  description: string | null;
  discountUsd: number;
  internalTest: boolean;
}

export interface PromoError {
  error: string;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export async function resolvePromo(
  admin: { from: (t: string) => any; rpc?: (fn: string, args: Record<string, unknown>) => any },
  rawCode: unknown,
  subtotalUsd: number,
  userId?: string | null,
): Promise<PromoResult | PromoError | null> {
  const code = String(rawCode ?? "").trim().toUpperCase().slice(0, 32);
  if (!code) return null;

  const { data: promo, error } = await admin
    .from("originals_promo_codes")
    .select(
      "code, description, percent_off, amount_off_usd, min_subtotal_usd, active, starts_at, expires_at, max_redemptions, times_redeemed, admin_only",
    )
    .ilike("code", code)
    .maybeSingle();

  if (error || !promo) return { error: "That code isn't valid." };

  // Admin-only codes (internal test orders) must never work for the public —
  // pretend they don't exist rather than hinting at the restriction.
  if (promo.admin_only) {
    const isAdmin = userId
      ? Boolean((await admin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle()).data)
      : false;
    if (!isAdmin) return { error: "That code isn't valid." };
  }

  if (!promo.active) return { error: "That code is no longer active." };

  const now = Date.now();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) {
    return { error: "That code isn't active yet." };
  }
  if (promo.expires_at && new Date(promo.expires_at).getTime() < now) {
    return { error: "That code has expired." };
  }
  if (
    promo.max_redemptions !== null &&
    Number(promo.times_redeemed ?? 0) >= Number(promo.max_redemptions)
  ) {
    return { error: "That code has been fully redeemed." };
  }
  if (subtotalUsd < Number(promo.min_subtotal_usd ?? 0)) {
    return {
      error: `That code needs an order of at least $${Number(promo.min_subtotal_usd).toFixed(0)}.`,
    };
  }

  let discount = 0;
  if (promo.percent_off) discount += (subtotalUsd * Number(promo.percent_off)) / 100;
  if (promo.amount_off_usd) discount += Number(promo.amount_off_usd);
  const internalTest = promo.admin_only === true && String(promo.code).toUpperCase() === "NYZORA-INTERNAL";
  // The reserved admin test code skips payment entirely. Every other code
  // keeps a chargeable minimum so it can only finish through the payment rail.
  discount = Math.min(round2(discount), round2(subtotalUsd - (internalTest ? 0 : 1)));
  if (discount <= 0) return { error: "That code doesn't apply to this order." };

  return {
    code: String(promo.code).toUpperCase(),
    description: promo.description ?? null,
    discountUsd: discount,
    internalTest,
  };
}

export const isPromoError = (v: unknown): v is PromoError =>
  Boolean(v && typeof v === "object" && "error" in (v as Record<string, unknown>));
