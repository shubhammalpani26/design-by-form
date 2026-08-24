import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
 * Live manufacturing quote for a piece. Prices come back from the production
 * partner via the `originals-quote` edge function; if that is unavailable the
 * server returns our standard list price, so the UI always has a number.
 *
 * When a buyer has picked a size for their own render we also drive the
 * pre-purchase feasibility check (real 3D mesh + partner slice) for *that*
 * size and refresh the ladder as soon as the true cost lands — so what we show
 * is what we can actually make.
 */
export function useOriginalsQuotes(
  skuSlug: string,
  previewId?: string | null,
  sizeKey?: string | null,
) {
  const [quotes, setQuotes] = useState<Record<string, OriginalsQuote>>({});
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  /** Set when the geometry gate rejects this render for FDM. */
  const [unprintable, setUnprintable] = useState<string[] | null>(null);

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

  // Drive the mesh + slice check for this buyer's render, at their chosen size.
  useEffect(() => {
    if (!previewId || !sizeKey) return;
    let cancelled = false;
    let polls = 0;
    setChecking(true);

    const tick = async () => {
      if (cancelled) return;
      polls += 1;
      const { data } = await supabase.functions.invoke("originals-feasibility", {
        body: { previewId, sizeKey },
      });
      if (cancelled) return;
      const status = data?.status;
      if (status === "ready") {
        await fetchQuotes();
        setChecking(false);
        return;
      }
      if (
        status === "failed" ||
        status === "skipped" ||
        status === "idle" ||
        status === "error" ||
        polls >= MAX_POLLS
      ) {
        setChecking(false);
        return;
      }
      timer = window.setTimeout(tick, POLL_MS);
    };

    let timer = window.setTimeout(tick, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [previewId, sizeKey, fetchQuotes]);


  const priceFor = useCallback(
    (sizeKey: string, fallback: number) => quotes[sizeKey]?.unitUsd ?? fallback,
    [quotes],
  );

  return { quotes, priceFor, loading, checking };
}
