/**
 * Pre-purchase manufacturability + cost check for a rendered Originals piece.
 *
 * As soon as a buyer sees their preview we quietly turn that render into a
 * real 3D mesh, scale it to every size we sell, and slice each one with the US
 * manufacturing partner. That proves the piece is printable and gives us the
 * true landed cost *before* anyone pays — so the remake guarantee and the
 * price on the size ladder are both backed by a real slice, not an estimate.
 *
 * Asynchronous and idempotent: the first call starts the mesh, later calls
 * poll it and finish the pricing.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { ensurePrintFile, uploadStl, US_MAX_MM } from "../_shared/printFile.ts";
import { analyseStl, repairStl, type MeshReport } from "../_shared/meshCheck.ts";
import { estimateLandedUnitCost, partnerCostToMbpUsd } from "../_shared/slant3d.ts";
import { PRICE_BOOK, RETAIL_MULTIPLE, SKU_NAMES } from "../_shared/originalsPricing.ts";
import { sizeMm } from "../_shared/originalsSizes.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

const MESHY = "https://api.meshy.ai/openapi/v1/image-to-3d";
const roundUpTo5 = (n: number) => Math.ceil(n / 5) * 5;

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

async function pollModelTask(taskId: string) {
  const res = await fetch(`${MESHY}/${encodeURIComponent(taskId)}`, {
    headers: { Authorization: `Bearer ${meshyKey()}` },
  });
  if (!res.ok) throw new Error(`Model status check failed (${res.status})`);
  const data = await res.json();
  return {
    status: String(data?.status ?? "UNKNOWN"),
    glb: data?.model_urls?.glb as string | undefined,
    progress: Number(data?.progress ?? 0),
  };
}

interface SizeOutcome {
  sizeKey: string;
  printFileUrl: string;
  landedUsd: number | null;
  mbpUsd: number | null;
  retailUsd: number;
  listUsd: number;
  /** Retail covers the landed cost at our required multiple. */
  marginOk: boolean;
  error?: string;
}

interface PriceCtx {
  previewId: string;
  modelTaskId?: string | null;
  modelUrl?: string | null;
  /** Produces a repaired print file for this size, or null if repair is impossible. */
  makeRepaired?: (sizeKey: string) => Promise<string | null>;
}

/** Writes a structured row to the admin print-validation log. Never throws. */
async function logValidation(row: Record<string, unknown>) {
  await admin.from("print_validation_events").insert(row).then(() => {}, (e: unknown) => {
    console.error("print validation log failed", e);
  });
}

