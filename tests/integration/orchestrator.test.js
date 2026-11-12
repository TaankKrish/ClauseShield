import { describe, it, expect } from 'vitest';
import { analyzeDocument } from '../../src/services/analysis-orchestrator.js';
import { SAMPLE_RENTAL_CONTRACT } from '../../src/data/demo-data/sample-contracts.js';

describe('Analysis Orchestrator E2E Integration', () => {
  it('runs complete analysis pipeline on sample rental contract', async () => {
    const result = await analyzeDocument({
      rawText: SAMPLE_RENTAL_CONTRACT.rawText,
      contractType: SAMPLE_RENTAL_CONTRACT.category,
    });

    // 1. Extraction checks
    expect(result.documentId).toBeDefined();

    // 2. Privacy checks
    expect(result.privacy.redactionCount).toBeGreaterThan(0);
    expect(result.privacy.piiCheckPassed).toBe(true);

    // 3. Clause segmentation checks
    expect(result.clauses.length).toBeGreaterThan(0);

    // 4. Rule engine assessment checks
    expect(result.summary.total).toBe(result.clauses.length);
    expect(result.summary.red).toBeGreaterThanOrEqual(1);

    // 5. Check that PII is absent from sanitized clauses
    for (const clause of result.clauses) {
      expect(clause.sanitizedText).not.toContain('4521 8832 9912');
      expect(clause.sanitizedText).not.toContain('ABCDE1234F');
    }

    // 6. Timeline checks
    expect(result.timeline.length).toBeGreaterThan(0);
  });
});

