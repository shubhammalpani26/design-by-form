import { supabase } from "@/integrations/supabase/client";

// In-memory cache for processed URLs
const processedUrlCache = new Map<string, string>();

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
      // Cache and return the result (it's a base64 data URL from the AI)
      const resultUrl = data.imageUrl.startsWith('data:') 
        ? data.imageUrl 
        : `data:image/png;base64,${data.imageUrl}`;
      processedUrlCache.set(imageUrl, resultUrl);
      return resultUrl;
    }

    // Fallback to original
    return imageUrl;
  } catch (error) {
    console.error('AI background removal failed:', error);
    return imageUrl;
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
