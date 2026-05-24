import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { ScrollReveal } from "@/hooks/useScrollReveal";
import { ArrowRight, Wand2, Check } from "lucide-react";

const faqs = [
  {
    q: "What is AI-designed furniture?",
    a: "AI-designed furniture is created by generative models that turn a prompt or sketch into a sculptural, manufacturable form. On Nyzora, you describe the piece you want — material feel, scale, mood — and our AI Design Studio generates a one-of-a-kind design that a verified maker then manufactures to order.",
  },
  {
    q: "Is AI-designed furniture actually buildable?",
    a: "Yes. Nyzora's AI is constrained to produce solid, monolithic, flat-based forms that real-world makers can manufacture in high-grade resin. We don't generate fantasy renders — every output is engineered to be made.",
  },
  {
    q: "How much does an AI-designed piece cost?",
    a: "Pricing depends on the size, finish, and complexity of the form you generate. You see a transparent quote inside the Design Studio before you commit to anything, and you can adjust scale to fit your budget.",
  },
  {
    q: "Can I sell furniture I design with AI on Nyzora?",
    a: "Yes. Founding Creators keep 100% of the markup on every piece sold. Generate a design, list it, and Nyzora handles manufacturing and fulfillment with our verified maker network.",
  },
];

const AIDesignedFurniture = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead
        title="AI Designed Furniture — Generate & Order One-Of-A-Kind Pieces"
        description="AI-designed furniture, manufactured for real. Generate sculptural, one-of-a-kind pieces with Nyzora's Design Studio and have them made-to-order by verified makers."
        keywords={[
          "ai designed furniture",
          "ai generated furniture",
          "ai furniture design",
          "custom ai furniture",
          "generative furniture design",
          "design furniture with ai",
        ]}
        url="https://nyzora.ai/ai-designed-furniture"
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
                  AI Designed Furniture
                </p>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground leading-[0.95] tracking-tight mb-8">
                  Design Anything.<br />
                  <span className="font-light italic">We Make It Real.</span>
                </h1>
                <p className="text-primary-foreground/60 text-base md:text-lg max-w-2xl leading-relaxed mb-10">
                  AI-designed furniture, manufactured for the real world. Describe a piece, generate a one-of-a-kind form, and have it built to order by verified Indian makers — in high-grade resin, with a 2-year warranty.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link
                    to="/design-studio"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary-foreground text-primary font-medium hover:opacity-90 transition-opacity"
                  >
                    <Wand2 className="w-4 h-4" /> Open the Design Studio
                  </Link>
                  <Link
                    to="/browse"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
                  >
                    Browse AI-Designed Pieces
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Why */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Why AI</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12 max-w-3xl">
                AI gives you the design power of a studio — without the studio.
              </h2>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-px bg-border border border-border">
              {[
                { title: "One Of A Kind", body: "Every generation produces a unique sculptural form. No two pieces are ever the same — and yours belongs only to you." },
                { title: "Built To Be Made", body: "Our AI is constrained to solid, monolithic, flat-based forms — meaning every design can actually be manufactured by a real maker." },
                { title: "Manufactured, Not Just Rendered", body: "Verified Indian makers turn your AI design into a physical piece in high-grade resin. Pan-India delivery, 2-year warranty." },
              ].map((item) => (
                <div key={item.title} className="bg-background p-8 md:p-10">
                  <h3 className="text-xl md:text-2xl font-semibold tracking-tight mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container max-w-4xl">
            <ScrollReveal animation="fade-up">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">The Process</p>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-12">
                Prompt to physical piece, in four steps.
              </h2>
            </ScrollReveal>

            <div className="space-y-px bg-border border border-border">
              {[
                "Describe what you want — a sculptural chair, a flowing console, a sculptural vase. Add a sketch or a room photo for context.",
                "Nyzora's AI generates a one-of-a-kind, manufacturable form. Iterate until it feels right.",
                "Choose your finish and scale. See a transparent quote — and either order it for yourself or list it on the marketplace.",
                "A verified Indian maker manufactures your piece to order, in high-grade resin. Delivered pan-India with a 2-year warranty.",
              ].map((step, i) => (
                <div key={i} className="bg-background p-6 md:p-8 flex gap-6 items-start">
                  <span className="text-3xl md:text-4xl font-light text-muted-foreground tabular-nums shrink-0">
                    0{i + 1}
                  </span>
                  <p className="text-base md:text-lg leading-relaxed pt-1">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/design-studio"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                <Wand2 className="w-4 h-4" /> Start Designing
              </Link>
            </div>
          </div>
        </section>

        {/* Standards */}
        <section className="py-20 md:py-28 border-b border-border">
          <div className="container">
            <ScrollReveal animation="fade-up">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground mb-4">Nyzora Verified Standards</p>
                  <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">
                    AI you can trust to be made.
                  </h2>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    Most AI furniture tools generate beautiful renders that can never be built. Nyzora's Manufacturing Intelligence is trained on real maker data — every output is engineered to be physically produced.
                  </p>
                </div>
                <ul className="space-y-4">
                  {[
                    "Generative forms constrained to solid, manufacturable shapes",
                    "High-grade resin construction with premium finishes",
                    "Verified Indian makers, vetted for craftsmanship",
                    "Transparent pricing before you commit",
                    "2-year warranty on every piece",
                    "List your designs and keep 100% of the markup (Founding Creator)",
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
                AI-designed furniture, answered.
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
                to="/design-studio"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
              >
                Open the Design Studio <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

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

export default AIDesignedFurniture;