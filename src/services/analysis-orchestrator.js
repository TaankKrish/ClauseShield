import { sanitizeDocumentText } from '../modules/privacy/pii-sanitizer.js';
import { segmentDocumentClauses } from '../modules/clause-segmentation/clause-segmenter.js';
import { evaluateAllClauses } from '../modules/rule-engine/rule-evaluator.js';
import { extractTimelineItems } from '../modules/timeline/timeline-extractor.js';
import { extractTextFromPdf } from '../modules/document-processing/pdf-extractor.js';
import { extractTextFromImage } from '../modules/document-processing/ocr-extractor.js';

/**
 * Master Pipeline Orchestrator for ClauseShield
 * Coordinates extraction, sanitization, segmentation, deterministic rule evaluation, and timeline.
 */
export async function analyzeDocument({ file = null, rawText = '', contractType = 'all', onProgress = () => {} }) {
  onProgress({ step: 'EXTRACTION', progress: 10, message: 'Extracting text layer...' });

  let textToProcess = rawText;
  let extractionResult = {
    documentId: `DOC-${Date.now()}`,
    extractionMethod: 'manual',
    success: true,
    warnings: [],
  };

  if (file) {
    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      extractionResult = await extractTextFromPdf(file);
      textToProcess = extractionResult.fullText;
    } else if (file.type.startsWith('image/')) {
      extractionResult = await extractTextFromImage(file, (ocrPct) => {
        onProgress({ step: 'OCR', progress: 10 + Math.round(ocrPct * 0.3), message: `OCR Scanning (${ocrPct}%)...` });
      });
      textToProcess = extractionResult.fullText;
    }
  }

  onProgress({ step: 'PRIVACY_SHIELD', progress: 45, message: 'Sanitizing personal data...' });
  const privacyResult = sanitizeDocumentText(textToProcess);

  onProgress({ step: 'SEGMENTATION', progress: 65, message: 'Segmenting legal clauses...' });
  const rawClauses = segmentDocumentClauses(privacyResult.sanitizedText, textToProcess);

  onProgress({ step: 'RULE_ENGINE', progress: 85, message: 'Evaluating statutory rules...' });
  const ruleResult = evaluateAllClauses(rawClauses, contractType);

  onProgress({ step: 'TIMELINE', progress: 95, message: 'Compiling timeline commitments...' });
  const timelineResult = extractTimelineItems(ruleResult.clauses);

  onProgress({ step: 'COMPLETE', progress: 100, message: 'Inspection complete.' });

  return {
    documentId: extractionResult.documentId,
    extractionMethod: extractionResult.extractionMethod,
    warnings: extractionResult.warnings,
    privacy: {
      redactionCount: privacyResult.redactions.length,
      redactions: privacyResult.redactions,
      piiCheckPassed: privacyResult.piiCheckPassed,
    },
    clauses: ruleResult.clauses,
    summary: ruleResult.summary,
    timeline: timelineResult.items,
  };
}
