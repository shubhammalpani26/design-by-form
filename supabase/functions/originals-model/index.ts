/**
 * Turns a paid Originals order into a real, printable file.
 *
 * For a photo-to-piece order the buyer's own render is converted into a 3D
 * mesh by our model generator, scaled into the print envelope and stored as an
 * .stl. Catalogue orders fall back to the registered master model for that
 * size. Once every piece in the group has a file the order is sent to the
 * production partner automatically.
 *
 * Generation is asynchronous: the first call starts the job, later calls poll
 * it. Safe to call repeatedly.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ensurePrintFile } from "../_shared/printFile.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-key",
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

const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const MESHY = "https://api.meshy.ai/openapi/v1/image-to-3d";

/** Longest edge we print an Originals piece at, per size key. */
const SIZE_MAX_MM: Record<string, number> = {
  petite: 120,
  standard: 140,
  statement: 196,
};

async function authorize(req: Request): Promise<boolean> {
  const internal = req.headers.get("x-internal-key");
  if (internal && internal === SERVICE_KEY) return true;
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return false;
  if (token === SERVICE_KEY) return true;
  const { data } = await admin.auth.getUser(token);
  if (!data?.user) return false;
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: data.user.id, _role: "admin" });
  return isAdmin === true;
}

function meshyKey(): string {
  const key = Deno.env.get("MESHY_API_KEY");
  if (!key) throw new Error("3D generation is not configured");
  return key;
}

async function startModelTask(imageUrl: string): Promise<string> {
  const res = await fetch(MESHY, {
    method: "POST",
    headers: { Authorization: `Bearer ${meshyKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      image_url: imageUrl,
      ai_model: "meshy-6",
      enable_pbr: false,
      should_remesh: true,
      should_texture: false,
      topology: "triangle",
      target_polycount: 150000,
      symmetry_mode: "auto",
    }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Model generation could not start (${res.status}): ${text.slice(0, 300)}`);
  const id = JSON.parse(text)?.result;
  if (!id) throw new Error("Model generation returned no task id");
  return String(id);
}

async function pollModelTask(taskId: string): Promise<{ status: string; glb?: string; progress?: number }> {
  const res = await fetch(`${MESHY}/${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${meshyKey()}` },
  });
  if (!res.ok) throw new Error(`Model status check failed (${res.status})`);
  const data = await res.json();
  return {
    status: String(data?.status ?? "UNKNOWN"),
    glb: data?.model_urls?.glb,
    progress: data?.progress,
  };
}

/** Registered master model for a catalogue size. */
async function masterFile(skuSlug: string, sizeKey: string): Promise<string | null> {
  const { data } = await admin
    .from("originals_print_models")
    .select("stl_url")
    .eq("sku_slug", skuSlug)
    .eq("size_key", sizeKey)
    .eq("active", true)
    .maybeSingle();
  return (data?.stl_url as string) ?? null;
}

interface OrderRow {
  id: string;
  group_id: string | null;
  preview_id: string | null;
  sku_slug: string;
  size_key: string;
  print_file_url: string | null;
  model_task_id: string | null;
  status: string;
}

/**
 * Resolves one order row to a printable .stl. Returns the url when ready,
 * or null while the mesh is still being generated.
 */
async function resolveFile(row: OrderRow): Promise<{ url: string | null; status: string; error?: string }> {
  if (row.print_file_url) return { url: row.print_file_url, status: "ready" };

  // Personalised piece: the buyer's render becomes their own mesh.
  if (row.preview_id) {
    const { data: preview } = await admin
      .from("originals_previews")
      .select("id, preview_image_url, print_file_url, model_task_id")
      .eq("id", row.preview_id)
      .maybeSingle();

    if (preview?.print_file_url) return { url: preview.print_file_url as string, status: "ready" };

    const imageUrl = preview?.preview_image_url as string | undefined;
    if (imageUrl && /^https:\/\//i.test(imageUrl)) {
      let taskId = (row.model_task_id ?? preview?.model_task_id) as string | null;
      if (!taskId) {
        taskId = await startModelTask(imageUrl);
        await admin.from("originals_previews")
          .update({ model_task_id: taskId, model_status: "generating", model_error: null })
          .eq("id", preview!.id);
        await admin.from("originals_orders")
          .update({ model_task_id: taskId, model_status: "generating" })
          .eq("id", row.id);
        return { url: null, status: "generating" };
      }

      const task = await pollModelTask(taskId);
      if (task.status === "SUCCEEDED" && task.glb) {
        const prepared = await ensurePrintFile(admin, {
          modelUrl: task.glb,
          key: `originals/${row.sku_slug}/${row.id}`,
          targetMaxMm: SIZE_MAX_MM[row.size_key] ?? 180,
        });
        await admin.from("originals_previews")
          .update({ print_file_url: prepared.url, model_status: "ready" })
          .eq("id", preview!.id);
        return { url: prepared.url, status: "ready" };
      }
      if (task.status === "FAILED" || task.status === "CANCELED") {
        await admin.from("originals_previews")
          .update({ model_status: "failed", model_error: task.status })
          .eq("id", preview!.id);
        // Never strand a paid order — ship the catalogue master instead.
        const master = await masterFile(row.sku_slug, row.size_key);
        return master
          ? { url: master, status: "ready_master" }
          : { url: null, status: "failed", error: "Model generation failed" };
      }
      return { url: null, status: "generating" };
    }
  }

  const master = await masterFile(row.sku_slug, row.size_key);
  return master ? { url: master, status: "ready_master" } : { url: null, status: "needs_file" };
}