/** Slices the requested size(s) of this piece and caches the result as a live quote. */
async function priceSizes(
  skuSlug: string,
  files: Record<string, string>,
  only: string | null | undefined,
  ctx: PriceCtx,
): Promise<SizeOutcome[]> {
  const sizes = PRICE_BOOK[skuSlug] ?? {};
  const out: SizeOutcome[] = [];

  for (const [sizeKey, entry] of Object.entries(sizes)) {
    if (only && sizeKey !== only) continue;
    const fileUrl = files[sizeKey];
    if (!fileUrl) continue;

    const slice = async (url: string) =>
      await estimateLandedUnitCost(
        url,
        `${SKU_NAMES[skuSlug] ?? "Nyzora Original"} ${sizeKey}`,
        "PLA BLACK",
      );

    let usedUrl = fileUrl;
    let repaired = false;
    let firstError: string | null = null;

    try {
      let landed;
      try {
        landed = await slice(fileUrl);
      } catch (e) {
        firstError = e instanceof Error ? e.message : String(e);
        console.warn("partner slice failed, attempting mesh repair", skuSlug, sizeKey, firstError);
        await logValidation({
          preview_id: ctx.previewId,
          sku_slug: skuSlug,
          size_key: sizeKey,
          stage: "slice",
          passed: false,
          print_file_url: fileUrl,
          model_task_id: ctx.modelTaskId ?? null,
          model_url: ctx.modelUrl ?? null,
          error: firstError.slice(0, 500),
          blockers: [firstError.slice(0, 300)],
        });
        const repairedUrl = ctx.makeRepaired ? await ctx.makeRepaired(sizeKey) : null;
        if (!repairedUrl) throw e;
        usedUrl = repairedUrl;
        repaired = true;
        landed = await slice(repairedUrl);
      }

      const retail = Math.max(entry.usd, roundUpTo5(landed.landedUsd * RETAIL_MULTIPLE));
      const mbpUsd = partnerCostToMbpUsd(landed.landedUsd);

      files[sizeKey] = usedUrl;

      await admin.from("originals_quotes").insert({
        sku_slug: skuSlug,
        size_key: sizeKey,
        print_file_url: usedUrl,
        print_usd: landed.printUsd,
        shipping_usd: landed.shippingUsd,
        landed_usd: landed.landedUsd,
        mbp_usd: mbpUsd,
        retail_usd: retail,
        feasible: true,
        source: "live",
      });

      await logValidation({
        preview_id: ctx.previewId,
        sku_slug: skuSlug,
        size_key: sizeKey,
        stage: "slice",
        passed: true,
        repaired,
        print_file_url: usedUrl,
        model_task_id: ctx.modelTaskId ?? null,
        model_url: ctx.modelUrl ?? null,
        metrics: {
          printUsd: landed.printUsd,
          shippingUsd: landed.shippingUsd,
          landedUsd: landed.landedUsd,
          retailUsd: retail,
        },
        error: repaired && firstError ? `Recovered after repair: ${firstError.slice(0, 300)}` : null,
      });

      out.push({
        sizeKey,
        printFileUrl: usedUrl,
        landedUsd: landed.landedUsd,
        mbpUsd,
        retailUsd: retail,
        listUsd: entry.usd,
        marginOk: entry.usd >= landed.landedUsd * RETAIL_MULTIPLE,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("preview slice failed", skuSlug, sizeKey, message);
      await admin.from("originals_quotes").insert({
        sku_slug: skuSlug,
        size_key: sizeKey,
        print_file_url: usedUrl,
        retail_usd: entry.usd,
        feasible: false,
        source: "list",
        error: message.slice(0, 500),
      }).then(() => {}, () => {});
      if (repaired) {
        await logValidation({
          preview_id: ctx.previewId,
          sku_slug: skuSlug,
          size_key: sizeKey,
          stage: "slice",
          passed: false,
          repaired: true,
          print_file_url: usedUrl,
          model_task_id: ctx.modelTaskId ?? null,
          model_url: ctx.modelUrl ?? null,
          error: `Repair retry also failed: ${message.slice(0, 400)}`,
          blockers: [message.slice(0, 300)],
        });
      }
      out.push({
        sizeKey,
        printFileUrl: usedUrl,
        landedUsd: null,
        mbpUsd: null,
        retailUsd: entry.usd,
        listUsd: entry.usd,
        marginOk: true,
        error: message.slice(0, 200),
      });
    }
  }

  return out;
}


function publicShape(feasibility: Record<string, unknown> | null) {
  const sizes = Array.isArray(feasibility?.sizes) ? (feasibility!.sizes as SizeOutcome[]) : [];
  return sizes.map((s) => ({ sizeKey: s.sizeKey, unitUsd: s.retailUsd, feasible: !s.error }));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => null);
    const previewId = typeof body?.previewId === "string" ? body.previewId : null;
    if (!previewId) return json({ error: "Missing preview." }, 400);

    const { data: preview } = await admin
      .from("originals_previews")
      .select("id, sku_slug, preview_image_url, print_files, print_file_url, model_task_id, model_status, feasibility, engineering")
      .eq("id", previewId)
      .maybeSingle();
    if (!preview) return json({ error: "Preview not found." }, 404);

    const files = (preview.print_files ?? {}) as Record<string, string>;
    const allSizeKeys = Object.keys(PRICE_BOOK[preview.sku_slug] ?? {});
    if (!allSizeKeys.length) return json({ status: "skipped" });

    // We only spend a mesh + slice on the size the buyer actually picked.
    const sizeKey = typeof body?.sizeKey === "string" ? body.sizeKey : null;
    if (!sizeKey || !allSizeKeys.includes(sizeKey)) return json({ status: "idle" });
    const sizeKeys = [sizeKey];

    const existing = (preview.feasibility ?? null) as Record<string, unknown> | null;
    const checked = Array.isArray(existing?.sizes) ? (existing!.sizes as SizeOutcome[]) : [];
    // This size has already been proven and priced.
    if (checked.some((s) => s.sizeKey === sizeKey)) {
      return json({ status: "ready", sizes: publicShape(existing) });
    }


    // Mesh not started yet — kick it off (guarded so parallel polls don't double-spend).
    if (!preview.model_task_id) {
      const imageUrl = preview.preview_image_url as string | null;
      if (!imageUrl || !/^https:\/\//i.test(imageUrl)) return json({ status: "skipped" });

      const { data: claimed } = await admin
        .from("originals_previews")
        .update({ model_status: "claiming" })
        .eq("id", previewId)
        .is("model_task_id", null)
        .neq("model_status", "claiming")
        .select("id")
        .maybeSingle();
      if (!claimed) return json({ status: "generating", progress: 0 });

      try {
        const taskId = await startModelTask(imageUrl);
        await admin.from("originals_previews")
          .update({ model_task_id: taskId, model_status: "generating", model_error: null })
          .eq("id", previewId);
        return json({ status: "generating", progress: 0 });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        await admin.from("originals_previews")
          .update({ model_status: "failed", model_error: message.slice(0, 400) })
          .eq("id", previewId);
        return json({ status: "failed" });
      }
    }

    if (preview.model_status === "failed") return json({ status: "failed" });

    const task = await pollModelTask(preview.model_task_id as string);
    if (task.status === "FAILED" || task.status === "CANCELED") {
      await admin.from("originals_previews")
        .update({ model_status: "failed", model_error: task.status })
        .eq("id", previewId);
      return json({ status: "failed" });
    }
    if (task.status !== "SUCCEEDED" || !task.glb) {
      return json({ status: "generating", progress: task.progress });
    }

    // Mesh is ready — build the print file for the chosen size only.
    const nextFiles: Record<string, string> = { ...files };
    let geometry: (MeshReport & { sizeKey: string; repaired?: boolean }) | null = null;
    /** Raw STL bytes per size, kept so a slice failure can trigger a repair retry. */
    const rawStl: Record<string, Uint8Array> = {};
    const repairedOnce = new Set<string>();

    const makeRepaired = async (key: string): Promise<string | null> => {
      if (repairedOnce.has(key)) return null;
      repairedOnce.add(key);
      const bytes = rawStl[key];
      if (!bytes) return null;
      const { stl, summary } = repairStl(bytes);
      if (!summary.changed) return null;
      const { url } = await uploadStl(admin, `originals/preview/${previewId}/${key}-repaired`, stl);
      const after = analyseStl(stl, { envelopeMm: US_MAX_MM });
      rawStl[key] = stl;
      await logValidation({
        preview_id: previewId,
        sku_slug: preview.sku_slug,
        size_key: key,
        stage: "repair",
        passed: after.printable,
        repaired: true,
        score: after.score,
        metrics: after as unknown as Record<string, unknown>,
        blockers: after.blockers,
        warnings: after.warnings,
        repair_summary: summary as unknown as Record<string, unknown>,
        print_file_url: url,
        model_task_id: preview.model_task_id ?? null,
        model_url: task.glb ?? null,
        engineering: preview.engineering ?? null,
      });
      return url;
    };

    for (const key of sizeKeys) {
      if (nextFiles[key]) continue;
      const prepared = await ensurePrintFile(admin, {
        modelUrl: task.glb,
        key: `originals/preview/${previewId}/${key}`,
        targetMaxMm: sizeMm(preview.sku_slug, key),
      });
      nextFiles[key] = prepared.url;

      // Geometry gate: measure the actual solid before we pay for a slice.
      if (prepared.stl) {
        rawStl[key] = prepared.stl;
        let report = analyseStl(prepared.stl, { envelopeMm: US_MAX_MM });
        let repaired = false;

        await logValidation({
          preview_id: previewId,
          sku_slug: preview.sku_slug,
          size_key: key,
          stage: "geometry",
          passed: report.printable,
          score: report.score,
          metrics: report as unknown as Record<string, unknown>,
          blockers: report.blockers,
          warnings: report.warnings,
          print_file_url: prepared.url,
          model_task_id: preview.model_task_id ?? null,
          model_url: task.glb ?? null,
          engineering: preview.engineering ?? null,
          error: report.printable ? null : report.blockers.join(" ").slice(0, 500),
        });

        // Auto-repair before giving up: weld cracks, drop degenerates, re-seat.
        if (!report.printable) {
          const repairedUrl = await makeRepaired(key);
          if (repairedUrl && rawStl[key]) {
            const after = analyseStl(rawStl[key], { envelopeMm: US_MAX_MM });
            if (after.printable) {
              nextFiles[key] = repairedUrl;
              report = after;
              repaired = true;
            }
          }
        }

        geometry = { ...report, sizeKey: key, repaired };

        if (!report.printable) {
          console.warn("originals geometry gate failed", previewId, key, report.blockers);
          await admin.from("originals_quotes").insert({
            sku_slug: preview.sku_slug,
            size_key: key,
            print_file_url: nextFiles[key],
            feasible: false,
            source: "geometry",
            error: report.blockers.join(" ").slice(0, 500),
          }).then(() => {}, () => {});
          await admin.from("originals_previews").update({
            print_files: nextFiles,
            model_status: "ready",
            feasibility: {
              checkedAt: new Date().toISOString(),
              sizes: checked,
              geometry,
              geometryBlocked: true,
            },
          }).eq("id", previewId);
          return json({
            status: "unprintable",
            reasons: report.blockers,
            score: report.score,
            metrics: report.metrics,
            sizes: publicShape({ sizes: checked }),
          });
        }
      }
    }

    const priced = await priceSizes(preview.sku_slug, nextFiles, sizeKey, {
      previewId,
      modelTaskId: preview.model_task_id as string | null,
      modelUrl: task.glb,
      makeRepaired,
    });

    const sizes = [...checked.filter((s) => s.sizeKey !== sizeKey), ...priced];
    const worst = sizes.filter((s) => !s.marginOk);
    const feasibility = {
      checkedAt: new Date().toISOString(),
      sizes,
      geometry,
      allPriced: sizes.every((s) => s.landedUsd !== null),
      marginBreaches: worst.map((s) => s.sizeKey),
    };
    if (worst.length) {
      console.warn("originals margin breach at preview time", previewId, preview.sku_slug, worst);
    }

    await admin.from("originals_previews").update({
      print_files: nextFiles,
      print_file_url: preview.print_file_url ?? nextFiles[sizeKey] ?? null,
      model_status: "ready",
      feasibility,
    }).eq("id", previewId);


    return json({
      status: "ready",
      sizes: publicShape(feasibility),
      score: geometry?.score ?? null,
      metrics: geometry?.metrics ?? [],
      repaired: geometry?.repaired ?? false,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("originals-feasibility error", message);
    return json({ error: "Feasibility check failed", status: "error" }, 500);
  }
});
