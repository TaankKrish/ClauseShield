/**
 * Client-Side Privacy Sanitization Engine
 *
 * CRITICAL SECURITY INVARIANT:
 * - Replaces sensitive values with [REDACTED].
 * - Never returns or leaks original sensitive values in the redactions metadata.
 * - Protects Indian phone numbers, emails, PAN cards, Aadhaar numbers, and financial IDs.
 */

export const PII_TYPES = Object.freeze({
  PHONE: 'PHONE',
  EMAIL: 'EMAIL',
  PAN: 'PAN',
  AADHAAR: 'AADHAAR',
  ACCOUNT_ID: 'ACCOUNT_ID',
});

/**
 * Standard detector patterns with false-positive boundary guards.
 */
const DEFAULT_DETECTORS = [
  {
    type: PII_TYPES.EMAIL,
    // RFC 5322 compliant practical email pattern
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    type: PII_TYPES.PAN,
    // Indian Income Tax Permanent Account Number (5 letters, 4 digits, 1 letter)
    pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/g,
  },
  {
    type: PII_TYPES.AADHAAR,
    // Indian Aadhaar: 12 digits, never starts with 0 or 1.
    // Matches spaced/hyphenated (4-4-4) or continuous 12 digits when preceded by context
    pattern: /\b[2-9]\d{3}[\s-]\d{4}[\s-]\d{4}\b|\b(?:aadhaar|uidai|uid)\D{0,10}([2-9]\d{11})\b/gi,
  },
  {
    type: PII_TYPES.PHONE,
    // Indian mobile numbers (10 digits starting with 6, 7, 8, 9 with optional +91/0 prefix)
    pattern: /(?:\+91[\s-]?)?(?:\b0)?[6-9]\d{4}[\s-]?\d{5}\b/g,
  },
  {
    type: PII_TYPES.ACCOUNT_ID,
    // Indian IFSC code (4 letters, 0, 6 alphanumeric) and bank account numbers preceded by keywords
    pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b|(?:\b(?:a\/c|account(?:\s+no\.?)?|bank\s+acc(?:ount)?)\s*[:#-]?\s*)(\d{9,18})\b/gi,
  },
];

/**
 * Sanitizes raw text by replacing sensitive personal identifiers with [REDACTED].
 *
 * @param {string} rawText - Unsanitized document string
 * @param {object} [options]
 * @param {string} [options.replacement='[REDACTED]'] - Token to replace sensitive data with
 * @param {Array<object>} [options.customDetectors] - Optional additional detection rules
 * @returns {{
 *   sanitizedText: string,
 *   redactions: Array<{ type: string, count: number }>,
 *   piiCheckPassed: boolean
 * }}
 */
export function sanitizeDocumentText(rawText, options = {}) {
  if (!rawText || typeof rawText !== 'string') {
    return {
      sanitizedText: '',
      redactions: [],
      piiCheckPassed: true,
    };
  }

  const replacementToken = options.replacement || '[REDACTED]';
  const detectors = options.customDetectors
    ? [...DEFAULT_DETECTORS, ...options.customDetectors]
    : DEFAULT_DETECTORS;

  let sanitizedText = rawText;
  const countMap = new Map();

  for (const detector of detectors) {
    let matchCount = 0;

    sanitizedText = sanitizedText.replace(detector.pattern, (fullMatch, group1) => {
      // If regex has a capturing group for the sensitive portion, replace target accurately
      if (typeof group1 === 'string' && group1.length > 0) {
        matchCount++;
        return fullMatch.replace(group1, replacementToken);
      }

      matchCount++;
      return replacementToken;
    });

    if (matchCount > 0) {
      countMap.set(detector.type, (countMap.get(detector.type) || 0) + matchCount);
    }
  }

  // Format category audit list without leaking sensitive values
  const redactions = Array.from(countMap.entries()).map(([type, count]) => ({
    type,
    count,
  }));

  // Verification pass: Confirm no residual unmasked Aadhaar, PAN, or Email remains
  const hasResidualEmail = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/.test(sanitizedText);
  const hasResidualPAN = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/.test(sanitizedText);
  const hasResidualAadhaar = /\b[2-9]\d{3}[\s-]\d{4}[\s-]\d{4}\b/.test(sanitizedText);

  const piiCheckPassed = !hasResidualEmail && !hasResidualPAN && !hasResidualAadhaar;

  return {
    sanitizedText,
    redactions,
    piiCheckPassed,
  };
}

/**
 * Audit utility to verify that given sensitive tokens do not appear anywhere in sanitized text.
 *
 * @param {string} sanitizedText
 * @param {string[]} sensitiveTokens
 * @returns {boolean} True if clean (no sensitive tokens present)
 */
export function verifyPiiAbsence(sanitizedText, sensitiveTokens = []) {
  if (!sanitizedText || !Array.isArray(sensitiveTokens)) return true;

  for (const token of sensitiveTokens) {
    if (token && typeof token === 'string' && token.trim().length > 3) {
      if (sanitizedText.includes(token.trim())) {
        return false;
      }
    }
  }

  return true;
}
