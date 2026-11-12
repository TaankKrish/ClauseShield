import { describe, it, expect } from 'vitest';
import { evaluateClause, evaluateAllClauses } from '../../src/modules/rule-engine/rule-evaluator.js';
import { RISK_LEVELS } from '../../src/constants/risk-levels.js';

describe('Deterministic Legal Rule Engine', () => {
  it('CRITICAL INVARIANT: classifies unmatched clauses as UNASSESSED, never GREEN', () => {
    const neutralClause = {
      id: 'clause-neutral',
      sanitizedText: 'The tenant shall keep indoor potted plants properly watered.',
    };

    const evaluated = evaluateClause(neutralClause, 'rental');
    expect(evaluated.riskLevel).toBe(RISK_LEVELS.UNASSESSED);
    expect(evaluated.riskLevel).not.toBe(RISK_LEVELS.GREEN);
    expect(evaluated.ruleId).toBeNull();
  });

  it('classifies unilateral deposit forfeiture as RED under Section 74', () => {
    const forfeitureClause = {
      id: 'clause-forfeit',
      sanitizedText: 'The landlord shall forfeit the entire deposit unconditionally if tenant leaves early.',
    };

    const evaluated = evaluateClause(forfeitureClause, 'rental');
    expect(evaluated.riskLevel).toBe(RISK_LEVELS.RED);
    expect(evaluated.ruleId).toBe('RULE-RENT-001');
    expect(evaluated.legalSource).toContain('Section 74');
  });

  it('classifies post-employment non-compete as RED under Section 27', () => {
    const nonCompeteClause = {
      id: 'clause-emp',
      sanitizedText: 'The employee shall not join or be employed by any competitor after termination for 2 years.',
    };

    const evaluated = evaluateClause(nonCompeteClause, 'employment');
    expect(evaluated.riskLevel).toBe(RISK_LEVELS.RED);
    expect(evaluated.ruleId).toBe('RULE-EMP-001');
    expect(evaluated.legalSource).toContain('Section 27');
  });

  it('classifies mutual standard 30-day notice as GREEN', () => {
    const mutualClause = {
      id: 'clause-mutual',
      sanitizedText: 'Either party may terminate by giving one month written notice.',
    };

    const evaluated = evaluateClause(mutualClause, 'rental');
    expect(evaluated.riskLevel).toBe(RISK_LEVELS.GREEN);
    expect(evaluated.ruleId).toBe('RULE-RENT-004');
  });

  it('evaluates an array of clauses and correctly sums the summary metrics', () => {
    const clauses = [
      { id: 'c1', sanitizedText: 'Landlord shall forfeit entire deposit.' },
      { id: 'c2', sanitizedText: 'Either party give one month written notice.' },
      { id: 'c3', sanitizedText: 'Tenant must give 3 months notice landlord immediate.' },
      { id: 'c4', sanitizedText: 'Pets are permitted upon prior discussion.' },
    ];

    const result = evaluateAllClauses(clauses, 'rental');
    expect(result.summary.red).toBe(1);
    expect(result.summary.green).toBe(1);
    expect(result.summary.yellow).toBe(1);
    expect(result.summary.unassessed).toBe(1);
    expect(result.summary.total).toBe(4);
  });
});

