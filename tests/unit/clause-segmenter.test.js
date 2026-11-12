import { describe, it, expect } from 'vitest';
import { segmentDocumentClauses } from '../../src/modules/clause-segmentation/clause-segmenter.js';

describe('Clause Segmentation Engine', () => {
  it('segments text by numbered legal clause indicators', () => {
    const text = `
1. RENT AND TERM: The tenancy shall be for 11 months.
2. SECURITY DEPOSIT: The tenant pays Rs 2,00,000 security deposit.
3. FORFEITURE: Deposit shall be forfeited in full.
    `.trim();

    const clauses = segmentDocumentClauses(text);
    expect(clauses.length).toBe(3);
    expect(clauses[0].clauseNumber).toBe('1');
    expect(clauses[1].clauseNumber).toBe('2');
    expect(clauses[2].clauseNumber).toBe('3');
  });

  it('falls back to paragraph blocks when no explicit numbering exists', () => {
    const text = `
This is the first paragraph describing general premises and obligations.

This is the second paragraph specifying maintenance responsibilities and painting terms.
    `.trim();

    const clauses = segmentDocumentClauses(text);
    expect(clauses.length).toBe(2);
    expect(clauses[0].clauseNumber).toBe('Section 1');
  });

  it('safely handles empty input', () => {
    expect(segmentDocumentClauses('')).toEqual([]);
    expect(segmentDocumentClauses(null)).toEqual([]);
  });
});

