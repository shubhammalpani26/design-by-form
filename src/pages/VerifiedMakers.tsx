import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { SEOHead } from "@/components/SEOHead";
import { makers } from "@/data/makers";
import { Link } from "react-router-dom";
import { MakerApplicationForm } from "@/components/MakerApplicationForm";
import { Button } from "@/components/ui/button";

// Craft categories where new maker partners are joining the Nyzora network.
// Shown as crafts (not identities) — we celebrate the disciplines, not anonymize the people.
const upcomingCrafts = [
  "Hand-cast Brass & Metal",
  "Solid Wood Joinery",
  "Powder-Coated Steel",
  "Upholstery & Foam",
  "Marble & Stone",
  "Ceramic & Stoneware",
  "Rattan & Cane Weaving",
  "Glass Blowing",
  "Terracotta & Clay",
  "Cork & Sustainable Goods",
  "Teak & Outdoor Furniture",
  "Hand-knotted Textiles",
];

const VerifiedMakers = () => {
  const { hash } = useLocation();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (hash) {
      const id = hash.replace("#", "");
      if (id === "apply") setShowForm(true);
      // Defer until after layout/paint so the anchor section exists.
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [hash]);

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
                    Coming Soon
                  </p>
                  <h2 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight leading-tight mb-4">
                    New crafts joining the <span className="font-light italic">Nyzora network</span>
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    We're carefully curating new maker partners across a wide range of crafts and disciplines — expanding what you can design, build, and bring home through Nyzora.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em]">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                  Onboarding now
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {upcomingCrafts.map((craft) => (
                  <span
                    key={craft}
                    className="px-4 py-2 rounded-full border border-border text-xs font-medium text-foreground/80 bg-background hover:border-primary/30 transition-colors"
                  >
                    {craft}
                  </span>
                ))}
              </div>

              <p className="text-xs text-muted-foreground/60 text-center mt-10 max-w-xl mx-auto leading-relaxed">
                We work closely with every maker we partner with — taking the time to understand their craft, materials, and process before welcoming them to Nyzora.
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
              { number: "12+", label: "Crafts Joining Soon" },
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

        {/* Apply as a Maker */}
        <section id="apply" className="py-20 md:py-28 border-t border-border bg-accent/30 scroll-mt-24">
          <div className="container">
            <ScrollReveal animation="fade-up">
              {!showForm ? (
                <div className="max-w-3xl mx-auto text-center">
                  <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-5">
                    Apply as a Maker
                  </p>
                  <h2 className="text-3xl md:text-5xl font-semibold text-foreground tracking-tight leading-[1.05] mb-5">
                    Join the <span className="font-light italic">Nyzora network</span>
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto mb-10">
                    Tell us about your craft, your workshop, and the work you're proud of. We partner with a small, growing circle of makers.
                  </p>
                  <Button
                    size="lg"
                    className="rounded-full px-8 h-12"
                    onClick={() => setShowForm(true)}
                  >
                    Apply as a Maker
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 mt-10 text-[11px] text-muted-foreground/70 uppercase tracking-[0.18em]">
                    {[
                      "Reviewed personally",
                      "Reply within days",
                      "Curated, not open listing",
                    ].map((item) => (
                      <span key={item} className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary/70" strokeWidth={1.5} />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto">
                  <div className="text-center mb-8 md:mb-10">
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.3em] mb-3">
                      Maker Application
                    </p>
                    <h2 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                      Tell us about your <span className="font-light italic">craft</span>
                    </h2>
                  </div>
                  <MakerApplicationForm />
                </div>
              )}
            </ScrollReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VerifiedMakers;
