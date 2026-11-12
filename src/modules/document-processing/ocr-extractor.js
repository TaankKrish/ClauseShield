/**
 * Client-Side OCR Extractor using Tesseract.js
 * Used for scanned agreements, photograph captures, and image attachments.
 */

/**
 * Extracts text from an image File or Canvas using Tesseract.js
 *
 * @param {File|Blob|HTMLCanvasElement|string} imageSource
 * @param {Function} [onProgress] - Optional progress callback (0 - 100)
 * @returns {Promise<import('../../../docs/MODULE_CONTRACTS.md').DocumentExtractionResult>}
 */
export async function extractTextFromImage(imageSource, onProgress = () => {}) {
  const documentId = `DOC-OCR-${Date.now().toString(36).toUpperCase()}`;
  const warnings = [];

  try {
    const { createWorker } = await import('tesseract.js');
    const worker = await createWorker('eng');

    const ret = await worker.recognize(imageSource, {}, {
      logger: (m) => {
        if (m.status === 'recognizing text' && typeof m.progress === 'number') {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const fullText = ret.data.text || '';
    await worker.terminate();

    return {
      documentId,
      pages: [{ pageNumber: 1, text: fullText }],
      fullText,
      extractionMethod: 'tesseract',
      success: true,
      warnings,
    };
  } catch (error) {
    return {
      documentId,
      pages: [],
      fullText: '',
      extractionMethod: 'tesseract',
      success: false,
      warnings: [`OCR recognition failed: ${error.message || 'Unknown error'}`],
    };
  }
}

