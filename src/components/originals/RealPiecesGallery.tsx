import pug from "@/assets/real-pieces/01-pug-front.jpg";
import golden from "@/assets/real-pieces/04-golden.jpg";
import rabbit from "@/assets/real-pieces/10-rabbit-front.jpg";
import blackCat from "@/assets/real-pieces/08-black-cat.jpg";
import whiteDog from "@/assets/real-pieces/03-white-dog-front.jpg";
import fluffyCat from "@/assets/real-pieces/12-fluffy-cat-front.jpg";
import cockatiel from "@/assets/real-pieces/13-cockatiel-front.jpg";
import goldenCream from "@/assets/real-pieces/09-golden-cream.jpg";
import { Camera } from "lucide-react";

/**
 * Real photos of finished sculptures (light colour/crop only, no AI edits).
 * Shown as proof of what arrives; never presented as customer reviews.
 */
const PIECES = [
  { src: pug, label: "Pug" },
  { src: golden, label: "Golden retriever" },
  { src: rabbit, label: "Rabbit" },
  { src: blackCat, label: "Black cat" },
  { src: whiteDog, label: "Dog" },
  { src: fluffyCat, label: "Long-haired cat" },
  { src: cockatiel, label: "Cockatiel" },
  { src: goldenCream, label: "Golden retriever" },
];

export const RealPiecesGallery = ({ className }: { className?: string }) => (
  <div className={className}>
    <h2 className="text-xl font-light tracking-tight">Real pieces, real photos</h2>
    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
      <Camera className="h-3.5 w-3.5 shrink-0" /> Finished sculptures, photographed as they are. Dogs, cats, birds, rabbits — any pet.
    </p>
    <div className="mt-5 grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-4">
      {PIECES.map((p, i) => (
        <figure key={i} className="bg-background">
          <img
            src={p.src}
            alt={`Real finished ${p.label.toLowerCase()} sculpture`}
            loading="lazy"
            decoding="async"
            width={640}
            height={800}
            className="aspect-[4/5] w-full object-contain"
          />
          <figcaption className="px-3 py-2 text-[11px] text-muted-foreground">{p.label}</figcaption>
        </figure>
      ))}
    </div>
  </div>
);
