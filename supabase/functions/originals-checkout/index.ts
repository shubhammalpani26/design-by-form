import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

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

/**
 * Server-side price book. Retail prices are never taken from the client.
 * Free US shipping is baked into these numbers.
 */
const PRICE_BOOK: Record<string, Record<string, { label: string; usd: number }>> = {
  "pet-silhouette-keepsake": {
    petite: { label: "Petite — 120 mm", usd: 59 },
    standard: { label: "Standard — 140 mm", usd: 89 },
    statement: { label: "Statement — 196 mm", usd: 139 },
  },
  "nursery-name-date": {
    standard: { label: "Standard — 210 mm", usd: 54 },
  },
  "wedding-coordinates": {
    standard: { label: "Standard — 215 mm", usd: 79 },
  },
};

const NAMES: Record<string, string> = {
  "pet-silhouette-keepsake": "Pet Sculpture Piece",
  "nursery-name-date": "Baby Name & Date Piece",
  "wedding-coordinates": "Wedding Coordinates Piece",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request." }, 400);

    const environment: StripeEnv = body.environment === "live" ? "live" : "sandbox";
    const skuSlug = String(body.skuSlug ?? "");
    const sizeKey = String(body.sizeKey ?? "standard");
    const previewId = typeof body.previewId === "string" ? body.previewId : null;
    const returnUrl = typeof body.returnUrl === "string" ? body.returnUrl : "";

    const sizes = PRICE_BOOK[skuSlug];
    const size = sizes?.[sizeKey];
    if (!size) return json({ error: "That option isn't available." }, 400);
    if (!/^https?:\/\//.test(returnUrl)) return json({ error: "Invalid return URL." }, 400);

    let userId: string | null = null;
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await admin.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    let previewUrl: string | null = null;
    let personalization: Record<string, unknown> = {};
    if (previewId) {
      const { data: preview } = await admin
        .from("originals_previews")
        .select("preview_image_url, personalization, sku_slug")
        .eq("id", previewId)
        .maybeSingle();
      if (preview && preview.sku_slug === skuSlug) {
        previewUrl = preview.preview_image_url;
        personalization = (preview.personalization as Record<string, unknown>) ?? {};
      }
    }

    const { data: order, error: orderErr } = await admin
      .from("originals_orders")
      .insert({
        preview_id: previewId,
        user_id: userId,
        sku_slug: skuSlug,
        size_key: sizeKey,
        size_label: size.label,
        amount_usd: size.usd,
        personalization,
        preview_image_url: previewUrl,
        status: "pending",
      })
      .select("id")
      .single();
    if (orderErr) {
      console.error("order insert failed", orderErr);
      return json({ error: "We couldn't start your order. Please try again." }, 500);
    }

    const stripe = createStripeClient(environment);
    const describedName = `${NAMES[skuSlug] ?? "Nyzora Original"} — ${size.label}`;
    const detail = Object.entries(personalization)
      .filter(([, v]) => typeof v === "string" && v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" · ")
      .slice(0, 400);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(size.usd * 100),
            product_data: {
              name: describedName,
              description: detail || "Made to order in the USA. Free shipping.",
              ...(previewUrl && previewUrl.startsWith("http") ? { images: [previewUrl] } : {}),
            },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ["US"] },
      customer_creation: "if_required",
      return_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
      payment_intent_data: { description: describedName },
      metadata: {
        originals_order_id: order.id,
        sku_slug: skuSlug,
        size_key: sizeKey,
        preview_id: previewId ?? "",
      },
    });

    await admin
      .from("originals_orders")
      .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    return json({ clientSecret: session.client_secret, orderId: order.id });
  } catch (e) {
    console.error("originals-checkout error", e);
    return json({ error: "Checkout is temporarily unavailable. Please try again." }, 500);
  }
});
