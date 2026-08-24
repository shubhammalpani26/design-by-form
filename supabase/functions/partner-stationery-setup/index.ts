// Temporary maintenance function: registers the branded 4x6 packing insert on
// the US print partner account and returns the valid stationery ids.
import { listStationery, createStationery } from "../_shared/slant3d.ts";

const BASE_URL = "https://slant3dapi.com/v2/api";
async function raw(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${Deno.env.get("SLANT3D_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, body: text.slice(0, 600) };
}


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
