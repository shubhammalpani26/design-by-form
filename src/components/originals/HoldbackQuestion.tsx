import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdTouch } from "@/lib/adAttribution";

/**
 * One optional, anonymous question for people who've seen their preview but
 * haven't gone to checkout yet. Nothing personal is stored — only the answer,
 * the product page and the ad campaign tag (if any). Asked once per browser.
 */
export const HOLDBACK_REASONS = [
  { key: "price", label: "The price" },
  { key: "unsure_look", label: "Not sure how the real piece will look" },
  { key: "just_curious", label: "Just curious" },
  { key: "buying_later", label: "Buying later" },
  { key: "unsure_new_site", label: "Not sure about paying a new website" },
  { key: "other", label: "Something else" },
] as const;

const DONE_KEY = "nyz_holdback_done";
const DELAY_MS = 20_000;

export function HoldbackQuestion({ skuSlug, onEvent }: { skuSlug: string; onEvent?: (event: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [other, setOther] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(DONE_KEY)) return;
    } catch { /* storage blocked — still ask */ }
    const id = setTimeout(() => {
      setVisible(true);
      onEvent?.("holdback_shown");
    }, DELAY_MS);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finish = () => {
    try { localStorage.setItem(DONE_KEY, String(Date.now())); } catch { /* ignore */ }
  };

  const send = async (reason: string, text?: string) => {
    setSent(true);
    finish();
    onEvent?.("holdback_answered");
    const campaign = getAdTouch("", "").touch?.campaign ?? null;
    await supabase.from("originals_holdback_answers").insert({
      reason,
      other_text: reason === "other" && text?.trim() ? text.trim().slice(0, 200) : null,
      sku_slug: skuSlug.slice(0, 80),
      campaign,
    });
  };

  const dismiss = () => {
    finish();
    setVisible(false);
    onEvent?.("holdback_dismissed");
  };

  if (!visible) return null;

  if (sent) {
    return (
      <div className="mt-5 border border-border p-4 text-sm text-muted-foreground">
        Thank you — that really helps us. Your preview is still here whenever you're ready.
      </div>
    );
  }

  return (
    <div className="mt-5 border border-border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Quick question · optional</p>
          <p className="mt-1 text-sm text-foreground">What's holding you back?</p>
        </div>
        <button
          type="button"
          aria-label="No thanks"
          onClick={dismiss}
          className="shrink-0 p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {HOLDBACK_REASONS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => (r.key === "other" ? setPicked("other") : void send(r.key))}
            className={`max-w-full whitespace-normal border px-3 py-1.5 text-left text-xs ${picked === r.key ? "border-foreground" : "border-border hover:border-foreground/50"}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      {picked === "other" && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            maxLength={200}
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="Tell us in a few words (optional)"
            className="h-10 min-w-0 flex-1 border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={() => void send("other", other)}
            className="h-10 shrink-0 border border-foreground px-4 text-xs tracking-[0.15em] uppercase text-foreground"
          >
            Send
          </button>
        </div>
      )}
      <p className="mt-3 text-[11px] text-muted-foreground">Anonymous — we don't save your name, email or photo with your answer.</p>
    </div>
  );
}
