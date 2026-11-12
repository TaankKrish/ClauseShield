/**
 * Client-Side PDF Text Extractor using PDF.js
 * Runs locally inside the browser. Document bytes never leave local memory.
 */

/**
 * Extracts continuous text and page chunks from an uploaded PDF File object.
 *
 * @param {File|Blob|ArrayBuffer} fileInput
 * @returns {Promise<import('../../../docs/MODULE_CONTRACTS.md').DocumentExtractionResult>}
 */
export async function extractTextFromPdf(fileInput) {
  const documentId = `DOC-${Date.now().toString(36).toUpperCase()}`;
  const warnings = [];

  try {
    // Dynamic import to prevent SSR/Node test environment breakage
    const pdfjsLib = await import('pdfjs-dist');

    // In browser, set workerSrc to bundled or CDN worker if not already configured
    if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
    }

    let arrayBuffer;
    if (fileInput instanceof ArrayBuffer) {
      arrayBuffer = fileInput;
    } else if (fileInput && typeof fileInput.arrayBuffer === 'function') {
      arrayBuffer = await fileInput.arrayBuffer();
    } else {
      throw new Error('Invalid file input provided to extractTextFromPdf');
    }

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const pages = [];
    let fullText = '';

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items.map((item) => item.str || '');
      const pageText = pageStrings.join(' ');

      pages.push({
        pageNumber: pageNum,
        text: pageText,
      });

      fullText += (pageNum > 1 ? '\n\n' : '') + pageText;
    }

    if (fullText.trim().length === 0) {
      warnings.push('Document contains no selectable digital text. Scanned document OCR may be required.');
    }

    return {
      documentId,
      pages,
      fullText,
      extractionMethod: 'pdfjs',
      success: true,
      warnings,
    };
  } catch (error) {
    return {
      documentId,
      pages: [],
      fullText: '',
      extractionMethod: 'pdfjs',
      success: false,
      warnings: [`PDF extraction error: ${error.message || 'Unknown error'}`],
    };
  }
}
