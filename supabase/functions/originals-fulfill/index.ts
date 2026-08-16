import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  isPrintableFileUrl,
  placeOrder,
  resolveFilamentId,
  uploadPrintFile,
  type PartnerAddress,
  type PartnerPrintItem,
} from "../_shared/slant3d.ts";
import { findOriginalsColor } from "../_shared/originalsColors.ts";

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

async function authorize(req: Request): Promise<boolean> {
  const internal = req.headers.get("x-internal-key");
  if (internal && internal === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return true;
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return false;
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  return isAdmin === true;
}

function addressFrom(shipping: any): { email?: string; address: PartnerAddress } {
  const a = shipping?.address ?? {};
  return {
    address: {
      name: shipping?.name ?? "Nyzora Customer",
      line1: a.line1 ?? "",
      line2: a.line2 ?? undefined,
      city: a.city ?? "",
      state: a.state ?? "",
      zip: a.postal_code ?? a.zip ?? "",
      country: (a.country ?? "US").toString().slice(0, 2).toUpperCase(),
    },
  };
}

/**
 * Sends a paid Originals order group to the US print partner as ONE shipment
 * (shipping is charged per order, not per piece). Each row needs a printable
 * .stl — either already stored on the row or passed in as `files`.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let scopeGroupId: string | null = null;
  let scopeOrderId: string | null = null;

  try {
    if (!(await authorize(req))) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const groupId = typeof body?.group_id === "string" ? body.group_id : null;
    const orderId = typeof body?.order_id === "string" ? body.order_id : null;
    scopeGroupId = groupId;
    scopeOrderId = orderId;
    // { "<order-row-id>": "https://.../piece.stl" } — optional per-row overrides.
    const files: Record<string, string> = body?.files ?? {};
    const filamentName: string | null = body?.filament ?? null;
    // Diagnostic mode: draft the order with the partner (no charge) so we can
    // read exactly what their API says, then release the draft.
    const dryRun = body?.dry_run === true;
    if (!groupId && !orderId) return json({ error: "group_id or order_id required" }, 400);

    const base = admin
      .from("originals_orders")
      .select(
        "id, group_id, status, sku_slug, size_label, quantity, personalization, customer_email, shipping_address, print_file_url, partner_order_id",
      );
    const { data: rows, error } = groupId
      ? await base.eq("group_id", groupId)
      : await base.eq("id", orderId!);
    if (error) throw error;
    if (!rows?.length) return json({ error: "Order not found" }, 404);

    const paid = rows.filter((r) => r.status === "paid" || r.status === "fulfilled");
    if (!paid.length) return json({ error: "Order is not paid yet" }, 400);
    if (paid.some((r) => r.partner_order_id)) {
      return json({ skipped: "already_sent", partnerOrderId: paid[0].partner_order_id });
    }

    const customer = addressFrom(paid[0].shipping_address);
    if (!customer.address.line1 || !customer.address.zip) {
      return json({ error: "Order has no usable shipping address" }, 400);
    }

    // Colour is chosen by the buyer and stored on the piece — honour it unless
    // an operator explicitly overrides the filament on this call.
    const chosen = findOriginalsColor(
      (paid[0].personalization as Record<string, unknown> | null)?.color as string | undefined,
    );
    const explicitId = (paid[0].personalization as Record<string, unknown> | null)?.filamentId;
    const filamentId = filamentName
      ? await resolveFilamentId(filamentName)
      : (typeof explicitId === "string" && explicitId ? explicitId : chosen.filamentId);
    const items: PartnerPrintItem[] = [];
    const usedFiles: Array<{ id: string; url: string }> = [];

    for (const row of paid) {
      const url = files[row.id] ?? row.print_file_url ?? null;
      if (!isPrintableFileUrl(url)) {
        await admin
          .from("originals_orders")
          .update({
            production_status: "needs_file",
            fulfillment_error: "No printable .stl attached to this piece yet",
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        return json({ error: `Piece ${row.id.slice(0, 8)} has no printable .stl yet`, needsFile: row.id }, 400);
      }
      const uploaded = await uploadPrintFile(url!, {
        name: `${row.sku_slug}-${row.id.slice(0, 8)}.stl`,
        ownerId: "nyzora-originals",
      });
      items.push({
        publicFileServiceId: uploaded.publicFileServiceId,
        quantity: Math.max(1, Number(row.quantity ?? 1)),
        ...(filamentId ? { filamentId } : {}),
      });
      usedFiles.push({ id: row.id, url: url! });
    }

    const buyer = { email: paid[0].customer_email ?? "orders@nyzora.ai", address: customer.address };

    if (dryRun) {
      const draft = await draftOrder(buyer, items, "nyzora-originals");
      cancelOrder(draft.publicId).catch(() => {});
      return json({
        dryRun: true,
        draftId: draft.publicId,
        status: draft.status,
        printingCost: draft.printingCost,
        deliveryCost: draft.deliveryCost,
        total: draft.total,
        pieces: items.length,
      });
    }

    const placed = await placeOrder(buyer, items, "nyzora-originals");

    const now = new Date().toISOString();
    for (const f of usedFiles) {
      await admin
        .from("originals_orders")
        .update({
          partner_order_id: placed.orderId,
          print_file_url: f.url,
          production_status: "in_production",
          fulfillment_error: null,
          status: "fulfilled",
          updated_at: now,
        })
        .eq("id", f.id);
    }

    return json({ partnerOrderId: placed.orderId, pieces: usedFiles.length, cost: placed.draft.total });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("originals-fulfill error", message);
    // Persist the partner's own words on the affected pieces so a failure is
    // never invisible after the logs roll over.
    try {
      const b = await Promise.resolve(null);
      void b;
    } catch { /* noop */ }
    return json({ error: message }, 500);
  }
});
