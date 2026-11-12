import { describe, it, expect, vi } from 'vitest';
import { piiGuardMiddleware } from '../../server/middleware/pii-guard.js';

describe('Server-Side PII Leak Defense Middleware', () => {
  const createMockReqRes = (body) => {
    const req = { body };
    const res = {
      statusCode: null,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      },
    };
    const next = vi.fn();
    return { req, res, next };
  };

  it('allows safe sanitized request payloads to proceed', () => {
    const { req, res, next } = createMockReqRes({
      clause: {
        id: 'clause-1',
        sanitizedText: 'Agreement entered with tenant [REDACTED_AADHAAR] and PAN [REDACTED_PAN].',
      },
      language: 'en',
    });

    piiGuardMiddleware(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res.statusCode).toBeNull();
  });

  it('blocks payloads containing unredacted Aadhaar numbers (spaced 4-4-4)', () => {
    const { req, res, next } = createMockReqRes({
      clause: {
        sanitizedText: 'Landlord Aadhaar number is 5421 8832 9912 for verification.',
      },
    });

    piiGuardMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('PRIVACY_VIOLATION_BLOCKED');
    expect(res.jsonData.message).toContain('Aadhaar Number');
  });

  it('blocks payloads containing unredacted PAN numbers', () => {
    const { req, res, next } = createMockReqRes({
      clause: {
        sanitizedText: 'Tenant PAN card ABCDE1234F shall be submitted to society.',
      },
    });

    piiGuardMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('PRIVACY_VIOLATION_BLOCKED');
    expect(res.jsonData.message).toContain('PAN Card');
  });

  it('blocks payloads containing unredacted email addresses', () => {
    const { req, res, next } = createMockReqRes({
      clause: {
        sanitizedText: 'Send vacation notice to landlord.personal@gmail.com 30 days prior.',
      },
    });

    piiGuardMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('PRIVACY_VIOLATION_BLOCKED');
    expect(res.jsonData.message).toContain('Email Address');
  });

  it('blocks payloads containing unredacted Indian mobile phone numbers', () => {
    const { req, res, next } = createMockReqRes({
      clause: {
        sanitizedText: 'Contact emergency manager at +91 9876543210 for electrical repairs.',
      },
    });

    piiGuardMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('PRIVACY_VIOLATION_BLOCKED');
    expect(res.jsonData.message).toContain('Phone Number');
  });

  it('blocks payloads containing unredacted Indian bank IFSC codes', () => {
    const { req, res, next } = createMockReqRes({
      clause: {
        sanitizedText: 'Remit deposit to HDFC Bank branch code HDFC0001234.',
      },
    });

    piiGuardMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('PRIVACY_VIOLATION_BLOCKED');
    expect(res.jsonData.message).toContain('Bank IFSC Code');
  });

  it('rejects oversized payloads exceeding 150KB size threshold', () => {
    const hugeString = 'A'.repeat(160000);
    const { req, res, next } = createMockReqRes({
      document: hugeString,
    });

    piiGuardMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(413);
    expect(res.jsonData.error).toBe('PAYLOAD_TOO_LARGE');
  });
});

