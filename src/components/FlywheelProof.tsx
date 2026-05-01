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

const FlywheelProof = () => {
  const [total, setTotal] = useState<number | null>(null);
  const [productionSignals, setProductionSignals] = useState<number | null>(null);
  const [designSignals, setDesignSignals] = useState<number | null>(null);
  const [recent, setRecent] = useState<Learning[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ count: totalCount }, { count: prodCount }, { count: designCount }, { data: latest }] =
        await Promise.all([
          supabase.from("manufacturing_intelligence").select("id", { count: "exact", head: true }),
          supabase.from("manufacturing_intelligence").select("id", { count: "exact", head: true }).eq("source", "production"),
          supabase.from("manufacturing_intelligence").select("id", { count: "exact", head: true }).eq("source", "design_generation"),
          supabase
            .from("manufacturing_intelligence")
            .select("id, maker, process, signal, learning, confidence, captured_at")
            .eq("source", "production")
            .order("confidence", { ascending: false })
            .limit(3),
        ]);
      if (!mounted) return;
      setTotal(totalCount ?? 0);
      setProductionSignals(prodCount ?? 0);
      setDesignSignals(designCount ?? 0);
      setRecent((latest as Learning[]) ?? []);
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

        {/* Sample of highest-confidence lessons */}
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-4 text-center">
            Sample lessons feeding the next generation
          </p>
          <div className="space-y-3">
            {recent.map((r) => (
              <div key={r.id} className="border border-border rounded-lg p-4 md:p-5 bg-background">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground/70">
                    {r.maker} · {r.process}
                  </p>
                  <span className="text-[10px] tabular-nums text-muted-foreground/60">
                    {r.confidence}% confidence
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{r.signal}</p>
                {r.learning && (
                  <p className="text-sm text-muted-foreground mt-1">{r.learning}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FlywheelProof;