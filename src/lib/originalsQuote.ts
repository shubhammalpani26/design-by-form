import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PrintabilityMetric {
  key: string;
  label: string;
  value: string;
  status: "pass" | "warn" | "fail";
  target: string;
}

export interface PrintabilityReport {
  score: number;
  metrics: PrintabilityMetric[];
  repaired: boolean;
  passed: boolean;
}

export type SizeCheckState = "idle" | "checking" | "confirmed" | "unprintable" | "unknown";

export interface SizeCheck {
  state: SizeCheckState;
  reasons?: string[];
  report?: PrintabilityReport | null;
}

export interface OriginalsQuote {
  skuSlug: string;
  sizeKey: string;
  sizeLabel: string;
  unitUsd: number;
  listUsd: number;
  source: "live" | "list" | "cache";
  feasible: boolean;
}

/** How long we keep nudging the pre-purchase feasibility check along. */
const POLL_MS = 12000;
const MAX_POLLS = 25;

/**
 * Live manufacturing quote for a piece plus the pre-purchase printability gate.
 *
 * The gate starts silently as soon as a render exists — on the default size —
 * so by the time a buyer picks a size we usually already know the piece can be
 * made. Results are cached per size, so re-selecting a size never re-runs the
 * (slow, paid) mesh + partner slice pipeline.
 */
export function useOriginalsQuotes(
  skuSlug: string,
  previewId?: string | null,
  sizeKey?: string | null,
  defaultSizeKey?: string | null,
) {
  const [quotes, setQuotes] = useState<Record<string, OriginalsQuote>>({});
  const [loading, setLoading] = useState(false);
  /** Per-size printability results, cached for the lifetime of this render. */
  const [checks, setChecks] = useState<Record<string, SizeCheck>>({});

  /** Sizes we've already kicked off (or finished) a check for, per preview. */
  const startedRef = useRef<Record<string, true>>({});
  const timersRef = useRef<number[]>([]);
  const cancelledRef = useRef(false);

  const fetchQuotes = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("originals-quote", {
      body: { skuSlug, previewId: previewId ?? null },
    });
    if (error || !data?.quotes) return null;
    const next: Record<string, OriginalsQuote> = {};
    for (const q of data.quotes as OriginalsQuote[]) next[q.sizeKey] = q;
    setQuotes(next);
    return next;
  }, [skuSlug, previewId]);

  useEffect(() => {
    let cancelled = false;
    if (!skuSlug) return;
    setLoading(true);
    fetchQuotes().finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [skuSlug, fetchQuotes]);

  // A new render invalidates every cached check.
  useEffect(() => {
    cancelledRef.current = false;
    startedRef.current = {};
    setChecks({});
    return () => {
      cancelledRef.current = true;
      timersRef.current.forEach((t) => window.clearTimeout(t));
      timersRef.current = [];
    };
  }, [previewId]);

  const runCheck = useCallback(
    (targetSize: string) => {
      if (!previewId || !targetSize) return;
      if (startedRef.current[targetSize]) return;
      startedRef.current[targetSize] = true;
      setChecks((c) => ({ ...c, [targetSize]: { state: "checking" } }));

      let polls = 0;
      const tick = async () => {
        if (cancelledRef.current) return;
        polls += 1;
        const { data } = await supabase.functions.invoke("originals-feasibility", {
          body: { previewId, sizeKey: targetSize },
        });
        if (cancelledRef.current) return;
        const status = data?.status;

        if (status === "ready") {
          setChecks((c) => ({
            ...c,
            [targetSize]: {
              state: "confirmed",
              report:
                typeof data?.score === "number"
                  ? {
                      score: data.score,
                      metrics: Array.isArray(data?.metrics) ? data.metrics : [],
                      repaired: Boolean(data?.repaired),
                      passed: true,
                    }
                  : null,
            },
          }));
          await fetchQuotes();
          return;
        }

        if (status === "unprintable") {
          setChecks((c) => ({
            ...c,
            [targetSize]: {
              state: "unprintable",
              reasons: Array.isArray(data?.reasons) ? data.reasons : ["This shape can't be made yet."],
              report: {
                score: typeof data?.score === "number" ? data.score : 0,
                metrics: Array.isArray(data?.metrics) ? data.metrics : [],
                repaired: false,
                passed: false,
              },
            },
          }));
          return;
        }

        if (
          status === "failed" ||
          status === "skipped" ||
          status === "idle" ||
          status === "error" ||
          polls >= MAX_POLLS
        ) {
          // We couldn't confirm — don't block the buyer, but don't claim confirmed either.
          setChecks((c) => ({ ...c, [targetSize]: { state: "unknown" } }));
          return;
        }

        timersRef.current.push(window.setTimeout(tick, POLL_MS));
      };

      timersRef.current.push(window.setTimeout(tick, 1200));
    },
    [previewId, fetchQuotes],
  );

  // Silent head start on the default size the moment a render exists.
  useEffect(() => {
    if (!previewId || !defaultSizeKey) return;
    runCheck(defaultSizeKey);
  }, [previewId, defaultSizeKey, runCheck]);

  // And for whatever size the buyer actually picks (cached if already run).
  useEffect(() => {
    if (!previewId || !sizeKey) return;
    runCheck(sizeKey);
  }, [previewId, sizeKey, runCheck]);

  const priceFor = useCallback(
    (key: string, fallback: number) => quotes[key]?.unitUsd ?? fallback,
    [quotes],
  );

  const checkFor = useCallback(
    (key?: string | null): SizeCheck => (key && checks[key]) || { state: "idle" },
    [checks],
  );

  const activeKey = sizeKey ?? defaultSizeKey ?? null;
  const active = checkFor(activeKey);
  /**
   * The buyer only ever waits on the default size. Every other size is proven
   * in the background — the shape is the same, only the scale differs — so
   * switching to a small or large size never re-blocks checkout.
   */
  const gate = checkFor(defaultSizeKey ?? activeKey);

  /** True once every size we've evaluated came back unmakeable. */
  const renderRejected = useMemo(() => {
    const values = Object.values(checks);
    return values.length > 0 && values.every((c) => c.state === "unprintable");
  }, [checks]);

  return {
    quotes,
    priceFor,
    loading,
    checks,
    checkFor,
    checking: gate.state === "checking",
    /** Blocks checkout: a size we've proven is unmakeable. */
    unprintable:
      active.state === "unprintable"
        ? active.reasons ?? []
        : gate.state === "unprintable"
          ? gate.reasons ?? []
          : null,
    /** The piece has passed the geometry + partner slice gate. */
    confirmed: gate.state === "confirmed" || active.state === "confirmed",
    printability: active.report ?? gate.report ?? null,
    renderRejected,
  };
}

