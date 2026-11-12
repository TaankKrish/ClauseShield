import { describe, it, expect } from 'vitest';
import {
  sanitizeDocumentText,
  verifyPiiAbsence,
  PII_TYPES,
} from '../../src/modules/privacy/pii-sanitizer.js';

describe('Privacy Sanitizer Engine', () => {
  describe('Indian Phone Number Redaction', () => {
    it('detects and redacts standard 10-digit mobile numbers with +91', () => {
      const raw = 'The tenant contact number is +91 98765 43210 for emergency calls.';
      const res = sanitizeDocumentText(raw);

      expect(res.sanitizedText).toBe('The tenant contact number is [REDACTED] for emergency calls.');
      expect(res.redactions).toEqual([{ type: PII_TYPES.PHONE, count: 1 }]);
      expect(res.piiCheckPassed).toBe(true);
      expect(verifyPiiAbsence(res.sanitizedText, ['98765 43210', '+91 98765 43210'])).toBe(true);
    });

    it('detects mobile numbers with leading 0 or unspaced 10 digits', () => {
      const raw = 'Alternate contacts: 09812345678 and 9123456789.';
      const res = sanitizeDocumentText(raw);

      expect(res.sanitizedText).not.toContain('09812345678');
      expect(res.sanitizedText).not.toContain('9123456789');
      expect(res.sanitizedText).toContain('[REDACTED]');
      const phoneRedaction = res.redactions.find((r) => r.type === PII_TYPES.PHONE);
      expect(phoneRedaction.count).toBe(2);
    });
  });

  describe('Email Address Redaction', () => {
    it('detects and redacts standard email addresses', () => {
      const raw = 'Send communications to citizen.user@example.com and legal@lawfirm.in immediately.';
      const res = sanitizeDocumentText(raw);

      expect(res.sanitizedText).toBe('Send communications to [REDACTED] and [REDACTED] immediately.');
      const emailRedaction = res.redactions.find((r) => r.type === PII_TYPES.EMAIL);
      expect(emailRedaction.count).toBe(2);
      expect(verifyPiiAbsence(res.sanitizedText, ['citizen.user@example.com', 'legal@lawfirm.in'])).toBe(true);
    });
  });

  describe('PAN Card Redaction', () => {
    it('detects and redacts Indian PAN card identifiers', () => {
      const raw = 'Landlord PAN is ABCDE1234F for income tax TDS credit.';
      const res = sanitizeDocumentText(raw);

      expect(res.sanitizedText).toBe('Landlord PAN is [REDACTED] for income tax TDS credit.');
      expect(res.redactions).toEqual([{ type: PII_TYPES.PAN, count: 1 }]);
      expect(verifyPiiAbsence(res.sanitizedText, ['ABCDE1234F'])).toBe(true);
    });
  });

  describe('Aadhaar Number Redaction', () => {
    it('detects and redacts 12-digit spaced Aadhaar numbers', () => {
      const raw = 'Tenant verified via Aadhaar 4521 8832 9912 during execution.';
      const res = sanitizeDocumentText(raw);

      expect(res.sanitizedText).toContain('[REDACTED]');
      expect(res.sanitizedText).not.toContain('4521 8832 9912');
      const aadhaarRedaction = res.redactions.find((r) => r.type === PII_TYPES.AADHAAR);
      expect(aadhaarRedaction.count).toBe(1);
      expect(verifyPiiAbsence(res.sanitizedText, ['4521 8832 9912'])).toBe(true);
    });
  });

  describe('Financial Account & IFSC Redaction', () => {
    it('detects and redacts Indian IFSC codes and bank accounts', () => {
      const raw = 'Deposit to Account: 123456789012 at IFSC HDFC0001234.';
      const res = sanitizeDocumentText(raw);

      expect(res.sanitizedText).not.toContain('HDFC0001234');
      expect(res.sanitizedText).not.toContain('123456789012');
      expect(res.sanitizedText).toContain('[REDACTED]');
    });
  });

  describe('Multiple PII Values in Single Document', () => {
    it('redacts all multiple mixed PII tokens in one pass', () => {
      const raw = `Landlord: Ramesh (Aadhaar: 4521 8832 9912, PAN: ABCDE1234F, Phone: +91 98765 43210, Email: ramesh@test.com).`;
      const res = sanitizeDocumentText(raw);

      expect(res.sanitizedText).not.toContain('4521 8832 9912');
      expect(res.sanitizedText).not.toContain('ABCDE1234F');
      expect(res.sanitizedText).not.toContain('98765 43210');
      expect(res.sanitizedText).not.toContain('ramesh@test.com');

      const totalCount = res.redactions.reduce((acc, r) => acc + r.count, 0);
      expect(totalCount).toBe(4);
      expect(res.piiCheckPassed).toBe(true);
    });
  });

  describe('Privacy Security Design Invariant: Zero PII in Metadata', () => {
    it('CONFIRMS that original sensitive values do NOT appear in the redactions metadata', () => {
      const sensitivePhone = '+91 98765 43210';
      const sensitivePan = 'ABCDE1234F';
      const sensitiveAadhaar = '4521 8832 9912';

      const raw = `Contacts: ${sensitivePhone}, ${sensitivePan}, ${sensitiveAadhaar}.`;
      const res = sanitizeDocumentText(raw);

      // Stringify the entire redactions metadata
      const metadataString = JSON.stringify(res.redactions);

      expect(metadataString).not.toContain(sensitivePhone);
      expect(metadataString).not.toContain(sensitivePan);
      expect(metadataString).not.toContain(sensitiveAadhaar);

      // Verify structure only contains type and count
      for (const item of res.redactions) {
        expect(Object.keys(item).sort()).toEqual(['count', 'type']);
        expect(typeof item.type).toBe('string');
        expect(typeof item.count).toBe('number');
      }
    });
  });

  describe('No-Match & False Positive Handling', () => {
    it('leaves text with no PII unchanged without false matches', () => {
      const raw = 'The monthly rent is Rs. 35,000 payable on or before 5th of every calendar month.';
      const res = sanitizeDocumentText(raw);

      expect(res.sanitizedText).toBe(raw);
      expect(res.redactions).toEqual([]);
      expect(res.piiCheckPassed).toBe(true);
    });

    it('does not confuse statutory sections or monetary numbers with phone numbers', () => {
      const raw = 'Under Section 74 of the Indian Contract Act, compensation of Rs. 10,00,000 was awarded.';
      const res = sanitizeDocumentText(raw);

      expect(res.sanitizedText).toContain('Section 74');
      expect(res.sanitizedText).toContain('10,00,000');
    });

    it('handles null and empty input safely', () => {
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
});
