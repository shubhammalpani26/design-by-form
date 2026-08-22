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

const SKU_NAMES: Record<string, string> = {
  "pet-silhouette-keepsake": "Custom Pet Memorial Sculpture",
  "pet-portrait-sculpture": "Custom Pet Portrait Sculpture",
  "nursery-name-date": "Baby Name & Date Piece",
  "wedding-coordinates": "Wedding Coordinates Piece",
};

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (n: number) =>
  `USD ${Number(n || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function addressLines(addr: Record<string, unknown> | null) {
  if (!addr) return [] as string[];
  const a = addr as Record<string, string>;
  return [
    a.name || a.full_name,
    a.line1 || a.address1 || a.street,
    a.line2 || a.address2,
    [a.city, a.state, a.zip || a.postal_code || a.pincode].filter(Boolean).join(", "),
    a.country || "United States",
  ].filter(Boolean) as string[];
}

function personalizationLine(p: Record<string, unknown> | null) {
  if (!p) return "";
  const bits = [p.heading, p.footnote].filter(Boolean).map(String);
  return bits.length ? `Engraved: ${bits.join(" · ")}` : "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const orderId = String(body?.orderId ?? "");
    const groupId = String(body?.groupId ?? "");
    const claimedEmail = String(body?.email ?? "").trim().toLowerCase();
    const byGroup = UUID.test(groupId);
    if (!byGroup && !UUID.test(orderId)) return json({ error: "Invalid order." }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Resolve the signed-in caller, if any. Ownership is derived from the token,
    // never from the request body.
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      const { data } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
      userId = data.user?.id ?? null;
    }

    const query = admin
      .from("originals_orders")
      .select(
        "id, group_id, user_id, status, sku_slug, size_label, amount_usd, quantity, discount_usd, promo_code, personalization, customer_email, shipping_address, created_at, payment_provider",
      )
      .order("created_at", { ascending: true });
    const { data: rows } = byGroup
      ? await query.eq("group_id", groupId)
      : await query.eq("id", orderId);

    const order = rows?.[0];
    if (!order) return json({ error: "Order not found." }, 404);
    if (order.status === "pending") return json({ error: "Invoice available once payment completes." }, 409);

    // An invoice carries the full address, so require real ownership: either the
    // signed-in user owns the order, or the caller proves the buyer email.
    const owns = userId && order.user_id === userId;
    const emailMatches =
      claimedEmail && String(order.customer_email ?? "").toLowerCase() === claimedEmail;
    if (!owns && !emailMatches) return json({ error: "Not authorised for this invoice." }, 403);

    const { data: company } = await admin
      .from("company_config")
      .select("legal_name, address, city, state, pincode")
      .limit(1)
      .maybeSingle();

    const items = rows ?? [];
    const subtotal = items.reduce(
      (s, r) => s + Number(r.amount_usd ?? 0) + Number(r.discount_usd ?? 0),
      0,
    );
    const discount = items.reduce((s, r) => s + Number(r.discount_usd ?? 0), 0);
    const total = items.reduce((s, r) => s + Number(r.amount_usd ?? 0), 0);
    const promo = items.find((r) => r.promo_code)?.promo_code ?? null;
    const shipTo = addressLines(order.shipping_address as Record<string, unknown> | null);
    const date = new Date(order.created_at).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const invoiceNo = `NYZ-${new Date(order.created_at).getFullYear()}-${String(order.id).slice(0, 8).toUpperCase()}`;
    const legalAddress = [company?.address, company?.city, company?.state, company?.pincode, "India"]
      .filter(Boolean)
      .join(", ");

    const rowsHtml = items
      .map((r) => {
        const note = personalizationLine(r.personalization as Record<string, unknown> | null);
        return `<tr>
          <td>
            <strong>${esc(SKU_NAMES[r.sku_slug] ?? "Nyzora piece")}</strong>
            <div class="muted">${esc(r.size_label ?? "")}${r.quantity > 1 ? ` · ×${r.quantity}` : ""}</div>
            ${note ? `<div class="muted">${esc(note)}</div>` : ""}
          </td>
          <td class="num">${esc(money(Number(r.amount_usd ?? 0) + Number(r.discount_usd ?? 0)))}</td>
        </tr>`;
      })
      .join("");

    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${esc(invoiceNo)} — Nyzora invoice</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; margin: 0; padding: 48px; max-width: 760px; }
  .brand { font-size: 26px; letter-spacing: .34em; font-weight: 500; }
  .muted { color: #666; font-size: 12px; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 1px solid #111; padding-bottom: 18px; }
  .right { text-align: right; font-size: 12px; }
  .cols { display: flex; gap: 48px; margin: 28px 0; font-size: 13px; }
  .cols h3 { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: #666; margin: 0 0 8px; font-weight: 500; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td, th { padding: 12px 0; border-bottom: 1px solid #e6e6e6; vertical-align: top; text-align: left; }
  .num { text-align: right; white-space: nowrap; }
  .totals { margin-top: 4px; font-size: 13px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
  .grand { border-top: 1px solid #111; font-weight: 600; margin-top: 6px; padding-top: 10px; }
  footer { margin-top: 44px; border-top: 1px solid #e6e6e6; padding-top: 16px; font-size: 11px; color: #666; line-height: 1.6; }
  @media print { body { padding: 24px; } }
</style></head>
<body>
  <div class="top">
    <div>
      <div class="brand">NYZORA</div>
      <div class="muted">nyzora.ai · contact@nyzora.ai</div>
    </div>
    <div class="right">
      <div><strong>INVOICE</strong></div>
      <div>${esc(invoiceNo)}</div>
      <div class="muted">${esc(date)}</div>
    </div>
  </div>

  <div class="cols">
    <div>
      <h3>Bill to</h3>
      <div>${esc(order.customer_email ?? "")}</div>
    </div>
    <div>
      <h3>Ship to</h3>
      ${shipTo.map((l) => `<div>${esc(l)}</div>`).join("") || '<div class="muted">—</div>'}
    </div>
  </div>

  <table><tbody>${rowsHtml}</tbody></table>

  <div class="totals">
    <div><span>Subtotal</span><span>${esc(money(subtotal))}</span></div>
    ${discount > 0 ? `<div><span>Discount${promo ? ` (${esc(promo)})` : ""}</span><span>− ${esc(money(discount))}</span></div>` : ""}
    <div><span>Shipping (US)</span><span>Free</span></div>
    <div class="grand"><span>Total paid</span><span>${esc(money(total))}</span></div>
  </div>
  <p class="muted" style="margin-top:10px">No additional taxes or duties charged.</p>
  <p class="muted">Paid by card · Order ${esc(String(order.id).slice(0, 8))} · ${esc(date)}</p>

  <footer>
    Made to order · ships free from our US facility.<br />
    Billed by ${esc(company?.legal_name ?? "Cyanique Sustainable Private Limited")}<br />
    ${esc(legalAddress)}<br />
    Questions about this invoice: contact@nyzora.ai
  </footer>
</body></html>`;

    return json({ invoice: html, invoiceNumber: invoiceNo });
  } catch (e) {
    console.error("originals-invoice error", e);
    return json({ error: "Could not build that invoice." }, 500);
  }
});
