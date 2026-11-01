import { useEffect, useState } from "react";
import { Check, Loader2, Mail, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Nyzora's WhatsApp line (same as contact page). */
const WHATSAPP_NUMBER = "919082582002";

interface Props {
  previewId: string | null;
  skuSlug: string;
  petName: string;
  /** Set for non-pet pieces (e.g. baby, wedding) so the message names the piece, not a pet. */
  pieceName?: string;
  colorKey: string;
  colorLabel: string;
  sizeKey: string | null;
  sizeLabel: string;
  onEvent?: (event: "email_open" | "email_saved" | "whatsapp_click") => void;
}

async function readFnError(error: unknown, fallback: string) {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const body = await ctx.json();
      if (body?.error) return String(body.error);
    } catch { /* ignore */ }
  }
  return fallback;
}

/**
 * Two quiet, shopper-initiated actions under the checkout button:
 *  - "Email me my preview": sends the image now + one reminder in 2 days.
 *  - "Questions? Message us on WhatsApp": opens a chat they start themselves.
 */
export const PreviewHelpActions = ({
  previewId, skuSlug, petName, pieceName, colorKey, colorLabel, sizeKey, sizeLabel, onEvent,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New preview → allow saving that one too.
  useEffect(() => { setSentTo(null); setError(null); }, [previewId]);

  useEffect(() => {
    if (!open || email) return;
    void supabase.auth.getSession().then(({ data }) => {
      const e = data.session?.user?.email;
      if (e) setEmail((cur) => cur || e);
    });
  }, [open, email]);

  const send = async () => {
    if (!previewId) return;
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed)) {
      setError("Please enter a valid email address.");
      return;
    }
    setSending(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("originals-preview-email", {
      body: { action: "save", previewId, email: trimmed, colorKey, sizeKey },
    });
    setSending(false);
    if (fnError || !data?.ok) {
      setError(await readFnError(fnError, "We couldn't send the email just now. Please try again."));
      return;
    }
    setSentTo(trimmed);
    setOpen(false);
    onEvent?.("email_saved");
  };

  const ref = previewId ? ` (ref ${previewId.slice(0, 8)})` : "";
  const subject = pieceName
    ? `${pieceName}${petName ? ` (${petName})` : ""}`
    : `${petName || "pet"} sculpture`;
  const waText = `Hi Nyzora! I have a question about my ${subject} preview — ${sizeLabel}, ${colorLabel}${ref}.`;
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waText)}`;

  return (
    <div className="mt-5 border-t border-border pt-4">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-none px-3 text-xs"
          disabled={!previewId || Boolean(sentTo)}
          onClick={() => { setOpen((v) => !v); if (!open) onEvent?.("email_open"); }}
        >
          {sentTo ? <Check className="mr-1.5 h-4 w-4 shrink-0" /> : <Mail className="mr-1.5 h-4 w-4 shrink-0" />}
          {sentTo ? "Preview emailed" : "Email me my preview"}
        </Button>
        <Button asChild variant="outline" className="h-11 rounded-none px-3 text-xs">
          <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => onEvent?.("whatsapp_click")}>
            <MessageCircle className="mr-1.5 h-4 w-4 shrink-0" />
            <span className="truncate">Questions? Message us on WhatsApp</span>
          </a>
        </Button>
      </div>

      {open && !sentTo && (
        <form
          className="mt-3 border border-border p-3"
          onSubmit={(e) => { e.preventDefault(); void send(); }}
        >
          <label htmlFor="preview-email" className="text-xs text-muted-foreground">
            We'll email this preview now and send one gentle reminder in 2 days. Nothing else.
          </label>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <Input
              id="preview-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-none"
              maxLength={254}
              required
            />
            <Button type="submit" className="h-11 rounded-none sm:w-32" disabled={sending}>
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send it"}
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </form>
      )}
      {sentTo && (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          Sent to {sentTo}. The link in the email opens this exact preview again.
        </p>
      )}
    </div>
  );
};
