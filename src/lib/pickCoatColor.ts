/**
 * Pure coat-colour classifier used to default the sculpture colour to the pet.
 * Takes RGBA pixel data (e.g. from a canvas) and returns one of the six
 * Originals colour keys. Background greenery and sky are ignored, and warm
 * brown/golden coats map to Sand even in shadow, so a golden on a lawn is not
 * mistaken for grey.
 */
export type CoatColorKey = "bone" | "charcoal" | "marble" | "slate" | "sand" | "blush";

function toHsv(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d > 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

type CoatGroup = "sand" | "blush" | "charcoal" | "neutral";

/** Sorts one pixel into a coat group; null for background greenery/sky. */
export function classifyCoatPixel(r: number, g: number, b: number): { group: CoatGroup; v: number } | null {
  const { h, s, v } = toHsv(r, g, b);
  // Grass, leaves, sky, blue walls: not the pet.
  if (s > 0.18 && h >= 70 && h <= 260) return null;
  if (v < 0.22) return { group: "charcoal", v };
  if (s >= 0.28 && (h < 50 || h >= 330)) {
    if ((h >= 330 || h < 12) && v > 0.75 && s < 0.5) return { group: "blush", v };
    return { group: "sand", v };
  }
  return { group: "neutral", v };
}

export function pickCoatColor(data: ArrayLike<number>): CoatColorKey | null {
  const votes: Record<CoatGroup, number> = { sand: 0, blush: 0, charcoal: 0, neutral: 0 };
  const neutralV: number[] = [];
  let counted = 0;
  for (let i = 0; i + 2 < data.length; i += 4) {
    const px = classifyCoatPixel(data[i], data[i + 1], data[i + 2]);
    if (!px) continue;
    votes[px.group]++;
    if (px.group === "neutral") neutralV.push(px.v);
    counted++;
  }
  if (!counted) return null;
  // Blush only wins with a clear majority: pink tongues and blankets are common, pink coats aren't.
  if (votes.blush < counted * 0.5) votes.blush = 0;
  const winner = (Object.entries(votes) as [CoatGroup, number][]).sort((a, b) => b[1] - a[1])[0][0];
  if (winner !== "neutral") return winner;
  // White fur photographs grey in shade, so judge the coat by its lighter pixels.
  neutralV.sort((a, b) => a - b);
  const light = neutralV[Math.floor(neutralV.length * 0.75)];
  if (light > 0.8) return "bone";
  if (light > 0.62) return "marble";
  return "slate";
}
