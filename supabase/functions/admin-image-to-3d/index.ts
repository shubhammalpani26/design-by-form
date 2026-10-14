/**
 * Admin-only "Image to 3D": turns any uploaded image into a printable STL.
 * action "start" { image_url } -> { task_id }
 * action "poll"  { task_id, size_mm } -> { status, progress, stl_url?, glb_url?, report? }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ensurePrintFile } from "../_shared/printFile.ts";
import { analyseStl } from "../_shared/meshCheck.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const MESHY = "https://api.meshy.ai/openapi/v1/image-to-3d";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return json({ error: "Unauthorized" }, 401);
    const { data: u } = await admin.auth.getUser(token);
    if (!u?.user) return json({ error: "Unauthorized" }, 401);
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (isAdmin !== true) return json({ error: "Admins only" }, 403);

    const key = Deno.env.get("MESHY_API_KEY");
    if (!key) return json({ error: "3D generation is not configured" }, 500);
    const body = await req.json().catch(() => ({}));

    if (body.action === "start") {
      const imageUrl = String(body.image_url ?? "");
      if (!/^https:\/\//i.test(imageUrl)) return json({ error: "A public https image URL is required" }, 400);
      const res = await fetch(MESHY, {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          ai_model: "meshy-7.1",
          enable_pbr: false,
          should_remesh: true,
          should_texture: false,
          topology: "triangle",
          target_polycount: 60000,
          image_enhancement: false,
          auto_size: true,
          origin_at: "bottom",
          target_formats: ["glb"],
        }),
      });
      const text = await res.text();
      if (!res.ok) return json({ error: `Could not start (${res.status}): ${text.slice(0, 200)}` }, 502);
      return json({ task_id: JSON.parse(text)?.result });
    }

    if (body.action === "poll") {
      const taskId = String(body.task_id ?? "");
      if (!/^[\w-]{1,200}$/.test(taskId)) return json({ error: "Invalid task id" }, 400);
      // No 220 mm partner-envelope clamp here: this tool is for any object
      // (mannequins, fixtures, etc.), so sizes are capped only for sanity.
      const sizeMm = Math.min(Math.max(Number(body.size_mm) || 140, 20), 2000);
      const res = await fetch(`${MESHY}/${taskId}`, { headers: { Authorization: `Bearer ${key}` } });
      if (!res.ok) return json({ error: `Status check failed (${res.status})` }, 502);
      const d = await res.json();
      const status = String(d?.status ?? "UNKNOWN");
      if (status !== "SUCCEEDED" || !d?.model_urls?.glb) {
        return json({ status, progress: d?.progress ?? 0, error: d?.task_error?.message });
      }
      const prepared = await ensurePrintFile(admin, {
        modelUrl: d.model_urls.glb,
        key: `admin-image-to-3d/${taskId}-${sizeMm}mm`,
        targetMaxMm: sizeMm,
        envelopeMaxMm: 2000,
      });
      const r = prepared.stl ? analyseStl(prepared.stl, { envelopeMm: sizeMm }) : null;
      return json({
        status,
        progress: 100,
        glb_url: d.model_urls.glb,
        stl_url: prepared.url,
        size: prepared.size,
        report: r && {
          watertight: r.watertight,
          volumeCm3: r.volumeCm3,
          triangleCount: r.triangleCount,
          warnings: r.warnings,
          blockers: r.blockers,
        },
      });
    }
    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("admin-image-to-3d:", message);
    return json({ error: message }, 500);
  }
});
