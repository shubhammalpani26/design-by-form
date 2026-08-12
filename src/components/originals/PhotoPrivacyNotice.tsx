import { useState } from "react";
import { Lock, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Upfront, plain-language explanation of what happens to an uploaded photo.
 * Only states what the product actually does today.
 */
export function PhotoPrivacyNotice({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border border-foreground/10 bg-background/60 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          Your photo is private — used only to make your piece, never sold or used to train AI.
        </span>
        <ChevronDown
          className={`ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul className="space-y-1.5 border-t border-foreground/10 px-3 py-3 text-xs leading-relaxed text-muted-foreground">
          <li>• It's stored in private storage — it is never published on the site or shared with other buyers.</li>
          <li>• It's used for one thing: rendering your preview and, if you order, making your piece.</li>
          <li>• We never sell it, and we don't use it to train AI models.</li>
          <li>• You can ask us to delete it at any time — email contact@nyzora.ai and it's removed.</li>
          <li>
            • Full details in our{" "}
            <Link to="/privacy-policy" className="underline underline-offset-2 hover:text-foreground">
              privacy policy
            </Link>
            .
          </li>
        </ul>
      )}
    </div>
  );
}

export default PhotoPrivacyNotice;
