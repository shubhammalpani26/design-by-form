import { PackageCheck, Repeat2, Sparkles } from "lucide-react";

/**
 * Made-to-order terms shown before payment. Each piece is produced for one
 * buyer, so the promise is a free remake on our fault — not a
 * change-of-mind cancellation. The finished piece is never promised to be
 * identical to the render, so the remake trigger is damage, a defect, or a
 * piece that clearly isn't right.
 */
export const MadeToOrderPolicy = ({ className = "", isPet = false }: { className?: string; isPet?: boolean }) => (
  <div className={`border border-border ${className}`}>
    <p className="border-b border-border px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
      Made for you — what's covered
    </p>
    <ul className="divide-y divide-border text-sm">
      <li className="flex gap-3 px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          <strong className="font-medium">You approve the design first.</strong> Nothing is made until you're
          happy with the preview. The render is a design preview — the finished piece is printed in one solid
          matte colour with the visible layer lines of a real 3D print, so texture and tone read a little
          differently in the hand.
        </span>
      </li>
      <li className="flex gap-3 px-4 py-3">
        <Repeat2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          <strong className="font-medium">Free remake if something's wrong.</strong> Damaged, broken, or
          {isPet ? " clearly not your pet?" : " clearly not the piece you ordered?"} Send a photo and we make
          it again and ship it — at our cost.
        </span>
      </li>
      <li className="flex gap-3 px-4 py-3">
        <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          <strong className="font-medium">Mishandled in transit? We replace it.</strong> If anything arrives
          the worse for wear, send a photo and a fresh piece goes into production the same day.
        </span>
      </li>
    </ul>
  </div>
);
