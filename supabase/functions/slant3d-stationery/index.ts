import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  createStationery,
  listStationery,
  PartnerApiError,
  updateStationery,
} from "../_shared/slant3d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

/** Admin-only: manage the branded 4x6 packing insert on the US partner account. */
async function isAdmin(req: Request): Promise<boolean> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  // Trusted server-to-server calls (service role) are treated as admin.
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (serviceKey && token === serviceKey) return true;
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return false;
  const { data: ok } = await admin.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  return ok === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!(await isAdmin(req))) return json({ error: "Unauthorized" }, 401);

    if (req.method === "GET") {
      const url = new URL(req.url);
      if (url.searchParams.get("verify") === "1") {
        const id = Deno.env.get("SLANT3D_STATIONERY_ID") ?? null;
        return json({ configured: Boolean(id), stationery_id: id });
      }
      return json({ stationery: await listStationery() });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const name = typeof body?.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 120)
        : "Nyzora packing insert";
      const imageUrl = typeof body?.image_url === "string" ? body.image_url : "";
      if (!/^https:\/\/\S+\.(png|jpg|jpeg)$/i.test(imageUrl)) {
        return json({ error: "image_url must be an https .png/.jpg URL" }, 400);
      }
      const extra = (body && typeof body.extra === "object" && body.extra)
        ? body.extra as Record<string, unknown>
        : {};
      return json({ created: await createStationery(name, imageUrl, extra) });
    }

    if (req.method === "PATCH") {
      const body = await req.json().catch(() => ({}));
      const id = typeof body?.id === "string" ? body.id : "";
      const patch = (body && typeof body.patch === "object" && body.patch)
        ? body.patch as Record<string, unknown>
        : {};
      if (!id) return json({ error: "id is required" }, 400);
      return json({ updated: await updateStationery(id, patch) });
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("stationery error:", message);
    return json({ error: message }, e instanceof PartnerApiError ? e.status : 500);
  }
});
