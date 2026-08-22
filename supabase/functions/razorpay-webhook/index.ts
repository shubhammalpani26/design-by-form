import {
  fetchRazorpayOrder,
  razorpayWebhookConfigured,
  verifyRazorpayWebhook,
} from "../_shared/razorpay.ts";
import { markOriginalsFailed, markOriginalsPaid } from "../_shared/originalsPaid.ts";

/**
 * Razorpay webhook for Originals orders. Source of truth for the receipt: the
 * return page only nudges, this confirms and is idempotent.
 */
Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  if (!razorpayWebhookConfigured()) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
    return new Response("Not configured", { status: 503 });
  }
  if (!(await verifyRazorpayWebhook(raw, signature))) {
    console.error("Razorpay webhook signature check failed");
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const event = JSON.parse(raw);
    const type = String(event?.event ?? "");
    const payment = event?.payload?.payment?.entity;
    const providerOrderId: string | undefined = payment?.order_id ??
      event?.payload?.order?.entity?.id;

    if (!providerOrderId) {
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    const email: string | null = payment?.email ?? null;
    const paymentId: string | null = payment?.id ? String(payment.id) : null;

    if (type === "payment.captured" || type === "order.paid") {
      // Re-read from Razorpay so a spoof-shaped payload can never mark an order paid.
      const order = await fetchRazorpayOrder(providerOrderId);
      if (order?.status === "paid") await markOriginalsPaid(providerOrderId, paymentId, email);
    } else if (type === "payment.failed") {
      await markOriginalsFailed(providerOrderId);
    } else {
      console.log("Unhandled Razorpay event:", type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("razorpay-webhook error", e);
    return new Response("Webhook error", { status: 400 });
  }
});
