import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/hooks/useScrollReveal";

import showcaseChair from "@/assets/showcase-product-chair.jpg";
import showcaseRoomChair from "@/assets/showcase-room-scene.jpg";
import showcaseConsole from "@/assets/showcase-product-console.jpg";
import showcaseRoomConsole from "@/assets/showcase-room-console.jpg";

const showcases = [
  {
    id: "chair",
    prompt: "A sculptural accent chair with flowing organic curves in walnut",
    category: "Chair",
    productImage: showcaseChair,
    roomImage: showcaseRoomChair,
    designer: "AI-Generated",
    material: "Walnut Wood",
  },
  {
    id: "console",
    prompt: "A modern console table with organic form in light oak with brass accents",
    category: "Console",
    productImage: showcaseConsole,
    roomImage: showcaseRoomConsole,
    designer: "AI-Generated",
    material: "Oak & Brass",
  },
];

const CuratedShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = showcases[activeIndex];

  return (
    <section className="py-16 md:py-28">
      <div className="container">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground/60 mb-3">
              From Idea to Reality
            </p>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
              See What's Possible
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto">
              A prompt becomes a product. A product finds its space.
            </p>
          </div>
        </ScrollReveal>

        {/* Showcase selector pills */}
        <ScrollReveal animation="fade-up" delay={50}>
          <div className="flex justify-center gap-3 mb-10 md:mb-14">
            {showcases.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActiveIndex(i)}
                className={`px-5 py-2 rounded-full text-xs tracking-[0.15em] uppercase transition-all duration-300 border ${
                  i === activeIndex
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border/50 hover:border-foreground/30"
                }`}
              >
                {s.category}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Main showcase — 2-row editorial layout */}
        <div className="space-y-6 md:space-y-8">
          {/* Row 1: Prompt → Product */}
          <ScrollReveal animation="fade-up" delay={100}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border/30 rounded-2xl overflow-hidden bg-card">
              {/* Prompt side */}
              <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16 border-b md:border-b-0 md:border-r border-border/30">
                <p className="text-[9px] tracking-[0.25em] uppercase text-primary/70 mb-4">
                  The Prompt
                </p>
                <p className="text-lg md:text-xl lg:text-2xl font-light text-foreground leading-relaxed italic">
                  "{active.prompt}"
                </p>
                <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border/20">
                  <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/50">
                    {active.designer}
                  </span>
                  <span className="w-px h-3 bg-border/30" />
                  <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/50">
                    {active.material}
                  </span>
                </div>
              </div>

              {/* Product image */}
              <div className="aspect-square md:aspect-auto relative bg-muted/10">
                <img
                  src={active.productImage}
                  alt={`${active.category} — AI generated design`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={1024}
                  height={1024}
                />
                <div className="absolute top-4 right-4">
                  <span className="text-[8px] tracking-[0.2em] uppercase bg-background/80 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full border border-border/20">
                    The Product
                  </span>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Row 2: Product in space — full bleed */}
          <ScrollReveal animation="fade-up" delay={200}>
            <div className="relative rounded-2xl overflow-hidden border border-border/30">
              <div className="aspect-[16/9] md:aspect-[21/9]">
                <img
                  src={active.roomImage}
                  alt={`${active.category} placed in a curated interior space`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  width={1280}
                  height={832}
                />
              </div>
              {/* Overlay label */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6 md:p-10">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[9px] tracking-[0.25em] uppercase text-white/60 mb-1">
                      In Your Space
                    </p>
                    <p className="text-white text-sm md:text-base font-light">
                      Manufactured & delivered to your door
                    </p>
                  </div>
                  <Link to="/design-studio">
                    <Button
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white hover:text-black text-xs tracking-[0.1em] uppercase rounded-full px-6 backdrop-blur-sm"
                    >
                      Start Designing
                      <ArrowRight className="w-3.5 h-3.5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        {/* Bottom CTA */}
        <ScrollReveal animation="fade-up" delay={300}>
          <div className="text-center mt-10 md:mt-14">
            <p className="text-xs text-muted-foreground/50 mb-4">
              Go from prompt to manufactured product in minutes
            </p>
            <Link to="/design-studio">
              <Button variant="outline" className="rounded-full px-8 text-xs tracking-[0.1em] uppercase">
                Open Design Studio
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default CuratedShowcase;
