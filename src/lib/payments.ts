/**
 * Which gateway takes Originals payments right now.
 *
 * Razorpay is the live rail: it settles card payments for an Indian exporter
 * and opens in an in-page modal, so the buyer never leaves the reveal screen.
 * Stripe stays wired only as a manual fallback; both server checkouts remain
 * interchangeable.
 */
export type PaymentProvider = "stripe" | "razorpay";

export const PAYMENT_PROVIDER: PaymentProvider = "razorpay";
