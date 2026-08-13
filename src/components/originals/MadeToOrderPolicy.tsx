import { PackageCheck, Repeat2, Sparkles } from "lucide-react";

/**
 * Made-to-order terms shown before payment. Each piece is produced for one
 * buyer, so the promise is a remake or a refund on our fault — not a
 * change-of-mind cancellation.
 */
export const MadeToOrderPolicy = ({ className = "" }: { className?: string }) => (
  <div className={`border border-border ${className}`}>
    <p className="border-b border-border px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
      Made for you — what's covered
    </p>
    <ul className="divide-y divide-border text-sm">
      <li className="flex gap-3 px-4 py-3">
        <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          <strong className="font-medium">Arrives damaged? We make it again.</strong> Send us a photo and a
          fresh piece goes into production the same day, at our cost.
        </span>
      </li>
      <li className="flex gap-3 px-4 py-3">
        <Repeat2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          <strong className="font-medium">Free remake</strong> if the piece doesn't match the render you
          approved. We make it again and ship it — no return postage to pay.
        </span>
      </li>
      <li className="flex gap-3 px-4 py-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          <strong className="font-medium">You approve the render first.</strong> Nothing is made until you're
          happy with the preview — so what you see is what we build.
        </span>
      </li>
    </ul>
  </div>
);
