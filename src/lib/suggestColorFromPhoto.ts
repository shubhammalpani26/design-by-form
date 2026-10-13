import { ORIGINALS_COLORS } from "@/lib/originalsColors";

/**
 * Picks the sellable colour closest to the pet's coat, on-device and free.
 * Samples the centre of the photo (where the pet usually is) and matches the
 * median-ish average against our six swatches. Falls back to null on error.
 */
export async function suggestColorFromPhoto(dataUrl: string): Promise<string | null> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // Centre 50% of the frame.
    const sx = img.naturalWidth * 0.25, sy = img.naturalHeight * 0.25;
    ctx.drawImage(img, sx, sy, img.naturalWidth * 0.5, img.naturalHeight * 0.5, 0, 0, size, size);
    const { data } = ctx.getImageData(0, 0, size, size);

    // Vote per pixel for nearest swatch; the most-voted swatch wins.
    const swatches = ORIGINALS_COLORS.map((c) => {
      const h = c.swatch.replace("#", "");
      return { key: c.key, r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
    });
    const votes: Record<string, number> = {};
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      let best = swatches[0].key, bestD = Infinity;
      for (const s of swatches) {
        // Weighted RGB distance (closer to perceived difference).
        const d = 2 * (r - s.r) ** 2 + 4 * (g - s.g) ** 2 + 3 * (b - s.b) ** 2;
        if (d < bestD) { bestD = d; best = s.key; }
      }
      votes[best] = (votes[best] ?? 0) + 1;
    }
    // Blush only wins with a clear majority — pink coats are rare, pink backgrounds aren't.
    if (votes.blush && votes.blush < data.length / 4 * 0.5) delete votes.blush;
    const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0];
    return winner ? winner[0] : null;
  } catch {
    return null;
  }
}
