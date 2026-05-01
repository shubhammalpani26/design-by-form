import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ChevronDown, ChevronUp } from "lucide-react";

interface Suggestion {
  maker: string;
  process: string;
  confidence: number;
  headline: string;
  rationale: string[];
  runner_up?: { maker: string; why_not: string };
}

interface Props {
  productId: string;
}

export function MakerSuggestion({ productId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [signalsUsed, setSignalsUsed] = useState<number>(0);
  const [expanded, setExpanded] = useState(true);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-maker", {
        body: { product_id: productId },
      });
      if (error) throw error;
      if (!data?.suggestion) throw new Error("No suggestion returned");
      setSuggestion(data.suggestion as Suggestion);
      setSignalsUsed(data.signals_used ?? 0);
    } catch (e) {
      setError((e as Error).message ?? "Failed to get suggestion");
    } finally {
      setLoading(false);
    }
  };

  if (!suggestion) {
    return (
      <div className="border border-dashed border-border rounded-lg p-3 mb-4 bg-background">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium">AI maker suggestion</span>
          </div>
          <Button size="sm" variant="secondary" onClick={run} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                Analyzing…
              </>
            ) : (
              "Suggest maker"
            )}
          </Button>
        </div>
        {error && <p className="text-xs text-destructive mt-2">{error}</p>}
      </div>
    );
  }

  return (
    <div className="border border-primary/30 rounded-lg p-4 mb-4 bg-primary/5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Routed to
          </span>
        </div>
        <Badge variant="default" className="tabular-nums">
          {suggestion.confidence}% confidence
        </Badge>
      </div>

      <p className="text-base font-semibold text-foreground">{suggestion.maker}</p>
      <p className="text-xs text-muted-foreground mb-2">{suggestion.process}</p>
      <p className="text-sm text-foreground mb-3">{suggestion.headline}</p>

      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Why this maker?
      </button>

      {expanded && (
        <div className="space-y-2 mt-2">
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {suggestion.rationale?.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>

          {suggestion.runner_up && (
            <div className="pt-2 border-t border-border/50 mt-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
                Runner-up
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {suggestion.runner_up.maker}
                </span>{" "}
                — {suggestion.runner_up.why_not}
              </p>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground/60 pt-2 border-t border-border/50 mt-2">
            Based on {signalsUsed} learning{signalsUsed === 1 ? "" : "s"} from past completed orders.
          </p>

          <Button size="sm" variant="ghost" onClick={run} disabled={loading} className="text-xs h-7">
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Re-analyze"}
          </Button>
        </div>
      )}
    </div>
  );
}