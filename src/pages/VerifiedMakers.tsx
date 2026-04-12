import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Shield, CheckCircle2, Award } from "lucide-react";
import { ScrollReveal, StaggerReveal } from "@/hooks/useScrollReveal";
import { SEOHead } from "@/components/SEOHead";
import { makers, Maker } from "@/data/makers";
import { Link } from "react-router-dom";

const VerifiedMakers = () => {
  const [selectedMaker, setSelectedMaker] = useState<Maker | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Verified Makers | Nyzora"
        description="Every product on Nyzora is crafted by carefully selected and verified manufacturers known for quality craftsmanship and reliability."
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-accent py-16 md:py-24">
          <div className="container text-center">
            <ScrollReveal animation="fade-up">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Shield className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">Verified & Vetted</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Crafted by <span className="gradient-text-animated">Verified Makers</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Every product on Nyzora is brought to life by carefully selected and verified manufacturers known for quality craftsmanship and reliability.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-10 border-b border-border">
          <div className="container">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>Quality Assured</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-5 w-5 text-primary" />
                <span>Verified by Nyzora</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="h-5 w-5 text-primary" />
                <span>Expert Craftsmen</span>
              </div>
            </div>
          </div>
        </section>

        {/* Makers Grid */}
        <section className="py-12 md:py-20">
          <div className="container">
            <StaggerReveal
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto"
              staggerDelay={120}
              animation="fade-up"
            >
              {makers.map((maker) => (
                <Link key={maker.id} to={`/maker/${maker.slug}`} className="group block">
                  <Card className="border-border hover:border-primary/30 hover:shadow-medium transition-all duration-300 overflow-hidden h-full">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {maker.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{maker.location}</p>
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold shrink-0">
                          <Shield className="h-3 w-3" />
                          Verified
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {maker.shortDescription}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">{maker.yearsActive} years</span>
                        <span>·</span>
                        <span>{maker.specialties.join(", ")}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {maker.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] font-medium">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <p className="text-xs text-primary font-medium group-hover:underline">
                        View maker profile →
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </StaggerReveal>
          </div>
        </section>

        {/* Why Nyzora */}
        <section className="py-12 md:py-20 bg-muted/50">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Why <span className="gradient-text-animated">Nyzora</span>?
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">Designed. Built. Delivered.</p>
              </div>
            </ScrollReveal>

            <StaggerReveal
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto"
              staggerDelay={100}
              animation="fade-up"
            >
              {[
                { icon: "✨", title: "AI-Powered Design", desc: "Create custom products with intelligent design tools" },
                { icon: "🛡️", title: "Verified Makers", desc: "Expert manufacturers vetted for quality and reliability" },
                { icon: "📦", title: "End-to-End", desc: "From design to delivery — we manage everything" },
                { icon: "🎯", title: "Quality Assured", desc: "Every piece inspected before it reaches your space" },
              ].map((item) => (
                <div key={item.title} className="text-center space-y-3 p-6 rounded-2xl bg-background border border-border/50 hover:border-primary/20 transition-colors">
                  <div className="text-3xl">{item.icon}</div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </StaggerReveal>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default VerifiedMakers;
