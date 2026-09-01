import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  draftOrder,
  isPrintableFileUrl,
  placeOrder,
  releaseDraftOrder,
  resolveFilamentId,
  uploadPrintFile,
  type PartnerAddress,
  type PartnerPrintItem,
} from "../_shared/slant3d.ts";
import { findOriginalsColor } from "../_shared/originalsColors.ts";
import { alertFulfillmentFailure } from "../_shared/fulfillmentAlert.ts";
import { logPartnerEvent, logPartnerEvents } from "../_shared/partnerEvents.ts";
import { PHOTO_PERSONALIZED_SKUS, isMasterPrintFile } from "../_shared/originalsPricing.ts";

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
  let scopeDryRun = false;

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
    scopeDryRun = dryRun;
    if (!groupId && !orderId) return json({ error: "group_id or order_id required" }, 400);

    const base = admin
      .from("originals_orders")
      .select(
        "id, group_id, status, sku_slug, size_label, quantity, personalization, customer_email, shipping_address, print_file_url, partner_order_id, engraved_text",
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
        await alertFulfillmentFailure(admin, {
          orderId: row.id,
          groupId: row.group_id,
          customerEmail: row.customer_email,
          pieces: paid.length,
          stage: "print file",
          error: "No printable .stl attached to this piece yet",
        });
        return json({ error: `Piece ${row.id.slice(0, 8)} has no printable .stl yet`, needsFile: row.id }, 400);
      }
      // Hard stop: a photo piece must be the buyer's own sculpted, engraved
      // model. The SKU master is a pricing reference — printing it ships a
      // generic bust with none of their personalisation.
      if (
        PHOTO_PERSONALIZED_SKUS.has(row.sku_slug) &&
        !files[row.id] &&
        (await isMasterPrintFile(admin, url!))
      ) {
        const reason =
          "Generic reference model attached — this piece needs the buyer's own sculpted, engraved .stl";
        await admin
          .from("originals_orders")
          .update({
            production_status: "needs_file",
            fulfillment_error: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        await alertFulfillmentFailure(admin, {
          orderId: row.id,
          groupId: row.group_id,
          customerEmail: row.customer_email,
          pieces: paid.length,
          stage: "print file",
          error: reason,
        });
        return json({ error: reason, needsFile: row.id }, 400);
      }
      // Hard stop: if the buyer paid for a name/date, the file we send must
      // physically carry it. Lettering that only lives in the 2D render gets
      // smoothed away by the mesh generator, which is how a blank plinth can
      // reach production. No engraving record => nothing ships.
      const wanted = engravingLabel(row.personalization as Record<string, unknown> | null);
      if (wanted && !files[row.id] && row.engraved_text !== wanted) {
        const reason = `Personalisation "${wanted}" is not cut into this print file yet`;
        await admin
          .from("originals_orders")
          .update({
            production_status: "needs_file",
            fulfillment_error: reason,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        await alertFulfillmentFailure(admin, {
          orderId: row.id,
          groupId: row.group_id,
          customerEmail: row.customer_email,
          pieces: paid.length,
          stage: "engraving",
          error: reason,
        });
        return json({ error: reason, needsFile: row.id }, 400);
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
      const cancelError = await releaseDraftOrder(draft.publicId);
      await logPartnerEvents(admin, usedFiles.map((f) => f.id), {
        groupId,
        partnerOrderId: draft.publicId,
        stage: "quote",
        event: cancelError ? "dry_run_draft_release_failed" : "dry_run_draft_released",
        status: cancelError ? "failed" : draft.status,
        message: cancelError,
        details: {
          printingCost: draft.printingCost,
          deliveryCost: draft.deliveryCost,
          total: draft.total,
        },
      });
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

    await logPartnerEvents(admin, usedFiles.map((f) => f.id), {
      groupId,
      stage: "print file",
      event: "files_uploaded",
      status: "ok",
      details: { pieces: items.length, filamentId },
    });

    const placed = await placeOrder(buyer, items, "nyzora-originals");

    const now = new Date().toISOString();
    await logPartnerEvents(admin, usedFiles.map((f) => f.id), {
      groupId,
      partnerOrderId: placed.orderId,
      stage: "partner order",
      event: "order_processed",
      status: "in_production",
      message: "Draft created and processed with the US partner (billed at processing)",
      details: {
        printingCost: placed.draft.printingCost,
        deliveryCost: placed.draft.deliveryCost,
        total: placed.draft.total,
      },
    });
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
    // never invisible once the function logs roll over.
    try {
      if (scopeGroupId || scopeOrderId) {
        const patch = {
          production_status: "failed",
          fulfillment_error: message.slice(0, 500),
          updated_at: new Date().toISOString(),
        };
        const q = admin.from("originals_orders").update(patch);
        await (scopeGroupId ? q.eq("group_id", scopeGroupId) : q.eq("id", scopeOrderId!));
      }
    } catch (_e) { /* logging must never mask the original failure */ }
    await logPartnerEvent(admin, {
      orderId: scopeOrderId,
      groupId: scopeGroupId,
      stage: "partner order",
      event: "fulfillment_failed",
      status: "failed",
      message,
    });
    // A dry run charges nothing and is operator-initiated, so it isn't an alert.
    if (!scopeDryRun && (scopeGroupId || scopeOrderId)) {
      const q = admin
        .from("originals_orders")
        .select("id, group_id, customer_email, amount_usd, quantity");
      const { data: affected } = await (scopeGroupId
        ? q.eq("group_id", scopeGroupId)
        : q.eq("id", scopeOrderId!));
      await alertFulfillmentFailure(admin, {
        orderId: affected?.[0]?.id ?? scopeOrderId,
        groupId: scopeGroupId,
        customerEmail: affected?.[0]?.customer_email ?? null,
        pieces: (affected ?? []).reduce((n, r) => n + Number(r.quantity ?? 1), 0) || null,
        amountUsd: (affected ?? []).reduce((s, r) => s + Number(r.amount_usd ?? 0), 0) || null,
        stage: "partner order",
        error: message,
      });
    }
    return json({ error: message }, 500);
  }
});
