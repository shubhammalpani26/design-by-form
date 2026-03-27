import { supabase } from "@/integrations/supabase/client";

// In-memory cache for processed URLs
const processedUrlCache = new Map<string, string>();

function normalizeReturnedImageUrl(rawValue: string): string {
  const value = rawValue.trim();

  if (value.startsWith("data:image/")) return value;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;

  // If backend returned base64 payload directly, normalize to PNG data URL.
  const base64Like = /^[A-Za-z0-9+/=\s]+$/.test(value) && value.length > 100;
  if (base64Like) {
    return `data:image/png;base64,${value.replace(/\s+/g, "")}`;
  }

  return value;
}

async function stripEdgeWhiteBackground(imageUrl: string): Promise<string> {
  if (!imageUrl.startsWith("data:image/")) return imageUrl;

  try {
    const img = new Image();
    img.crossOrigin = "anonymous";

    const loadedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = loadedImage.naturalWidth;
    canvas.height = loadedImage.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return imageUrl;

    ctx.drawImage(loadedImage, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { data, width, height } = imageData;

    const idx = (x: number, y: number) => (y * width + x) * 4;
    const cornerPoints = [
      [0, 0],
      [width - 1, 0],
      [0, height - 1],
      [width - 1, height - 1],
    ] as const;

    let bgR = 0;
    let bgG = 0;
    let bgB = 0;
    let bgSamples = 0;

    for (const [x, y] of cornerPoints) {
      const i = idx(x, y);
      if (data[i + 3] > 0) {
        bgR += data[i];
        bgG += data[i + 1];
        bgB += data[i + 2];
        bgSamples += 1;
      }
    }

    if (bgSamples === 0) return imageUrl;

    bgR /= bgSamples;
    bgG /= bgSamples;
    bgB /= bgSamples;

    const bgBrightness = (bgR + bgG + bgB) / 3;
    if (bgBrightness < 180) return imageUrl;

    const visited = new Uint8Array(width * height);
    const queue: number[] = [];

    const isBackgroundLike = (x: number, y: number) => {
      const i = idx(x, y);
      const a = data[i + 3];
      if (a === 0) return true;

      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      const colorDistance = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);

      return brightness > 185 && colorDistance < 80;
    };

    const enqueue = (x: number, y: number) => {
      if (x < 0 || x >= width || y < 0 || y >= height) return;
      const p = y * width + x;
      if (visited[p]) return;
      if (!isBackgroundLike(x, y)) return;
      visited[p] = 1;
      queue.push(p);
    };

    for (let x = 0; x < width; x++) {
      enqueue(x, 0);
      enqueue(x, height - 1);
    }
    for (let y = 0; y < height; y++) {
      enqueue(0, y);
      enqueue(width - 1, y);
    }

    let removedPixels = 0;

    while (queue.length > 0) {
      const p = queue.shift()!;
      const x = p % width;
      const y = Math.floor(p / width);
      const i = p * 4;

      if (data[i + 3] !== 0) {
        data[i + 3] = 0;
        removedPixels += 1;
      }

      enqueue(x + 1, y);
      enqueue(x - 1, y);
      enqueue(x, y + 1);
      enqueue(x, y - 1);
    }

    if (removedPixels < width * height * 0.01) {
      return imageUrl;
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return imageUrl;
  }
}

/**
 * Remove background from a furniture image using server-side AI.
 * Returns a data URL of the furniture with transparent background.
 */
export async function removeBackgroundAI(imageUrl: string): Promise<string> {
  // Check in-memory cache
  if (processedUrlCache.has(imageUrl)) {
    return processedUrlCache.get(imageUrl)!;
  }

  try {
    // If the image is not a data URL, we can send the URL directly
    // If it IS a data URL, send it as-is (the edge function handles both)
    const { data, error } = await supabase.functions.invoke('remove-background', {
      body: { imageUrl },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    if (data?.imageUrl) {
      const resultUrl = normalizeReturnedImageUrl(data.imageUrl);
      const cleanedResultUrl = await stripEdgeWhiteBackground(resultUrl);

      // Don't cache fallback/original output as a "processed" result.
      if (cleanedResultUrl !== imageUrl) {
        processedUrlCache.set(imageUrl, cleanedResultUrl);
      }

      return cleanedResultUrl;
    }

    // No processed URL returned; fallback to original
    return await stripEdgeWhiteBackground(imageUrl);
  } catch (error) {
    console.error('AI background removal failed:', error);
    return await stripEdgeWhiteBackground(imageUrl);
  }
}

/**
 * Simple image processing (resize only) - kept for non-AR uses.
 */
export async function processImageUrl(imageUrl: string): Promise<string> {
  if (processedUrlCache.has(imageUrl)) {
    return processedUrlCache.get(imageUrl)!;
  }

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const loadedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });

    const MAX_DIM = 1024;
    let width = loadedImage.naturalWidth;
    let height = loadedImage.naturalHeight;

    if (width > MAX_DIM || height > MAX_DIM) {
      if (width > height) {
        height = Math.round((height * MAX_DIM) / width);
        width = MAX_DIM;
      } else {
        width = Math.round((width * MAX_DIM) / height);
        height = MAX_DIM;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(loadedImage, 0, 0, width, height);

    const processedUrl = canvas.toDataURL('image/png');
    processedUrlCache.set(imageUrl, processedUrl);
    return processedUrl;
  } catch (error) {
    console.error('Error processing image:', error);
    return imageUrl;
  }
}
