import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { JsonLd } from "@/components/JsonLd";
import { FounderNote } from "@/components/originals/FounderNote";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, Wand2 } from "lucide-react";
import { ORIGINALS_SKUS } from "@/data/originalsSkus";
import { EXPERIMENTS, getVariant, trackExperiment } from "@/lib/experiments";
import heroImg from "@/assets/originals-hero.jpg";

const STEPS = [
  { n: "01", t: "Pick a piece", d: "Nyzora Originals — each designed to be personal without being kitsch." },
  { n: "02", t: "Make it yours", d: "Add a name, a date, a place — or describe a change and our AI redraws the piece." },
  { n: "03", t: "Made in the USA", d: "Printed to order in our US network and shipped in 3–5 business days." },
];

const FAQS = [
  { q: "How long does it take?", a: "Every Original is made to order. Production takes 2–3 business days and delivery is 5–7 business days anywhere in the US." },
  { q: "What is it made of?", a: "A dense matte polymer, precision 3D-printed as one solid part in the USA. The finish reads and feels stone-like — but to be clear, it is a durable printed material, not natural stone or ceramic. It is solid through, not hollow-feeling, and safe indoors on any shelf." },
  { q: "Is this a real product or just an AI image?", a: "The AI only designs it. What you see in the preview is turned into a manufacturable 3D model, checked by our engineering system for wall thickness, stability and print feasibility, then produced by a real US workshop and shipped to you as a physical object." },
  { q: "What if it arrives damaged or doesn't look right?", a: "You approve the render before anything is made, so the piece you get is the one you signed off on. If anything arrives the worse for wear in transit, send us a photo and a fresh piece goes into production the same day — at our cost, no return postage. If it doesn't match the render you approved, we remake it free and ship the new one." },
  { q: "Can I cancel or return an order?", a: "No. Every Original is made for one person and goes into production right after you order, so it can't be cancelled, returned for a change of mind, resold or restocked. That's exactly why we show you the render for free before you pay — check the piece and the spelling carefully, then order." },
  { q: "How large are the pieces?", a: "Each Original is produced as one part inside a 220 × 220 × 220 mm envelope, so it reads as a substantial object on a shelf without becoming furniture." },
  { q: "Can I change the design?", a: "Yes. Every Original can be remixed — describe what you want in plain language and the piece is redrawn before it is made." },
];

const OriginalsHome = () => {
  const navigate = useNavigate();
  const heroVariant = useMemo(() => getVariant("hero_copy"), []);
  const hero = EXPERIMENTS.hero_copy[heroVariant];

  useEffect(() => {
    trackExperiment("hero_copy", heroVariant, "hero_view");
  }, [heroVariant]);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Pet Memorial Gifts & Personalized Sculptures — Nyzora Originals"
        description="Custom pet memorial sculptures made from your photo, plus baby name and wedding coordinate keepsakes. Made to order in the USA, free shipping, from $59."
        keywords={["pet memorial gifts", "dog memorial gift", "pet loss gift", "personalized pet gift", "custom pet statue", "baby name sign", "wedding coordinates gift", "made in usa"]}
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
      <JsonLd
        id="org"
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": "https://nyzora.ai/#organization",
          name: "Nyzora",
          alternateName: "Nyzora.ai",
          url: "https://nyzora.ai",
          logo: {
            "@type": "ImageObject",
            url: "https://nyzora.ai/favicon.png",
            width: 512,
            height: 512,
          },
          description:
            "Nyzora Originals — made-to-order personalized sculptures from your photo. Pet memorials, baby name signs and wedding coordinate keepsakes, produced and shipped in the USA.",
          sameAs: [
            "https://www.instagram.com/nyzora.ai",
            "https://www.linkedin.com/company/nyzora",
          ],
          contactPoint: {
            "@type": "ContactPoint",
            email: "contact@nyzora.ai",
            contactType: "customer support",
          },
        }}
      />
      <JsonLd
        id="website"
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": "https://nyzora.ai/#website",
          url: "https://nyzora.ai",
          name: "Nyzora",
          publisher: { "@id": "https://nyzora.ai/#organization" },
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
              {hero.headline[0]}
              <br />
              {hero.headline[1]}
            </h1>
            <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-lg">
              {hero.sub}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="rounded-none" asChild>
                <Link
                  to="/originals/pet-silhouette-keepsake"
                  onClick={() => trackExperiment("hero_copy", heroVariant, "hero_cta_click")}
                >
                  {hero.cta} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-none" asChild>
                <a href="#collection">
                  <Wand2 className="mr-2 h-4 w-4" /> See the collection
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {["Made in the USA", "Ships in 3–5 days", "One-of-one, no minimums", "Remake if it's not right"].map((t) => (
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
              <h2 className="text-3xl md:text-4xl font-light tracking-tight">Nyzora Originals</h2>
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
                  alt={`${sku.name} — personalized piece made in the USA`}
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
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-4">Photo to piece</p>
          <h2 className="text-2xl md:text-4xl font-light tracking-tight max-w-2xl mx-auto">
            One photo. One minute. Theirs, sculpted.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground max-w-xl mx-auto">
            Upload a photo of your pet and see the memorial sculpture before anything is made or charged.
            Made to order in the USA, shipped in 3–5 days.
          </p>
          <Button size="lg" className="mt-8 rounded-none" onClick={() => navigate("/originals/pet-silhouette-keepsake")}>
            <Wand2 className="mr-2 h-4 w-4" /> Upload a photo — free
          </Button>
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 pb-20">
        <ScrollReveal>
          <FounderNote className="mb-16" />
        </ScrollReveal>
        <ScrollReveal>

          <div className="border border-border p-8 md:p-12 mb-16">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
              The .ai in Nyzora
            </p>
            <h2 className="text-2xl md:text-3xl font-light tracking-tight max-w-2xl">
              AI designs it. A real workshop in the USA makes it and ships it to you.
            </h2>
            <p className="mt-4 text-sm text-muted-foreground max-w-2xl">
              You are not buying an image. The AI is the fastest way to get a one-of-one design that
              actually looks like your pet — everything after that is physical.
            </p>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-4 border-t border-l border-border">
              {[
                { n: "01", t: "AI sculpts the design", d: "Your photo and details become a one-of-one sculpture, previewed free in about a minute." },
                { n: "02", t: "Engineering checks it", d: "Wall thickness, overhangs, stability and print settings are validated before anything is made." },
                { n: "03", t: "Printed in the USA", d: "Produced as one solid part in dense matte polymer with a stone-look finish — a real, weighty object." },
                { n: "04", t: "Shipped to your door", d: "Made to order and delivered in 3–5 business days, with free US shipping." },
              ].map((s) => (
                <div key={s.n} className="border-r border-b border-border p-6">
                  <span className="text-[11px] tracking-[0.3em] text-muted-foreground">{s.n}</span>
                  <h3 className="mt-3 text-base font-light tracking-tight">{s.t}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

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
