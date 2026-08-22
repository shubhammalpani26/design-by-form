import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  fetchRazorpayOrder,
  fetchRazorpayPayment,
  verifyPaymentSignature,
} from "../_shared/razorpay.ts";
import { markOriginalsPaid } from "../_shared/originalsPaid.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Return-page safety net: the buyer lands back before the webhook arrives, so
 * we confirm the payment straight with Razorpay. Never trusts the browser —
 * the handoff signature is verified and the order is re-read from Razorpay.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const groupId = String(body?.groupId ?? "");
    if (!UUID.test(groupId)) return json({ error: "Invalid order." }, 400);

    const paymentId = typeof body?.paymentId === "string" ? body.paymentId : null;
    const signature = typeof body?.signature === "string" ? body.signature : null;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows } = await admin
      .from("originals_orders")
      .select("id, status, provider_order_id, customer_email")
      .eq("group_id", groupId)
      .limit(1);

    const row = rows?.[0];
    if (!row?.provider_order_id) return json({ error: "Order not found." }, 404);
    if (row.status === "paid") return json({ status: "paid" });

    const providerOrderId = row.provider_order_id;

    // A signed handoff proves this browser really completed the payment.
    if (paymentId && signature) {
      const ok = await verifyPaymentSignature(providerOrderId, paymentId, signature);
      if (!ok) return json({ error: "Payment verification failed." }, 400);
    }

    const order = await fetchRazorpayOrder(providerOrderId);
    const paid = order?.status === "paid";

    if (paid) {
      let email = row.customer_email ?? null;
      let capturedPaymentId = paymentId;
      if (paymentId) {
        const payment = await fetchRazorpayPayment(paymentId).catch(() => null);
        if (payment && payment.order_id === providerOrderId) {
          email = payment.email || email;
          capturedPaymentId = payment.id;
        }
      }
      await markOriginalsPaid(providerOrderId, capturedPaymentId, email);
    }

    return json({ status: paid ? "paid" : String(order?.status ?? "pending").toLowerCase() });
  } catch (e) {
    console.error("razorpay-verify error", e);
    return json({ error: "Could not confirm that payment." }, 500);
  }
});
