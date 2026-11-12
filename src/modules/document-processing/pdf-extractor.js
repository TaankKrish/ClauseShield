/**
 * Client-Side PDF Text Extractor using PDF.js
 * Runs locally inside the browser. Document bytes never leave local memory.
 */

export const MAX_PDF_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB reasonable limit

/**
 * Validates whether a file input is a valid PDF within acceptable size limits.
 *
 * @param {File|Blob|ArrayBuffer} fileInput
 * @param {string} [fileName]
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validatePdfInput(fileInput, fileName = '') {
  if (!fileInput) {
    return { valid: false, error: 'No file input provided.' };
  }

  // Size validation
  const size = fileInput.size || (fileInput.byteLength !== undefined ? fileInput.byteLength : null);
  if (size !== null && size > MAX_PDF_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 15MB limit (${(size / (1024 * 1024)).toFixed(1)}MB). Please upload a smaller document.`,
    };
  }

  // Type / Extension validation
  const name = fileName || fileInput.name || '';
  const type = fileInput.type || '';
  if (name && !name.toLowerCase().endsWith('.pdf') && type && type !== 'application/pdf') {
    return {
      valid: false,
      error: `Unsupported file format. Expected a PDF document, got '${type || name}'.`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Extracts continuous text and per-page chunks from an uploaded PDF File or ArrayBuffer.
 *
 * @param {File|Blob|ArrayBuffer} fileInput
 * @param {object} [options]
 * @param {string} [options.fileName]
 * @returns {Promise<{
 *   documentId: string,
 *   fileName: string,
 *   pages: Array<{ pageNumber: number, text: string }>,
 *   fullText: string,
 *   extractionMethod: 'pdfjs',
 *   success: boolean,
 *   warnings: string[]
 * }>}
 */
export async function extractTextFromPdf(fileInput, options = {}) {
  const fileName = options.fileName || (fileInput && fileInput.name) || 'document.pdf';
  const documentId = `DOC-PDF-${Date.now().toString(36).toUpperCase()}`;
  const warnings = [];

  // 1. Input Validation
  const validation = validatePdfInput(fileInput, fileName);
  if (!validation.valid) {
    return {
      documentId,
      fileName,
      pages: [],
      fullText: '',
      extractionMethod: 'pdfjs',
      success: false,
      warnings: [validation.error],
    };
  }

  try {
    // Dynamic import of pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist');

    // In browser, configure workerSrc safely
    if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
    }

    let arrayBuffer;
    if (fileInput instanceof ArrayBuffer) {
      arrayBuffer = fileInput;
    } else if (fileInput && typeof fileInput.arrayBuffer === 'function') {
      arrayBuffer = await fileInput.arrayBuffer();
    } else if (fileInput instanceof Uint8Array) {
      arrayBuffer = fileInput.buffer;
    } else {
      throw new Error('Unsupported input format. Expected File, Blob, or ArrayBuffer.');
    }

    // Verify PDF header magic bytes (%PDF)
    const headerBytes = new Uint8Array(arrayBuffer.slice(0, 5));
    const headerString = String.fromCharCode.apply(null, headerBytes);
    if (!headerString.startsWith('%PDF')) {
      return {
        documentId,
        fileName,
        pages: [],
        fullText: '',
        extractionMethod: 'pdfjs',
        success: false,
        warnings: ['File header does not match valid PDF specification (%PDF header missing).'],
      };
    }

    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useSystemFonts: true,
      isEvalSupported: false,
    });

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    if (numPages === 0) {
      return {
        documentId,
        fileName,
        pages: [],
        fullText: '',
        extractionMethod: 'pdfjs',
        success: true,
        warnings: ['The PDF document contains 0 pages.'],
      };
    }

    const pages = [];
    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item) => (item.str !== undefined ? item.str : ''))
        .filter((str) => str.trim().length > 0);

      const pageText = pageStrings.join(' ').trim();

      pages.push({
        pageNumber: pageNum,
        text: pageText,
      });

      if (pageText.length > 0) {
        fullText += (fullText.length > 0 ? '\n\n' : '') + pageText;
      }
    }

    // Check for image-only or flattened scan PDF
    if (fullText.trim().length === 0) {
      warnings.push('Document contains no selectable digital text. This is likely an image-only or scanned PDF. OCR recognition is recommended.');
    }

    return {
      documentId,
      fileName,
      pages,
      fullText,
      extractionMethod: 'pdfjs',
      success: true,
      warnings,
    };
  } catch (error) {
    return {
      documentId,
      fileName,
      pages: [],
      fullText: '',
      extractionMethod: 'pdfjs',
      success: false,
      warnings: [`PDF parsing failed: ${error.message || 'Corrupted or password-protected PDF document.'}`],
    };
  }
}
