import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  createRazorpayOrder,
  razorpayConfigured,
  razorpayKeyId,
  razorpayMode,
} from "../_shared/razorpay.ts";
import { PRICE_BOOK, SKU_NAMES, quoteLine } from "../_shared/originalsPricing.ts";

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

const NAMES = SKU_NAMES;

const MAX_LINES = 10;
const MAX_QTY = 10;

interface RawLine {
  skuSlug?: unknown;
  sizeKey?: unknown;
  previewId?: unknown;
  quantity?: unknown;
}

const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

/**
 * Originals checkout on Razorpay. Prices every line against the real print
 * file, writes the pending order rows, then hands back a Razorpay order the
 * browser opens in Razorpay Checkout. USD is attempted first (international
 * payments); if the merchant account can't take USD we charge the equivalent
 * in INR while the ledger stays in USD.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!razorpayConfigured()) return json({ error: "Payments are not available yet." }, 503);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const admin = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request." }, 400);

    const returnUrl = typeof body.returnUrl === "string" ? body.returnUrl : "";
    if (!/^https?:\/\//.test(returnUrl)) return json({ error: "Invalid return URL." }, 400);

    // Razorpay does not collect a shipping address for us, so the buyer's
    // details come from our own form.
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

    // Real manufacturing quote per line, with the agreed list price as a net.
    const quotes = await Promise.all(
      lines.map((l) =>
        quoteLine(admin, { skuSlug: l.skuSlug, sizeKey: l.sizeKey, previewId: l.previewId })
          .catch(() => null)
      ),
    );
    const priced = lines.map((l, i) => ({
      ...l,
      unitUsd: quotes[i]?.unitUsd ?? l.size!.usd,
      quoteSource: quotes[i]?.source ?? "list",
      partnerCostUsd: quotes[i]?.partnerCostUsd ?? null,
      printFileUrl: quotes[i]?.printFileUrl ?? null,
    }));

    let userId: string | null = null;
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (token) {
      const { data } = await admin.auth.getUser(token);
      userId = data?.user?.id ?? null;
    }

    // Attach each line to its preview (image + personalization) when we have one.
    const previewIds = lines.map((l) => l.previewId).filter((v): v is string => Boolean(v));
    const previewMap = new Map<
      string,
      { url: string | null; personalization: Record<string, unknown>; sku: string }
    >();
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

    const totalPieces = priced.reduce((n, l) => n + l.quantity, 0);
    const subtotalUsd = Math.round(priced.reduce((sum, l) => sum + l.unitUsd * l.quantity, 0) * 100) / 100;

    // Promo codes are resolved server-side against the real subtotal.
    const promo = await resolvePromo(admin, body.promoCode, subtotalUsd);
    if (isPromoError(promo)) return json({ error: promo.error }, 400);
    const discountUsd = promo?.discountUsd ?? 0;
    const totalUsd = Math.round((subtotalUsd - discountUsd) * 100) / 100;

    // Spread any discount across the lines so the ledger still adds up.
    const discountRatio = subtotalUsd > 0 ? totalUsd / subtotalUsd : 1;

    const rows = priced.map((l) => {
      const preview = l.previewId ? previewMap.get(l.previewId) : undefined;
      const matched = preview && preview.sku === l.skuSlug ? preview : undefined;
      const lineSubtotal = l.unitUsd * l.quantity;
      return {
        group_id: groupId,
        preview_id: matched ? l.previewId : null,
        user_id: userId,
        sku_slug: l.skuSlug,
        size_key: l.sizeKey,
        size_label: l.size!.label,
        amount_usd: Math.round(lineSubtotal * discountRatio * 100) / 100,
        quantity: l.quantity,
        quote_source: l.quoteSource,
        partner_cost_usd: l.partnerCostUsd,
        print_file_url: l.printFileUrl,
        personalization: matched?.personalization ?? {},
        preview_image_url: matched?.url ?? null,
        status: "pending",
        payment_provider: "razorpay",
        customer_email: customer.email,
        shipping_address: shipping,
        promo_code: promo?.code ?? null,
        discount_usd: Math.round(lineSubtotal * (1 - discountRatio) * 100) / 100,
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

    const note = totalPieces === 1
      ? `${NAMES[lines[0].skuSlug] ?? "Nyzora Original"} — ${lines[0].size!.label}`
      : `Nyzora Originals — ${totalPieces} pieces`;

    const notes = {
      group_id: groupId,
      order_id: orders[0].id,
      pieces: String(totalPieces),
      amount_usd: totalUsd.toFixed(2),
      ...(promo ? { promo_code: promo.code } : {}),
    };

    const receipt = `nyz_${groupId.replace(/-/g, "").slice(0, 32)}`;

    const usdInr = Number(Deno.env.get("USD_INR_RATE") ?? "") || 89;
    let chargedCurrency: "USD" | "INR" = "USD";
    let chargedAmount = Number(totalUsd.toFixed(2));
    let rzpOrder: { id: string; amount: number; currency: string };
    try {
      rzpOrder = await createRazorpayOrder({
        receipt,
        amount: chargedAmount,
        currency: "USD",
        notes,
      });
    } catch (usdErr) {
      const msg = String((usdErr as Error)?.message ?? usdErr);
      if (!/currenc/i.test(msg) && !/international/i.test(msg)) throw usdErr;
      console.warn("USD not enabled on Razorpay account, retrying in INR", msg);
      chargedCurrency = "INR";
      chargedAmount = Math.round(totalUsd * usdInr * 100) / 100;
      rzpOrder = await createRazorpayOrder({
        receipt,
        amount: chargedAmount,
        currency: "INR",
        notes,
      });
    }

    await admin
      .from("originals_orders")
      .update({ provider_order_id: rzpOrder.id, updated_at: new Date().toISOString() })
      .eq("group_id", groupId);

    return json({
      keyId: razorpayKeyId(),
      mode: razorpayMode,
      providerOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      description: note,
      orderId: orders[0].id,
      groupId,
      amountUsd: totalUsd,
      chargedCurrency,
      chargedAmount,
      prefill: { name: customer.name, email: customer.email, contact: customer.phone },
    });
  } catch (e) {
    console.error("razorpay-checkout error", e);
    return json({ error: "Checkout is temporarily unavailable. Please try again." }, 500);
  }
});
