/**
 * Standardized Legal Risk Levels for ClauseShield
 * Governed by the Deterministic Rule Engine
 */
export const RISK_LEVELS = Object.freeze({
  RED: 'RED',             // Critical risk: Unlawful penalty, statutory violation, or one-sided liability
  YELLOW: 'YELLOW',       // Cautionary risk: Ambiguous terms, one-sided notice, or missing dispute redressal
  GREEN: 'GREEN',         // Safe/Standard: Balanced, standard statutory terms
  UNASSESSED: 'UNASSESSED', // Unmatched: No codified rule matched; NEVER assumed safe
});

export const RISK_METADATA = Object.freeze({
  [RISK_LEVELS.RED]: {
    label: 'Critical Risk',
    color: 'red',
    badgeClass: 'bg-red-500/15 text-red-400 border-red-500/30',
    description: 'Potentially void or severe statutory violation under Indian law.',
  },
  [RISK_LEVELS.YELLOW]: {
    label: 'Needs Review',
    color: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    description: 'Ambiguous or heavily one-sided terms; negotiate before signing.',
  },
  [RISK_LEVELS.GREEN]: {
    label: 'Standard / Balanced',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    description: 'Standard contractual clause adhering to legal norms.',
  },
  [RISK_LEVELS.UNASSESSED]: {
    label: 'Unassessed',
    color: 'slate',
    badgeClass: 'bg-slate-700/30 text-slate-400 border-slate-600/30',
    description: 'No matching statutory rule found. Does not imply safe or dangerous.',
  },
});

