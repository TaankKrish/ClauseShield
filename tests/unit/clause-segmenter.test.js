import { describe, it, expect } from 'vitest';
import { segmentDocumentClauses } from '../../src/modules/clause-segmentation/clause-segmenter.js';

describe('Clause Segmentation Engine', () => {
  it('identifies and segments numbered legal clauses with padded CLAUSE-XXX IDs', () => {
    const text = `
1. The tenant shall pay a security deposit of Rs. 1,00,000.
2. The landlord may terminate the agreement with 30 days notice.
3. The tenant shall maintain the leased property in good condition.
    `.trim();

    const res = segmentDocumentClauses(text);
    const clauses = res.clauses;

    expect(clauses.length).toBe(3);
    expect(clauses[0].id).toBe('CLAUSE-001');
    expect(clauses[0].clauseNumber).toBe('1');
    expect(clauses[0].text).toContain('The tenant shall pay a security deposit');

    expect(clauses[1].id).toBe('CLAUSE-002');
    expect(clauses[1].clauseNumber).toBe('2');

    expect(clauses[2].id).toBe('CLAUSE-003');
    expect(clauses[2].clauseNumber).toBe('3');
  });

  it('handles sub-clause numbering like 1.1, Clause 2:, and Section 3', () => {
    const text = `
Section 1: The initial term is 11 months.
Clause 2: The security deposit is refundable within 15 days.
Article 3: Neither party shall assign rights without consent.
    `.trim();

    const res = segmentDocumentClauses(text);
    expect(res.clauses.length).toBe(3);
    expect(res.clauses[0].clauseNumber).toBe('Section 1');
    expect(res.clauses[1].clauseNumber).toBe('Clause 2');
    expect(res.clauses[2].clauseNumber).toBe('Article 3');
  });

  it('handles mixed uppercase headings and paragraphs without silent text loss', () => {
    const text = `
RENT AND TERM:
The tenancy shall commence on April 1st for a duration of 11 months.

SECURITY DEPOSIT:
Tenant pays two lakhs security deposit before possession.
    `.trim();

    const res = segmentDocumentClauses(text);
    expect(res.clauses.length).toBe(2);
    expect(res.clauses[0].text).toContain('RENT AND TERM:');
    expect(res.clauses[1].text).toContain('SECURITY DEPOSIT:');
  });

  it('falls back safely to paragraph boundaries when no legal numbering is detected', () => {
    const text = `
This is an unnumbered first clause defining party obligations and premise descriptions.

This is an unnumbered second clause detailing utility charges and maintenance norms.
    `.trim();

    const res = segmentDocumentClauses(text);
    expect(res.clauses.length).toBe(2);
    expect(res.clauses[0].clauseNumber).toBe('Paragraph 1');
    expect(res.clauses[1].clauseNumber).toBe('Paragraph 2');
  });

  it('tracks multi-page references accurately when pages array is provided', () => {
    const pages = [
      { pageNumber: 1, text: '1. RENT: Monthly rent is Rs. 30,000.' },
      { pageNumber: 2, text: '2. FORFEITURE: Unconditional forfeiture of entire deposit.' },
    ];
    const fullText = pages.map((p) => p.text).join('\n\n');

    const res = segmentDocumentClauses(fullText, { pages });
    expect(res.clauses.length).toBe(2);
    expect(res.clauses[0].pageNumber).toBe(1);
    expect(res.clauses[1].pageNumber).toBe(2);
  });

  it('preserves preamble text before the first numbered clause', () => {
    const text = `
AGREEMENT OF LEASE entered on this day between Landlord and Tenant.
NOW THIS AGREEMENT WITNESSETH:

1. RENT: Rent is Rs. 20,000.
2. NOTICE: Notice period is 30 days.
    `.trim();

    const res = segmentDocumentClauses(text);
    expect(res.clauses.length).toBe(3);
    expect(res.clauses[0].clauseNumber).toBe('Preamble');
    expect(res.clauses[1].clauseNumber).toBe('1');
    expect(res.clauses[2].clauseNumber).toBe('2');
  });

  it('safely handles empty or non-string input', () => {
    const empty1 = segmentDocumentClauses('');
    expect(empty1.clauses).toEqual([]);
    expect(empty1.length).toBe(0);

    const empty2 = segmentDocumentClauses(null);
    expect(empty2.clauses).toEqual([]);
    expect(empty2.length).toBe(0);
  });

  it('supports backwards compatibility array operations', () => {
    const text = '1. First clause.\n2. Second clause.';
    const res = segmentDocumentClauses(text);

    // Array-like properties
    expect(res.length).toBe(2);
    expect(Array.from(res).length).toBe(2);
    const mapped = res.map((c) => c.id);
    expect(mapped).toEqual(['CLAUSE-001', 'CLAUSE-002']);
  });
});
