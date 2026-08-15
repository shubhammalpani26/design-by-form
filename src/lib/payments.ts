/**
 * Which gateway takes Originals payments right now.
 *
 * Cashfree's International Payment Gateway settles USD charges into INR for an
 * Indian exporter, so it is the live rail. Stripe stays wired only as an
 * automatic fallback if Cashfree refuses an order; both server checkouts remain
 * interchangeable.
 */
export type PaymentProvider = "stripe" | "cashfree";

export const PAYMENT_PROVIDER: PaymentProvider = "cashfree";