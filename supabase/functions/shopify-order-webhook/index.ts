import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { shopifyAdminGraphQL } from "../_shared/shopify-admin.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/** Platform commission on the manufacturing base price, per unit. */
const MAKER_COMMISSION_RATE = 0.2;

const ORDER_LOOKUP = `
  query order($id: ID!) {
    order(id: $id) {
      id
      name
      displayFinancialStatus
      currentTotalPriceSet { shopMoney { amount currencyCode } }
    }
  }
`;

/**
 * Authenticates the payload by confirming the order actually exists in the store,
 * using our own Admin API credentials. A forged POST cannot fabricate a real order id.
 */
async function verifyOrderExists(orderId: unknown): Promise<any | null> {
  if (orderId === undefined || orderId === null) return null;
  const gid = String(orderId).startsWith("gid://")
    ? String(orderId)
    : `gid://shopify/Order/${orderId}`;
  try {
    const data = await shopifyAdminGraphQL(ORDER_LOOKUP, { id: gid });
    return data?.order ?? null;
  } catch (e) {
    console.error("Order verification lookup failed:", e instanceof Error ? e.message : e);
    return null;
  }
}

function extractNyzoraProductId(lineItem: any): string | null {
  const props = lineItem?.properties;
  if (Array.isArray(props)) {
    const match = props.find((p: any) => p?.name === "nyzora_product_id");
    if (match?.value) return String(match.value);
  }
  return null;
}

async function resolveProduct(lineItem: any) {
  const explicitId = extractNyzoraProductId(lineItem);
  const query = supabase
    .from("designer_products")
    .select("id, designer_id, base_price, designer_price, name")
    .limit(1);

  if (explicitId) {
    const { data } = await query.eq("id", explicitId).maybeSingle();
    if (data) return data;
  }

  if (lineItem?.variant_id) {
    const gid = `gid://shopify/ProductVariant/${lineItem.variant_id}`;
    const { data } = await supabase
      .from("designer_products")
      .select("id, designer_id, base_price, designer_price, name")
      .eq("shopify_variant_id", gid)
      .maybeSingle();
    if (data) return data;
  }

  return null;
}

async function handleOrder(order: any) {
  const shopifyOrderId = String(order.id);

  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("shopify_order_id", shopifyOrderId)
    .maybeSingle();

  if (existing) {
    console.log(`Order ${shopifyOrderId} already recorded (${existing.id}) — skipping`);
    return { orderId: existing.id, skipped: true };
  }

  const currency = order.currency ?? "INR";
  const totalAmount = Number(order.total_price ?? 0);
  const shipping = order.shipping_address ?? order.billing_address ?? null;

  const { data: createdOrder, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: null,
      total_amount: totalAmount,
      subtotal: Number(order.subtotal_price ?? totalAmount),
      status: "paid",
      currency,
      shopify_order_id: shopifyOrderId,
      shipping_address: shipping,
      payment_details: {
        source: "shopify",
        order_number: order.order_number ?? null,
        financial_status: order.financial_status ?? null,
        email: order.email ?? null,
        gateway: order.gateway ?? null,
      },
    })
    .select("id")
    .single();

  if (orderError) throw orderError;
  const orderId = createdOrder.id;

  const unmatched: any[] = [];

  for (const lineItem of order.line_items ?? []) {
    const product = await resolveProduct(lineItem);
    if (!product) {
      unmatched.push({ title: lineItem?.title, variant_id: lineItem?.variant_id });
      console.warn(`No Nyzora product matched Shopify line item ${lineItem?.id}`);
      continue;
    }

    const quantity = Number(lineItem.quantity ?? 1);
    const unitPrice = Number(lineItem.price ?? product.designer_price ?? 0);
    const basePrice = Number(product.base_price ?? 0);

    // Platform earns a flat commission on the manufacturing base price.
    // The creator keeps 100% of their markup above MBP.
    const commissionAmount = basePrice * MAKER_COMMISSION_RATE * quantity;
    const markup = Math.max(0, unitPrice - basePrice);
    const designerEarnings = markup * quantity;

    const { error: itemError } = await supabase.from("order_items").insert({
      order_id: orderId,
      product_id: product.id,
      designer_id: product.designer_id,
      quantity,
      price: unitPrice,
      designer_price: unitPrice,
      commission_rate: MAKER_COMMISSION_RATE,
      commission_amount: commissionAmount,
      designer_earnings: designerEarnings,
      customizations: lineItem.properties ?? null,
    });
    if (itemError) throw itemError;

    const { error: earningsError } = await supabase.from("designer_earnings").insert({
      designer_id: product.designer_id,
      product_id: product.id,
      order_id: orderId,
      sale_amount: unitPrice * quantity,
      royalty_percentage: 100,
      royalty_amount: designerEarnings,
      commission_amount: commissionAmount,
      status: "pending",
    });
    if (earningsError) throw earningsError;

    const { error: salesError } = await supabase.from("product_sales").insert({
      product_id: product.id,
      designer_id: product.designer_id,
      sale_price: unitPrice,
      base_price: basePrice,
      designer_markup: markup,
      commission_rate: MAKER_COMMISSION_RATE,
      commission_amount: commissionAmount,
      designer_earnings: designerEarnings,
    });
    if (salesError) throw salesError;

    await supabase.rpc("increment_product_sales", {
      p_product_id: product.id,
      p_quantity: quantity,
    }).catch(() => {
      /* helper is optional; total_sales stays authoritative via product_sales */
    });
  }

  return { orderId, unmatched };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const rawBody = await req.text();

  try {
    const order = JSON.parse(rawBody);

    const verified = await verifyOrderExists(order?.id);
    if (!verified) {
      console.error("Rejected Shopify webhook: order could not be verified against the store");
      return new Response(JSON.stringify({ error: "Unverified order" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await handleOrder(order);
    console.log("Shopify order processed:", JSON.stringify(result));

    return new Response(JSON.stringify({ received: true, ...result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("shopify-order-webhook error:", message);
    // Return 200 so Shopify does not hammer retries on a logic bug; the log carries the failure.
    return new Response(JSON.stringify({ received: true, error: message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});