import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRight } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { SEOHead } from "@/components/SEOHead";
import { makers } from "@/data/makers";
import { Link } from "react-router-dom";

// Makers currently progressing through Nyzora's verification pipeline.
// Shown anonymized to convey momentum without exposing partner identities pre-verification.
const pipelineMakers = [
  { region: "Jaipur, India", craft: "Hand-cast Brass & Metal", stage: "Sample Review" },
  { region: "Jodhpur, India", craft: "Solid Wood Joinery", stage: "Material Audit" },
  { region: "Bengaluru, India", craft: "Powder-Coated Steel", stage: "Finish Testing" },
  { region: "Pune, India", craft: "Upholstery & Foam", stage: "Sample Review" },
  { region: "Delhi NCR, India", craft: "Marble & Stone", stage: "Facility Visit" },
  { region: "Ahmedabad, India", craft: "Ceramic & Stoneware", stage: "Sample Review" },
  { region: "Coimbatore, India", craft: "Rattan & Cane Weaving", stage: "Onboarding" },
  { region: "Chennai, India", craft: "Glass Blowing", stage: "Material Audit" },
  { region: "Kolkata, India", craft: "Terracotta & Clay", stage: "Sample Review" },
  { region: "Lisbon, Portugal", craft: "Cork & Sustainable Goods", stage: "Onboarding" },
  { region: "Bali, Indonesia", craft: "Teak & Outdoor Furniture", stage: "Facility Visit" },
  { region: "Istanbul, Turkey", craft: "Hand-knotted Textiles", stage: "Material Audit" },
];

const VerifiedMakers = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Verified Makers | Nyzora"
        description="Every product on Nyzora is crafted by carefully selected and verified manufacturers known for quality craftsmanship and reliability."
      />
      <Header />

      <main className="flex-1">
        {/* Hero — Editorial, typographic-led */}
        <section className="relative py-24 md:py-36 overflow-hidden">
          <div className="absolute inset-0 bg-[hsl(var(--primary))]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <div className="container relative z-10">
            <ScrollReveal animation="fade-up">
              <div className="max-w-3xl">
                <p className="text-primary-foreground/50 text-xs font-medium uppercase tracking-[0.3em] mb-6">
                  The Makers Behind Every Piece
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  Verified<br />
                  <span className="font-light italic">Makers</span>
                </h1>
                <p className="text-primary-foreground/60 text-base md:text-lg max-w-lg leading-relaxed">
                  Every Nyzora product is brought to life by carefully vetted artisans and fabricators — selected for craft, consistency, and care.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Makers — Premium grid cards */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {makers.map((maker, index) => (
                <Link
                  key={maker.id}
                  to={`/maker/${maker.slug}`}
                  className="group relative"
                >
                  <div className="relative border border-border rounded-2xl p-8 md:p-10 hover:border-primary/30 transition-all duration-500 hover:shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.15)] bg-background h-full flex flex-col">
                    {/* Index + Verified */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="text-4xl font-extralight text-muted-foreground/15 tabular-nums tracking-tight leading-none">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/8 text-primary text-[9px] font-semibold uppercase tracking-[0.15em]">
                        Verified
                      </span>
                    </div>

                    {/* Name & Location */}
                    <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300 mb-1">
                      {maker.name}
                    </h2>
                    <p className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] mb-4">
                      {maker.location}
                    </p>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground/70 leading-relaxed mb-6 flex-1">
                      {maker.shortDescription}
                    </p>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {maker.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-2.5 py-1 rounded-full border border-border/60 text-[10px] font-medium text-muted-foreground/60"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-border/40">
                      <span className="text-[11px] text-muted-foreground/40">
                        {maker.yearsActive}+ years of craft
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* In the Pipeline — momentum signal */}
        <section className="py-16 md:py-24 border-t border-border">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                <div className="max-w-xl">
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-4">
                    In the Pipeline
                  </p>
                  <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight leading-tight mb-4">
                    40+ makers currently in <span className="font-light italic">verification</span>
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    Across India and select global regions, dozens of fabricators are progressing through our multi-stage vetting — material audits, sample reviews, facility visits, and finish testing — before they ever touch a Nyzora order.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Active vetting
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden">
                {pipelineMakers.map((m, i) => (
                  <div key={i} className="bg-background p-6 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {m.craft}
                      </p>
                      <p className="text-[11px] text-muted-foreground/60 uppercase tracking-[0.15em] mt-1">
                        {m.region}
                      </p>
                    </div>
                    <span className="shrink-0 px-2.5 py-1 rounded-full border border-border text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
                      {m.stage}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground/50 text-center mt-8 italic">
                Identities withheld until verification is complete. Most applicants do not pass.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Philosophy strip */}
        <section className="py-20 md:py-28 bg-accent">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="max-w-2xl mx-auto text-center">
                <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-6">
                  Our Standard
                </p>
                <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground leading-snug tracking-tight mb-8">
                  We don't list makers.<br />
                  <span className="font-semibold">We select them.</span>
                </blockquote>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                  Each maker goes through a rigorous verification — from material sourcing to finish quality. Only those who meet our standards make it to the platform.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Value grid */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden">
              {[
                { number: "50+", label: "Years Combined Experience" },
                { number: "40+", label: "Makers In Vetting Pipeline" },
                { number: "✓", label: "Nyzora Verified Standards" },
              ].map((stat) => (
                <div key={stat.label} className="bg-background p-8 md:p-10 text-center">
                  <p className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-2">
                    {stat.number}
                  </p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
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
                  Designed. Built. Delivered.
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Start designing — we handle the rest.
                </p>
              </div>
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-medium rounded-full hover:opacity-90 transition-opacity"
              >
                Browse Products
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VerifiedMakers;
