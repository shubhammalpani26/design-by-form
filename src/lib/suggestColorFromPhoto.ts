import { pickCoatColor } from "@/lib/pickCoatColor";

/**
 * Picks the sellable colour closest to the pet's coat, on-device and free.
 * Samples the centre of the photo (where the pet usually is), ignores
 * greenery/sky, and votes per pixel. Falls back to null on error.
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
    return pickCoatColor(data);
  } catch {
    return null;
  }
}
