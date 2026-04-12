import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { ScrollReveal, StaggerReveal } from "@/hooks/useScrollReveal";
import { SEOHead } from "@/components/SEOHead";
import { makers, Maker } from "@/data/makers";
import { Link } from "react-router-dom";

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

        {/* Makers — Full-width editorial list */}
        <section className="py-0">
          {makers.map((maker, index) => (
            <Link
              key={maker.id}
              to={`/maker/${maker.slug}`}
              className="group block border-b border-border last:border-b-0"
            >
              <div className="container">
                <div className="py-10 md:py-16 flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
                  {/* Index number */}
                  <div className="hidden md:block">
                    <span className="text-6xl font-light text-muted-foreground/20 tabular-nums tracking-tight">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl md:text-2xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {maker.name}
                      </h2>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/8 text-primary text-[10px] font-semibold uppercase tracking-wider">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground/60 uppercase tracking-[0.15em] mb-3">
                      {maker.location}
                    </p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                      {maker.shortDescription}
                    </p>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                    <div className="flex flex-wrap gap-1.5 md:justify-end">
                      {maker.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="px-2.5 py-1 rounded-full border border-border text-[10px] font-medium text-muted-foreground"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground/50">
                      {maker.yearsActive}+ years of craft
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center">
                    <ArrowRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
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

        {/* Value grid — minimal */}
        <section className="py-16 md:py-24">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-2xl overflow-hidden">
              {[
                { number: "50+", label: "Years Combined Experience" },
                { number: "5", label: "Verified Fabricators" },
                { number: "100%", label: "Quality Inspected" },
                { number: "0", label: "Middlemen" },
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
