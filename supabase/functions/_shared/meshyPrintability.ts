/**
 * Meshy's own printability report (`/print/analyze`), used as a second opinion
 * alongside our geometry gate. It reports watertightness, holes, non-manifold
 * edges and volume — it does NOT check wall thickness, overhangs, tipping or
 * build envelope, so it never replaces our own checks. Best-effort: any
 * failure returns a summary carrying the error rather than throwing.
 */

const MESHY_BASE = "https://api.meshy.ai/openapi/v1";

export interface PrintabilitySummary {
  source: "meshy";
  checkedAt: string;
  printable: boolean | null;
  watertight: boolean | null;
  holes: number | null;
  nonManifoldEdges: number | null;
  volumeCm3: number | null;
  degenerateFaces?: number;
  error?: string;
  raw?: unknown;
}

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);

function summarize(payload: Record<string, unknown>): PrintabilitySummary {
  const top = (payload?.result ?? payload) as Record<string, unknown>;
  // Meshy 7 nests the verdict under `printability.metrics`; older shapes put
  // the same fields at the top level.
  const report = (top?.printability ?? top) as Record<string, unknown>;
  const m = (report?.metrics ?? report) as Record<string, unknown>;
  const holes = num(m?.hole_count ?? m?.holes);
  const nonManifold = num(m?.non_manifold_edge_count ?? m?.non_manifold_edges);
  const watertight = bool(m?.is_watertight ?? m?.watertight);
  const status = typeof report?.status === "string" ? report.status.toLowerCase() : null;
  const explicit = bool(m?.is_printable ?? m?.printable) ??
    (status ? status !== "error" : null);
  const printable = explicit !== null
    ? explicit
    : watertight === null && holes === null && nonManifold === null
    ? null
    : watertight !== false && (holes ?? 0) === 0 && (nonManifold ?? 0) === 0;

  const rawVolume = num(m?.volume_cm3 ?? m?.volume);
  // Meshy reports volume in cubic metres for print-analyze; scale to cm³.
  const volumeCm3 = m?.volume_cm3 !== undefined
    ? rawVolume
    : rawVolume !== null
    ? Math.round(rawVolume * 1_000_000 * 100) / 100
    : null;

  return {
    source: "meshy",
    checkedAt: new Date().toISOString(),
    printable,
    watertight,
    holes,
    nonManifoldEdges: nonManifold,
    volumeCm3,
    ...(typeof m?.degenerate_faces === "number" ? { degenerateFaces: m.degenerate_faces } : {}),
    raw: top,
  };
}

async function call(path: string, apiKey: string, init?: RequestInit) {
  const res = await fetch(`${MESHY_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : {};
}

/** Never throws. Returns null only when no API key is configured. */
export async function analyzePrintability(
  taskId: string,
  apiKey: string | undefined,
): Promise<PrintabilitySummary | null> {
  if (!apiKey) return null;
  try {
    const started = await call("/print/analyze", apiKey, {
      method: "POST",
      body: JSON.stringify({ input_task_id: taskId }),
    });

    // Synchronous payloads carry the metrics directly; async ones return an id.
    const id = typeof started?.result === "string" ? started.result : null;
    if (!id) return summarize(started as Record<string, unknown>);

    for (let attempt = 0; attempt < 4; attempt++) {
      const poll = await call(`/print/analyze/${encodeURIComponent(id)}`, apiKey);
      const status = String(poll?.status ?? poll?.result?.status ?? "SUCCEEDED").toUpperCase();
      if (status === "SUCCEEDED") return summarize(poll as Record<string, unknown>);
      if (status === "FAILED" || status === "CANCELED") {
        return {
          source: "meshy",
          checkedAt: new Date().toISOString(),
          printable: null,
          watertight: null,
          holes: null,
          nonManifoldEdges: null,
          volumeCm3: null,
          error: `Printability analysis ${status.toLowerCase()}`,
        };
      }
      await new Promise((r) => setTimeout(r, 1_500));
    }
    return {
      source: "meshy",
      checkedAt: new Date().toISOString(),
      printable: null,
      watertight: null,
      holes: null,
      nonManifoldEdges: null,
      volumeCm3: null,
      error: "Printability analysis still running",
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Meshy printability analysis failed", message);
    return {
      source: "meshy",
      checkedAt: new Date().toISOString(),
      printable: null,
      watertight: null,
      holes: null,
      nonManifoldEdges: null,
      volumeCm3: null,
      error: message.slice(0, 300),
    };
  }
}
