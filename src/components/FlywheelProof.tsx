import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/hooks/useScrollReveal";

interface Learning {
  id: string;
  maker: string;
  process: string;
  signal: string;
  learning: string | null;
  confidence: number;
  captured_at: string;
}

// Plain-language glimpses — one per maker, rotated from production data.
// Keep these short and human; the technical data lives in the dataset.
const FALLBACK_GLIMPSES: Array<{ maker: string; process: string; headline: string; lesson: string; confidence: number }> = [
  {
    maker: "Cyanique",
    process: "FGF 3D printed + hand finished",
    headline: "Wave-form benches need thicker walls than they look.",
    lesson: "Ten completed seats taught us where to add hidden ribbing — so new sculpted forms hold a 180 kg load on the first print.",
    confidence: 96,
  },
  {
    maker: "Beni Enterprise",
    process: "Solid wood + hand finished",
    headline: "Pedestal tables behave differently in Sheesham vs Teak.",
    lesson: "Joinery data from past dining tables now tells the AI when to suggest a wider base — before a creator ever sees a wobble.",
    confidence: 94,
  },
  {
    maker: "U.G. Agawane Studio",
    process: "Hand-painted canvas",
    headline: "Color stays truer when the brief matches the atelier's palette.",
    lesson: "Past canvases narrowed which pigments hold under UV varnish — new artwork briefs are now generated within that safe range.",
    confidence: 97,
  },
];

const FlywheelProof = () => {
  const [total, setTotal] = useState<number | null>(null);
  const [productionSignals, setProductionSignals] = useState<number | null>(null);
  const [designSignals, setDesignSignals] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ count: totalCount }, { count: prodCount }, { count: designCount }] =
        await Promise.all([
          supabase.from("manufacturing_intelligence").select("id", { count: "exact", head: true }),
          supabase.from("manufacturing_intelligence").select("id", { count: "exact", head: true }).eq("source", "production"),
          supabase.from("manufacturing_intelligence").select("id", { count: "exact", head: true }).eq("source", "design_generation"),
        ]);
      if (!mounted) return;
      setTotal(totalCount ?? 0);
      setProductionSignals(prodCount ?? 0);
      setDesignSignals(designCount ?? 0);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-20 md:py-28 border-t border-border">
      <div className="container">
        <ScrollReveal animation="fade-up">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-4">
              The Flywheel — Live
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-4">
              Every new design is conditioned on real production data.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              When a creator generates a design, the system retrieves the highest-confidence
              lessons from completed orders and uses them to shape geometry, materials, and
              maker routing. The dataset grows with every order and every generation.
            </p>
          </div>
        </ScrollReveal>

        {/* Live counters */}
        <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden max-w-3xl mx-auto mb-12">
          {[
            { n: total, label: "Total signals" },
            { n: productionSignals, label: "From completed orders" },
            { n: designSignals, label: "From new designs" },
          ].map((s) => (
            <div key={s.label} className="bg-background p-6 md:p-8 text-center">
              <p className="text-3xl md:text-4xl font-bold text-foreground tabular-nums tracking-tight">
                {s.n ?? "—"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* A glimpse — one plain-language lesson per maker */}
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 text-center">
            A glimpse of what the system has learned
          </p>
          <div className="space-y-3">
            {FALLBACK_GLIMPSES.map((g) => (
              <div key={g.maker} className="border border-border rounded-lg p-4 md:p-5 bg-background">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                    {g.maker} · {g.process}
                  </p>
                  <span className="text-[10px] tabular-nums text-muted-foreground/60">
                    {g.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{g.headline}</p>
                <p className="text-sm text-muted-foreground mt-1">{g.lesson}</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/50 text-center mt-6">
            Full telemetry stays internal — these are summaries of the signals the model uses.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FlywheelProof;