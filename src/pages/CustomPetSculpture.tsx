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
    q: "How do I get a custom sculpture of my pet?",
    a: "Upload one clear photo of your dog or cat on the product page. Our AI sculpts their head and shoulders in full 3D, you pick a size and colour, add their name if you like, and we make and ship it to you.",
  },
  {
    q: "Will it actually look like my pet?",
    a: "Yes — the model keeps your pet's breed, ear shape, muzzle length and markings as sculpted form. You see the finished render before you order, and you can adjust one thing if it isn't right.",
  },
  {
    q: "What pets can you sculpt?",
    a: "Dogs and cats of any breed, plus rabbits, horses and birds. Long snouts, short snouts, pointed or floppy ears — the sculpt follows the photo you upload.",
  },
  {
    q: "What is it made of?",
    a: "Plant-based PLA, 3D-printed as one solid part in the USA. The surface is a single satin colour with fine, even layer lines — the honest signature of precision 3D printing — and every piece is checked for strength before production.",
  },
  {
    q: "How much does a custom pet sculpture cost?",
    a: "From $59 for the Petite (120 mm), $89 for the Standard (140 mm) and $139 for the Statement (196 mm). Every price includes free US shipping, ships in 7–8 business days.",
  },
];

const CustomPetSculpture = () => {
  const memorial = getSku("pet-silhouette-keepsake")!;
  const portrait = getSku("pet-portrait-sculpture")!;

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
            { "@type": "ListItem", position: 2, name: "Custom Pet Sculpture", item: "https://nyzora.ai/custom-pet-sculpture" },
          ],
        },
      ],
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "custom-pet-sculpture-schema";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => {
      document.getElementById("custom-pet-sculpture-schema")?.remove();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="Custom Pet Sculpture from a Photo — 3D Dog & Cat Statues"
        description="A custom pet sculpture made from your photo: your dog or cat sculpted in 3D, engraved with their name. Made in the USA, free shipping, from $59."
        keywords={[
          "custom pet sculpture",
          "custom pet statue",
          "custom dog statue",
          "custom cat statue",
          "3d pet figurine",
          "pet sculpture from photo",
          "personalized pet statue",
          "custom pet figurine",
        ]}
        url="https://nyzora.ai/custom-pet-sculpture"
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
                  Custom Pet Sculpture
                </p>
                <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  Your pet, sculpted.<br />
                  <span className="font-light italic">From a single photo.</span>
                </h1>
                <p className="text-primary-foreground/60 text-base md:text-lg max-w-2xl leading-relaxed mb-10">
                  Upload one photo and our AI sculpts your dog or cat's head and shoulders in full three dimensions —
                  breed, ears, muzzle, markings — set on a weighted plinth engraved with their name. Made to order in
                  the USA, shipped free in 7–8 business days, from $59.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to={`/originals/${portrait.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-foreground text-primary font-medium hover:opacity-90 transition-opacity"
                  >
                    Sculpt My Pet <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container max-w-4xl">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">How It Works</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12">
                Photo to sculpture in three steps.
              </h2>
            </ScrollReveal>
            <div className="space-y-px bg-border border border-border">
              {[
                { n: "01", t: "Upload a photo", d: "One clear, well-lit photo of their face. Front or three-quarter view works best — any dog, cat, rabbit, horse or bird." },
                { n: "02", t: "See your sculpture", d: "Our AI sculpts their likeness in 3D and shows you the exact piece before you pay. Adjust one thing if it isn't right." },
                { n: "03", t: "We make and ship it", d: "Your sculpture is checked for strength and printability, produced as one solid piece in the USA and shipped free in 7–8 business days." },
              ].map((s) => (
                <div key={s.n} className="bg-background p-8 md:p-10 flex gap-6">
                  <span className="text-sm tabular-nums text-muted-foreground shrink-0 pt-1">{s.n}</span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight mb-2">{s.t}</h3>
                    <p className="text-muted-foreground leading-relaxed">{s.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Two pieces */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">The Pieces</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12 max-w-3xl">
                For the one beside you — or the one you miss.
              </h2>
            </ScrollReveal>

            <div className="grid sm:grid-cols-2 gap-6">
              {[
                { sku: portrait, blurb: "A custom portrait of the one still curled up next to you — for a birthday, a gotcha day, or no reason at all." },
                { sku: memorial, blurb: "A memorial sculpture for the one you've lost, with their name and dates engraved on the plinth." },
              ].map(({ sku, blurb }) => (
                <ScrollReveal key={sku.slug} animation="fade-up">
                  <Link to={`/originals/${sku.slug}`} className="block border border-border group h-full">
                    <div className="aspect-square overflow-hidden bg-card">
                      <img
                        src={sku.image}
                         alt={sku.imageAlt ?? `${sku.name} — custom pet sculpture made from a photo`}
                        className="w-full h-full object-contain group-hover:scale-[1.02] transition-transform duration-500"
                        loading="lazy"
                      />
                    </div>
                    <div className="p-6">
                      <div className="flex items-baseline justify-between gap-4 mb-2">
                        <h3 className="text-lg font-light tracking-tight">{sku.name}</h3>
                        <span className="text-sm tabular-nums text-muted-foreground">from ${sku.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{blurb}</p>
                    </div>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Why */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container max-w-4xl">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Why Nyzora</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12">
                Not a figurine from a catalogue. Their face.
              </h2>
            </ScrollReveal>
            <div className="space-y-6">
              {[
                "Sculpted in the round — cheeks, muzzle, brow and ears shaped all the way around, not a flat cut-out or relief panel.",
                "Sculpted eyes with defined lids and a raised iris dome, so they read as eyes in any light — no paint, no glued-in parts.",
                "A warm, happy expression as the default: perked ears, lifted cheeks, a gentle smile.",
                "Engineering-checked for wall thickness, stability and print feasibility before anything is made.",
                "Plant-based PLA in six curated colours, printed as one solid part in the USA.",
                "Free US shipping on every size, ships in 7–8 business days.",
              ].map((point) => (
                <div key={point} className="flex gap-3">
                  <Check className="w-5 h-5 shrink-0 mt-0.5 text-secondary" />
                  <p className="text-muted-foreground leading-relaxed">{point}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 md:py-28">
          <div className="container max-w-4xl">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Questions</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12">Custom pet sculpture FAQs</h2>
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

export default CustomPetSculpture;
