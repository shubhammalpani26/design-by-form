import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, Check } from "lucide-react";

const faqs = [
  {
    q: "What makes Nyzora luxury furniture different from other brands in India?",
    a: "Every Nyzora piece is designed by an independent creator and made-to-order by verified Indian makers. You're not buying a mass-produced catalogue item — you're commissioning a sculptural, one-of-a-kind work in high-grade resin with a 2-year warranty.",
  },
  {
    q: "Do you ship luxury furniture across India?",
    a: "Yes. We ship pan-India from our verified maker network. Lead times are typically 4–8 weeks because every piece is custom-made for you, not pulled off a shelf.",
  },
  {
    q: "Can I order bespoke or fully custom furniture?",
    a: "Absolutely. Use our Design Studio to generate a one-off piece with AI, or get a personal quote for a fully bespoke commission. Both options give you a sculptural piece manufactured to luxury standards.",
  },
  {
    q: "Is the pricing competitive with other luxury furniture brands in India?",
    a: "Because we manufacture on-demand and connect you directly with the maker, our pricing is typically far below traditional luxury showrooms for comparable craftsmanship.",
  },
];

const LuxuryFurnitureIndia = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Luxury Furniture India — Bespoke, Designer-Made, Pan-India Delivery"
        description="Shop luxury furniture in India — bespoke, designer-made pieces from independent creators, manufactured to order by verified Indian makers. Pan-India delivery."
        keywords={[
          "luxury furniture india",
          "bespoke furniture india",
          "designer furniture india",
          "custom made furniture online india",
          "handmade furniture india",
          "made to order furniture",
          "buy designer furniture",
        ]}
        url="https://nyzora.ai/luxury-furniture-india"
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-24 md:py-36 overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[hsl(var(--primary))]" />
          <div className="container relative z-10">
            <ScrollReveal animation="fade-up">
              <div className="max-w-3xl">
                <p className="text-primary-foreground/40 text-xs font-medium uppercase tracking-[0.3em] mb-6">
                  Luxury Furniture · India
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  Luxury Furniture,<br />
                  <span className="font-light italic">Made For You In India</span>
                </h1>
                <p className="text-primary-foreground/60 text-base md:text-lg max-w-2xl leading-relaxed mb-10">
                  Bespoke, designer-led furniture — sculpted by independent Indian creators and manufactured to order by verified makers. No mass production, no warehouse stock. Just one-of-a-kind pieces, delivered across India.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/browse"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-foreground text-primary font-medium hover:opacity-90 transition-opacity"
                  >
                    Browse the Collection <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    to="/design-studio"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                  >
                    Commission a Bespoke Piece
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Why Nyzora */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Why Nyzora</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12 max-w-3xl">
                A new definition of luxury furniture for India.
              </h2>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
              {[
                {
                  title: "Designer-Led",
                  body: "Every piece is the work of an independent creator. You see who designed it, you can read their story, and you support their practice directly.",
                },
                {
                  title: "Made-to-Order in India",
                  body: "Nothing sits in a warehouse. Your piece is manufactured only after you order, by a verified Indian maker using high-grade resin and a 2-year warranty.",
                },
                {
                  title: "Bespoke if You Want It",
                  body: "Use our AI Design Studio to generate a one-off form, or request a fully custom commission. Luxury, on your terms.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-background p-8 md:p-10">
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured pieces */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Featured Pieces</p>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight max-w-2xl">
                    Sculptural luxury, designed in India.
                  </h2>
                </div>
                <Link to="/browse" className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity">
                  View all <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border">
              {[
                { slug: "noir-sculpt-accent-chair", name: "Noir Sculpt Accent Chair", category: "Designer Chair" },
                { slug: "sinuous-flow-console", name: "Sinuous Flow Console", category: "Bespoke Console" },
                { slug: "aura-stone-bench", name: "Aura Stone Bench", category: "Sculptural Bench" },
                { slug: "ondine-wave-lounge", name: "Ondine Wave Lounge", category: "Luxury Lounge" },
                { slug: "obsidian-tear-table", name: "Obsidian Tear Table", category: "Designer Table" },
                { slug: "the-loop-table", name: "The Loop Table", category: "Sculptural Table" },
              ].map((p) => (
                <Link
                  key={p.slug}
                  to={`/product/${p.slug}`}
                  className="bg-background p-6 md:p-8 hover:bg-muted/30 transition-colors group"
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{p.category}</p>
                  <h3 className="text-base md:text-xl font-semibold tracking-tight group-hover:opacity-70 transition-opacity">
                    {p.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-4">
                    View piece <ArrowRight className="w-3 h-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container max-w-4xl">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">How It Works</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12">
                From sketch to your space, in four steps.
              </h2>
            </ScrollReveal>

            <div className="space-y-px bg-border border border-border">
              {[
                "Browse curated luxury pieces from independent Indian creators — or design your own in our AI Design Studio.",
                "Choose your finish, scale, and any bespoke modifications. We confirm pricing and delivery timeline upfront.",
                "Your piece is manufactured to order by a verified Indian maker. We share progress updates throughout.",
                "Delivered pan-India with white-glove handling. Backed by a 2-year warranty on every piece.",
              ].map((step, i) => (
                <div key={i} className="bg-background p-6 md:p-8 flex gap-6 items-start">
                  <span className="text-3xl md:text-4xl font-light text-muted-foreground tabular-nums shrink-0">
                    0{i + 1}
                  </span>
                  <p className="text-base md:text-lg leading-relaxed pt-1">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Nyzora Verified Standards</p>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                    Luxury without compromise.
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Every maker on Nyzora is vetted for craftsmanship. Every piece is inspected before dispatch. Every order is backed by a 2-year warranty and pan-India support.
                  </p>
                </div>
                <ul className="space-y-4">
                  {[
                    "Verified Indian makers, vetted for craftsmanship",
                    "High-grade resin construction, premium finishes",
                    "2-year warranty on every piece",
                    "Made-to-order — no warehouse stock, no compromises",
                    "Direct attribution to the creator who designed it",
                    "Pan-India white-glove delivery",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 items-start">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28">
          <div className="container max-w-3xl">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Frequently Asked</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12">
                Luxury furniture in India — answered.
              </h2>
            </ScrollReveal>

            <div className="space-y-px bg-border border border-border">
              {faqs.map((f) => (
                <div key={f.q} className="bg-background p-6 md:p-8">
                  <h3 className="text-lg md:text-xl font-semibold tracking-tight mb-3">{f.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/browse"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Explore the Collection <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqs.map((f) => ({
                "@type": "Question",
                name: f.q,
                acceptedAnswer: { "@type": "Answer", text: f.a },
              })),
            }),
          }}
        />
      </main>

      <Footer />
    </div>
  );
};

export default LuxuryFurnitureIndia;