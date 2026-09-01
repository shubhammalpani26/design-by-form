// Temporary diagnostic: returns the raw partner order record (status + cost
// fields) so we can confirm whether a cancelled-but-processed order was
// refunded. Admin-only. Removed after verification.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const BASE_URL = "https://slant3dapi.com/v2/api";

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
  const { data: isAdmin } = await admin.rpc("has_role", {
    _user_id: data.user.id,
    _role: "admin",
  });
  return isAdmin === true;
}

async function fetchOrder(orderId: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
    headers: {
      Authorization: `Bearer ${Deno.env.get("SLANT3D_API_KEY")}`,
      "Content-Type": "application/json",
    },
  });
  const text = await res.text();
  let body: unknown = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    /* text/plain */
  }
  return { httpStatus: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!(await authorize(req))) return json({ error: "Unauthorized" }, 401);

  const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
  const ids = Array.isArray(body?.orderIds) && body.orderIds.length
    ? body.orderIds.map(String)
    : body?.orderId
    ? [String(body.orderId)]
    : [];

  if (!ids.length) return json({ error: "No order id supplied" }, 400);

  const out: Record<string, unknown> = {};
  for (const id of ids) {
    try {
      out[id] = await fetchOrder(id);
    } catch (e) {
      out[id] = { error: e instanceof Error ? e.message : String(e) };
    }
  }
  return json({ orders: out });
});
