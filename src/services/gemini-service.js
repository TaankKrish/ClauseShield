import { requestClauseExplanation, getOfflineFallbackExplanation } from './api-client.js';

/**
 * Service facade for Gemini intelligence queries.
 */
export const geminiService = {
  /**
   * Explain an individual evaluated clause.
   */
  async explainClause(clause, language = 'en') {
    return requestClauseExplanation(clause, language);
  },

  /**
   * Generates offline mock response for headless testing or disconnected operation.
   */
  getOfflineExplanation(clause, language = 'en') {
    return getOfflineFallbackExplanation(clause, language);
  },
};

