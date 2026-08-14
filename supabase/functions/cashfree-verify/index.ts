import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { fetchCashfreeOrder } from "../_shared/cashfree.ts";

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

/**
 * Return-page safety net: the buyer lands back before the webhook arrives, so
 * we confirm the order straight with Cashfree. The webhook stays the source of
 * truth for the receipt — this only flips status and lets the webhook's
 * idempotent claim send the email.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => null);
    const groupId = String(body?.groupId ?? "");
    if (!UUID.test(groupId)) return json({ error: "Invalid order." }, 400);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows } = await admin
      .from("originals_orders")
      .select("id, status, provider_order_id")
      .eq("group_id", groupId)
      .limit(1);

    const row = rows?.[0];
    if (!row?.provider_order_id) return json({ error: "Order not found." }, 404);
    if (row.status === "paid") return json({ status: "paid" });

    const order = await fetchCashfreeOrder(row.provider_order_id);
    const paid = order?.order_status === "PAID";
    if (paid) {
      await admin
        .from("originals_orders")
        .update({ status: "paid", updated_at: new Date().toISOString() })
        .eq("group_id", groupId)
        .in("status", ["pending", "failed"]);
    }

    return json({ status: paid ? "paid" : String(order?.order_status ?? "pending").toLowerCase() });
  } catch (e) {
    console.error("cashfree-verify error", e);
    return json({ error: "Could not confirm that payment." }, 500);
  }
});