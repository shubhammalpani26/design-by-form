import { useEffect, useState } from "react";
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
    prompt: "A sculptural accent chair with flowing organic curves in matte black resin",
    category: "Chair",
    productImage: showcaseChair,
    roomImage: showcaseRoomChair,
    designer: "AI-Generated",
    material: "Matte Black Resin",
  },
  {
    id: "console",
    prompt: "A sculptural console table with sinuous biomorphic form in matte black resin",
    category: "Console",
    productImage: showcaseConsole,
    roomImage: showcaseRoomConsole,
    designer: "AI-Generated",
    material: "Matte Black Resin",
  },
];

const CuratedShowcase = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = showcases[activeIndex];

  useEffect(() => {
    showcases.forEach(({ productImage, roomImage }) => {
      [productImage, roomImage].forEach((src) => {
        const image = new Image();
        image.src = src;
        image.decoding = "async";
        void image.decode?.().catch(() => undefined);
      });
    });
  }, []);

  return (
    <section className="pt-2 pb-16 md:pt-4 md:pb-24">
      <div className="container">
        <ScrollReveal animation="fade-up">
          <div className="text-center mb-10 md:mb-12">
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

        <ScrollReveal animation="fade-up" delay={50}>
          <div className="flex justify-center gap-3 mb-8 md:mb-10">
            {showcases.map((showcase, index) => (
              <button
                key={showcase.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`px-5 py-2 rounded-full text-xs tracking-[0.15em] uppercase transition-all duration-300 border ${
                  index === activeIndex
                    ? "bg-foreground text-background border-foreground"
                    : "bg-transparent text-muted-foreground border-border/50 hover:border-foreground/30"
                }`}
              >
                {showcase.category}
              </button>
            ))}
          </div>
        </ScrollReveal>

        <div className="space-y-5 md:space-y-6">
          <ScrollReveal animation="fade-up" delay={100}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-border/30 rounded-2xl overflow-hidden bg-card">
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

              <div className="aspect-square md:aspect-auto relative bg-muted/10">
                <img
                  key={`${active.id}-product`}
                  src={active.productImage}
                  alt={`${active.category} — AI generated design`}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  loading="eager"
                  decoding="async"
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

          <ScrollReveal animation="fade-up" delay={200}>
            <div className="rounded-2xl overflow-hidden border border-border/30 bg-card">
              <div className="relative">
                <div className="aspect-[5/4] sm:aspect-[16/10] lg:aspect-[16/9]">
                  <img
                    key={`${active.id}-room`}
                    src={active.roomImage}
                    alt={`${active.category} placed in a curated interior space`}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      active.id === "console" ? "object-[center_58%]" : "object-center"
                    }`}
                    loading="eager"
                    decoding="async"
                    width={1920}
                    height={1080}
                  />
                </div>
                <div className="absolute top-4 left-4 md:top-6 md:left-6">
                  <span className="text-[8px] tracking-[0.2em] uppercase bg-background/80 backdrop-blur-sm text-foreground px-3 py-1.5 rounded-full border border-border/20">
                    In Your Space
                  </span>
                </div>
              </div>

              <div className="border-t border-border/20 px-5 py-5 md:px-8 md:py-6 bg-background">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6">
                  <div className="space-y-2">
                    <p className="text-base md:text-lg font-medium text-foreground">
                      Upload your space photo
                    </p>
                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-2xl">
                      Our AI can optimise this design to match your room's style, lighting & dimensions — or generate a completely new piece tailored to your space.
                    </p>
                  </div>
                  <Link to="/design-studio" className="w-full md:w-auto shrink-0">
                    <Button
                      variant="outline"
                      className="rounded-full px-6 text-xs tracking-[0.1em] uppercase w-full md:w-auto"
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

        <ScrollReveal animation="fade-up" delay={300}>
          <div className="text-center mt-10 md:mt-12">
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
