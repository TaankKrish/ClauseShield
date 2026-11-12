import { describe, it, expect } from 'vitest';
import { analyzeDocument } from '../../src/services/analysis-orchestrator.js';
import {
  SYNTHETIC_RENTAL_CONTRACT,
  SYNTHETIC_STUDENT_BOND,
  SYNTHETIC_EMPLOYMENT_CONTRACT,
} from '../fixtures/synthetic-documents.js';

describe('Analysis Orchestrator End-to-End Pipeline', () => {
  describe('Full Successful Pipeline Execution', () => {
    it('processes synthetic rental contract through ingestion, sanitization, segmentation, and rule evaluation', async () => {
      const sensitiveTokens = ['4521 8832 9912', '9912 3344 5566', 'ABCDE1234F', '98765 43210', 'sneha.test@example.com'];

      const result = await analyzeDocument({
        rawText: SYNTHETIC_RENTAL_CONTRACT.text,
        contractType: 'rental',
      });

      // 1. Ingestion / extraction verification
      expect(result.documentId).toBeDefined();
      expect(result.extractionMethod).toBe('manual');
      expect(result.warnings).toEqual([]);

      // 2. Privacy verification
      expect(result.privacy.piiCheckPassed).toBe(true);
      expect(result.privacy.redactionCount).toBeGreaterThanOrEqual(4);

      // Verify ZERO sensitive tokens leaked into clauses or metadata
      const serializedClauses = JSON.stringify(result.clauses);
      const serializedPrivacy = JSON.stringify(result.privacy);

      for (const token of sensitiveTokens) {
        expect(serializedClauses).not.toContain(token);
        expect(serializedPrivacy).not.toContain(token);
      }

      // 3. Clause segmentation verification
      expect(result.clauses.length).toBeGreaterThanOrEqual(5);
      expect(result.clauses[0].id).toMatch(/^CLAUSE-\d{3}$/);

      // 4. Rule engine assessment verification
      expect(result.summary.total).toBe(result.clauses.length);
      expect(result.summary.red).toBeGreaterThanOrEqual(1);

      // Check specific clause flags
      const forfeitureClause = result.clauses.find((c) => c.ruleId === 'RULE-RENT-001');
      expect(forfeitureClause).toBeDefined();
      expect(forfeitureClause.riskLevel).toBe('RED');
      expect(forfeitureClause.legalSource).toContain('Section 74');

      // 5. Timeline verification
      expect(result.timeline.length).toBeGreaterThan(0);
      expect(result.timeline.some((t) => t.title === 'Refund Window' || t.title === 'Notice Period')).toBe(true);
    });

    it('processes synthetic student bond contract accurately', async () => {
      const result = await analyzeDocument({
        rawText: SYNTHETIC_STUDENT_BOND.text,
        contractType: 'student_bond',
      });

      expect(result.summary.red).toBeGreaterThanOrEqual(1);
      const feeForfeiture = result.clauses.find((c) => c.ruleId === 'RULE-BOND-001');
      expect(feeForfeiture).toBeDefined();
      expect(feeForfeiture.riskLevel).toBe('RED');
    });

    it('processes synthetic employment contract accurately', async () => {
      const result = await analyzeDocument({
        rawText: SYNTHETIC_EMPLOYMENT_CONTRACT.text,
        contractType: 'employment',
      });

      expect(result.summary.red).toBeGreaterThanOrEqual(1);
      const nonCompete = result.clauses.find((c) => c.ruleId === 'RULE-EMP-001');
      expect(nonCompete).toBeDefined();
      expect(nonCompete.riskLevel).toBe('RED');
      expect(nonCompete.legalSource).toContain('Section 27');
    });
  });

  describe('Failure & Edge Case Handling', () => {
    it('handles empty text gracefully without throwing unhandled exceptions', async () => {
      const result = await analyzeDocument({
        rawText: '',
      });

      expect(result.clauses).toEqual([]);
      expect(result.summary.total).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('No readable text');
    });

    it('handles whitespace-only text gracefully', async () => {
      const result = await analyzeDocument({
        rawText: '   \n\n\t   ',
      });

      expect(result.clauses).toEqual([]);
      expect(result.summary.total).toBe(0);
    });
  });
});
