import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Shield, CheckCircle2, Award } from "lucide-react";
import { ScrollReveal, StaggerReveal } from "@/hooks/useScrollReveal";
import { SEOHead } from "@/components/SEOHead";

interface Maker {
  id: string;
  name: string;
  location: string;
  description: string;
  expertise: string;
  tags: string[];
  yearsActive: string;
  specialties: string[];
}

const makers: Maker[] = [
  {
    id: "1",
    name: "TeakWorks Studio",
    location: "Jodhpur",
    description: "15+ years in solid wood craftsmanship, specializing in hand-finished premium furniture.",
    expertise: "Known for intricate joinery techniques and sustainable sourcing of premium hardwoods. Every piece undergoes a 12-step finishing process for lasting beauty.",
    tags: ["Verified by Nyzora", "Solid Wood Specialist"],
    yearsActive: "15+",
    specialties: ["Dining Tables", "Benches", "Consoles"],
  },
  {
    id: "2",
    name: "FormCraft Industries",
    location: "Pune",
    description: "Expert metal fabricators creating sculptural furniture with industrial precision and artistic flair.",
    expertise: "Combining CNC precision with artisan welding to produce furniture that blurs the line between art and function. Specialists in powder-coated and brushed metal finishes.",
    tags: ["Verified by Nyzora", "Metal Fabrication"],
    yearsActive: "12+",
    specialties: ["Coffee Tables", "Installations", "Shelving"],
  },
  {
    id: "3",
    name: "Artisan Resin Co.",
    location: "Bengaluru",
    description: "Pioneers in composite and resin-based furniture, blending modern materials with timeless design.",
    expertise: "Innovators in high-grade resin and composite fibre construction. Each piece is cast, cured, and hand-finished to achieve museum-quality surfaces.",
    tags: ["Verified by Nyzora", "Composite & Resin"],
    yearsActive: "8+",
    specialties: ["Vases", "Decor", "Statement Pieces"],
  },
  {
    id: "4",
    name: "Heritage Upholstery Works",
    location: "Jaipur",
    description: "Third-generation upholstery craftsmen delivering world-class comfort with artisanal precision.",
    expertise: "From hand-tied springs to precision-cut foam and premium fabric selection, every seat is built for decades of comfort and elegance.",
    tags: ["Verified by Nyzora", "Upholstery"],
    yearsActive: "20+",
    specialties: ["Chairs", "Lounge Seating", "Cushioned Benches"],
  },
];

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
                <Card
                  key={maker.id}
                  className="group border-border hover:border-primary/30 hover:shadow-medium transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => setSelectedMaker(maker)}
                >
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
                      {maker.description}
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
                      Learn about this maker →
                    </p>
                  </CardContent>
                </Card>
              ))}
            </StaggerReveal>
          </div>
        </section>

        {/* Why Nyzora Value Section */}
        <section className="py-12 md:py-20 bg-muted/50">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                  Why <span className="gradient-text-animated">Nyzora</span>?
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  Designed. Built. Delivered.
                </p>
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

      {/* Maker Detail Modal */}
      <Dialog open={!!selectedMaker} onOpenChange={() => setSelectedMaker(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMaker?.name}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                <Shield className="h-3 w-3" />
                Verified
              </span>
            </DialogTitle>
          </DialogHeader>
          {selectedMaker && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedMaker.location} · {selectedMaker.yearsActive} years of expertise</p>
              <p className="text-sm text-foreground leading-relaxed">{selectedMaker.expertise}</p>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMaker.specialties.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedMaker.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70 pt-2 border-t border-border">
                Custom-made for your space. Built by real manufacturers.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default VerifiedMakers;
