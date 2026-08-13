import { PackageCheck, Repeat2, Ban } from "lucide-react";

/**
 * Made-to-order terms shown before payment. Each piece is produced for one
 * buyer, so the promise is a remake or a refund on our fault — not a
 * change-of-mind cancellation.
 */
export const MadeToOrderPolicy = ({ className = "" }: { className?: string }) => (
  <div className={`border border-border ${className}`}>
    <p className="border-b border-border px-4 py-2.5 text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
      Made to order — what's covered
    </p>
    <ul className="divide-y divide-border text-sm">
      <li className="flex gap-3 px-4 py-3">
        <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          <strong className="font-medium">Refund</strong> if it arrives damaged or defective — cracked,
          warped, mis-engraved. Send us a photo within 30 days and we refund you in full.
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
        <Ban className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>
          <strong className="font-medium">No cancellations or change-of-mind returns.</strong> Your piece is
          made for you alone and goes into production right after you order, so it can't be cancelled,
          resold or restocked. Please check your render and spelling before you pay.
        </span>
      </li>
    </ul>
  </div>
);
