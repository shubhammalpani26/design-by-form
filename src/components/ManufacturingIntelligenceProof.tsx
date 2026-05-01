import { useMemo, useState } from "react";
import { miDataset, stageMeta, makerSummary, type Stage } from "@/data/manufacturingIntelligence";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const STAGES: Stage[] = ["geometry", "routing", "production", "qc"];

const ManufacturingIntelligenceProof = () => {
  const [activeStage, setActiveStage] = useState<Stage | "all">("all");

  const filtered = useMemo(
    () => (activeStage === "all" ? miDataset : miDataset.filter((d) => d.stage === activeStage)),
    [activeStage]
  );

  return (
    <section className="py-20 md:py-28 border-t border-border">
      <div className="container">
        <ScrollReveal animation="fade-up">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-4">
              Proof — From 9 Completed Orders
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-4">
              {miDataset.length} live data points captured
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Every order routed through Nyzora generates measurable signals — geometry,
              maker fit, production cycle, and quality outcomes — that train the system.
            </p>
          </div>
        </ScrollReveal>

        {/* Maker routing summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border max-w-4xl mx-auto rounded-xl overflow-hidden mb-10">
          {makerSummary.map((m) => (
            <div key={m.maker} className="bg-background p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">
                Routed Maker
              </p>
              <h3 className="text-base font-semibold text-foreground tracking-tight">{m.maker}</h3>
              <p className="text-xs text-muted-foreground mt-1">{m.process}</p>
              <div className="flex items-baseline gap-4 mt-4">
                <div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{m.orders}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Orders</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{m.avgConfidence}%</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">Avg confidence</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stage filter */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setActiveStage("all")}
            className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.15em] border transition ${
              activeStage === "all"
                ? "bg-foreground text-background border-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All stages
          </button>
          {STAGES.map((s) => (
            <button
              key={s}
              onClick={() => setActiveStage(s)}
              className={`px-4 py-2 rounded-full text-xs uppercase tracking-[0.15em] border transition ${
                activeStage === s
                  ? "bg-foreground text-background border-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {stageMeta[s].label}
            </button>
          ))}
        </div>

        {/* Data table */}
        <div className="max-w-6xl mx-auto border border-border rounded-xl overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 bg-accent px-6 py-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
            <div className="col-span-1">Order</div>
            <div className="col-span-3">Product / Creator</div>
            <div className="col-span-2">Maker</div>
            <div className="col-span-2">Stage</div>
            <div className="col-span-3">Signal → Value</div>
            <div className="col-span-1 text-right">Conf.</div>
          </div>
          <div className="divide-y divide-border">
            {filtered.map((d) => (
              <div
                key={d.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 text-xs items-start hover:bg-accent/40 transition-colors"
              >
                <div className="col-span-1 font-mono text-muted-foreground">{d.orderRef}</div>
                <div className="col-span-3">
                  <p className="font-medium text-foreground">{d.product}</p>
                  <p className="text-muted-foreground text-[11px]">by {d.creator}</p>
                </div>
                <div className="col-span-2 text-foreground">{d.maker}</div>
                <div className="col-span-2">
                  <span className="inline-block px-2 py-0.5 rounded-full bg-accent text-foreground text-[10px] uppercase tracking-wider">
                    {stageMeta[d.stage].label}
                  </span>
                </div>
                <div className="col-span-3">
                  <p className="text-muted-foreground text-[11px] uppercase tracking-wider">{d.signal}</p>
                  <p className="text-foreground">{d.value}</p>
                </div>
                <div className="col-span-1 md:text-right tabular-nums text-foreground">{d.confidence}%</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/60 text-center mt-6 max-w-2xl mx-auto">
          Data captured from completed orders. Cyanique production = additive (FDM) + hand finishing.
          Beni Enterprise = solid wood joinery + hand finishing. U.G. Agawane Studio = hand-painted canvas.
        </p>
      </div>
    </section>
  );
};

export default ManufacturingIntelligenceProof;