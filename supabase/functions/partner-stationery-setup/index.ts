// Temporary maintenance function: registers the branded 4x6 packing insert on
// the US print partner account and returns the valid stationery ids.
import { listStationery, createStationery, updateStationery } from "../_shared/slant3d.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const out: Record<string, unknown> = {};
    out.before = await listStationery();

    if (body.imageUrl) {
      out.created = await createStationery("Nyzora Insert 4x6", body.imageUrl);
    }
    if (body.activateId) {
      out.activated = await updateStationery(String(body.activateId), { available: true });
    }

    out.after = await listStationery();
    return new Response(JSON.stringify(out, null, 2), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
