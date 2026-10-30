/**
 * Pulls a new pet name out of a customer's free-text revision.
 *
 * Why: a buyer typed "Hampt" in the name box, then asked the re-render to fix
 * it ("Name is Hampton"). The render showed HAMPTON but the lettering on the
 * print file followed the stale name box (HAMPT) — Oct 2026. The name the
 * render shows and the name we letter must come from one place.
 *
 * Kept identical to src/lib/revisionName.ts (the shop page mirrors it).
 */
const PATTERNS: RegExp[] = [
  // "name is Hampton", "his name should be Hampton", "name = Hampton"
  /\bname\s*(?:is|should\s+be|should\s+read|must\s+be|reads?|=|:|-)\s*["'“‘]?([a-z][a-z' .-]{0,30}?)["'”’]?\s*(?:[.,;!?)]|$|\s+(?:and|but|please|pls|instead|not|thanks|thank)\b)/i,
  // "change (the) name to Hampton", "rename to Hampton", "spell it Hampton"
  /\b(?:change|fix|update|correct|make)\s+(?:the\s+|his\s+|her\s+|their\s+)?name\s+(?:to|as|into)\s+["'“‘]?([a-z][a-z' .-]{0,30}?)["'”’]?\s*(?:[.,;!?)]|$|\s+(?:and|but|please|pls|instead|not|thanks|thank)\b)/i,
  /\brename\s+(?:it\s+|him\s+|her\s+)?(?:to\s+)?["'“‘]?([a-z][a-z' .-]{0,30}?)["'”’]?\s*(?:[.,;!?)]|$|\s+(?:and|but|please|pls|instead|not|thanks|thank)\b)/i,
  /\bspell(?:ed|t)?\s+(?:it|the\s+name|his\s+name|her\s+name)\s+(?:as\s+)?["'“‘]?([a-z][a-z' .-]{0,30}?)["'”’]?\s*(?:[.,;!?)]|$|\s+(?:and|but|please|pls|instead|not|thanks|thank)\b)/i,
];

const STOP = new Set(["the", "it", "a", "an", "bigger", "larger", "smaller", "bold", "bolder", "raised", "clearer", "centered", "centred"]);

export function nameFromRevision(revision: string | null | undefined, maxLength = 18): string | null {
  const text = String(revision ?? "").trim();
  if (!text) return null;
  for (const pattern of PATTERNS) {
    const match = text.match(pattern);
    const raw = match?.[1]?.trim().replace(/[\s.'-]+$/, "");
    if (!raw) continue;
    if (STOP.has(raw.toLowerCase())) continue;
    if (raw.length > maxLength) continue;
    return raw;
  }
  return null;
}
