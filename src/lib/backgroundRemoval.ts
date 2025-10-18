import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = false;

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

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    return true;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0);
  return false;
}

export const removeBackground = async (imageElement: HTMLImageElement): Promise<Blob> => {
  try {
    console.log('Starting background removal process...');
    const segmenter = await pipeline('image-segmentation', 'Xenova/segformer-b0-finetuned-ade-512-512', {
      device: 'webgpu',
    });
    
    // Convert HTMLImageElement to canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error('Could not get canvas context');
    
    // Resize image if needed and draw it to canvas
    const wasResized = resizeImageIfNeeded(canvas, ctx, imageElement);
    console.log(`Image ${wasResized ? 'was' : 'was not'} resized. Final dimensions: ${canvas.width}x${canvas.height}`);
    
    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    console.log('Image converted to base64');
    
    // Process the image with the segmentation model
    console.log('Processing with segmentation model...');
    const result = await segmenter(imageData);
    
    console.log('Segmentation result:', result);
    
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error('Invalid segmentation result');
    }
    
    // Furniture-related labels to keep
    const furnitureLabels = ['table', 'chair', 'desk', 'sofa', 'bed', 'cabinet', 'shelf', 'bench', 'stool', 'ottoman', 'armchair'];
    
    // Find furniture masks
    const furnitureMasks = result.filter(r => 
      furnitureLabels.some(label => r.label.toLowerCase().includes(label))
    );
    
    console.log('Found furniture masks:', furnitureMasks.map(m => m.label));
    
    // Create a new canvas for the masked image
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = canvas.width;
    outputCanvas.height = canvas.height;
    const outputCtx = outputCanvas.getContext('2d');
    
    if (!outputCtx) throw new Error('Could not get output canvas context');
    
    // Draw original image
    outputCtx.drawImage(canvas, 0, 0);
    
    // Apply the mask
    const outputImageData = outputCtx.getImageData(
      0, 0,
      outputCanvas.width,
      outputCanvas.height
    );
    const data = outputImageData.data;
    
    // Create combined furniture mask
    const combinedMask = new Uint8Array(canvas.width * canvas.height);
    
    if (furnitureMasks.length > 0) {
      // Combine all furniture masks
      for (const furnitureMask of furnitureMasks) {
        if (furnitureMask.mask && furnitureMask.mask.data) {
          for (let i = 0; i < furnitureMask.mask.data.length; i++) {
            combinedMask[i] = Math.max(combinedMask[i], furnitureMask.mask.data[i]);
          }
        }
      }
      
      // Apply the combined mask to keep furniture
      for (let i = 0; i < combinedMask.length; i++) {
        const alpha = combinedMask[i];
        data[i * 4 + 3] = alpha;
      }
    } else {
      // No furniture detected - keep the most prominent object (usually the first non-background)
      console.log('No furniture detected, using first segment');
      const firstMask = result.find(r => !['sky', 'wall', 'floor', 'ceiling'].includes(r.label.toLowerCase()));
      if (firstMask && firstMask.mask) {
        for (let i = 0; i < firstMask.mask.data.length; i++) {
          data[i * 4 + 3] = firstMask.mask.data[i];
        }
      }
    }
    
    outputCtx.putImageData(outputImageData, 0, 0);
    console.log('Mask applied successfully');
    
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      outputCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('Successfully created final blob');
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        'image/png',
        1.0
      );
    });
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};

export const processImageUrl = async (imageUrl: string): Promise<string> => {
  try {
    // Fetch the image
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // Load as HTMLImageElement
    const img = await loadImage(blob);
    
    // Remove background
    const processedBlob = await removeBackground(img);
    
    // Convert to data URL
    return URL.createObjectURL(processedBlob);
  } catch (error) {
    console.error('Error processing image:', error);
    return imageUrl; // Return original if processing fails
  }
};
