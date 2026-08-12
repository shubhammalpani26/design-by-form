import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const orderId = String(body?.orderId ?? "");
    if (!UUID.test(orderId)) return json({ error: "Invalid order." }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: order } = await admin
      .from("originals_orders")
      .select("id, status, sku_slug, size_label, amount_usd, preview_image_url, customer_email, created_at")
      .eq("id", orderId)
      .maybeSingle();

    if (!order) return json({ error: "Order not found." }, 404);

    // Only non-sensitive fields; email is masked so a guessed id leaks nothing.
    const email = typeof order.customer_email === "string" ? order.customer_email : null;
    return json({
      order: {
        id: order.id,
        status: order.status,
        skuSlug: order.sku_slug,
        sizeLabel: order.size_label,
        amountUsd: order.amount_usd,
        previewImageUrl: order.preview_image_url,
        emailMasked: email ? email.replace(/^(.).*(@.*)$/, "$1•••$2") : null,
        createdAt: order.created_at,
      },
    });
  } catch (e) {
    console.error("originals-order-status error", e);
    return json({ error: "Could not load that order." }, 500);
  }
});
