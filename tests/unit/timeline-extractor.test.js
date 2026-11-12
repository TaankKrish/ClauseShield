import { describe, it, expect } from 'vitest';
import { extractTimelineItems } from '../../src/modules/timeline/timeline-extractor.js';

describe('Timeline & Deadline Extractor', () => {
  it('extracts notice period deadlines with high urgency', () => {
    const clauses = [
      {
        id: 'c-notice',
        sanitizedText: 'The tenant must provide a notice period of 30 days before vacating the premises.',
      },
    ];

    const result = extractTimelineItems(clauses);
    expect(result.items.length).toBe(1);
    expect(result.items[0].title).toBe('Notice Period');
    expect(result.items[0].dateText).toBe('30 days');
    expect(result.items[0].urgency).toBe('HIGH');
  });

  it('extracts deposit refund timeline with medium urgency', () => {
    const clauses = [
      {
        id: 'c-refund',
        sanitizedText: 'Security deposit shall be refunded within 15 days of key handover.',
      },
    ];

    const result = extractTimelineItems(clauses);
    expect(result.items.length).toBe(1);
    expect(result.items[0].title).toBe('Refund Window');
    expect(result.items[0].dateText).toBe('15 days');
    expect(result.items[0].urgency).toBe('MEDIUM');
  });
});
