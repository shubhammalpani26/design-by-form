import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const steps = [
  {
    number: "01",
    title: "Create with AI",
    subtitle: "Describe or sketch your idea",
    desc: "Use our AI Design Studio to transform ideas into manufacturable designs. Simply describe your vision, upload a sketch, or both. No CAD experience required. Get 3–5 design variations in ~30 seconds.",
  },
  {
    number: "02",
    title: "We Optimize",
    subtitle: "AI ensures manufacturability",
    desc: "Our AI generates multiple variations optimized for real-world production — ensuring structural integrity, material efficiency, and manufacturing feasibility while preserving your creative intent.",
  },
  {
    number: "03",
    title: "Review & Validate",
    subtitle: "Quality before listing",
    desc: "Our team reviews every design for manufacturability and sustainability standards. We work with you to refine any technical aspects — 94% approval rate within 1–3 business days.",
  },
  {
    number: "04",
    title: "List & Sell",
    subtitle: "Zero inventory, zero risk",
    desc: "Your design goes live on Nyzora. We handle product presentation, customer service, and logistics. You focus on creating. No listing fees, no inventory costs — just earnings.",
  },
  {
    number: "05",
    title: "Earn Forever",
    subtitle: "Perpetual royalties, monthly payouts",
    desc: "Earn 70% of your markup on every sale. Payments are automatic, monthly, and continue as long as your design is available. One design can generate income indefinitely.",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="How It Works — AI-Powered Design to Manufacturing | Nyzora"
        description="From idea to income in 5 steps. Create with AI, we optimize for manufacturing, review, list, and earn perpetual royalties. Zero inventory, zero risk."
        keywords="how AI design works, AI product creation, design to manufacturing, creator royalties, AI furniture platform, custom product manufacturing"
        url="https://nyzora.ai/how-it-works"
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
                  The Process
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  From Idea<br />
                  <span className="font-light italic">to Income</span>
                </h1>
                <p className="text-primary-foreground/50 text-base md:text-lg max-w-lg leading-relaxed">
                  Five steps from concept to earning. We handle manufacturing, logistics, and delivery.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Steps — Editorial list */}
        <section className="py-0">
          {steps.map((step) => (
            <div key={step.number} className="border-b border-border last:border-b-0">
              <div className="container">
                <div className="py-12 md:py-20 flex flex-col md:flex-row gap-6 md:gap-16">
                  {/* Number */}
                  <div className="shrink-0">
                    <span className="text-6xl md:text-7xl font-light text-muted-foreground/15 tabular-nums tracking-tight">
                      {step.number}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 max-w-xl">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 mb-2">{step.subtitle}</p>
                    <h2 className="text-xl md:text-2xl font-semibold text-foreground tracking-tight mb-4">
                      {step.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Deep Tech callout */}
        <section className="py-20 md:py-28 bg-accent">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-6">Powered by Deep AI</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-4">
                  AI that learns how things are made.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto mb-6">
                  Our AI doesn't just generate designs — it systematically learns from our maker network. 
                  Every production cycle deepens its understanding of materials, processes, and constraints, 
                  enabling it to predict what can be manufactured before production begins.
                </p>
                <Link
                  to="/technology"
                  className="inline-flex items-center gap-2 text-xs text-muted-foreground/50 hover:text-primary transition-colors uppercase tracking-[0.2em]"
                >
                  Explore our technology <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Stats strip */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid grid-cols-3 gap-px bg-border rounded-xl overflow-hidden max-w-2xl mx-auto">
              {[
                { number: "0", label: "Listing Fee" },
                { number: "70%", label: "Creator Royalty" },
                { number: "∞", label: "Earning Period" },
              ].map((stat) => (
                <div key={stat.label} className="bg-background p-8 md:p-10 text-center">
                  <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
                    {stat.number}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 border-t border-border">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                  Ready to Start?
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Join hundreds of creators already earning on Nyzora.
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
                  to="/designer-signup"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground text-sm font-medium rounded-full hover:bg-accent transition-colors"
                >
                  Join as Creator
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

export default HowItWorks;
