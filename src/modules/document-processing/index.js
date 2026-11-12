/**
 * Document Processing Module
 * Unified entry point for client-side PDF extraction and Tesseract OCR.
 */

import { extractTextFromPdf, validatePdfInput, MAX_PDF_FILE_SIZE_BYTES } from './pdf-extractor.js';
import { extractTextFromImage, validateImageInput, MAX_IMAGE_FILE_SIZE_BYTES } from './ocr-extractor.js';
import { preprocessImageForOcr } from './image-preprocessor.js';

/**
 * Universal document processor that inspects file format and executes
 * the optimal local extraction method (PDF.js or Tesseract OCR).
 *
 * @param {File|Blob|ArrayBuffer} file
 * @param {object} [options]
 * @param {string} [options.fileName]
 * @param {Function} [options.onProgress]
 * @returns {Promise<import('../../../docs/MODULE_CONTRACTS.md').DocumentExtractionResult>}
 */
export async function processDocument(file, options = {}) {
  const fileName = options.fileName || (file && file.name) || '';
  const fileType = (file && file.type) || '';

  if (!file) {
    return {
      documentId: `DOC-ERR-${Date.now()}`,
      fileName: 'unknown',
      pages: [],
      fullText: '',
      extractionMethod: 'manual',
      success: false,
      warnings: ['No file provided for document processing.'],
    };
  }

  // Check if PDF
  const isPdf = (fileType === 'application/pdf') || /\.pdf$/i.test(fileName);
  if (isPdf) {
    return extractTextFromPdf(file, options);
  }

  // Check if image
  const isImage = fileType.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(fileName);
  if (isImage) {
    return extractTextFromImage(file, options);
  }

  return {
    documentId: `DOC-UNSUPPORTED-${Date.now()}`,
    fileName: fileName || 'unsupported_file',
    pages: [],
    fullText: '',
    extractionMethod: 'manual',
    success: false,
    warnings: [`Unsupported document type '${fileType || fileName}'. Please upload a PDF or image (JPG/PNG).`],
  };
}

export {
  extractTextFromPdf,
  validatePdfInput,
  MAX_PDF_FILE_SIZE_BYTES,
  extractTextFromImage,
  validateImageInput,
  MAX_IMAGE_FILE_SIZE_BYTES,
  preprocessImageForOcr,
};

