/**
 * Timeline & Deadline Extraction Engine
 * Identifies temporal commitments, notice periods, and statutory deadlines from clauses.
 */

const TEMPORAL_PATTERNS = [
  {
    regex: /(?:notice(?:\s+period)?(?:\s+of)?|prior\s+notice(?:\s+of)?)\s+(\d+\s+(?:days?|months?|weeks?))/i,
    type: 'Notice Period',
    urgency: 'HIGH',
    actionRequired: 'Serve written notice prior to this window to avoid forfeiture or penalty.',
  },
  {
    regex: /(?:refunded|returned|repaid)\s+within\s+(\d+\s+(?:days?|months?|weeks?))/i,
    type: 'Refund Window',
    urgency: 'MEDIUM',
    actionRequired: 'Demand joint inspection and immediate written acknowledgment of key return.',
  },
  {
    regex: /(?:lock-in(?:\s+period)?(?:\s+of)?)\s+(\d+\s+(?:days?|months?|years?))/i,
    type: 'Lock-in Period',
    urgency: 'HIGH',
    actionRequired: 'Verify mandatory occupancy or employment duration before signing.',
  },
  {
    regex: /(?:escalat(?:ion|ed)|increase(?:\s+of)?)\s+(?:by\s+)?(\d+%\s+(?:after|every)\s+\d+\s+months?)/i,
    type: 'Rent Escalation',
    urgency: 'LOW',
    actionRequired: 'Budget for scheduled rent or fee escalation.',
  },
];

/**
 * Extracts chronological timeline milestones from an array of evaluated clauses.
 *
 * @param {Array<object>} evaluatedClauses
 * @returns {{ items: Array<{ id: string, title: string, dateText: string, clauseId: string, urgency: string, actionRequired: string }> }}
 */
export function extractTimelineItems(evaluatedClauses) {
  if (!Array.isArray(evaluatedClauses)) {
    return { items: [] };
  }

  const items = [];
  let counter = 1;

  for (const clause of evaluatedClauses) {
    const text = clause.sanitizedText || '';

    for (const pattern of TEMPORAL_PATTERNS) {
      const match = text.match(pattern.regex);
      if (match) {
        items.push({
          id: `time-${counter++}`,
          title: pattern.type,
          dateText: match[1] || match[0],
          clauseId: clause.id,
          urgency: pattern.urgency,
          actionRequired: pattern.actionRequired,
        });
      }
    }
  }

  return { items };
}
