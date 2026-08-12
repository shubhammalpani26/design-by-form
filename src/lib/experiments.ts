import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight on-site copy experiments.
 * Variant assignment is sticky per visitor (localStorage) and events are logged
 * anonymously to `experiment_events` for later read-out.
 */

const SESSION_KEY = "nyz_exp_session";
const ASSIGN_KEY = "nyz_exp_assign";

export const EXPERIMENTS = {
  /** Homepage hero headline + subhead + CTA label. */
  hero_copy: {
    a: {
      headline: ["Upload one photo.", "Hold them in stone."],
      sub: "A photo of your dog becomes a carved sculpture with their name on the base. See it free in about a minute — made in the USA, shipped in 3–5 days, free shipping.",
      cta: "See your pet in stone — free",
    },
    b: {
      headline: ["They don't have to", "be just a photo."],
      sub: "Send us one picture and we carve them into a solid stone-finish sculpture, their name engraved in the base. See yours free before you decide. Made in the USA, free shipping.",
      cta: "See mine free",
    },
  },
  /** Copy shown while the render is being generated. */
  render_progress: {
    a: [
      "Reading their face…",
      "Carving the brow and muzzle…",
      "Cutting the eyes so they catch the light…",
      "Engraving the name into the plinth…",
      "Almost there.",
    ],
    b: [
      "Studying your photo…",
      "Blocking out the head and shoulders…",
      "Deepening the eye sockets by hand…",
      "Engraving the base…",
      "Finishing the stone. A few more seconds.",
    ],
  },
  /** Reveal screen framing + purchase CTA. */
  reveal_screen: {
    a: {
      eyebrow: "Your piece",
      headline: (name: string) => `Here's ${name}.`,
      sizePrompt: "Choose a size",
      cta: (price: number) => `Make it real — $${price}`,
    },
    b: {
      eyebrow: "First look",
      headline: (name: string) => `This is ${name}, in stone.`,
      sizePrompt: "How big should they be?",
      cta: (price: number) => `Make this one — $${price}`,
    },
  },
} as const;

export type ExperimentKey = keyof typeof EXPERIMENTS;
export type VariantKey = "a" | "b";

const readJson = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const getSessionId = (): string => {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
};

/** Sticky 50/50 assignment. Force a variant with ?exp_<key>=a|b for QA. */
export const getVariant = (key: ExperimentKey): VariantKey => {
  try {
    const forced = new URLSearchParams(window.location.search).get(`exp_${key}`);
    if (forced === "a" || forced === "b") return forced;
  } catch { /* ignore */ }

  const assignments = readJson<Record<string, VariantKey>>(ASSIGN_KEY) ?? {};
  if (assignments[key] === "a" || assignments[key] === "b") return assignments[key];

  const variant: VariantKey = Math.random() < 0.5 ? "a" : "b";
  try {
    localStorage.setItem(ASSIGN_KEY, JSON.stringify({ ...assignments, [key]: variant }));
  } catch { /* ignore */ }
  return variant;
};

/** Fire-and-forget event log. Never blocks or breaks the UI. */
export const trackExperiment = (
  experiment: ExperimentKey,
  variant: VariantKey,
  event: string,
  opts?: { skuSlug?: string; metadata?: Record<string, unknown> },
) => {
  void supabase
    .from("experiment_events")
    .insert({
      experiment,
      variant,
      event,
      session_id: getSessionId(),
      sku_slug: opts?.skuSlug ?? null,
      metadata: (opts?.metadata ?? {}) as never,
    })
    .then(undefined, () => undefined);
};