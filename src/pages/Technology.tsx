import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import LearningLoopDiagram from "@/components/LearningLoopDiagram";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const Technology = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="AI Manufacturing Technology | Manufacturing Intelligence — Nyzora"
        description="Nyzora learns from real-world production—capturing materials, processes, and outcomes to predict what can be built before production begins."
        keywords={["AI manufacturing", "manufacturing intelligence", "production data", "maker matching", "feasibility prediction", "smart manufacturing platform"]}
        url="https://nyzora.ai/technology"
      />
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
                  Not just generating designs — Nyzora learns from real-world production 
                  to understand what can actually be built.
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
                <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground leading-snug tracking-tight mb-6">
                  Nyzora doesn't just generate designs —<br />
                  <span className="font-semibold">it ensures they can be built in the real world.</span>
                </blockquote>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Every completed product strengthens our system — refining how we match 
                  designs to makers, estimate costs, and anticipate production outcomes.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* 3 pillars */}
        <section className="py-16 md:py-24 bg-accent">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border max-w-4xl mx-auto rounded-xl overflow-hidden">
              {[
                {
                  title: "Learns from Every Product Built",
                  desc: "Our system learns from every product manufactured — capturing materials, processes, timelines, and outcomes to understand how things are actually made.",
                },
                {
                  title: "Predicts Before Production",
                  desc: "Before a design is finalized, Nyzora evaluates feasibility — estimating cost ranges, identifying suitable makers, and anticipating production constraints.",
                },
                {
                  title: "Improves with Every Order",
                  desc: "Each completed product strengthens the system — refining maker matching, cost estimation, and production outcomes over time.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-background p-8 md:p-10">
                  <h3 className="text-base font-semibold text-foreground mb-2 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Learning Loop */}
        <section className="py-20 md:py-28">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-4 text-center">The Learning Loop</p>
              <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-12 text-center">
                Every build makes us smarter
              </h2>
            </ScrollReveal>

            <LearningLoopDiagram />
          </div>
        </section>

        {/* Manufacturing Intelligence — NEW SECTION */}
        <section className="py-16 md:py-24 bg-accent">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-6">Our Moat</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-4">
                  Built on Manufacturing Intelligence
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
                  Nyzora connects AI design with real-world manufacturing — matching designs 
                  to the right makers, materials, and processes to ensure every idea can be built.
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
                  Try the AI Design Studio — powered by manufacturing intelligence.
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
