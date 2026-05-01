import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/hooks/useScrollReveal";

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
          <div className="max-w-xl mx-auto text-center mb-10">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-4">
              The Flywheel — Live
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              Growing with every order.
            </h2>
          </div>
        </ScrollReveal>

        {/* Live counters */}
        <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden max-w-3xl mx-auto">
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
      </div>
    </section>
  );
};

export default FlywheelProof;