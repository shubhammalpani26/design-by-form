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

const MAX_LINES = 10;
const MAX_QTY = 10;

interface RawLine {
  skuSlug?: unknown;
  sizeKey?: unknown;
  previewId?: unknown;
  quantity?: unknown;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request." }, 400);

    const environment: StripeEnv = body.environment === "live" ? "live" : "sandbox";
    const returnUrl = typeof body.returnUrl === "string" ? body.returnUrl : "";
    if (!/^https?:\/\//.test(returnUrl)) return json({ error: "Invalid return URL." }, 400);

    // Accept either a single piece (legacy) or a basket of pieces.
    const rawLines: RawLine[] = Array.isArray(body.items) && body.items.length
      ? body.items.slice(0, MAX_LINES)
      : [{ skuSlug: body.skuSlug, sizeKey: body.sizeKey, previewId: body.previewId }];

    const lines = rawLines.map((l) => {
      const skuSlug = String(l.skuSlug ?? "");
      const sizeKey = String(l.sizeKey ?? "standard");
      const qty = Number(l.quantity ?? 1);
      return {
        skuSlug,
        sizeKey,
        previewId: typeof l.previewId === "string" && l.previewId ? l.previewId : null,
        quantity: Number.isFinite(qty) ? Math.min(MAX_QTY, Math.max(1, Math.trunc(qty))) : 1,
        size: PRICE_BOOK[skuSlug]?.[sizeKey],
      };
    });

    if (lines.some((l) => !l.size)) return json({ error: "That option isn't available." }, 400);

    let userId: string | null = null;
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await admin.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    // Attach each line to its preview (image + personalization) when we have one.
    const previewIds = lines.map((l) => l.previewId).filter((v): v is string => Boolean(v));
    const previewMap = new Map<string, { url: string | null; personalization: Record<string, unknown>; sku: string }>();
    if (previewIds.length) {
      const { data: previews } = await admin
        .from("originals_previews")
        .select("id, preview_image_url, personalization, sku_slug")
        .in("id", previewIds);
      for (const p of previews ?? []) {
        previewMap.set(p.id, {
          url: p.preview_image_url,
          personalization: (p.personalization as Record<string, unknown>) ?? {},
          sku: p.sku_slug,
        });
      }
    }

    const groupId = crypto.randomUUID();

    const rows = lines.map((l) => {
      const preview = l.previewId ? previewMap.get(l.previewId) : undefined;
      const matched = preview && preview.sku === l.skuSlug ? preview : undefined;
      return {
        group_id: groupId,
        preview_id: matched ? l.previewId : null,
        user_id: userId,
        sku_slug: l.skuSlug,
        size_key: l.sizeKey,
        size_label: l.size!.label,
        amount_usd: l.size!.usd * l.quantity,
        quantity: l.quantity,
        personalization: matched?.personalization ?? {},
        preview_image_url: matched?.url ?? null,
        status: "pending",
      };
    });

    const { data: orders, error: orderErr } = await admin
      .from("originals_orders")
      .insert(rows)
      .select("id, preview_image_url, sku_slug, size_label, quantity, personalization");
    if (orderErr || !orders?.length) {
      console.error("order insert failed", orderErr);
      return json({ error: "We couldn't start your order. Please try again." }, 500);
    }

    const stripe = createStripeClient(environment);

    const lineItems = lines.map((l, i) => {
      const row = orders[i];
      const describedName = `${NAMES[l.skuSlug] ?? "Nyzora Original"} — ${l.size!.label}`;
      const detail = Object.entries((row?.personalization as Record<string, unknown>) ?? {})
        .filter(([, v]) => typeof v === "string" && v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" · ")
        .slice(0, 400);
      const image = row?.preview_image_url;
      return {
        quantity: l.quantity,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(l.size!.usd * 100),
          product_data: {
            name: describedName,
            description: detail || "Made to order in the USA. Free shipping.",
            ...(typeof image === "string" && image.startsWith("http") ? { images: [image] } : {}),
          },
        },
      };
    });

    const totalPieces = lines.reduce((n, l) => n + l.quantity, 0);
    const summary =
      totalPieces === 1
        ? `${NAMES[lines[0].skuSlug] ?? "Nyzora Original"} — ${lines[0].size!.label}`
        : `Nyzora Originals — ${totalPieces} pieces`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      ui_mode: "embedded_page",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["US"] },
      customer_creation: "if_required",
      return_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}group=${groupId}&order=${orders[0].id}&session_id={CHECKOUT_SESSION_ID}`,
      payment_intent_data: { description: summary },
      metadata: {
        originals_group_id: groupId,
        // Kept for backwards compatibility with in-flight sessions/webhooks.
        originals_order_id: orders[0].id,
        pieces: String(totalPieces),
      },
    });

    await admin
      .from("originals_orders")
      .update({ stripe_session_id: session.id, updated_at: new Date().toISOString() })
      .eq("group_id", groupId);

    return json({
      clientSecret: session.client_secret,
      orderId: orders[0].id,
      groupId,
    });
  } catch (e) {
    console.error("originals-checkout error", e);
    return json({ error: "Checkout is temporarily unavailable. Please try again." }, 500);
  }
});
