// Lazy-load @huggingface/transformers only when actually needed
let pipelinePromise: Promise<any> | null = null;

const MAX_IMAGE_DIMENSION = 1024;

function resizeImageIfNeeded(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, image: HTMLImageElement) {
  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
}

async function getSegmentationPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = import('@huggingface/transformers').then(async (module) => {
      module.env.allowLocalModels = false;
      module.env.useBrowserCache = false;
      return module.pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
        device: 'wasm',
      });
    });
  }
  return pipelinePromise;
}

// Simple URL processing cache using Map (not localStorage to avoid quota issues)
const processedUrlCache = new Map<string, string>();

export async function processImageUrl(imageUrl: string): Promise<string> {
  // Check in-memory cache first
  if (processedUrlCache.has(imageUrl)) {
    return processedUrlCache.get(imageUrl)!;
  }

  try {
    // Create a proxy URL if needed for CORS
    const proxyUrl = imageUrl.startsWith('data:') ? imageUrl : imageUrl;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const loadedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = proxyUrl;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    resizeImageIfNeeded(canvas, ctx, loadedImage);
    
    const processedUrl = canvas.toDataURL('image/png');
    
    // Cache the result in memory
    processedUrlCache.set(imageUrl, processedUrl);
    
    return processedUrl;
  } catch (error) {
    console.error('Error processing image:', error);
    return imageUrl;
  }
}

export async function removeBackground(imageUrl: string): Promise<string> {
  try {
    const segmenter = await getSegmentationPipeline();
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    const loadedImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    resizeImageIfNeeded(canvas, ctx, loadedImage);
    
    const dataUrl = canvas.toDataURL('image/png');
    const results = await segmenter(dataUrl);
    
    if (results && results.length > 0) {
      // Find the main object segment
      const mainSegment = results.find((r: any) => 
        r.label && !['wall', 'floor', 'ceiling', 'sky', 'ground'].includes(r.label.toLowerCase())
      ) || results[0];
      
      if (mainSegment?.mask) {
        return mainSegment.mask;
      }
    }
    
    return dataUrl;
  } catch (error) {
    console.error('Background removal failed:', error);
    return imageUrl;
  }
}
