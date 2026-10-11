import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendMetaEvent, trackingFromRequest } from "../_shared/metaCapi.ts";

/**
 * Browser → server relay for InitiateCheckout only. Purchase is sent from the
 * payment confirmation itself, never from the browser.
 */
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => null);
    const eventId = typeof body?.eventId === "string" ? body.eventId : "";
    if (body?.eventName !== "InitiateCheckout" || !/^[\w-]{8,80}$/.test(eventId)) {
      return json({ error: "Invalid event." }, 400);
    }
    const value = Number(body.valueUsd);
    const pieces = Number(body.numItems);
    const sku = typeof body.skuSlug === "string" ? body.skuSlug.slice(0, 80) : "originals";
    const tracking = trackingFromRequest(req, body.tracking);
    if (!tracking) return json({ error: "Missing tracking." }, 400);
    const ok = await sendMetaEvent({
      eventName: "InitiateCheckout",
      eventId,
      tracking,
      valueUsd: Number.isFinite(value) && value > 0 && value < 10000 ? value : undefined,
      numItems: Number.isFinite(pieces) && pieces > 0 && pieces < 50 ? pieces : undefined,
      contentIds: [sku],
    });
    return json({ ok });
  } catch (e) {
    console.error(e);
    return json({ ok: false }, 200);
  }
});
