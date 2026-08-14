/**
 * Which gateway takes Originals payments right now.
 *
 * Cashfree's International Payment Gateway settles USD charges into INR for an
 * Indian exporter, so it is the live rail while the Stripe account is still in
 * onboarding. Flip this back to "stripe" once Stripe goes live — both server
 * checkouts stay wired and interchangeable.
 */
export type PaymentProvider = "stripe" | "cashfree";

export const PAYMENT_PROVIDER: PaymentProvider = "cashfree";