import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Verifies Shopify's HMAC signature. The secret comes from the store's
 * Settings -> Notifications -> Webhooks page and is stored as SHOPIFY_WEBHOOK_SECRET.
 * Fails closed when the secret is absent so forged payloads can never create earnings.
 */
async function verifyShopifyHmac(rawBody: string, hmacHeader: string | null): Promise<boolean> {
  const secret = Deno.env.get("SHOPIFY_WEBHOOK_SECRET");
  if (!secret) {
    console.error(
      "SHOPIFY_WEBHOOK_SECRET is not configured — rejecting webhook. " +
        "Copy the signing secret from Shopify admin > Settings > Notifications > Webhooks.",
    );
    return false;
  }
  if (!hmacHeader) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return timingSafeEqual(expected, hmacHeader);
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
      currency,
      country: (order.shipping_address?.country_code ?? order.billing_address?.country_code ?? null) as string | null,
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
    const valid = await verifyShopifyHmac(rawBody, req.headers.get("x-shopify-hmac-sha256"));
    if (!valid) {
      console.error("Rejected Shopify webhook: invalid or unverifiable signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const order = JSON.parse(rawBody);
    const result = await handleOrder(order);
    console.log("Shopify order processed:", JSON.stringify(result));

    // Route any US-printed (fdm_us) items to the US manufacturing partner.
    if (result.orderId) {
      try {
        const res = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/slant3d-fulfill`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-internal-key": Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            },
            body: JSON.stringify({ order_id: result.orderId }),
          },
        );
        console.log("US print routing:", res.status, (await res.text()).slice(0, 500));
      } catch (e) {
        console.error("US print routing failed:", e instanceof Error ? e.message : e);
      }
    }

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