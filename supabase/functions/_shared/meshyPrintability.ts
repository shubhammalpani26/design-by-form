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
  error?: string;
  raw?: unknown;
}

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);

function summarize(payload: Record<string, unknown>): PrintabilitySummary {
  const r = (payload?.result ?? payload) as Record<string, unknown>;
  const holes = num(r?.hole_count ?? r?.holes);
  const nonManifold = num(r?.non_manifold_edge_count ?? r?.non_manifold_edges);
  const watertight = bool(r?.is_watertight ?? r?.watertight);
  const explicit = bool(r?.is_printable ?? r?.printable);
  const printable = explicit !== null
    ? explicit
    : watertight === null && holes === null && nonManifold === null
    ? null
    : watertight !== false && (holes ?? 0) === 0 && (nonManifold ?? 0) === 0;

  return {
    source: "meshy",
    checkedAt: new Date().toISOString(),
    printable,
    watertight,
    holes,
    nonManifoldEdges: nonManifold,
    volumeCm3: num(r?.volume_cm3 ?? r?.volume),
    raw: r,
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
