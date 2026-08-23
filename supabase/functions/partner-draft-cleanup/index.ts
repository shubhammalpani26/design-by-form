import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { listPartnerOrders, releaseDraftOrder } from "../_shared/slant3d.ts";
import { logPartnerEvent } from "../_shared/partnerEvents.ts";

/**
 * Sweeps abandoned DRAFT orders off our partner account. Feasibility quoting
 * drafts an order to read shipping cost; drafts are never billed, but they pile
 * up if a cancel call fails. Admin-only.
 */
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await authorize(req))) return json({ error: "Unauthorized" }, 401);

    const orders = await listPartnerOrders();
    const drafts = orders.filter((o) =>
      String(o.status ?? "").toUpperCase() === "DRAFT"
    );

    const released: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    for (const d of drafts) {
      const id = String(d.publicId ?? d.id ?? "");
      if (!id) continue;
      const error = await releaseDraftOrder(id);
      if (error) failed.push({ id, error });
      else released.push(id);
      await logPartnerEvent(admin, {
        partnerOrderId: id,
        stage: "quote",
        event: error ? "draft_release_failed" : "draft_released",
        status: error ? "failed" : "released",
        message: error,
        details: { source: "draft sweep" },
      });
    }

    return json({ drafts: drafts.length, released: released.length, failed });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("partner-draft-cleanup error", message);
    return json({ error: message }, 500);
  }
});
