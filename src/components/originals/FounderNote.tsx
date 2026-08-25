import { Mail } from "lucide-react";

/**
 * Drop the founder photo in here later:
 *   import founderPhoto from "@/assets/founder.jpg";
 *   const FOUNDER_PHOTO: string | null = founderPhoto;
 * Leave as null and the block renders a clean initials mark instead.
 */
const FOUNDER_PHOTO: string | null = null;

interface FounderNoteProps {
  /** Compact version for product pages */
  compact?: boolean;
  className?: string;
}

/**
 * "Who makes this" trust block. Deliberately plain and personal — it exists to
 * answer the one question an emotional first-time buyer has: is there a real
 * person behind this?
 */
export const FounderNote = ({ compact = false, className = "" }: FounderNoteProps) => {

  return (
    <section className={`border border-border p-8 md:p-12 ${className}`}>
      <p className="text-[11px] tracking-[0.3em] uppercase text-muted-foreground mb-6">
        Who makes this
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl md:text-2xl font-light tracking-tight max-w-xl">
            Nyzora is a small team. Every piece is made one at a time, for one pet.
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
            I started Nyzora because the things people love most rarely exist as objects you can hold.
            A photo sits in a phone. A sculpture sits on a shelf. We use AI to sculpt the design from
            your photo, an engineering check to make sure it can actually be made, and a US workshop to
            produce and ship it — nothing is mass-produced and nothing is held in stock.
          </p>
          {!compact && (
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
              If a piece arrives broken or clearly isn't the pet you uploaded, we remake it. That promise
              is the whole business — I read the inbox myself.
            </p>
          )}

          <div className="pt-4 flex items-center gap-4">
            {FOUNDER_PHOTO ? (
              <img
                src={FOUNDER_PHOTO}
                alt="Shubham Malpani, founder of Nyzora"
                loading="lazy"
                className="h-14 w-14 rounded-full object-cover border border-border"
              />
            ) : (
              <span
                aria-hidden="true"
                className="h-14 w-14 rounded-full border border-border flex items-center justify-center text-xs tracking-[0.2em] text-muted-foreground"
              >
                SM
              </span>
            )}
            <div>
              <p className="text-lg font-light italic tracking-tight">Shubham Malpani</p>
              <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground mt-1">
                Founder, Nyzora
              </p>
            </div>
          </div>

        </div>

        <div className="md:border-l border-border md:pl-8 space-y-5 text-sm">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Reach a human</p>
            <a
              href="mailto:contact@nyzora.ai"
              className="mt-2 inline-flex items-center gap-2 underline underline-offset-4"
            >
              <Mail className="h-3.5 w-3.5" /> contact@nyzora.ai
            </a>
            <p className="mt-2 text-xs text-muted-foreground">Replies within one business day.</p>
          </div>
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground">Made &amp; shipped</p>
            <p className="mt-2 text-muted-foreground">
              Produced in our US facility and shipped free within the USA in 7–8 days.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
