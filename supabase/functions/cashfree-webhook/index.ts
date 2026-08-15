import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { fetchCashfreeOrder, verifyCashfreeWebhook } from "../_shared/cashfree.ts";

const db = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const NAMES: Record<string, string> = {
  "pet-silhouette-keepsake": "Pet Sculpture Piece",
  "nursery-name-date": "Baby Name & Date Piece",
  "wedding-coordinates": "Wedding Coordinates Piece",
};

async function sendReceipt(email: string | null, orders: any[]) {
  if (!email || !orders.length) return;
  const items = orders.map((o) => {
    const qty = Math.max(1, Number(o.quantity ?? 1) || 1);
    return {
      productName: NAMES[o.sku_slug] ?? "Your Nyzora piece",
      sizeLabel: o.size_label ?? "",
      amountUsd: Number(o.amount_usd ?? 0) / qty,
      previewImageUrl: o.preview_image_url ?? "",
      skuSlug: o.sku_slug ?? "",
      quantity: qty,
    };
  });
  const { error } = await db().functions.invoke("send-transactional-email", {
    body: {
      templateName: "originals-order-confirmation",
      recipientEmail: email,
      idempotencyKey: `originals-confirmation-${orders[0].id}`,
      templateData: {
        orderId: orders[0].id,
        items,
        totalUsd: orders.reduce((sum, o) => sum + Number(o.amount_usd ?? 0), 0),
      },
    },
  });
  if (error) console.error("Originals confirmation email failed:", error);
}

/** Mark every row in the group paid exactly once, then email the receipt. */
async function markPaid(providerOrderId: string, paymentId: string | null, email: string | null) {
  const admin = db();
  const { data: orders } = await admin
    .from("originals_orders")
    .select("id, status, sku_slug, size_label, amount_usd, quantity, preview_image_url, customer_email")
    .eq("provider_order_id", providerOrderId)
    .order("created_at", { ascending: true });

  if (!orders?.length) {
    console.error("Cashfree order not found:", providerOrderId);
    return;
  }

  const { data: claimed } = await admin
    .from("originals_orders")
    .update({
      status: "paid",
      ...(email ? { customer_email: email } : {}),
      ...(paymentId ? { provider_payment_id: paymentId } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("provider_order_id", providerOrderId)
    .in("status", ["pending", "failed"])
    .select("id");

  if (!claimed?.length) {
    console.log("Cashfree order already fulfilled:", providerOrderId);
    return;
  }

  await sendReceipt(email ?? orders[0].customer_email ?? null, orders);

  // Start model generation + partner production for the paid pieces.
  const { error: prodErr } = await admin.functions.invoke("originals-model", {
    body: { order_id: claimed[0].id },
  });
  if (prodErr) console.error("originals-model kickoff failed:", prodErr);
}

async function markFailed(providerOrderId: string) {
  await db()
    .from("originals_orders")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("provider_order_id", providerOrderId)
    .eq("status", "pending");
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const raw = await req.text();
  const timestamp = req.headers.get("x-webhook-timestamp") ?? "";
  const signature = req.headers.get("x-webhook-signature") ?? "";

  if (!(await verifyCashfreeWebhook(raw, timestamp, signature))) {
    console.error("Cashfree webhook signature check failed");
    return new Response("Invalid signature", { status: 401 });
  }

  try {
    const event = JSON.parse(raw);
    const type = String(event?.type ?? "");
    const providerOrderId = event?.data?.order?.order_id as string | undefined;
    if (!providerOrderId) return new Response(JSON.stringify({ received: true }), { status: 200 });

    const email = event?.data?.customer_details?.customer_email ?? null;
    const paymentId = event?.data?.payment?.cf_payment_id
      ? String(event.data.payment.cf_payment_id)
      : null;

    if (type === "PAYMENT_SUCCESS_WEBHOOK") {
      // Re-read from Cashfree so a spoof-shaped payload can never mark an order paid.
      const order = await fetchCashfreeOrder(providerOrderId);
      if (order?.order_status === "PAID") await markPaid(providerOrderId, paymentId, email);
    } else if (type === "PAYMENT_FAILED_WEBHOOK" || type === "PAYMENT_USER_DROPPED_WEBHOOK") {
      await markFailed(providerOrderId);
    } else {
      console.log("Unhandled Cashfree event:", type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("cashfree-webhook error", e);
    return new Response("Webhook error", { status: 400 });
  }
});