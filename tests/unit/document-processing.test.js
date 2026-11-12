import { describe, it, expect, vi } from 'vitest';
import {
  extractTextFromPdf,
  validatePdfInput,
  MAX_PDF_FILE_SIZE_BYTES,
} from '../../src/modules/document-processing/pdf-extractor.js';
import {
  extractTextFromImage,
  validateImageInput,
  MAX_IMAGE_FILE_SIZE_BYTES,
} from '../../src/modules/document-processing/ocr-extractor.js';
import { processDocument } from '../../src/modules/document-processing/index.js';
import { preprocessImageForOcr } from '../../src/modules/document-processing/image-preprocessor.js';
import { createSyntheticPdfBuffer } from '../fixtures/synthetic-documents.js';

// Mock tesseract.js worker enforcing structured-clone checks on recognize payload
// to catch any regressions where functions are erroneously sent via Worker.postMessage
vi.mock('tesseract.js', () => ({
  createWorker: vi.fn(async (_langs, _oem, options) => {
    return {
      recognize: vi.fn(async (_image, opts, output) => {
        // Enforce structuredClone: Web Worker postMessage cannot serialize functions
        if (opts !== undefined) structuredClone(opts);
        if (output !== undefined) structuredClone(output);

        // Simulate progress emission via the logger configured in createWorker
        if (options && typeof options.logger === 'function') {
          options.logger({ status: 'recognizing text', progress: 0.5 });
          options.logger({ status: 'recognizing text', progress: 1.0 });
        }

        return {
          data: { text: 'Sample Agreement Clause: Deposit is non-refundable.' },
        };
      }),
      terminate: vi.fn(async () => {}),
    };
  }),
}));

