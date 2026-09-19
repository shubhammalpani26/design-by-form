import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, Check } from "lucide-react";
import { getSku } from "@/data/originalsSkus";

const faqs = [
  {
    q: "What is a good pet memorial gift?",
    a: "The most meaningful pet memorial gifts are personal: something made from a photo of the actual animal, with their name and dates. A custom sculpture keeps their likeness — ear shape, muzzle, expression — in a form you can hold, rather than a generic paw print or frame.",
  },
  {
    q: "How is the sculpture made from a photo?",
    a: "You upload one clear photo of your dog or cat. Our AI models their head and shoulders in full three dimensions, keeping their breed, ear shape and markings. Our engineering system then checks the model for wall thickness, stability and print feasibility before it is produced as one solid part in the USA.",
  },
  {
    q: "How long does it take to arrive?",
    a: "Each piece is made to order and shipped free anywhere in the US, ships in 7–8 business days from order. Business days exclude Saturdays, Sundays and US national holidays.",
  },
  {
    q: "Is this an alternative to a pet urn?",
    a: "Many families choose it that way. A sculpted portrait with their name and dates engraved is a dignified keepsake you can keep on a shelf or desk — no ashes required, so it also works as a memorial gift for someone whose pet was buried or cremated elsewhere.",
  },
  {
    q: "What sizes and prices are available?",
    a: "Three sizes: Petite (120 mm, $59), Standard (140 mm, $89) and Statement (196 mm, $139). Every size includes free US shipping and your engraved words on the plinth.",
  },
];

const PetMemorialGifts = () => {
  const sku = getSku("pet-silhouette-keepsake")!;

  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Nyzora Originals", item: "https://nyzora.ai/" },
            { "@type": "ListItem", position: 2, name: "Pet Memorial Gifts", item: "https://nyzora.ai/pet-memorial-gifts" },
          ],
        },
      ],
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "pet-memorial-gifts-schema";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      document.getElementById("pet-memorial-gifts-schema")?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Pet Memorial Gifts — Custom Dog & Cat Memorials from a Photo"
        description="Personalized pet memorial gifts sculpted from your pet's photo, engraved with their name and dates. A keepsake alternative to a pet urn. Made in the USA, free shipping, from $59."
        keywords={[
          "pet memorial gifts",
          "dog memorial gifts",
          "cat memorial gifts",
          "pet loss gifts",
          "pet remembrance gifts",
          "dog memorial",
          "pet urn alternative",
          "personalized pet memorial",
        ]}
        url="https://nyzora.ai/pet-memorial-gifts"
      />
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative py-24 md:py-32 overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-[hsl(var(--primary))]" />
          <div className="container relative z-10">
            <ScrollReveal animation="fade-up">
              <div className="max-w-3xl">
                <p className="text-primary-foreground/40 text-xs font-medium uppercase tracking-[0.3em] mb-6">
                  Pet Memorial Gifts
                </p>
                <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  A memorial that<br />
                  <span className="font-light italic">actually looks like them.</span>
                </h1>
                <p className="text-primary-foreground/60 text-base md:text-lg max-w-2xl leading-relaxed mb-10">
                  Most pet memorial gifts are generic — a paw print, a frame, a stone. Ours is sculpted from a photo of
                  your dog or cat: their face, their ears, their expression, with their name and dates engraved on the
                  plinth. Made to order in the USA, shipped free in 7–8 business days.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to={`/originals/${sku.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-foreground text-primary font-medium hover:opacity-90 transition-opacity"
                  >
                    Create Their Memorial <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Featured piece */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">The Piece</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12 max-w-3xl">
                One photo becomes a sculpture you can hold.
              </h2>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
              <ScrollReveal animation="fade-up">
                <Link to={`/originals/${sku.slug}`} className="block border border-border group">
                  <div className="aspect-square overflow-hidden bg-card">
                    <img
                      src={sku.image}
                      alt={sku.imageAlt ?? "Custom pet memorial sculpture with the pet's name and years on the plinth"}
                      className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-6 flex items-baseline justify-between gap-4">
                    <h3 className="text-lg font-light tracking-tight">{sku.name}</h3>
                    <span className="text-sm tabular-nums text-muted-foreground">from ${sku.price}</span>
                  </div>
                </Link>
              </ScrollReveal>

              <ScrollReveal animation="fade-up" delay={120}>
                <div className="space-y-6">
                  {[
                    "Made from your photo — their breed, ear shape, muzzle and markings modelled in full three dimensions, not a flat cut-out.",
                    "Their name and dates engraved in raised lettering on the plinth — or leave it clean.",
                    "A warm, happy expression: perked ears, lifted cheeks, a gentle smile. A celebration of them, not a sombre object.",
                    "One solid piece in plant-based PLA, with the fine layer lines that are the honest signature of precision 3D printing.",
                    "Checked by our engineering system for strength and print feasibility before it's made.",
                    "Made in the USA. Free shipping, ships in 7–8 business days.",
                  ].map((point) => (
                    <div key={point} className="flex gap-3">
                      <Check className="w-5 h-5 shrink-0 mt-0.5 text-secondary" />
                      <p className="text-muted-foreground leading-relaxed">{point}</p>
                    </div>
                  ))}
                  <Link
                    to={`/originals/${sku.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity mt-4"
                  >
                    Start With a Photo <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* Sizes */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container max-w-4xl">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Sizes & Pricing</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12">
                Three sizes. Free US shipping on every one.
              </h2>
            </ScrollReveal>

            <div className="grid sm:grid-cols-3 gap-px bg-border border border-border">
              {sku.sizes.map((s) => (
                <div key={s.key} className="bg-background p-8 md:p-10">
                  <h3 className="text-xl font-semibold tracking-tight mb-1">{s.label}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{s.size}{s.note ? ` · ${s.note}` : ""}</p>
                  <p className="text-2xl font-light tabular-nums">${s.price}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Gifting */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container max-w-4xl">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Giving It As A Gift</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">
                For someone who just lost them.
              </h2>
              <p className="text-muted-foreground leading-relaxed text-base md:text-lg max-w-3xl">
                A pet loss gift is hard to get right. Flowers wilt, cards get put away, and generic "rainbow bridge"
                gifts can feel hollow. A sculpture of their actual dog or cat — made from a photo you already have,
                or one from their social media — says you understood what they lost. It works as a dog memorial gift,
                a cat memorial gift, or a remembrance for rabbits, horses and birds too. If you're not sure of the
                exact dates, leave the footnote blank and the plinth arrives clean.
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28">
          <div className="container max-w-4xl">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Questions</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12">Pet memorial gift FAQs</h2>
            </ScrollReveal>
            <div className="space-y-px bg-border border border-border">
              {faqs.map((f) => (
                <details key={f.q} className="bg-background p-6 md:p-8 group">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                    <h3 className="text-lg font-medium tracking-tight">{f.q}</h3>
                    <span className="text-muted-foreground group-open:rotate-45 transition-transform text-xl leading-none">+</span>
                  </summary>
                  <p className="text-muted-foreground leading-relaxed mt-4">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default PetMemorialGifts;
