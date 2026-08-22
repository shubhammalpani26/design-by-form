/**
 * Razorpay PG helper.
 *
 * Mode is derived from the key id prefix, so there is no separate flag to keep
 * in sync: `rzp_test_` hits test mode, `rzp_live_` hits live. The same keys
 * work for orders, payment lookups and webhook verification.
 */
const KEY_ID = Deno.env.get("RAZORPAY_KEY_ID") ?? "";
const KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET") ?? "";
const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";

const BASE = "https://api.razorpay.com/v1";

export const razorpayMode: "test" | "live" = /^rzp_test_/.test(KEY_ID) ? "test" : "live";

export function razorpayKeyId() {
  return KEY_ID;
}

export function razorpayConfigured() {
  return Boolean(KEY_ID && KEY_SECRET);
}

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${btoa(`${KEY_ID}:${KEY_SECRET}`)}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("razorpay api error", path, res.status, body);
    throw new Error(body?.error?.description ?? "Payment gateway error");
  }
  return body;
}

export interface RazorpayOrderInput {
  /** Our own reference, stored on the order as `receipt` (max 40 chars). */
  receipt: string;
  /** Major units (e.g. dollars); converted to the smallest unit here. */
  amount: number;
  currency: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder(input: RazorpayOrderInput) {
  return await call("/orders", {
    method: "POST",
    body: JSON.stringify({
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      receipt: input.receipt.slice(0, 40),
      payment_capture: 1,
      ...(input.notes ? { notes: input.notes } : {}),
    }),
  }) as { id: string; amount: number; currency: string; status: string };
}

export async function fetchRazorpayOrder(orderId: string) {
  return await call(`/orders/${encodeURIComponent(orderId)}`) as {
    id: string;
    status: string;
    amount_paid: number;
  };
}

export async function fetchRazorpayPayment(paymentId: string) {
  return await call(`/payments/${encodeURIComponent(paymentId)}`) as {
    id: string;
    order_id: string;
    status: string;
    email?: string;
  };
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Checkout handoff signature: HMAC-SHA256(order_id|payment_id, key_secret). */
export async function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): Promise<boolean> {
  if (!orderId || !paymentId || !signature || !KEY_SECRET) return false;
  return timingSafeEqual(await hmacHex(KEY_SECRET, `${orderId}|${paymentId}`), signature);
}

/** Webhook signature: HMAC-SHA256(rawBody, webhook secret). */
export async function verifyRazorpayWebhook(
  rawBody: string,
  signature: string,
): Promise<boolean> {
  if (!signature || !WEBHOOK_SECRET) return false;
  return timingSafeEqual(await hmacHex(WEBHOOK_SECRET, rawBody), signature);
}

export function razorpayWebhookConfigured() {
  return Boolean(WEBHOOK_SECRET);
}
