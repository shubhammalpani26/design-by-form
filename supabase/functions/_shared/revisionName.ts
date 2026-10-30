/**
 * Pulls a new pet name out of a customer's free-text revision.
 *
 * Why: a buyer typed "Hampt" in the name box, then asked the re-render to fix
 * it ("Name is Hampton"). The render showed HAMPTON but the lettering on the
 * print file followed the stale name box (HAMPT) — Oct 2026. The name the
 * render shows and the name we letter must come from one place.
 *
 * Errs toward returning null: a missed rename leaves the buyer's own name box,
 * but a wrong "name" would be raised on the paid print (QA, Oct 2026).
 */
const END = String.raw`["'”’]?\s*(?:[.,;!?)]|$|\s+(?:and|but|please|pls|instead|not|thanks|thank)\b)`;
const OPEN = String.raw`["'“‘]?`;
const NAME = String.raw`([a-z][a-z' .-]{0,30}?)`;

const PATTERNS: RegExp[] = [
  // "name is Hampton", "his name should be Hampton", "name = Hampton"
  new RegExp(String.raw`\bname\s*(?:is|should\s+be|should\s+read|must\s+be|reads?|=|:|-)\s*` + OPEN + NAME + END, "i"),
  // "change (the) name to Hampton", "rename to Hampton", "spell it Hampton"
  new RegExp(String.raw`\b(?:change|fix|update|correct|make)\s+(?:the\s+|his\s+|her\s+|their\s+)?name\s+(?:to|as|into)\s+` + OPEN + NAME + END, "i"),
  new RegExp(String.raw`\brename\s+(?:it\s+|him\s+|her\s+)?(?:to\s+)?` + OPEN + NAME + END, "i"),
  new RegExp(String.raw`\bspell(?:ed|t)?\s+(?:it|the\s+name|his\s+name|her\s+name)\s+(?:as\s+)?` + OPEN + NAME + END, "i"),
  // "name is spelled wrong, it should be Bella"
  new RegExp(String.raw`\bname\b[^.!?]*?\b(?:should\s+be|should\s+read|must\s+be)\s+` + OPEN + NAME + END, "i"),
];

// Words that describe the lettering rather than name the pet. If any word of
// the candidate is one of these, it is a complaint ("the name is too small",
// "name is not centered"), not a new name — keep the name box unchanged.
// Erring this way is safe: a missed rename leaves the buyer's own name box.
const NOT_A_NAME = new Set([
  "the", "it", "a", "an", "my", "his", "her", "their", "this", "that", "its",
  "not", "no", "too", "very", "so", "bit", "little", "more", "less", "quite", "really", "kind", "sort",
  "still", "now", "currently", "barely", "hardly", "also", "just", "only",
  "big", "bigger", "large", "larger", "small", "smaller", "tiny", "huge", "thin", "thick", "tall", "short",
  "bold", "bolder", "raised", "clearer", "clear", "unclear", "centered", "centred", "center", "centre",
  "off", "crooked", "tilted", "uneven", "lopsided", "faint", "blurry", "blurred", "visible", "invisible",
  "readable", "unreadable", "legible", "illegible", "hard", "difficult", "easy",
  "wrong", "incorrect", "correct", "right", "misspelled", "misspelt", "spelled", "spelt", "typo",
  "missing", "gone", "cut", "cropped", "hidden", "covered", "showing", "shown", "printed", "written",
  "placed", "positioned", "upside", "down", "backwards", "reversed", "mirrored", "sideways",
  "left", "on", "in", "at", "of", "to", "side", "back", "front", "top", "bottom",
  "font", "size", "text", "letters", "lettering", "engraving", "name", "same", "fine", "ok", "okay", "good", "great",
  "perfect", "bad", "ugly", "weird", "strange", "different", "changed", "there", "here",
]);

export function nameFromRevision(revision: string | null | undefined, maxLength = 18): string | null {
  const text = String(revision ?? "").trim();
  if (!text) return null;
  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    const raw = match?.[1]?.trim().replace(/[\s.'-]+$/, "");
    if (!raw) continue;
    if (raw.length > maxLength) continue;
    const words = raw.toLowerCase().split(/[\s.-]+/).filter(Boolean);
    if (words.length > 3) continue;
    if (words.some((word) => NOT_A_NAME.has(word.replace(/'s$|'/g, "")))) continue;
    return raw;
  }
  return null;
}
