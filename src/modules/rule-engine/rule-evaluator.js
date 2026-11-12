import { RISK_LEVELS } from '../../constants/risk-levels.js';
import rentalRules from '../../data/legal-rules/rental-rules.json';
import studentRules from '../../data/legal-rules/student-bond-rules.json';
import employmentRules from '../../data/legal-rules/employment-rules.json';

const RULE_CATALOG = {
  rental: rentalRules,
  student_bond: studentRules,
  employment: employmentRules,
  all: [...rentalRules, ...studentRules, ...employmentRules],
};

/**
 * Deterministically evaluates a clause against codified statutory rules.
 *
 * @param {object} clause - The clause to evaluate { id, sanitizedText, ... }
 * @param {string} [contractCategory='all'] - The category of rules to apply
 * @returns {object} Evaluated clause with risk level, ruleId, reason, legalSource, caveat
 */
export function evaluateClause(clause, contractCategory = 'all') {
  const rules = RULE_CATALOG[contractCategory] || RULE_CATALOG.all;
  const text = (clause.sanitizedText || '').toLowerCase();

  for (const rule of rules) {
    let matches = false;

    if (rule.pattern) {
      try {
        const regex = new RegExp(rule.pattern, 'i');
        matches = regex.test(text);
      } catch (_e) {
        // Fallback to keyword matching if regex fails
        matches = false;
      }
    }

    if (!matches && Array.isArray(rule.keywords) && rule.keywords.length > 0) {
      const matchedKeywords = rule.keywords.filter((kw) => text.includes(kw.toLowerCase()));
      matches = matchedKeywords.length >= Math.min(2, rule.keywords.length);
    }

    if (matches) {
      return {
        ...clause,
        riskLevel: rule.riskLevel || RISK_LEVELS.YELLOW,
        ruleId: rule.id,
        reason: rule.reason,
        legalSource: rule.legalSource,
        caveat: rule.caveat,
      };
    }
  }

  // CRITICAL INVARIANT: Unmatched clauses must be UNASSESSED, NEVER automatically GREEN
  return {
    ...clause,
    riskLevel: RISK_LEVELS.UNASSESSED,
    ruleId: null,
    reason: 'No statutory violations or standard terms detected by existing rule catalog.',
    legalSource: 'Unassessed - Citizen manual or legal review recommended.',
    caveat: 'A lack of matched rules does not guarantee the clause is safe.',
  };
}

/**
 * Evaluates an entire array of clauses and returns the assessed list plus summary statistics.
 *
 * @param {Array<object>} clauses - Array of segmented clauses
 * @param {string} [contractCategory='all']
 * @returns {{ clauses: Array<object>, summary: { red: number, yellow: number, green: number, unassessed: number, total: number } }}
 */
export function evaluateAllClauses(clauses, contractCategory = 'all') {
  if (!Array.isArray(clauses)) {
    return {
      clauses: [],
      summary: { red: 0, yellow: 0, green: 0, unassessed: 0, total: 0 },
    };
  }

  const evaluated = clauses.map((clause) => evaluateClause(clause, contractCategory));

  const summary = {
    red: 0,
    yellow: 0,
    green: 0,
    unassessed: 0,
    total: evaluated.length,
  };

  for (const c of evaluated) {
    if (c.riskLevel === RISK_LEVELS.RED) summary.red++;
    else if (c.riskLevel === RISK_LEVELS.YELLOW) summary.yellow++;
    else if (c.riskLevel === RISK_LEVELS.GREEN) summary.green++;
    else summary.unassessed++;
  }

  return {
    clauses: evaluated,
    summary,
  };
}
