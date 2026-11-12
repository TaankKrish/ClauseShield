/**
 * Client-Side Privacy Sanitizer & PII Redactor
 * Strictly executed locally before any external API communication.
 */

// Regex patterns for Indian PII identification
const PII_PATTERNS = [
  {
    type: 'aadhaar',
    regex: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
    placeholder: (id) => `[REDACTED_AADHAAR_${id}]`,
  },
  {
    type: 'pan',
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
    placeholder: (id) => `[REDACTED_PAN_${id}]`,
  },
  {
    type: 'phone',
    regex: /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/g,
    placeholder: (id) => `[REDACTED_PHONE_${id}]`,
  },
  {
    type: 'email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    placeholder: (id) => `[REDACTED_EMAIL_${id}]`,
  },
  {
    type: 'ifsc',
    regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/g,
    placeholder: (id) => `[REDACTED_IFSC_${id}]`,
  },
];

/**
 * Sanitizes raw document text by replacing sensitive personal identifiers.
 * Returns the sanitized string, an audit log of redactions, and a safety pass boolean.
 *
 * @param {string} rawText - Unsanitized extracted text
 * @returns {import('../../../docs/MODULE_CONTRACTS.md').PrivacySanitizationResult}
 */
export function sanitizeDocumentText(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      sanitizedText: '',
      redactions: [],
      piiCheckPassed: true,
    };
  }

  let sanitizedText = rawText;
  const redactions = [];
  let tokenCounter = 1;

  for (const { type, regex, placeholder } of PII_PATTERNS) {
    sanitizedText = sanitizedText.replace(regex, (match, offset) => {
      const replacement = placeholder(tokenCounter++);
      redactions.push({
        id: `redact-${tokenCounter}`,
        type,
        original: match,
        replacement,
        index: offset,
      });
      return replacement;
    });
  }

  // Secondary verification: confirm no residual Aadhaar or PAN remains unmasked
  const hasResidualAadhaar = /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(sanitizedText);
  const hasResidualPAN = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(sanitizedText);
  const piiCheckPassed = !hasResidualAadhaar && !hasResidualPAN;

  return {
    sanitizedText,
    redactions,
    piiCheckPassed,
  };
}

