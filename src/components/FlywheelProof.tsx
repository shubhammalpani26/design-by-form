import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight } from "lucide-react";

const FlywheelProof = () => {
  const [orders, setOrders] = useState<number | null>(null);
  const [signals, setSignals] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ count: orderCount }, { count: signalCount }] = await Promise.all([
        supabase.from("product_sales").select("id", { count: "exact", head: true }),
        supabase.from("manufacturing_intelligence").select("id", { count: "exact", head: true }),
      ]);
      if (!mounted) return;
      setOrders(orderCount ?? 0);
      setSignals(signalCount ?? 0);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="py-20 md:py-28 border-t border-border bg-background">
      <div className="container">
        <ScrollReveal animation="fade-up">
          <div className="max-w-xl mx-auto text-center mb-12">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-4">
              The Flywheel — Live
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
              Smarter with every order.
            </h2>
          </div>
        </ScrollReveal>

        {/* Visual flow: Orders → Signals → Smarter designs */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-6 md:gap-4">
            {/* Orders */}
            <div className="text-center md:text-right">
              <p className="text-5xl md:text-6xl font-bold text-foreground tabular-nums tracking-tight">
                {orders ?? "—"}
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">
                Orders manufactured
              </p>
            </div>

            {/* Arrow */}
            <div className="flex justify-center">
              <ArrowRight className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground/40 rotate-90 md:rotate-0" />
            </div>

            {/* Signals */}
            <div className="text-center md:text-left">
              <p className="text-5xl md:text-6xl font-bold text-foreground tabular-nums tracking-tight">
                {signals ?? "—"}
              </p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">
                Lessons learned
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground text-center max-w-md mx-auto mt-12 leading-relaxed">
            Each finished piece teaches the system something — material behaviour, maker
            strengths, what holds up. The next design starts smarter.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FlywheelProof;