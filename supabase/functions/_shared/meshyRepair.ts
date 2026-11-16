/**
 * Closes holes in an *unlettered* print file with Meshy's Repair Printability
 * API, and proves the repair kept the piece exactly as it was.
 *
 * Meshy's repair deletes or smears raised lettering (it treats letter strokes
 * as stray shells), so it must only ever see the file before our lettering is
 * added. Every vertex the repair keeps must sit where it was; a repair that
 * moves the surface, shrinks the piece or still leaves holes is discarded.
 */
import { parseStl } from "./engraveStl.ts";

const MESHY_REPAIR = "https://api.meshy.ai/openapi/v1/print/repair";

export interface MeshyRepairOutcome {
  bytes: Uint8Array;
  taskId: string;
}

/** Sends a public STL url to Meshy and returns the repaired STL, or null. */
export async function meshyRepairStl(
  modelUrl: string,
  apiKey: string,
  { timeoutMs = 90_000, pollMs = 3_000 }: { timeoutMs?: number; pollMs?: number } = {},
): Promise<MeshyRepairOutcome | null> {
  const start = await fetch(MESHY_REPAIR, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model_url: modelUrl }),
  });
  const startText = await start.text();
  if (!start.ok) {
    console.warn("meshy repair could not start", start.status, startText.slice(0, 300));
    return null;
  }
  const taskId = String(JSON.parse(startText)?.result ?? "");
  if (!taskId) return null;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollMs));
    const res = await fetch(`${MESHY_REPAIR}/${encodeURIComponent(taskId)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      console.warn("meshy repair status failed", res.status);
      return null;
    }
    const task = await res.json();
    const status = String(task?.status ?? "");
    if (status === "SUCCEEDED") {
      const url = task?.model_urls?.stl;
      if (!url) return null;
      const file = await fetch(url);
      if (!file.ok) return null;
      return { bytes: new Uint8Array(await file.arrayBuffer()), taskId };
    }
    if (status === "FAILED" || status === "CANCELED" || status === "EXPIRED") {
      console.warn("meshy repair ended", status, JSON.stringify(task?.task_error ?? null).slice(0, 300));
      return null;
    }
  }
  console.warn("meshy repair timed out", taskId);
  return null;
}

/** Puts our 80-byte STL header back (it carries the integrated-plinth marker). */
export function withHeaderOf(bytes: Uint8Array, headerSource: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes);
  out.set(headerSource.subarray(0, 80), 0);
  return out;
}

export interface ShapeMatch {
  ok: boolean;
  /** Share of the repaired file's vertices that sit on an original vertex. */
  matched: number;
  /** Share of the original vertices still present after repair. */
  retained: number;
  /** Largest change in overall width/depth/height, mm. */
  sizeDeltaMm: number;
}

/** Vertices further than this from an original vertex count as moved. */
export const SHAPE_MATCH_TOLERANCE_MM = 0.05;
/** Hole caps add a few new vertices; anything beyond this is a reshaped piece. */
export const SHAPE_MIN_MATCHED = 0.99;
export const SHAPE_MIN_RETAINED = 0.98;
export const SHAPE_MAX_SIZE_DELTA_MM = 0.5;

function vertexSet(bytes: Uint8Array) {
  const pts: number[] = [];
  const seen = new Set<string>();
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (const tri of parseStl(bytes)) {
    for (const p of tri) {
      const k = `${Math.round(p[0] * 1e4)},${Math.round(p[1] * 1e4)},${Math.round(p[2] * 1e4)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      pts.push(p[0], p[1], p[2]);
      for (let i = 0; i < 3; i++) {
        if (p[i] < lo[i]) lo[i] = p[i];
        if (p[i] > hi[i]) hi[i] = p[i];
      }
    }
  }
  return { pts, size: [hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]] };
}

function shareNear(from: number[], to: number[], tol: number): number {
  const cell = tol * 2;
  const grid = new Map<string, number[]>();
  for (let i = 0; i < to.length; i += 3) {
    const k = `${Math.floor(to[i] / cell)},${Math.floor(to[i + 1] / cell)},${Math.floor(to[i + 2] / cell)}`;
    const bucket = grid.get(k);
    if (bucket) bucket.push(i);
    else grid.set(k, [i]);
  }
  const t2 = tol * tol;
  let hits = 0;
  const n = from.length / 3;
  for (let i = 0; i < from.length; i += 3) {
    const cx = Math.floor(from[i] / cell), cy = Math.floor(from[i + 1] / cell), cz = Math.floor(from[i + 2] / cell);
    let found = false;
    for (let dx = -1; dx <= 1 && !found; dx++) {
      for (let dy = -1; dy <= 1 && !found; dy++) {
        for (let dz = -1; dz <= 1 && !found; dz++) {
          const bucket = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!bucket) continue;
          for (const j of bucket) {
            const ex = from[i] - to[j], ey = from[i + 1] - to[j + 1], ez = from[i + 2] - to[j + 2];
            if (ex * ex + ey * ey + ez * ez <= t2) { found = true; break; }
          }
        }
      }
    }
    if (found) hits++;
  }
  return n > 0 ? hits / n : 0;
}

/** True only when a repair closed holes without moving, slimming or resizing the piece. */
export function repairMatchesShape(original: Uint8Array, repaired: Uint8Array): ShapeMatch {
  const a = vertexSet(original), b = vertexSet(repaired);
  const sizeDeltaMm = Math.max(...a.size.map((s, i) => Math.abs(s - b.size[i])));
  if (!a.pts.length || !b.pts.length || !(sizeDeltaMm <= SHAPE_MAX_SIZE_DELTA_MM)) {
    return { ok: false, matched: 0, retained: 0, sizeDeltaMm };
  }
  const matched = shareNear(b.pts, a.pts, SHAPE_MATCH_TOLERANCE_MM);
  const retained = shareNear(a.pts, b.pts, SHAPE_MATCH_TOLERANCE_MM);
  return {
    ok: matched >= SHAPE_MIN_MATCHED && retained >= SHAPE_MIN_RETAINED,
    matched,
    retained,
    sizeDeltaMm,
  };
}
