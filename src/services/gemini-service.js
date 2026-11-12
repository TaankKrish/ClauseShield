import {
  requestClauseExplanation,
  requestAgreementSummary,
  requestLawyerQuestions,
  requestAiInsights,
  requestDocumentBriefing,
  getOfflineFallbackExplanation,
  getOfflineFallbackSummary,
  getOfflineFallbackLawyerQuestions,
  getOfflineFallbackInsights,
  getOfflineFallbackBriefing,
} from './api-client.js';

/**
 * Service facade for Gemini AI intelligence queries.
 */
export const geminiService = {
  /**
   * Explain an individual evaluated clause.
   */
  async explainClause(clause, language = 'en') {
    return requestClauseExplanation(clause, language);
  },

  /**
   * Summarize the entire agreement structure.
   */
  async summarizeAgreement(clauses, contractType = 'all', language = 'en') {
    return requestAgreementSummary(clauses, contractType, language);
  },

  /**
   * Generate advocate consultation questions for flagged clauses.
   */
  async getLawyerQuestions(clauses, language = 'en') {
    return requestLawyerQuestions(clauses, language);
  },

  /**
   * Generate additional AI observations not covered by deterministic rules.
   */
  async getAiInsights(clauses, language = 'en') {
    return requestAiInsights(clauses, language);
  },

  /**
   * Generate an executive document briefing.
   */
  async getDocumentBriefing(clauses, summary = {}, language = 'en') {
    return requestDocumentBriefing(clauses, summary, language);
  },

  // Offline mock accessors for testing or headless disconnected usage
  getOfflineExplanation: getOfflineFallbackExplanation,
  getOfflineSummary: getOfflineFallbackSummary,
  getOfflineLawyerQuestions: getOfflineFallbackLawyerQuestions,
  getOfflineInsights: getOfflineFallbackInsights,
  getOfflineBriefing: getOfflineFallbackBriefing,
};
