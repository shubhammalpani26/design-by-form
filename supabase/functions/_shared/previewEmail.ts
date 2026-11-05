/**
 * Rules for the opt-in "Email me my preview" feature on the Originals reveal
 * screen. Kept pure so the timing and stop conditions are tested.
 *
 * A shopper who opts in gets the preview now and exactly ONE gentle reminder
 * two days later — never more, and never after they have paid.
 */
import { PHOTO_PERSONALIZED_SKUS, SKU_NAMES } from "./originalsPricing.ts";

export const REMINDER_DELAY_MS = 2 * 24 * 60 * 60 * 1000;
/** Previews older than this can't be emailed (they're stale by then). */
export const MAX_PREVIEW_AGE_MS = 7 * 24 * 60 * 60 * 1000;
/** Abuse caps: a network / a recipient can only opt in a few times a day. */
export const MAX_OPTINS_PER_NETWORK_PER_DAY = 4;
export const MAX_OPTINS_PER_EMAIL_PER_DAY = 3;

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const email = raw.trim().toLowerCase();
  if (email.length < 6 || email.length > 254) return null;
  if (!/^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i.test(email)) return null;
  return email;
}

/** Shoppers who reach checkout and enter their email but don't pay get the
 *  same single reminder, sooner (they were told under the email field). */
export const CHECKOUT_REMINDER_DELAY_MS = 3 * 60 * 60 * 1000;

export function checkoutReminderDueAt(startedAt: Date): Date {
  return new Date(startedAt.getTime() + CHECKOUT_REMINDER_DELAY_MS);
}

export function reminderDueAt(optedInAt: Date): Date {
  return new Date(optedInAt.getTime() + REMINDER_DELAY_MS);
}

export type ReminderDecision =
  | { send: true }
  | { send: false; reason: "already_sent" | "not_due" | "paid" | "preview_gone" };

export function decideReminder(input: {
  now: Date;
  dueAt: Date;
  reminderSentAt: Date | null;
  previewExists: boolean;
  hasPaidOrder: boolean;
}): ReminderDecision {
  if (input.reminderSentAt) return { send: false, reason: "already_sent" };
  if (input.now.getTime() < input.dueAt.getTime()) return { send: false, reason: "not_due" };
  if (!input.previewExists) return { send: false, reason: "preview_gone" };
  if (input.hasPaidOrder) return { send: false, reason: "paid" };
  return { send: true };
}

/** Public link that reopens this exact preview on the product page. */
export function savedPreviewLink(skuSlug: string, token: string): string {
  return `https://nyzora.ai/originals/${encodeURIComponent(skuSlug)}?saved=${encodeURIComponent(token)}`;
}

/**
 * What the preview emails call this piece. Only pet pieces get the pet's name
 * and pet-specific wording ("doesn't look like your pet", "another photo");
 * baby and wedding pieces are named by the piece itself, because their heading
 * is lettering (a baby's name, coordinates), not who the piece is of.
 */
export function previewEmailSubject(
  skuSlug: string,
  personalization: unknown,
): { kind: "pet" | "piece"; petName: string; pieceName: string } {
  const isPet = PHOTO_PERSONALIZED_SKUS.has(skuSlug);
  const p = (personalization ?? {}) as Record<string, unknown>;
  const raw = typeof p.heading === "string" ? p.heading : typeof p.petName === "string" ? p.petName : "";
  return {
    kind: isPet ? "pet" : "piece",
    petName: isPet ? raw.trim().slice(0, 40) : "",
    pieceName: isPet ? "" : SKU_NAMES[skuSlug] ?? "Nyzora piece",
  };
}
