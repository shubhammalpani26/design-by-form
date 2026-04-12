import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight, Brain, Factory, TrendingUp, Layers, Cpu, BarChart3 } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const pillars = [
  {
    icon: Factory,
    title: "Manufacturing Intelligence",
    desc: "Our AI observes and learns from every production cycle — material behaviour, machine tolerances, finishing techniques, lead times. Over time, it builds a living model of how things are actually made.",
  },
  {
    icon: Brain,
    title: "Deep Process Learning",
    desc: "We don't just match orders to makers. Our system understands the why behind each fabrication step — from wood grain orientation to weld sequencing — creating institutional knowledge that compounds with every order.",
  },
  {
    icon: Layers,
    title: "Maker-Specific Training",
    desc: "Each verified maker's capabilities, pricing structures, and craftsmanship nuances are encoded into personalised AI models. The result: accurate pricing, better order matching, and fewer production surprises.",
  },
  {
    icon: TrendingUp,
    title: "Predictive Manufacturability",
    desc: "Before a design is ever submitted, our AI can predict whether it can be manufactured, by whom, at what cost, and how long it will take — based on patterns learned across our entire maker network.",
  },
  {
    icon: Cpu,
    title: "Design-to-Production Pipeline",
    desc: "From the moment a creator describes an idea to the moment it ships, AI orchestrates the entire journey — generating designs constrained by real manufacturing limits, not just aesthetics.",
  },
  {
    icon: BarChart3,
    title: "Continuous Optimisation",
    desc: "Every delivered product feeds back into the system. Quality scores, delivery timelines, material efficiency — all refine our models, making each subsequent production cycle smarter than the last.",
  },
];

const Technology = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-24 md:py-36 overflow-hidden">
          <div className="absolute inset-0 bg-[hsl(var(--primary))]" />
          <div className="container relative z-10">
            <ScrollReveal animation="fade-up">
              <div className="max-w-3xl">
                <p className="text-primary-foreground/40 text-xs font-medium uppercase tracking-[0.3em] mb-6">
                  Our Technology
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  AI That Learns<br />
                  <span className="font-light italic">How Things Are Made</span>
                </h1>
                <p className="text-primary-foreground/50 text-base md:text-lg max-w-lg leading-relaxed">
                  We're building deep manufacturing intelligence — AI that doesn't just generate designs, 
                  but systematically understands how real-world production works.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Thesis */}
        <section className="py-20 md:py-28">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-6">The Thesis</p>
                <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground leading-snug tracking-tight mb-8">
                  Most AI generates images.<br />
                  <span className="font-semibold">Ours understands manufacturing.</span>
                </blockquote>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Every order, every maker interaction, every production cycle trains our models to better understand 
                  materials, processes, and constraints — creating a compounding intelligence layer 
                  that makes the entire platform smarter over time.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Pillars */}
        <section className="py-16 md:py-24 bg-accent">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-10 text-center">
                How It Works
              </p>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border max-w-5xl mx-auto rounded-xl overflow-hidden">
              {pillars.map((pillar) => (
                <div key={pillar.title} className="bg-background p-8 md:p-10">
                  <pillar.icon className="h-5 w-5 text-muted-foreground/40 mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-3 tracking-tight">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Learning Loop */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <ScrollReveal animation="fade-up">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-6">The Learning Loop</p>
                <div className="space-y-8">
                  {[
                    {
                      step: "01",
                      title: "Observe",
                      desc: "Every production order generates data — material usage, processing times, quality outcomes, maker feedback.",
                    },
                    {
                      step: "02",
                      title: "Encode",
                      desc: "Our AI models absorb these signals, building rich representations of how each material, technique, and maker behaves.",
                    },
                    {
                      step: "03",
                      title: "Predict",
                      desc: "With enough data, the system begins predicting outcomes — cost estimates, lead times, manufacturability scores — before production begins.",
                    },
                    {
                      step: "04",
                      title: "Compound",
                      desc: "Each cycle makes the next one smarter. The network effect means every new maker and every new order improves the entire system.",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-6">
                      <span className="text-3xl font-light text-muted-foreground/15 tabular-nums tracking-tight shrink-0">
                        {item.step}
                      </span>
                      <div>
                        <h3 className="text-base font-semibold text-foreground tracking-tight mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Vision */}
        <section className="py-16 md:py-24 bg-accent">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-6">The Vision</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-6">
                  Predict what can be manufactured — before it's designed.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  As our AI deepens its understanding of manufacturing processes across our global maker network, 
                  we move toward a future where the system can proactively suggest what's possible — 
                  matching creative intent with manufacturing reality in real time.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 border-t border-border">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Experience It
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Try our AI Design Studio — powered by deep manufacturing intelligence.
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  to="/design-studio"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
                >
                  Start Designing <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground text-sm font-medium rounded-full hover:bg-accent transition-colors"
                >
                  About Nyzora
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Technology;
