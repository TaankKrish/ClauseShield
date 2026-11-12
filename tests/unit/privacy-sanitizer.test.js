import { describe, it, expect } from 'vitest';
import { sanitizeDocumentText } from '../../src/modules/privacy/pii-sanitizer.js';

describe('Privacy Sanitizer Engine', () => {
  it('redacts Indian Aadhaar numbers correctly', () => {
    const raw = 'The tenant Aadhaar number is 4521 8832 9912 verified on record.';
    const result = sanitizeDocumentText(raw);

    expect(result.sanitizedText).not.toContain('4521 8832 9912');
    expect(result.sanitizedText).toContain('[REDACTED_AADHAAR_');
    expect(result.redactions.length).toBe(1);
    expect(result.redactions[0].type).toBe('aadhaar');
    expect(result.piiCheckPassed).toBe(true);
  });

  it('redacts Indian PAN card numbers correctly', () => {
    const raw = 'The landlord PAN is ABCDE1234F for tax deduction.';
    const result = sanitizeDocumentText(raw);

    expect(result.sanitizedText).not.toContain('ABCDE1234F');
    expect(result.sanitizedText).toContain('[REDACTED_PAN_');
    expect(result.redactions.some((r) => r.type === 'pan')).toBe(true);
    expect(result.piiCheckPassed).toBe(true);
  });

  it('redacts 10-digit Indian phone numbers with and without prefix', () => {
    const raw = 'Contact primary: +91 98765 43210 or emergency 9812345678 immediately.';
    const result = sanitizeDocumentText(raw);

    expect(result.sanitizedText).not.toContain('98765 43210');
    expect(result.sanitizedText).not.toContain('9812345678');
    expect(result.redactions.length).toBeGreaterThanOrEqual(1);
  });

  it('redacts email addresses', () => {
    const raw = 'Send communications to citizen.user@example.com before notice.';
    const result = sanitizeDocumentText(raw);

    expect(result.sanitizedText).not.toContain('citizen.user@example.com');
    expect(result.sanitizedText).toContain('[REDACTED_EMAIL_');
  });

  it('handles empty or non-string inputs safely', () => {
    expect(sanitizeDocumentText('')).toEqual({
      sanitizedText: '',
      redactions: [],
      piiCheckPassed: true,
    });
    expect(sanitizeDocumentText(null)).toEqual({
      sanitizedText: '',
      redactions: [],
      piiCheckPassed: true,
    });
  });
});

