import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="About Nyzora — AI-Powered Custom Manufacturing Platform"
        description="Nyzora connects creators with verified manufacturers using deep AI that learns how things are made. Design anything, we make it real."
        keywords="about Nyzora, AI manufacturing platform, custom furniture, creator platform, verified makers, deep tech startup"
        url="https://nyzora.ai/about"
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
                  About Nyzora
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  Where Ideas<br />
                  <span className="font-light italic">Become Objects</span>
                </h1>
                <p className="text-primary-foreground/50 text-base md:text-lg max-w-lg leading-relaxed">
                  A new era of creation — where the tools of design and the engines of manufacturing finally speak the same language.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Mission — Manifesto style */}
        <section className="py-20 md:py-28">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-6">Our Mission</p>
                <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground leading-snug tracking-tight mb-8">
                  Bridge the gap between<br />
                  <span className="font-semibold">a digital idea</span> and<br />
                  <span className="font-semibold">a physical object.</span>
                </blockquote>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  We democratize design by combining AI-powered tools with on-demand manufacturing — enabling creators worldwide to bring their visions to life.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Values — Editorial grid */}
        <section className="py-16 md:py-24 bg-accent">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-10 text-center">What We Stand For</p>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border max-w-4xl mx-auto rounded-xl overflow-hidden">
              {[
                {
                  title: "Sustainability",
                  desc: "On-demand manufacturing eliminates waste. Every piece is made only when ordered, using responsibly sourced materials."
                },
                {
                  title: "Creator-Centric",
                  desc: "Creators earn 70% of their markup from every sale, forever. Ongoing recognition for ongoing value."
                },
                {
                  title: "AI-Augmented",
                  desc: "Technology enhances human creativity, making design accessible while preserving artistic vision."
                },
              ].map((value) => (
                <div key={value.title} className="bg-background p-8 md:p-10">
                  <h3 className="text-lg font-semibold text-foreground mb-3 tracking-tight">{value.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deep Tech */}
        <section className="py-20 md:py-28">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <ScrollReveal animation="fade-up">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-6">Deep Tech</p>
                <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
                  <p>
                    Nyzora is not just a marketplace — it's a deep tech platform. Our AI doesn't stop at generating 
                    beautiful designs. It learns how our makers work — their materials, techniques, tolerances, 
                    and craftsmanship nuances.
                  </p>
                  <p>
                    With every production cycle, our models get smarter — building a systematic understanding 
                    of how manufacturing actually happens, from raw material to finished product.
                  </p>
                  <p className="text-foreground font-medium text-lg leading-snug tracking-tight">
                    The result: AI that can predict what can be manufactured, by whom, at what cost — 
                    before production ever begins.
                  </p>
                </div>
                <Link
                  to="/technology"
                  className="inline-flex items-center gap-2 mt-6 text-xs text-muted-foreground/50 hover:text-primary transition-colors uppercase tracking-[0.2em]"
                >
                  Learn more about our technology <ArrowRight className="h-3 w-3" />
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="py-20 md:py-28 border-t border-border">
          <div className="container">
            <div className="max-w-2xl mx-auto">
              <ScrollReveal animation="fade-up">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-6">The Story</p>
                <div className="space-y-6 text-base text-muted-foreground leading-relaxed">
                  <p>
                    The gap was clear: talented creators had beautiful concepts that never made it 
                    to production. Manufacturing minimums, upfront capital, complex logistics — the 
                    barriers were too high.
                  </p>
                  <p>
                    Meanwhile, consumers chose between mass-produced furniture that lacked character 
                    or custom pieces they couldn't afford.
                  </p>
                  <p className="text-foreground font-medium text-lg leading-snug tracking-tight">
                    We built Nyzora to close that gap. AI-powered design tools meet on-demand 
                    manufacturing — so anyone can create and earn from their designs.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 md:py-24 bg-accent">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-6">The Team</p>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight mb-6">
                  Built by creators, for creators.
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Our team combines expertise in furniture design, sustainable manufacturing, 
                  AI technology, and marketplace economics.
                </p>
                <a 
                  href="https://nyzora.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground/50 hover:text-primary transition-colors uppercase tracking-[0.2em]"
                >
                  nyzora.ai
                </a>
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
                  Join the Movement
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Whether you're a creator or a shopper — be part of what's next.
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
                  to="/browse"
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground text-sm font-medium rounded-full hover:bg-accent transition-colors"
                >
                  Browse Designs
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

export default About;
