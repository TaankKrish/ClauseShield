/**
 * Master Pipeline Orchestrator for ClauseShield
 * Coordinates Document Ingestion, Client-Side Privacy Sanitization,
 * Clause Segmentation, Deterministic Rule Evaluation, and Timeline Extraction.
 */

import { processDocument } from '../modules/document-processing/index.js';
import { sanitizeDocumentText } from '../modules/privacy/index.js';
import { segmentDocumentClauses } from '../modules/clause-segmentation/index.js';
import { evaluateAllClauses } from '../modules/rule-engine/index.js';
import { extractTimelineItems } from '../modules/timeline/timeline-extractor.js';

/**
 * Executes the complete Document Intelligence pipeline on a document file or raw text.
 *
 * @param {object} params
 * @param {File|Blob|ArrayBuffer} [params.file] - Document file (PDF, JPG, PNG)
 * @param {string} [params.rawText] - Direct text input
 * @param {string} [params.contractType='all'] - 'rental' | 'student_bond' | 'employment' | 'all'
 * @param {Function} [params.onProgress] - Lifecycle progress callback
 * @returns {Promise<object>} Complete audit result
 */
export async function analyzeDocument({
  file = null,
  rawText = '',
  contractType = 'all',
  onProgress = () => {},
}) {
  onProgress({ step: 'EXTRACTION', progress: 10, message: 'Extracting text layer locally...' });

  let textToProcess = rawText || '';
  let extractionResult = {
    documentId: `DOC-${Date.now().toString(36).toUpperCase()}`,
    fileName: (file && file.name) || 'text_input.txt',
    pages: [{ pageNumber: 1, text: textToProcess }],
    fullText: textToProcess,
    extractionMethod: 'manual',
    success: true,
    warnings: [],
  };

  if (file) {
    extractionResult = await processDocument(file, {
      onProgress: (p) => {
        const pct = 10 + Math.round((p.percent || 0) * 0.3);
        onProgress({ step: 'PROCESSING', progress: pct, message: p.status || 'Extracting document text...' });
      },
    });
    textToProcess = extractionResult.fullText || '';
  }

  // Graceful handling of empty or failed extraction
  if (!textToProcess || textToProcess.trim().length === 0) {
    const warnings = [...(extractionResult.warnings || [])];
    if (warnings.length === 0) {
      warnings.push('No readable text could be extracted from the document.');
    }

    onProgress({ step: 'COMPLETE', progress: 100, message: 'Processing finished with warnings.' });

    return {
      documentId: extractionResult.documentId,
      fileName: extractionResult.fileName,
      extractionMethod: extractionResult.extractionMethod,
      warnings,
      privacy: {
        redactionCount: 0,
        redactions: [],
        piiCheckPassed: true,
      },
      clauses: [],
      summary: { red: 0, yellow: 0, green: 0, unassessed: 0, total: 0 },
      timeline: [],
    };
  }

  // Phase 2: Client-Side Privacy Sanitization
  onProgress({ step: 'PRIVACY_SHIELD', progress: 45, message: 'Sanitizing personal data...' });
  const privacyResult = sanitizeDocumentText(textToProcess);

  // Phase 3: Clause Segmentation
  onProgress({ step: 'SEGMENTATION', progress: 65, message: 'Segmenting legal clauses...' });
  const segmentationResult = segmentDocumentClauses(privacyResult.sanitizedText, {
    pages: extractionResult.pages,
    originalText: textToProcess,
  });

  // Phase 4: Deterministic Statutory Rule Engine
  onProgress({ step: 'RULE_ENGINE', progress: 85, message: 'Evaluating statutory rules...' });
  const ruleResult = evaluateAllClauses(segmentationResult.clauses, contractType);

  // Phase 5: Timeline Extraction
  onProgress({ step: 'TIMELINE', progress: 95, message: 'Compiling timeline commitments...' });
  const timelineResult = extractTimelineItems(ruleResult.clauses);

  onProgress({ step: 'COMPLETE', progress: 100, message: 'Inspection complete.' });

  const totalRedactions = privacyResult.redactions.reduce((acc, r) => acc + (r.count || 0), 0);

  return {
    documentId: extractionResult.documentId,
    fileName: extractionResult.fileName,
    extractionMethod: extractionResult.extractionMethod,
    warnings: extractionResult.warnings,
    privacy: {
      redactionCount: totalRedactions,
      redactions: privacyResult.redactions,
      piiCheckPassed: privacyResult.piiCheckPassed,
    },
    clauses: ruleResult.clauses,
    summary: ruleResult.summary,
    timeline: timelineResult.items || [],
  };
}
