/**
 * Privacy Sanitization Module
 * Public interface for client-side PII detection and redaction.
 */

import { sanitizeDocumentText, verifyPiiAbsence, PII_TYPES } from './pii-sanitizer.js';

export {
  sanitizeDocumentText,
  verifyPiiAbsence,
  PII_TYPES,
};

