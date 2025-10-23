/**
 * Canvas-based color transformation that preserves backgrounds
 * and only colorizes the furniture/product in the image
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

// Detect if a pixel is likely background (white/very light)
const isBackgroundPixel = (r: number, g: number, b: number, threshold = 240): boolean => {
  return r > threshold && g > threshold && b > threshold;
};

// Convert RGB to HSL for color manipulation
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
};

// Convert HSL back to RGB
const hslToRgb = (h: number, s: number, l: number): RGB => {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

// Apply color transformation based on selected color
const transformColor = (r: number, g: number, b: number, color: string): RGB => {
  const [h, s, l] = rgbToHsl(r, g, b);

  switch (color.toLowerCase()) {
    case 'black':
      // Darken significantly while preserving some texture
      return {
        r: Math.round(r * 0.15),
        g: Math.round(g * 0.15),
        b: Math.round(b * 0.15),
      };

    case 'white':
      // Lighten while preserving texture
      return {
        r: Math.min(255, Math.round(r * 1.5 + 50)),
        g: Math.min(255, Math.round(g * 1.5 + 50)),
        b: Math.min(255, Math.round(b * 1.5 + 50)),
      };

    case 'gray':
      // Desaturate and adjust lightness
      const gray = (r + g + b) / 3;
      const grayAdjusted = gray * 0.7 + 40;
      return {
        r: Math.round(grayAdjusted),
        g: Math.round(grayAdjusted),
        b: Math.round(grayAdjusted),
      };

    case 'brown':
    case 'wood finish':
      // Shift to brown/wood tones (hue around 25-35)
      const brownHue = 30;
      const brownRgb = hslToRgb(brownHue, Math.min(70, s), l * 0.8);
      return brownRgb;

    case 'blue':
      // Shift to blue tones (hue around 210-240)
      const blueHue = 220;
      const blueRgb = hslToRgb(blueHue, Math.min(80, s + 20), l);
      return blueRgb;

    case 'beige':
      // Warm, light neutral
      const beigeRgb = hslToRgb(40, 30, Math.max(l, 70));
      return beigeRgb;

    default:
      // Keep original color
      return { r, g, b };
  }
};

// Apply finish effects
const applyFinish = (r: number, g: number, b: number, finish: string): RGB => {
  switch (finish.toLowerCase()) {
    case 'glossy':
      // Increase contrast and brightness
      return {
        r: Math.min(255, Math.round(r * 1.15 + 10)),
        g: Math.min(255, Math.round(g * 1.15 + 10)),
        b: Math.min(255, Math.round(b * 1.15 + 10)),
      };

    case 'textured':
      // Slight randomization for texture effect
      const variation = (Math.random() - 0.5) * 10;
      return {
        r: Math.max(0, Math.min(255, r + variation)),
        g: Math.max(0, Math.min(255, g + variation)),
        b: Math.max(0, Math.min(255, b + variation)),
      };

    case 'polished':
      // Subtle brightness increase
      return {
        r: Math.min(255, Math.round(r * 1.08)),
        g: Math.min(255, Math.round(g * 1.08)),
        b: Math.min(255, Math.round(b * 1.08)),
      };

    case 'metallic':
      // Increase contrast, slight desaturation
      const [h, s, l] = rgbToHsl(r, g, b);
      const metallic = hslToRgb(h, s * 0.7, l * 1.1);
      return metallic;

    case 'matte':
    case 'natural':
    default:
      // Keep as is
      return { r, g, b };
  }
};

/**
 * Apply color and finish transformation to a furniture image
 * Only affects the furniture, preserves the background
 */
export const applyColorTransformToFurniture = (
  imageUrl: string,
  color: string,
  finish: string
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Get pixel data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Process each pixel
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Skip background pixels
          if (isBackgroundPixel(r, g, b)) {
            continue;
          }

          // Apply color transformation
          let transformed = transformColor(r, g, b, color);

          // Apply finish effect
          transformed = applyFinish(transformed.r, transformed.g, transformed.b, finish);

          // Update pixel data
          data[i] = transformed.r;
          data[i + 1] = transformed.g;
          data[i + 2] = transformed.b;
          // Alpha channel (data[i + 3]) remains unchanged
        }

        // Put the modified data back
        ctx.putImageData(imageData, 0, 0);

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = imageUrl;
  });
};
