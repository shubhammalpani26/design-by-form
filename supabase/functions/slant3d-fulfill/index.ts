import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  isPrintableFileUrl,
  placeOrder,
  PartnerApiError,
  type Slant3DOrderLine,
} from "../_shared/slant3d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

/** Callers: the Shopify order webhook (internal key) or an admin from the dashboard. */
async function authorize(req: Request): Promise<boolean> {
  const internal = req.headers.get("x-internal-key");
  if (internal && internal === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return true;

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return false;
  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: data.user.id,
    _role: "admin",
  });
  return isAdmin === true;
}

function addressFrom(order: any) {
  const a = order?.shipping_address ?? {};
  return {
    name: a.name ?? [a.first_name, a.last_name].filter(Boolean).join(" ") ?? "Nyzora Customer",
    street1: a.address1 ?? a.street ?? a.line1 ?? "",
    street2: a.address2 ?? a.line2 ?? undefined,
    city: a.city ?? "",
    state: a.province ?? a.state ?? "",
    zip: a.zip ?? a.postal_code ?? "",
    country: (a.country_code ?? a.country ?? "US").toString().slice(0, 2).toUpperCase(),
    phone: a.phone ?? order?.payment_details?.phone ?? "000-000-0000",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (!(await authorize(req))) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body?.order_id === "string" ? body.order_id : null;
    if (!orderId) return json({ error: "order_id required" }, 400);

    const { data: order, error: orderErr } = await admin
      .from("orders")
      .select("id, shipping_address, payment_details, invoice_number, shopify_order_id, currency")
      .eq("id", orderId)
      .maybeSingle();
    if (orderErr) throw orderErr;
    if (!order) return json({ error: "Order not found" }, 404);

    const { data: items, error: itemsErr } = await admin
      .from("order_items")
      .select("id, product_id, designer_id, quantity, customizations")
      .eq("order_id", orderId);
    if (itemsErr) throw itemsErr;
    if (!items?.length) return json({ error: "Order has no items" }, 400);

    const productIds = items.map((i) => i.product_id).filter(Boolean) as string[];
    const { data: products, error: prodErr } = await admin
      .from("designer_products")
      .select(
        "id, name, image_url, print_file_url, model_url, manufacturing_method, slant3d_filament, slug",
      )
      .in("id", productIds.length ? productIds : ["00000000-0000-0000-0000-000000000000"]);
    if (prodErr) throw prodErr;
    const byId = new Map((products ?? []).map((p) => [p.id, p]));

    const addr = addressFrom(order);
    const email = order?.payment_details?.email ?? "orders@nyzora.ai";
    const orderNumber = String(
      order.invoice_number ?? order.shopify_order_id ?? order.id.slice(0, 12),
    );

    const results: Array<Record<string, unknown>> = [];

    for (const item of items) {
      const product = item.product_id ? byId.get(item.product_id) : null;
      if (!product || product.manufacturing_method !== "fdm_us") continue;

      // Skip items already sent to the farm.
      const { data: existing } = await admin
        .from("slant3d_fulfillments")
        .select("id, slant_order_id")
        .eq("order_item_id", item.id)
        .maybeSingle();
      if (existing?.slant_order_id) {
        results.push({ order_item_id: item.id, skipped: "already_fulfilled" });
        continue;
      }

      const fileUrl = product.print_file_url ?? product.model_url ?? null;
      const quantity = Number(item.quantity ?? 1);

      // Shoppers can choose a finish/filament at checkout. The selected filament string
      // is stored in order_items.customizations.filament and takes precedence over the
      // product default so each line item prints in the chosen color.
      const selectedFilament =
        (item.customizations as Record<string, unknown> | null)?.filament ??
        product.slant3d_filament ??
        "PLA BLACK";
      const color = String(selectedFilament).toUpperCase();

      const line: Slant3DOrderLine = {
        email,
        phone: String(addr.phone),
        name: String(addr.name),
        orderNumber: `${orderNumber}-${item.id.slice(0, 6)}`,
        filename: `${product.slug ?? product.id}.stl`,
        fileURL: fileUrl ?? "",
        bill_to_street_1: addr.street1,
        bill_to_street_2: addr.street2,
        bill_to_city: addr.city,
        bill_to_state: addr.state,
        bill_to_zip: addr.zip,
        bill_to_country_as_iso: addr.country,
        bill_to_is_US_residential: "true",
        ship_to_name: String(addr.name),
        ship_to_street_1: addr.street1,
        ship_to_street_2: addr.street2,
        ship_to_city: addr.city,
        ship_to_state: addr.state,
        ship_to_zip: addr.zip,
        ship_to_country_as_iso: addr.country,
        ship_to_is_US_residential: "true",
        order_item_name: product.name,
        order_quantity: String(quantity),
        order_image_url: product.image_url ?? undefined,
        order_sku: product.id,
        order_item_color: color.split(" ").slice(-1)[0].toLowerCase(),
        profile: color.split(" ")[0],
      };


      const baseRow = {
        order_id: order.id,
        order_item_id: item.id,
        product_id: product.id,
        designer_id: item.designer_id,
        order_number: line.orderNumber,
        quantity,
        request_payload: line as unknown as Record<string, unknown>,
      };

      if (!isPrintableFileUrl(fileUrl)) {
        await admin.from("slant3d_fulfillments").insert({
          ...baseRow,
          status: "needs_file",
          error: "No .stl/.3mf/.obj print file on this product",
        });
        results.push({ order_item_id: item.id, status: "needs_file" });
        continue;
      }

      try {
        const { orderId: slantOrderId, raw } = await placeOrder([line]);
        await admin.from("slant3d_fulfillments").insert({
          ...baseRow,
          slant_order_id: slantOrderId,
          status: "submitted",
          response_payload: raw as Record<string, unknown>,
          error: null,
          last_synced_at: new Date().toISOString(),
        });
        results.push({ order_item_id: item.id, status: "submitted", slant_order_id: slantOrderId });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error("US print order failed:", message);
        await admin.from("slant3d_fulfillments").insert({
          ...baseRow,
          status: "failed",
          error: message.slice(0, 800),
        });
        results.push({ order_item_id: item.id, status: "failed", error: message });
      }
    }

    return json({ order_id: orderId, results });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("us-print fulfill error:", message);
    return json({ error: message }, e instanceof PartnerApiError ? e.status : 500);
  }
});