async function fulfilGroup(groupId: string | null, orderId: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/originals-fulfill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-key": SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify(groupId ? { group_id: groupId } : { order_id: orderId }),
  });
  return { ok: res.ok, body: await res.json().catch(() => null) };
}

/** Advances every paid piece in scope one step. */
async function run(scope: { orderId?: string | null; groupId?: string | null; sweep?: boolean }) {
  // A single order id may belong to a multi-piece checkout — widen to the group
  // so the whole shipment moves together.
  let groupId = scope.groupId ?? null;
  if (!groupId && scope.orderId) {
    const { data } = await admin
      .from("originals_orders")
      .select("group_id")
      .eq("id", scope.orderId)
      .maybeSingle();
    groupId = (data?.group_id as string) ?? null;
  }

  let query = admin
    .from("originals_orders")
    .select("id, group_id, preview_id, sku_slug, size_key, print_file_url, model_task_id, status")
    .eq("status", "paid")
    .is("partner_order_id", null)
    .order("created_at", { ascending: true })
    .limit(scope.sweep ? 25 : 12);

  if (groupId) query = query.eq("group_id", groupId);
  else if (scope.orderId) query = query.eq("id", scope.orderId);

  const { data: rows, error } = await query;
  if (error) throw error;
  if (!rows?.length) return { pieces: 0, results: [] as unknown[] };

  const results: Array<Record<string, unknown>> = [];
  const groups = new Set<string>();

  for (const row of rows as OrderRow[]) {
    try {
      const out = await resolveFile(row);
      if (out.url) {
        await admin.from("originals_orders").update({
          print_file_url: out.url,
          model_status: "ready",
          fulfillment_error: null,
          updated_at: new Date().toISOString(),
        }).eq("id", row.id);
        groups.add(row.group_id ?? row.id);
      } else if (out.status === "failed" || out.status === "needs_file") {
        await admin.from("originals_orders").update({
          model_status: out.status,
          production_status: "needs_file",
          fulfillment_error: out.error ?? "No printable model yet",
          updated_at: new Date().toISOString(),
        }).eq("id", row.id);
      }
      results.push({ id: row.id, status: out.status });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("originals-model piece failed", row.id, message);
      await admin.from("originals_orders")
        .update({ model_status: "error", fulfillment_error: message.slice(0, 400) })
        .eq("id", row.id);
      results.push({ id: row.id, status: "error", error: message });
    }
  }

  // A group only goes to the partner once every piece in it has a file.
  const sent: string[] = [];
  for (const key of groups) {
    const { data: pending } = await admin
      .from("originals_orders")
      .select("id")
      .eq("status", "paid")
      .is("print_file_url", null)
      .or(`group_id.eq.${key},id.eq.${key}`)
      .limit(1);
    if (pending?.length) continue;
    const out = await fulfilGroup(key, key);
    if (out.ok) sent.push(key);
    else console.error("originals-fulfill rejected", key, out.body);
  }

  return { pieces: rows.length, results, sent };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    if (!(await authorize(req))) return json({ error: "Unauthorized" }, 401);
    const body = await req.json().catch(() => ({}));
    const out = await run({
      orderId: typeof body?.order_id === "string" ? body.order_id : null,
      groupId: typeof body?.group_id === "string" ? body.group_id : null,
      sweep: body?.sweep === true,
    });
    return json(out);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("originals-model error", message);
    return json({ error: message }, 500);
  }
});
