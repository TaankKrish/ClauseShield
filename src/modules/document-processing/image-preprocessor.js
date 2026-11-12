/**
 * Canvas API Image Preprocessor
 * Enhances scanned agreement pages for improved Tesseract OCR accuracy.
 * Executes in browser Canvas; gracefully passes through in headless environments.
 */

/**
 * Preprocesses an image Source (File, Blob, ImageData, HTMLImageElement, HTMLCanvasElement)
 * Applies grayscale conversion and contrast enhancement.
 *
 * @param {Blob|File|HTMLImageElement|string} imageSource
 * @param {object} [options]
 * @param {boolean} [options.contrast=true] - Apply contrast stretching
 * @param {boolean} [options.threshold=false] - Apply adaptive binarization
 * @returns {Promise<Blob|HTMLCanvasElement|string>} Preprocessed image or original if headless
 */
export async function preprocessImageForOcr(imageSource, options = { contrast: true, threshold: false }) {
  // If running in headless/Node environment without DOM Canvas, pass through source safely
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.createElement) {
    return imageSource;
  }

  try {
    const canvas = document.createElement('canvas');
    let ctx = null;
    try {
      ctx = typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null;
    } catch (_ctxErr) {
      return imageSource;
    }

    if (!ctx) return imageSource;

    let imgElement;
    if (imageSource instanceof HTMLImageElement) {
      imgElement = imageSource;
    } else {
      imgElement = await loadImageElement(imageSource);
    }

    canvas.width = imgElement.naturalWidth || imgElement.width || 800;
    canvas.height = imgElement.naturalHeight || imgElement.height || 1000;

    // Draw original image to canvas
    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Grayscale conversion & dynamic range evaluation
    let minLum = 255;
    let maxLum = 0;

    for (let i = 0; i < data.length; i += 4) {
      // Perceptual luminance calculation (ITU-R BT.601)
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      data[i] = lum;
      data[i + 1] = lum;
      data[i + 2] = lum;

      if (lum < minLum) minLum = lum;
      if (lum > maxLum) maxLum = lum;
    }

    // Contrast stretching / normalization
    if (options.contrast && maxLum > minLum) {
      const range = maxLum - minLum;
      for (let i = 0; i < data.length; i += 4) {
        const normalized = Math.round(((data[i] - minLum) / range) * 255);
        data[i] = normalized;
        data[i + 1] = normalized;
        data[i + 2] = normalized;
      }
    }

    // Optional binarization thresholding
    if (options.threshold) {
      const threshold = 128;
      for (let i = 0; i < data.length; i += 4) {
        const val = data[i] > threshold ? 255 : 0;
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }
    }

    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob || imageSource);
      }, 'image/png');
    });
  } catch (_err) {
    // Graceful fallback to raw image source on any canvas error
    return imageSource;
  }
}

function loadImageElement(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);

    if (source instanceof Blob || source instanceof File) {
      img.src = URL.createObjectURL(source);
    } else if (typeof source === 'string') {
      img.src = source;
    } else {
      reject(new Error('Unsupported image source type'));
    }
  });
}
