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

export function classifyCoatPixel(r: number, g: number, b: number): CoatColorKey | null {
  const { h, s, v } = toHsv(r, g, b);
  // Grass, leaves, sky, blue walls: not the pet.
  if (s > 0.18 && h >= 70 && h <= 260) return null;
  if (v < 0.2) return "charcoal";
  if (s >= 0.28 && (h < 50 || h >= 330)) {
    if ((h >= 330 || h < 12) && v > 0.75 && s < 0.5) return "blush";
    return "sand";
  }
  if (v > 0.82) return "bone";
  if (v > 0.62) return "marble";
  if (v > 0.33) return "slate";
  return "charcoal";
}

export function pickCoatColor(data: ArrayLike<number>): CoatColorKey | null {
  const votes: Partial<Record<CoatColorKey, number>> = {};
  let counted = 0;
  for (let i = 0; i + 2 < data.length; i += 4) {
    const key = classifyCoatPixel(data[i], data[i + 1], data[i + 2]);
    if (!key) continue;
    votes[key] = (votes[key] ?? 0) + 1;
    counted++;
  }
  if (!counted) return null;
  // Blush only wins with a clear majority: pink tongues and blankets are common, pink coats aren't.
  if (votes.blush && votes.blush < counted * 0.5) delete votes.blush;
  const winner = (Object.entries(votes) as [CoatColorKey, number][]).sort((a, b) => b[1] - a[1])[0];
  return winner ? winner[0] : null;
}
