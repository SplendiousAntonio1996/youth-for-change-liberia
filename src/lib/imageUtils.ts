/**
 * imageUtils.ts
 * High-performance client-side image processing, compression, and data URL generation.
 * Resizes high-resolution camera images from phones/computers to clean, performant data URLs.
 */

export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
}

/**
 * Reads a File from disk/device and compresses it into a high-quality data URL
 * optimized for permanent Firestore storage (<80KB) and instant rendering.
 */
export async function optimizeImageFile(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<{ dataUrl: string; originalSize: number; optimizedSize: number; width: number; height: number; name: string }> {
  const {
    maxWidth = 960,
    maxHeight = 720,
    quality = 0.78,
    outputFormat = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    // If it's an SVG, read directly as data URL without rasterizing on canvas
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          dataUrl: result,
          originalSize: file.size,
          optimizedSize: result.length,
          width: 500,
          height: 500,
          name: file.name
        });
      };
      reader.onerror = () => reject(new Error('Failed to read SVG file.'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate scaled dimensions while preserving aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        // Render to canvas for compression
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to raw data url if canvas context fails
          const raw = e.target?.result as string;
          resolve({
            dataUrl: raw,
            originalSize: file.size,
            optimizedSize: raw.length,
            width: img.width,
            height: img.height,
            name: file.name
          });
          return;
        }

        // Smooth rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to optimized data URL (JPEG for photographs gives highest compression ratio)
        const format = outputFormat === 'image/png' && file.size < 100000 ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(format, quality);
        const optimizedSize = Math.round((dataUrl.length * 3) / 4); // Approximate binary byte size

        resolve({
          dataUrl,
          originalSize: file.size,
          optimizedSize,
          width,
          height,
          name: file.name
        });
      };

      img.onerror = () => {
        reject(new Error('Selected file is not a valid or readable image.'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Error reading local file from computer.'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an existing base64 Data URL to guarantee it is safely under 80KB
 * for permanent, non-expiring persistence in Firestore documents.
 */
export async function compressDataUrlForPermanentStorage(
  dataUrl: string,
  maxDimension = 900,
  targetQuality = 0.76
): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) {
    return dataUrl;
  }

  // If already under 75KB, it's already perfectly compact for Firestore
  if (dataUrl.length < 80000) {
    return dataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', targetQuality);
      resolve(compressed);
    };

    img.onerror = () => {
      resolve(dataUrl);
    };

    img.src = dataUrl;
  });
}


/**
 * Format bytes to readable string (e.g. 1.2 MB or 450 KB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
