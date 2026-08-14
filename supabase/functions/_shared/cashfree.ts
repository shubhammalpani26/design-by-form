/**
 * Cashfree PG (International Payment Gateway) helper.
 *
 * Environment is derived from the secret key prefix so there is no separate
 * flag to keep in sync: test keys (`cfsk_ma_test_`/`TEST`) hit sandbox,
 * everything else hits production.
 */
const APP_ID = Deno.env.get("CASHFREE_APP_ID") ?? "";
const SECRET_KEY = Deno.env.get("CASHFREE_SECRET_KEY") ?? "";

export const cashfreeMode: "sandbox" | "production" =
  /test/i.test(SECRET_KEY) || /test/i.test(APP_ID) ? "sandbox" : "production";

const BASE = cashfreeMode === "sandbox"
  ? "https://sandbox.cashfree.com/pg"
  : "https://api.cashfree.com/pg";

export function cashfreeConfigured() {
  return Boolean(APP_ID && SECRET_KEY);
}

async function call(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-api-version": "2023-08-01",
      "x-client-id": APP_ID,
      "x-client-secret": SECRET_KEY,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("cashfree api error", path, res.status, body);
    throw new Error(body?.message ?? "Payment gateway error");
  }
  return body;
}

export interface CashfreeOrderInput {
  orderId: string;
  amount: number;
  currency: string;
  customer: { id: string; email: string; phone: string; name?: string };
  returnUrl: string;
  notifyUrl?: string;
  note?: string;
  tags?: Record<string, string>;
}

export async function createCashfreeOrder(input: CashfreeOrderInput) {
  return await call("/orders", {
    method: "POST",
    body: JSON.stringify({
      order_id: input.orderId,
      order_amount: Number(input.amount.toFixed(2)),
      order_currency: input.currency,
      order_note: input.note?.slice(0, 200),
      customer_details: {
        customer_id: input.customer.id,
        customer_email: input.customer.email,
        customer_phone: input.customer.phone,
        ...(input.customer.name ? { customer_name: input.customer.name } : {}),
      },
      order_meta: {
        return_url: input.returnUrl,
        ...(input.notifyUrl ? { notify_url: input.notifyUrl } : {}),
      },
      ...(input.tags ? { order_tags: input.tags } : {}),
    }),
  });
}

export async function fetchCashfreeOrder(orderId: string) {
  return await call(`/orders/${encodeURIComponent(orderId)}`);
}

/**
 * Cashfree signs webhooks with base64(HMAC-SHA256(timestamp + rawBody, secret)).
 */
export async function verifyCashfreeWebhook(
  rawBody: string,
  timestamp: string,
  signature: string,
): Promise<boolean> {
  if (!timestamp || !signature || !SECRET_KEY) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(timestamp + rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}