/**
 * Deterministic Statutory Legal Rule Engine
 *
 * CRITICAL INVARIANTS:
 * 1. Independent of Gemini or any external AI service.
 * 2. Unmatched clauses must NEVER be classified as GREEN; they are UNASSESSED.
 * 3. Only enabled rules are evaluated.
 * 4. Preserves matched evidence and supports multiple matching rules.
 */

import { RISK_LEVELS } from '../../constants/risk-levels.js';
import rentalRules from '../../data/legal-rules/rental-rules.json';
import studentRules from '../../data/legal-rules/student-bond-rules.json';
import employmentRules from '../../data/legal-rules/employment-rules.json';

export const RULE_CATALOG = Object.freeze({
  rental: rentalRules,
  student_bond: studentRules,
  employment: employmentRules,
  all: [...rentalRules, ...studentRules, ...employmentRules],
});

const SEVERITY_WEIGHT = Object.freeze({
  [RISK_LEVELS.RED]: 3,
  [RISK_LEVELS.YELLOW]: 2,
  [RISK_LEVELS.GREEN]: 1,
  [RISK_LEVELS.UNASSESSED]: 0,
});

/**
 * Tests whether a clause text matches a given statutory rule.
 *
 * @param {string} text - Lowercase clause text
 * @param {object} rule - Rule definition
 * @returns {{ matched: boolean, evidence: string[] }}
 */
function testRuleMatch(text, rule) {
  if (rule.enabled === false) {
    return { matched: false, evidence: [] };
  }

  const evidence = [];

  // 1. Pattern testing (Regex)
  if (Array.isArray(rule.patterns)) {
    for (const patternStr of rule.patterns) {
      try {
        const regex = new RegExp(patternStr, 'i');
        const match = regex.exec(text);
        if (match) {
          evidence.push(match[0]);
          return { matched: true, evidence };
        }
      } catch (_regexErr) {
        // Safe regex evaluation
      }
    }
  } else if (rule.pattern) {
    try {
      const regex = new RegExp(rule.pattern, 'i');
      const match = regex.exec(text);
      if (match) {
        evidence.push(match[0]);
        return { matched: true, evidence };
      }
    } catch (_err) {
      // Safe regex evaluation
    }
  }

  // 2. Keyword conditions testing
  if (Array.isArray(rule.conditions) && rule.conditions.length > 0) {
    const matchedConditions = rule.conditions.filter((cond) =>
      text.includes(cond.toLowerCase())
    );

    // Require majority of conditions to match if no regex matched
    if (matchedConditions.length >= Math.min(2, rule.conditions.length)) {
      evidence.push(...matchedConditions);
      return { matched: true, evidence };
    }
  }

  return { matched: false, evidence: [] };
}

/**
 * Deterministically evaluates a single clause against the configured rule catalog.
 *
 * @param {object} clause - Clause object { id, sanitizedText, ... }
 * @param {string} [contractCategory='all'] - Category to scope rules
 * @returns {object} Evaluated clause with riskLevel, ruleId, reason, legalSource, caveat, matchedRules, evidence
 */
export function evaluateClause(clause, contractCategory = 'all') {
  const allCategoryRules = RULE_CATALOG[contractCategory] || RULE_CATALOG.all;
  // Filter for enabled rules only
  const activeRules = allCategoryRules.filter((r) => r.enabled !== false);
  const text = (clause.sanitizedText || clause.text || '').toLowerCase();

  const matchingRules = [];
  const allEvidence = [];

  for (const rule of activeRules) {
    const result = testRuleMatch(text, rule);
    if (result.matched) {
      matchingRules.push(rule);
      allEvidence.push(...result.evidence);
    }
  }

  // If one or more rules matched, pick the highest severity rule as primary
  if (matchingRules.length > 0) {
    matchingRules.sort((a, b) => {
      const weightA = SEVERITY_WEIGHT[a.riskLevel] || 0;
      const weightB = SEVERITY_WEIGHT[b.riskLevel] || 0;
      return weightB - weightA;
    });

    const primaryRule = matchingRules[0];

    return {
      id: clause.id || 'CLAUSE-001',
      clauseNumber: clause.clauseNumber || '1',
      text: clause.text || clause.sanitizedText || '',
      sanitizedText: clause.sanitizedText || clause.text || '',
      riskLevel: primaryRule.riskLevel || RISK_LEVELS.YELLOW,
      ruleId: primaryRule.id,
      reason: primaryRule.explanation || primaryRule.description || primaryRule.reason || 'Flagged by statutory rule catalog.',
      legalSource: primaryRule.legalSource || 'Statutory legal benchmark',
      caveat: primaryRule.caveat || 'Applicability depends on state jurisdiction and specific contract terms.',
      matchedRules: matchingRules.map((r) => ({
        id: r.id,
        name: r.name,
        riskLevel: r.riskLevel,
        legalSource: r.legalSource,
      })),
      evidence: Array.from(new Set(allEvidence)),
    };
  }

  // CRITICAL INVARIANT: Unmatched clauses are UNASSESSED, never automatically GREEN
  return {
    id: clause.id || 'CLAUSE-001',
    clauseNumber: clause.clauseNumber || '1',
    text: clause.text || clause.sanitizedText || '',
    sanitizedText: clause.sanitizedText || clause.text || '',
    riskLevel: RISK_LEVELS.UNASSESSED,
    ruleId: null,
    reason: 'No statutory concerns or standard baseline provisions matched this clause in the current rule catalog.',
    legalSource: 'Unassessed - Independent legal review recommended.',
    caveat: 'The absence of a matched statutory rule does not confirm that this clause is legally balanced or risk-free.',
    matchedRules: [],
    evidence: [],
  };
}

/**
 * Evaluates an entire array of clauses and returns the assessed list and summary metrics.
 *
 * @param {Array<object>|{ clauses: Array<object> }} input - Array of clauses or object with .clauses
 * @param {string} [contractCategory='all']
 * @returns {{
 *   clauses: Array<object>,
 *   summary: { red: number, yellow: number, green: number, unassessed: number, total: number }
 * }}
 */
export function evaluateAllClauses(input, contractCategory = 'all') {
  const clauseList = Array.isArray(input)
    ? input
    : input && Array.isArray(input.clauses)
    ? input.clauses
    : [];

  const evaluated = clauseList.map((clause) => evaluateClause(clause, contractCategory));

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
