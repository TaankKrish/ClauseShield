import { useState, useCallback } from 'react';
import { geminiService } from '../services/gemini-service.js';

export function useGemini() {
  // Clause Explanation Modal State
  const [activeClause, setActiveClause] = useState(null);
  const [clauseExplanation, setClauseExplanation] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [explanationError, setExplanationError] = useState(null);

  // Agreement Summary State
  const [agreementSummary, setAgreementSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState(null);

  // Lawyer Questions State
  const [lawyerQuestions, setLawyerQuestions] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState(null);

  // AI Insights State
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState(null);

  // Document Briefing State
  const [documentBriefing, setDocumentBriefing] = useState(null);
  const [loadingBriefing, setLoadingBriefing] = useState(false);
  const [briefingError, setBriefingError] = useState(null);

  const explainClause = useCallback(async (clause, language = 'en') => {
    if (!clause) return;
    setActiveClause(clause);
    setClauseExplanation(null);
    setLoadingExplanation(true);
    setExplanationError(null);

    try {
      const data = await geminiService.explainClause(clause, language);
      setClauseExplanation(data);
      return data;
    } catch (err) {
      setExplanationError(err.message || 'Failed to generate explanation');
    } finally {
      setLoadingExplanation(false);
    }
  }, []);

  const closeExplanationModal = useCallback(() => {
    setActiveClause(null);
    setClauseExplanation(null);
    setExplanationError(null);
  }, []);

  const fetchSummary = useCallback(async (clauses, contractType = 'all', language = 'en') => {
    if (!clauses || clauses.length === 0) return;
    setLoadingSummary(true);
    setSummaryError(null);

    try {
      const data = await geminiService.summarizeAgreement(clauses, contractType, language);
      setAgreementSummary(data);
      return data;
    } catch (err) {
      setSummaryError(err.message || 'Failed to generate summary');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  const fetchLawyerQuestions = useCallback(async (clauses, language = 'en') => {
    if (!clauses || clauses.length === 0) return;
    setLoadingQuestions(true);
    setQuestionsError(null);

    try {
      const data = await geminiService.getLawyerQuestions(clauses, language);
      setLawyerQuestions(data);
      return data;
    } catch (err) {
      setQuestionsError(err.message || 'Failed to generate lawyer questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, []);

  const fetchAiInsights = useCallback(async (clauses, language = 'en') => {
    if (!clauses || clauses.length === 0) return;
    setLoadingInsights(true);
    setInsightsError(null);

    try {
      const data = await geminiService.getAiInsights(clauses, language);
      setAiInsights(data);
      return data;
    } catch (err) {
      setInsightsError(err.message || 'Failed to generate insights');
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  const fetchDocumentBriefing = useCallback(async (clauses, summary = {}, language = 'en') => {
    if (!clauses || clauses.length === 0) return;
    setLoadingBriefing(true);
    setBriefingError(null);

    try {
      const data = await geminiService.getDocumentBriefing(clauses, summary, language);
      setDocumentBriefing(data);
      return data;
    } catch (err) {
      setBriefingError(err.message || 'Failed to generate briefing');
    } finally {
      setLoadingBriefing(false);
    }
  }, []);

  const resetAll = useCallback(() => {
    setActiveClause(null);
    setClauseExplanation(null);
    setAgreementSummary(null);
    setLawyerQuestions(null);
    setAiInsights(null);
    setDocumentBriefing(null);
  }, []);

  return {
    // Clause Explanation
    activeClause,
    clauseExplanation,
    loadingExplanation,
    explanationError,
    explainClause,
    closeExplanationModal,

    // Summary
    agreementSummary,
    loadingSummary,
    summaryError,
    fetchSummary,

    // Lawyer Questions
    lawyerQuestions,
    loadingQuestions,
    questionsError,
    fetchLawyerQuestions,

    // Insights
    aiInsights,
    loadingInsights,
    insightsError,
    fetchAiInsights,

    // Briefing
    documentBriefing,
    loadingBriefing,
    briefingError,
    fetchDocumentBriefing,

    resetAll,
  };
}

