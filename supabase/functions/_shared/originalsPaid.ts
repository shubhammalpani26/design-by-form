import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { sendAppEmail } from "./appEmail.ts";

const db = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const NAMES: Record<string, string> = {
  "pet-silhouette-keepsake": "Pet Memorial Sculpture",
  "pet-portrait-sculpture": "Pet Portrait Sculpture",
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
  const templateData = {
    orderId: orders[0].id,
    items,
    totalUsd: orders.reduce((sum, o) => sum + Number(o.amount_usd ?? 0), 0),
  };

  await sendAppEmail("originals-order-confirmation", email, {
    idempotencyKey: `originals-confirmation-${orders[0].id}`,
    templateData,
  });

  // Internal copy so the team sees every order that comes in.
  await sendAppEmail("originals-order-confirmation", "contact@nyzora.ai", {
    idempotencyKey: `originals-internal-${orders[0].id}`,
    templateData,
  });
}

/**
 * Mark every row of a provider order paid exactly once, email the receipt and
 * kick off production. Safe to call from both the webhook and the return page.
 */
export async function markOriginalsPaid(
  providerOrderId: string,
  paymentId: string | null,
  email: string | null,
) {
  const admin = db();
  const { data: orders } = await admin
    .from("originals_orders")
    .select("id, status, sku_slug, size_label, amount_usd, quantity, preview_image_url, customer_email")
    .eq("provider_order_id", providerOrderId)
    .order("created_at", { ascending: true });

  if (!orders?.length) {
    console.error("Provider order not found:", providerOrderId);
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
    console.log("Provider order already fulfilled:", providerOrderId);
    return;
  }

  // Count the promo redemption once per paid group.
  const { data: promoRow } = await admin
    .from("originals_orders")
    .select("promo_code")
    .eq("provider_order_id", providerOrderId)
    .not("promo_code", "is", null)
    .limit(1)
    .maybeSingle();
  if (promoRow?.promo_code) {
    const { error: redeemErr } = await admin.rpc("redeem_originals_promo", { _code: promoRow.promo_code });
    if (redeemErr) console.error("promo redemption failed", redeemErr);
  }

  await sendReceipt(email ?? orders[0].customer_email ?? null, orders);


  const { error: prodErr } = await admin.functions.invoke("originals-model", {
    body: { order_id: claimed[0].id },
  });
  if (prodErr) console.error("originals-model kickoff failed:", prodErr);
}

export async function markOriginalsFailed(providerOrderId: string) {
  await db()
    .from("originals_orders")
    .update({ status: "failed", updated_at: new Date().toISOString() })
    .eq("provider_order_id", providerOrderId)
    .eq("status", "pending");
}
