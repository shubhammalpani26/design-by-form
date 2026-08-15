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

/**
 * Live manufacturing quote for a piece. Prices come back from the production
 * partner via the `originals-quote` edge function; if that is unavailable the
 * server returns our standard list price, so the UI always has a number.
 */
export function useOriginalsQuotes(skuSlug: string, previewId?: string | null) {
  const [quotes, setQuotes] = useState<Record<string, OriginalsQuote>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!skuSlug) return;
    setLoading(true);
    supabase.functions
      .invoke("originals-quote", { body: { skuSlug, previewId: previewId ?? null } })
      .then(({ data, error }) => {
        if (cancelled || error || !data?.quotes) return;
        const next: Record<string, OriginalsQuote> = {};
        for (const q of data.quotes as OriginalsQuote[]) next[q.sizeKey] = q;
        setQuotes(next);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [skuSlug, previewId]);

  const priceFor = useCallback(
    (sizeKey: string, fallback: number) => quotes[sizeKey]?.unitUsd ?? fallback,
    [quotes],
  );

  return { quotes, priceFor, loading };
}
