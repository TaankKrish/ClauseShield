/**
 * Shared Formatting Utilities for ClauseShield
 */

export function truncateText(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

export function formatRiskScore(summary) {
  if (!summary || summary.total === 0) return 0;
  // Risk score formula: Red gives 100 points, Yellow gives 40, Green gives 0
  const score = Math.round(((summary.red * 100 + summary.yellow * 40) / (summary.total * 100)) * 100);
  return Math.min(100, Math.max(0, score));
}

