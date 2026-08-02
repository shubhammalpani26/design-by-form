import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTracking } from "../_shared/slant3d.ts";

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

const OPEN_STATUSES = ["submitted", "awaiting_shipment", "on_hold", "pending"];

async function authorize(req: Request): Promise<boolean> {
  const internal = req.headers.get("x-internal-key");
  if (internal && internal === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) return true;

  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return false;
  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: data.user.id,
    _role: "admin",
  });
  return isAdmin === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await authorize(req))) return json({ error: "Unauthorized" }, 401);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const singleId = typeof body?.fulfillment_id === "string" ? body.fulfillment_id : null;

    let query = admin
      .from("slant3d_fulfillments")
      .select("id, slant_order_id, status, order_id, product_id, designer_id")
      .not("slant_order_id", "is", null)
      .limit(50);

    query = singleId ? query.eq("id", singleId) : query.in("status", OPEN_STATUSES);

    const { data: rows, error } = await query;
    if (error) throw error;

    const updates: Array<Record<string, unknown>> = [];

    for (const row of rows ?? []) {
      try {
        const { status, trackingNumbers } = await getTracking(row.slant_order_id!);
        const shippedNow = status === "shipped" && row.status !== "shipped";

        await admin
          .from("slant3d_fulfillments")
          .update({
            status,
            tracking_numbers: trackingNumbers,
            last_synced_at: new Date().toISOString(),
            error: null,
          })
          .eq("id", row.id);

        if (shippedNow && row.order_id) {
          await admin.from("orders").update({ status: "shipped" }).eq("id", row.order_id);

          const { data: profile } = row.designer_id
            ? await admin
                .from("designer_profiles")
                .select("user_id")
                .eq("id", row.designer_id)
                .maybeSingle()
            : { data: null };

          if (profile?.user_id) {
            await admin.from("notifications").insert({
              user_id: profile.user_id,
              type: "order_shipped",
              title: "Your piece shipped from the US print farm",
              message: `Tracking: ${
                (trackingNumbers as unknown[]).join(", ") || "available shortly"
              }`,
              link: "/creator-dashboard",
              metadata: { fulfillment_id: row.id, tracking: trackingNumbers },
            });
          }
        }

        updates.push({ id: row.id, status, tracking: trackingNumbers });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        console.error(`Tracking sync failed for ${row.id}:`, message);
        await admin
          .from("slant3d_fulfillments")
          .update({ error: message.slice(0, 800), last_synced_at: new Date().toISOString() })
          .eq("id", row.id);
        updates.push({ id: row.id, error: message });
      }
    }

    return json({ synced: updates.length, updates });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("slant3d-tracking-sync error:", message);
    return json({ error: message }, 500);
  }
});