/**
 * Server-Side PII Leak Defense Middleware
 *
 * CRITICAL PRIVACY INVARIANT:
 * - Ensures no unredacted Aadhaar, PAN, email, mobile phone, or financial tokens
 *   reach external LLM endpoints.
 * - Rejects any unsanitized request before it can reach the Gemini API.
 */

const LEAK_PATTERNS = [
  { name: 'Aadhaar Number', pattern: /\b[2-9]\d{3}[\s-]?\d{4}[\s-]?\d{4}\b/ },
  { name: 'PAN Card', pattern: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/ },
  { name: 'Email Address', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/ },
  { name: 'Phone Number', pattern: /(?:\+91[\s-]?)?(?:\b0)?[6-9]\d{4}[\s-]?\d{5}\b/ },
  { name: 'Bank IFSC Code', pattern: /\b[A-Z]{4}0[A-Z0-9]{6}\b/ },
];

const MAX_PAYLOAD_STRING_LENGTH = 150000; // 150KB text limit for AI prompts

export function piiGuardMiddleware(req, res, next) {
  try {
    const payloadString = JSON.stringify(req.body || {});

    if (payloadString.length > MAX_PAYLOAD_STRING_LENGTH) {
      return res.status(413).json({
        error: 'PAYLOAD_TOO_LARGE',
        message: 'Security Guard rejected request: Payload exceeds safe processing size limit.',
      });
    }

    for (const { name, pattern } of LEAK_PATTERNS) {
      if (pattern.test(payloadString)) {
        return res.status(400).json({
          error: 'PRIVACY_VIOLATION_BLOCKED',
          message: `Security Guard rejected request: Payload contains unredacted personal identifier (${name}). Client-side sanitization failed or was bypassed.`,
        });
      }
    }

    next();
  } catch (err) {
    return res.status(500).json({
      error: 'SECURITY_CHECK_FAILED',
      message: 'Failed to complete pre-flight privacy scan: ' + (err.message || 'Internal error'),
    });
  }
}
