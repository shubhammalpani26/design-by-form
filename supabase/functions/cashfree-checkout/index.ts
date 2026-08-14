import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { cashfreeConfigured, cashfreeMode, createCashfreeOrder } from "../_shared/cashfree.ts";

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

/** Server-side price book — retail prices are never taken from the client. */
const PRICE_BOOK: Record<string, Record<string, { label: string; usd: number }>> = {
  "pet-silhouette-keepsake": {
    petite: { label: "Petite — 120 mm tall", usd: 59 },
    standard: { label: "Standard — 140 mm tall", usd: 89 },
    statement: { label: "Statement — 196 mm tall", usd: 139 },
  },
  "nursery-name-date": { standard: { label: "Standard — 210 mm wide", usd: 54 } },
  "wedding-coordinates": { standard: { label: "Standard — 215 mm wide", usd: 79 } },
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

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!cashfreeConfigured()) return json({ error: "Payments are not available yet." }, 503);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request." }, 400);

    const returnUrl = typeof body.returnUrl === "string" ? body.returnUrl : "";
    if (!/^https?:\/\//.test(returnUrl)) return json({ error: "Invalid return URL." }, 400);

    // Buyer details — Cashfree needs email + phone up front, and we need a US
    // shipping address because the gateway does not collect one for us.
    const c = body.customer ?? {};
    const customer = {
      name: str(c.name, 80),
      email: str(c.email, 120).toLowerCase(),
      phone: str(c.phone, 20).replace(/[^\d+]/g, ""),
      line1: str(c.line1, 120),
      line2: str(c.line2, 120),
      city: str(c.city, 60),
      state: str(c.state, 40),
      postalCode: str(c.postalCode, 12),
      country: "US",
    };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) {
      return json({ error: "Please enter a valid email address." }, 400);
    }
    if (customer.phone.replace(/\D/g, "").length < 10) {
      return json({ error: "Please enter a valid phone number." }, 400);
    }
    if (!customer.name || !customer.line1 || !customer.city || !customer.state || !customer.postalCode) {
      return json({ error: "Please complete your shipping address." }, 400);
    }

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
    const shipping = {
      name: customer.name,
      phone: customer.phone,
      address: {
        line1: customer.line1,
        line2: customer.line2 || null,
        city: customer.city,
        state: customer.state,
        postal_code: customer.postalCode,
        country: "US",
      },
    };

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
        payment_provider: "cashfree",
        customer_email: customer.email,
        shipping_address: shipping,
      };
    });

    const { data: orders, error: orderErr } = await admin
      .from("originals_orders")
      .insert(rows)
      .select("id");
    if (orderErr || !orders?.length) {
      console.error("order insert failed", orderErr);
      return json({ error: "We couldn't start your order. Please try again." }, 500);
    }

    const totalPieces = lines.reduce((n, l) => n + l.quantity, 0);
    const totalUsd = lines.reduce((sum, l) => sum + l.size!.usd * l.quantity, 0);
    const note = totalPieces === 1
      ? `${NAMES[lines[0].skuSlug] ?? "Nyzora Original"} — ${lines[0].size!.label}`
      : `Nyzora Originals — ${totalPieces} pieces`;

    const providerOrderId = `nyz_${groupId.replace(/-/g, "")}`;
    const sep = returnUrl.includes("?") ? "&" : "?";

    const cfOrder = await createCashfreeOrder({
      orderId: providerOrderId,
      amount: totalUsd,
      currency: "USD",
      note,
      customer: {
        // Cashfree customer ids allow alphanumerics and underscores only.
        id: (userId ?? groupId).replace(/-/g, "").slice(0, 40),
        email: customer.email,
        phone: customer.phone,
        name: customer.name,
      },
      returnUrl: `${returnUrl}${sep}group=${groupId}&order=${orders[0].id}&provider=cashfree`,
      notifyUrl: `${SUPABASE_URL}/functions/v1/cashfree-webhook`,
      tags: { group_id: groupId, pieces: String(totalPieces) },
    });

    await admin
      .from("originals_orders")
      .update({
        provider_order_id: providerOrderId,
        updated_at: new Date().toISOString(),
      })
      .eq("group_id", groupId);

    return json({
      paymentSessionId: cfOrder.payment_session_id,
      mode: cashfreeMode,
      orderId: orders[0].id,
      groupId,
      providerOrderId,
      amountUsd: totalUsd,
    });
  } catch (e) {
    console.error("cashfree-checkout error", e);
    return json({ error: "Checkout is temporarily unavailable. Please try again." }, 500);
  }
});