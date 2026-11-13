import { lazy, Suspense, useState } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import socialIcon from "@/assets/helper-social.png";
import adsIcon from "@/assets/helper-ads.png";

// The chat (markdown, code highlighting) is heavy, so it only loads when opened.
const AdminHelperChat = lazy(() => import("./AdminHelperChat"));

const LABEL = {
  social: { title: "Social helper", sub: "Chat to change, skip or draft posts", icon: socialIcon },
  ads: { title: "Ads helper", sub: "Chat about ad numbers, or pause an ad", icon: adsIcon },
} as const;

export function HelperSection({ helper }: { helper: "social" | "ads" }) {
  // Open by default: the chat is the point of the section, and a collapsed bar was easy to miss.
  const [open, setOpen] = useState(true);
  const l = LABEL[helper];
  return (
    <section className="border border-border">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-3 text-left">
        <span className="flex min-w-0 items-center gap-3">
          <img src={l.icon} alt="" width={32} height={32} className="h-8 w-8 shrink-0 dark:invert" />
          <span className="min-w-0">
            <span className="block text-sm font-semibold uppercase tracking-wider text-foreground">{l.title}</span>
            <span className="block truncate text-xs text-muted-foreground">{l.sub}</span>
          </span>
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="border-t border-border p-2 sm:p-3">
          <Suspense fallback={<div className="flex items-center gap-2 p-4 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>}>
            <AdminHelperChat helper={helper} />
          </Suspense>
        </div>
      )}
    </section>
  );
}
