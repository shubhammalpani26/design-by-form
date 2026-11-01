import { useState } from "react";
import { Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { findOriginalsColor } from "@/lib/originalsColors";
import pug from "@/assets/real-pieces/01-pug-front.jpg";
import greyDog from "@/assets/real-pieces/03-white-dog-front.jpg";
import blackCat from "@/assets/real-pieces/08-black-cat.jpg";
import creamGolden from "@/assets/real-pieces/09-golden-cream.jpg";
import rabbit from "@/assets/real-pieces/10-rabbit-front.jpg";
import marbleCat from "@/assets/real-pieces/12-fluffy-cat-front.jpg";

/**
 * One real, finished piece per colour (light crop/colour only, no AI edits),
 * shown beside the price so shoppers see what actually arrives.
 */
const REAL_BY_COLOUR: Record<string, { src: string; pet: string }> = {
  bone: { src: creamGolden, pet: "golden retriever" },
  charcoal: { src: blackCat, pet: "cat" },
  marble: { src: marbleCat, pet: "long-haired cat" },
  slate: { src: greyDog, pet: "dog" },
  sand: { src: pug, pet: "pug" },
  blush: { src: rabbit, pet: "rabbit" },
};

interface Props {
  colorKey: string;
  sizeLabel: string;
  price: number;
}

export const RealPieceInColour = ({ colorKey, sizeLabel, price }: Props) => {
  const [open, setOpen] = useState(false);
  const colour = findOriginalsColor(colorKey);
  const real = REAL_BY_COLOUR[colour.key];
  if (!real) return null;

  return (
    <>
      <div className="mt-3 flex items-center gap-3 border border-border p-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`See a real finished piece in ${colour.label}`}
          className="shrink-0 border border-border bg-muted/20"
        >
          <img
            src={real.src}
            alt={`Real finished ${real.pet} sculpture in ${colour.label}`}
            width={64}
            height={80}
            loading="lazy"
            decoding="async"
            className="h-20 w-16 object-contain"
          />
        </button>
        <div className="min-w-0 flex-1">
          <p className="flex items-baseline justify-between gap-2 text-sm">
            <span className="truncate">{sizeLabel} · {colour.label}</span>
            <span className="tabular-nums">${price}</span>
          </p>
          <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-snug text-muted-foreground">
            <Camera className="mt-px h-3 w-3 shrink-0" />
            A real finished piece in {colour.label}, photographed as it arrived. Yours is made the same way.
          </p>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-light">A real piece in {colour.label}</DialogTitle>
          </DialogHeader>
          <img
            src={real.src}
            alt={`Real finished ${real.pet} sculpture in ${colour.label}`}
            className="w-full object-contain"
          />
          <p className="text-xs text-muted-foreground">
            Unedited apart from light and crop. You'll see the fine layer lines of a real print up close.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
};
