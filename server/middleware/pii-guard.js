/**
 * Server-Side PII Leak Defense Middleware
 * Ensures no unredacted Aadhaar or PAN tokens reach external LLM endpoints.
 */

const LEAK_PATTERNS = [
  /\b\d{4}\s?\d{4}\s?\d{4}\b/,     // Unredacted Aadhaar
  /\b[A-Z]{5}[0-9]{4}[A-Z]\b/,      // Unredacted PAN
];

export function piiGuardMiddleware(req, res, next) {
  const payloadString = JSON.stringify(req.body || {});

  for (const pattern of LEAK_PATTERNS) {
    if (pattern.test(payloadString)) {
      return res.status(400).json({
        error: 'PRIVACY_VIOLATION_BLOCKED',
        message: 'Security Guard rejected request: Payload contains unredacted personal identifiers (Aadhaar or PAN). Client-side sanitization failed or was bypassed.',
      });
    }
  }

  next();
}

