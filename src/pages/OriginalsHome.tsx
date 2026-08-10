import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { JsonLd } from "@/components/JsonLd";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, Wand2 } from "lucide-react";
import { ORIGINALS_SKUS } from "@/data/originalsSkus";
import heroImg from "@/assets/originals-hero.jpg";

const STEPS = [
  { n: "01", t: "Pick a piece", d: "Three Originals, each designed to be personal without being kitsch." },
  { n: "02", t: "Make it yours", d: "Add a name, a date, a place — or describe a change and our AI redraws the piece." },
  { n: "03", t: "Made in the USA", d: "Printed to order in our US network and shipped in 3–5 business days." },
];

const FAQS = [
  { q: "How long does it take?", a: "Every Original is made to order. Production takes 1–2 business days and delivery is 3–5 business days anywhere in the US." },
  { q: "What is it made of?", a: "A dense matte composite with a stone-like hand feel. Solid through, not hollow-feeling — each piece is engineered as a single part." },
  { q: "How large are the pieces?", a: "Each Original is produced as one part inside a 220 × 220 × 220 mm envelope, so it reads as a substantial object on a shelf without becoming furniture." },
  { q: "Can I change the design?", a: "Yes. Every Original can be remixed — describe what you want in plain language and the piece is redrawn before it is made." },
];

const OriginalsHome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Nyzora Originals — Personalized Pieces, Made in the USA"
        description="Sculptural personalized pieces: pet silhouettes, baby name blocks and wedding coordinates. Made to order in the USA and shipped in 3–5 days."
        keywords={["personalized gift", "pet silhouette gift", "baby name sign", "wedding coordinates gift", "made in usa"]}
      />
      <JsonLd
        id="originals-collection"
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Nyzora Originals",
          itemListElement: ORIGINALS_SKUS.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: s.name,
            url: `https://nyzora.ai/originals/${s.slug}`,
          })),
        }}
      />
      <Header />

      {/* Hero */}
      <section className="relative border-b border-border">
        <div className="absolute inset-0">
          <img
            src={heroImg}
            alt="Three matte sculptural personal pieces on a minimalist shelf"
            className="h-full w-full object-cover"
            width={1920}
            height={1088}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/20" />
        </div>
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-6">
              Nyzora Originals · Made in the USA
            </p>
            <h1 className="text-4xl md:text-6xl font-light leading-[1.05] tracking-tight text-foreground">
              Keepsakes for the things
              <br />
              you don't want to forget.
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-lg">
              Sculptural objects made one at a time — your pet's profile, your child's name,
              the coordinates of the day. Designed with AI, printed in the USA, shipped in 3–5 days.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="rounded-none" asChild>
                <a href="#collection">
                  Shop the collection <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" className="rounded-none" onClick={() => navigate("/studio")}>
                <Wand2 className="mr-2 h-4 w-4" /> Design something new
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {["Made in the USA", "Ships in 3–5 days", "One-of-one, no minimums", "2-year warranty"].map((t) => (
            <div key={t} className="py-5 px-4 text-center text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
              {t}
            </div>
          ))}
        </div>
      </section>

      {/* Collection */}
      <section id="collection" className="container mx-auto px-4 py-16 md:py-24">
        <ScrollReveal>
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-3">The Collection</p>
              <h2 className="text-3xl md:text-4xl font-light tracking-tight">Three Originals</h2>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-border">
          {ORIGINALS_SKUS.map((sku) => (
            <Link
              key={sku.slug}
              to={`/originals/${sku.slug}`}
              className="group border-r border-b border-border p-4 md:p-6 hover:bg-muted/40 transition-colors"
            >
              <div className="aspect-[4/5] overflow-hidden bg-muted/30 mb-5">
                <img
                  src={sku.image}
                  alt={`${sku.name} — personalized keepsake made in the USA`}
                  loading="lazy"
                  width={1024}
                  height={1280}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-lg font-light tracking-tight">{sku.name}</h3>
                <span className="text-sm tabular-nums text-muted-foreground">${sku.price}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{sku.tagline}</p>
              <span className="mt-5 inline-flex items-center text-[11px] tracking-[0.2em] uppercase">
                Customize <ArrowRight className="ml-2 h-3 w-3 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-border bg-muted/20">
        <div className="container mx-auto px-4 py-16 md:py-20 grid grid-cols-1 md:grid-cols-3 gap-10">
          {STEPS.map((s) => (
            <div key={s.n}>
              <span className="text-[11px] tracking-[0.3em] text-muted-foreground">{s.n}</span>
              <h3 className="mt-4 text-xl font-light tracking-tight">{s.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Remix band */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="border border-border p-8 md:p-14 text-center">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-4">Prompt to product</p>
          <h2 className="text-2xl md:text-4xl font-light tracking-tight max-w-2xl mx-auto">
            Describe the object you wish existed. We'll make it real.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto">
            Every Original is a starting point. Change the form, the finish, the words — the piece
            is redrawn, engineered for manufacturing, and made to order.
          </p>
          <Button size="lg" className="mt-8 rounded-none" onClick={() => navigate("/studio")}>
            <Wand2 className="mr-2 h-4 w-4" /> Open the studio
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 pb-20">
        <h2 className="text-2xl md:text-3xl font-light tracking-tight mb-8">Questions</h2>
        <div className="border-t border-border">
          {FAQS.map((f) => (
            <div key={f.q} className="border-b border-border py-6 grid md:grid-cols-3 gap-3">
              <h3 className="text-sm font-medium">{f.q}</h3>
              <p className="md:col-span-2 text-sm text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Are you a designer?{" "}
          <Link to="/platform" className="underline underline-offset-4">
            See the Nyzora creator platform
          </Link>
          .
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default OriginalsHome;