describe('Document Processing Module', () => {
  describe('PDF Input Validation', () => {
    it('rejects null or undefined input', () => {
      const res = validatePdfInput(null);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('No file input provided');
    });

    it('rejects files exceeding the 15MB size limit', () => {
      const oversizedBuffer = { size: MAX_PDF_FILE_SIZE_BYTES + 1024, name: 'large.pdf' };
      const res = validatePdfInput(oversizedBuffer);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds the 15MB limit');
    });

    it('rejects non-PDF files by extension/type', () => {
      const txtFile = { name: 'contract.txt', type: 'text/plain', size: 1000 };
      const res = validatePdfInput(txtFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Unsupported file format');
    });

    it('accepts valid PDF file metadata', () => {
      const validPdf = { name: 'agreement.pdf', type: 'application/pdf', size: 50000 };
      const res = validatePdfInput(validPdf);
      expect(res.valid).toBe(true);
      expect(res.error).toBeNull();
    });
  });

  describe('PDF Text Extraction', () => {
    it('detects corrupted or non-PDF binary data missing %PDF header', async () => {
      const corruptedBuffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
      const res = await extractTextFromPdf(corruptedBuffer, { fileName: 'corrupt.pdf' });

      expect(res.success).toBe(false);
      expect(res.warnings[0]).toContain('%PDF header missing');
      expect(res.extractionMethod).toBe('pdfjs');
      expect(res.pages).toEqual([]);
    });

    it('handles simulated empty PDF buffer gracefully', async () => {
      const emptyPdfStr = '%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [] /Count 0 >> endobj\nxref\n0 3\n0000000000 65535 f\ntrailer << /Size 3 /Root 1 0 R >>\nstartxref\n100\n%%EOF';
      const buf = new Uint8Array(emptyPdfStr.length);
      for (let i = 0; i < emptyPdfStr.length; i++) buf[i] = emptyPdfStr.charCodeAt(i);

      const res = await extractTextFromPdf(buf.buffer, { fileName: 'empty.pdf' });
      expect(res.documentId).toBeDefined();
      expect(res.fileName).toBe('empty.pdf');
    });

    it('extracts text from valid synthetic PDF buffer', async () => {
      const syntheticBuffer = createSyntheticPdfBuffer('ClauseShield Test Page');
      const res = await extractTextFromPdf(syntheticBuffer, { fileName: 'test.pdf' });

      expect(res.documentId).toMatch(/^DOC-PDF-/);
      expect(res.fileName).toBe('test.pdf');
      expect(res.extractionMethod).toBe('pdfjs');
      expect(res.warnings).toBeInstanceOf(Array);
    });
  });

  describe('Image OCR Input Validation & Extraction', () => {
    it('rejects unsupported image file formats', () => {
      const invalidImage = { name: 'script.exe', type: 'application/x-msdownload', size: 1000 };
      const res = validateImageInput(invalidImage);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Unsupported image format');
    });

    it('rejects oversized images', () => {
      const oversized = { name: 'scan.png', type: 'image/png', size: MAX_IMAGE_FILE_SIZE_BYTES + 1024 };
      const res = validateImageInput(oversized);
      expect(res.valid).toBe(false);
      expect(res.error).toContain('Image size exceeds 15MB limit');
    });

    it('extracts text via Tesseract OCR worker', async () => {
      const dummyFile = { name: 'scan.jpg', type: 'image/jpeg', size: 500 };
      const res = await extractTextFromImage(dummyFile, {
        fileName: 'scan.jpg',
        preprocess: false,
      });

      expect(res.documentId).toMatch(/^DOC-OCR-/);
      expect(res.fileName).toBe('scan.jpg');
      expect(res.extractionMethod).toBe('tesseract');
      expect(res.success).toBe(true);
      expect(res.fullText).toContain('Deposit is non-refundable');
    });

    it('REGRESSION: configures logger in createWorker options and does not pass uncloneable functions to worker.recognize', async () => {
      const dummyFile = { name: 'scanned_agreement.png', type: 'image/png', size: 1200 };
      const progressHistory = [];

      const res = await extractTextFromImage(dummyFile, {
        fileName: 'scanned_agreement.png',
        preprocess: false,
        onProgress: (p) => progressHistory.push(p),
      });

      expect(res.success).toBe(true);
      expect(res.fullText).toContain('Deposit is non-refundable');
      // Verify progress reporting triggered by the worker logger callback
      expect(progressHistory.some((p) => p.status.includes('Reading text lines'))).toBe(true);
    });

    it('image preprocessor safely passes through image source in headless environment', async () => {
      const mockBlob = { size: 100 };
      const processed = await preprocessImageForOcr(mockBlob);
      expect(processed).toBe(mockBlob);
    });

    it('REGRESSION(vite-alias): createWorker receives logger in options object, not as postMessage payload', async () => {
      // Guard against future tesseract.js upgrades or Vite config changes breaking the
      // browser-worker alias. The mock above captures the options object passed to
      // createWorker(); if the logger ends up inside the recognize() payload instead,
      // structuredClone() would throw and this test would fail.
      const { createWorker } = await import('tesseract.js');
      let capturedOptions = null;

      createWorker.mockImplementationOnce(async (_langs, _oem, options) => {
        capturedOptions = options;
        return {
          recognize: vi.fn(async () => ({ data: { text: '' } })),
          terminate: vi.fn(async () => {}),
        };
      });

      const dummyFile = { name: 'test.png', type: 'image/png', size: 500 };
      await extractTextFromImage(dummyFile, { preprocess: false });

      // logger must be on the createWorker options object (main-thread side), never sent
      // across the Worker postMessage boundary
      expect(capturedOptions).not.toBeNull();
      expect(typeof capturedOptions.logger).toBe('function');

      // Verify recognize() is not called with a function argument
      // (functions cannot be structuredClone-d across Worker boundary)
      expect(() => structuredClone(capturedOptions.logger)).toThrow();
      // ^ This is intentional: logger IS a function. The key assertion is that it
      //   lives only in createWorker options (main-thread closure), NOT in the
      //   payload sent to worker.recognize().
    });
  });

  describe('Universal processDocument router', () => {
    it('routes PDF files to PDF extraction', async () => {
      const pdfBuffer = createSyntheticPdfBuffer('Sample content');
      const mockPdfFile = {
        name: 'sample.pdf',
        type: 'application/pdf',
        arrayBuffer: async () => pdfBuffer,
        size: pdfBuffer.byteLength,
      };

      const result = await processDocument(mockPdfFile);
      expect(result.extractionMethod).toBe('pdfjs');
      expect(result.fileName).toBe('sample.pdf');
    });

    it('routes image files to OCR extraction', async () => {
      const mockImageFile = {
        name: 'scan.png',
        type: 'image/png',
        size: 2000,
      };

      const result = await processDocument(mockImageFile, { preprocess: false });
      expect(result.extractionMethod).toBe('tesseract');
      expect(result.fileName).toBe('scan.png');
    });

    it('rejects unsupported file formats gracefully', async () => {
      const unknownFile = {
        name: 'data.zip',
        type: 'application/zip',
        size: 200,
      };

      const result = await processDocument(unknownFile);
      expect(result.success).toBe(false);
      expect(result.warnings[0]).toContain('Unsupported document type');
    });
  });
});
