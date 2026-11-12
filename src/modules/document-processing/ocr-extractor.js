/**
 * Client-Side OCR Extractor using Tesseract.js & Canvas Preprocessing
 * Used for scanned agreements, photograph captures, and image attachments.
 */

import { preprocessImageForOcr } from './image-preprocessor.js';

export const MAX_IMAGE_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit
export const SUPPORTED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validates whether an image input meets format and size boundaries.
 *
 * @param {File|Blob|string} imageSource
 * @param {string} [fileName]
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateImageInput(imageSource, fileName = '') {
  if (!imageSource) {
    return { valid: false, error: 'No image source provided.' };
  }

  const size = imageSource.size || null;
  if (size !== null && size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image size exceeds 15MB limit (${(size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller image.`,
    };
  }

  const name = fileName || (imageSource && imageSource.name) || '';
  const type = (imageSource && imageSource.type) || '';

  const hasValidExt = /\.(jpe?g|png|webp)$/i.test(name);
  const hasValidMime = SUPPORTED_IMAGE_MIME_TYPES.includes(type.toLowerCase());

  if (name && !hasValidExt && type && !hasValidMime) {
    return {
      valid: false,
      error: `Unsupported image format (${type || name}). Please upload a JPG, JPEG, or PNG image.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Extracts text from an image File, Blob, or Canvas using Tesseract.js with optional Canvas preprocessing.
 *
 * @param {File|Blob|HTMLCanvasElement|string} imageSource
 * @param {object} [options]
 * @param {Function} [options.onProgress] - Progress callback receiving { percent: number, status: string }
 * @param {boolean} [options.preprocess=true] - Whether to apply contrast stretching
 * @param {string} [options.fileName]
 * @param {string} [options.language='eng'] - OCR language
 * @returns {Promise<{
 *   documentId: string,
 *   fileName: string,
 *   pages: Array<{ pageNumber: number, text: string }>,
 *   fullText: string,
 *   extractionMethod: 'tesseract',
 *   success: boolean,
 *   warnings: string[]
 * }>}
 */
export async function extractTextFromImage(imageSource, options = {}) {
  const fileName = options.fileName || (imageSource && imageSource.name) || 'image_scan.jpg';
  const documentId = `DOC-OCR-${Date.now().toString(36).toUpperCase()}`;
  const warnings = [];
  const onProgress = options.onProgress || (() => {});

  const validation = validateImageInput(imageSource, fileName);
  if (!validation.valid) {
    return {
      documentId,
      fileName,
      pages: [],
      fullText: '',
      extractionMethod: 'tesseract',
      success: false,
      warnings: [validation.error],
    };
  }

  let worker = null;
  try {
    onProgress({ percent: 10, status: 'Preprocessing image quality...' });

    // Preprocess image contrast/grayscale if enabled
    let processedSource = imageSource;
    if (options.preprocess !== false) {
      processedSource = await preprocessImageForOcr(imageSource, { contrast: true, threshold: false });
    }

    onProgress({ percent: 25, status: 'Initializing OCR engine...' });
    const { createWorker } = await import('tesseract.js');
    const lang = options.language || 'eng';

    // Tesseract.js v5/v6: Logger callback must be configured on createWorker (main thread),
    // NOT passed inside worker.recognize() where postMessage fails to clone functions.
    worker = await createWorker(lang, 1, {
      logger: (m) => {
        if (!m || typeof m !== 'object') return;
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          const currentPct = 50 + Math.round(m.progress * 45);
          onProgress({
            percent: Math.min(95, currentPct),
            status: `Reading text lines (${Math.round(m.progress * 100)}%)...`,
          });
        }
      },
    });

    onProgress({ percent: 50, status: 'Recognizing text in document scan...' });
    const ret = await worker.recognize(processedSource);

    const fullText = (ret.data && ret.data.text ? ret.data.text.trim() : '');

    if (fullText.length === 0) {
      warnings.push('OCR completed but no readable text could be detected. The image might be blurry or low contrast.');
    }

    onProgress({ percent: 100, status: 'OCR recognition complete.' });

    return {
      documentId,
      fileName,
      pages: [{ pageNumber: 1, text: fullText }],
      fullText,
      extractionMethod: 'tesseract',
      success: true,
      warnings,
    };
  } catch (error) {
    return {
      documentId,
      fileName,
      pages: [],
      fullText: '',
      extractionMethod: 'tesseract',
      success: false,
      warnings: [`OCR recognition error: ${error.message || 'Unable to recognize text from image.'}`],
    };
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_termErr) {
        // Safe worker cleanup
      }
    }
  }
}
