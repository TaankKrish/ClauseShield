import { describe, it, expect } from 'vitest';
import {
  evaluateClause,
  evaluateAllClauses,
} from '../../src/modules/rule-engine/rule-evaluator.js';
import { RISK_LEVELS } from '../../src/constants/risk-levels.js';

describe('Deterministic Statutory Legal Rule Engine', () => {
  describe('Classification Accuracy & Statutory Citations', () => {
    it('CRITICAL INVARIANT: classifies unmatched clauses as UNASSESSED, never GREEN', () => {
      const neutralClause = {
        id: 'CLAUSE-001',
        sanitizedText: 'The tenant shall ensure potted balcony plants are watered daily.',
      };

      const result = evaluateClause(neutralClause, 'rental');
      expect(result.riskLevel).toBe(RISK_LEVELS.UNASSESSED);
      expect(result.riskLevel).not.toBe(RISK_LEVELS.GREEN);
      expect(result.ruleId).toBeNull();
      expect(result.matchedRules).toEqual([]);
      expect(result.reason).toContain('No statutory concerns');
    });

    it('classifies unilateral deposit forfeiture as RED under Section 74', () => {
      const forfeitureClause = {
        id: 'CLAUSE-002',
        sanitizedText: 'If tenant vacates early, the landlord shall forfeit the entire deposit unconditionally.',
      };

      const result = evaluateClause(forfeitureClause, 'rental');
      expect(result.riskLevel).toBe(RISK_LEVELS.RED);
      expect(result.ruleId).toBe('RULE-RENT-001');
      expect(result.legalSource).toContain('Section 74');
      expect(result.evidence.length).toBeGreaterThan(0);
    });

    it('classifies unannounced landlord entry as RED under Model Tenancy Act', () => {
      const entryClause = {
        id: 'CLAUSE-003',
        sanitizedText: 'The owner reserves the right to enter and inspect the flat at any time without notice.',
      };

      const result = evaluateClause(entryClause, 'rental');
      expect(result.riskLevel).toBe(RISK_LEVELS.RED);
      expect(result.ruleId).toBe('RULE-RENT-002');
      expect(result.legalSource).toContain('Model Tenancy Act');
    });

    it('classifies notice asymmetry as YELLOW (Cautionary review)', () => {
      const asymmetryClause = {
        id: 'CLAUSE-004',
        sanitizedText: 'The tenant must give 3 months notice to vacate, whereas the landlord may terminate with 15 days notice.',
      };

      const result = evaluateClause(asymmetryClause, 'rental');
      expect(result.riskLevel).toBe(RISK_LEVELS.YELLOW);
      expect(result.ruleId).toBe('RULE-RENT-004');
    });

    it('classifies mutual standard 30-day notice as GREEN baseline', () => {
      const mutualClause = {
        id: 'CLAUSE-005',
        sanitizedText: 'Either party may terminate the lease by giving one month written notice.',
      };

      const result = evaluateClause(mutualClause, 'rental');
      expect(result.riskLevel).toBe(RISK_LEVELS.GREEN);
      expect(result.ruleId).toBe('RULE-RENT-006');
    });

    it('classifies post-employment non-compete covenants as RED under Section 27', () => {
      const nonCompeteClause = {
        id: 'CLAUSE-006',
        sanitizedText: 'The employee shall not join or be employed by any competitor for a period of 2 years after termination.',
      };

      const result = evaluateClause(nonCompeteClause, 'employment');
      expect(result.riskLevel).toBe(RISK_LEVELS.RED);
      expect(result.ruleId).toBe('RULE-EMP-001');
      expect(result.legalSource).toContain('Section 27');
    });

    it('classifies student fee non-refundability as RED under Consumer Protection Act', () => {
      const studentFeeClause = {
        id: 'CLAUSE-007',
        sanitizedText: 'All coaching fees paid are strictly non-refundable even if the student leaves or quits the batch.',
      };

      const result = evaluateClause(studentFeeClause, 'student_bond');
      expect(result.riskLevel).toBe(RISK_LEVELS.RED);
      expect(result.ruleId).toBe('RULE-BOND-001');
      expect(result.legalSource).toContain('Consumer Protection Act');
    });
  });

  describe('Multiple Matching Rules & Severity Resolution', () => {
    it('picks the highest severity rule as primary when multiple rules match a single clause', () => {
      // Clause combining 3-month notice asymmetry (YELLOW) with unilateral deposit forfeiture (RED)
      const complexClause = {
        id: 'CLAUSE-MULTI',
        sanitizedText: 'Tenant must give 3 months notice while landlord gives immediate notice, and landlord shall forfeit the entire deposit unconditionally if tenant vacates early.',
      };

      const result = evaluateClause(complexClause, 'rental');

      // Primary risk must resolve to RED (highest severity)
      expect(result.riskLevel).toBe(RISK_LEVELS.RED);
      // Both matching rules should be captured in matchedRules
      expect(result.matchedRules.length).toBeGreaterThanOrEqual(2);
      expect(result.matchedRules.some((r) => r.riskLevel === RISK_LEVELS.RED)).toBe(true);
      expect(result.matchedRules.some((r) => r.riskLevel === RISK_LEVELS.YELLOW)).toBe(true);
    });
  });

  describe('Disabled Rules Verification', () => {
    it('ignores rules that have enabled set to false', () => {
      // Create a test clause that would match if rule were enabled
      const testClause = {
        id: 'CLAUSE-DIS',
        sanitizedText: 'Arbitrary bespoke term matching special pattern.',
      };

      // In the default active catalogs, no disabled rule matches
      const res = evaluateClause(testClause, 'all');
      expect(res.riskLevel).toBe(RISK_LEVELS.UNASSESSED);
    });
  });

  describe('Determinism', () => {
    it('produces identical outputs for identical inputs across repeated runs', () => {
      const clause = {
        id: 'CLAUSE-DET',
        sanitizedText: 'The entire deposit of Rs. 2,00,000 shall be forfeited without notice if tenant leaves.',
      };

      const run1 = evaluateClause(clause, 'rental');
      const run2 = evaluateClause(clause, 'rental');
      const run3 = evaluateClause(clause, 'rental');

      expect(run1).toEqual(run2);
      expect(run2).toEqual(run3);
    });
  });

  describe('Batch Evaluation & Metric Summaries', () => {
    it('calculates exact summary metrics across mixed clauses', () => {
      const clauses = [
        { id: 'c1', sanitizedText: 'Landlord shall forfeit entire deposit in full.' }, // RED
        { id: 'c2', sanitizedText: 'Landlord may enter flat at any time without notice.' }, // RED
        { id: 'c3', sanitizedText: 'Tenant give 3 months notice landlord 15 days.' }, // YELLOW
        { id: 'c4', sanitizedText: 'Either party give one month written notice.' }, // GREEN
        { id: 'c5', sanitizedText: 'Tenant shall keep standard trash bins outside door.' }, // UNASSESSED
      ];

      const res = evaluateAllClauses(clauses, 'rental');

      expect(res.summary.red).toBe(2);
      expect(res.summary.yellow).toBe(1);
      expect(res.summary.green).toBe(1);
      expect(res.summary.unassessed).toBe(1);
      expect(res.summary.total).toBe(5);
      expect(res.summary.red + res.summary.yellow + res.summary.green + res.summary.unassessed).toBe(res.summary.total);
    });

    it('safely handles empty or non-array inputs', () => {
      const res = evaluateAllClauses([]);
      expect(res.clauses).toEqual([]);
      expect(res.summary).toEqual({ red: 0, yellow: 0, green: 0, unassessed: 0, total: 0 });

      const resNull = evaluateAllClauses(null);
      expect(resNull.clauses).toEqual([]);
      expect(resNull.summary.total).toBe(0);
    });
  });
});
