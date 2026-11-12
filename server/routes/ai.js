import express from 'express';
import {
  explainClauseWithGemini,
  summarizeAgreementWithGemini,
  generateLawyerQuestionsWithGemini,
  generateAiInsightsWithGemini,
  generateDocumentBriefingWithGemini,
} from '../services/gemini-server-service.js';

const router = express.Router();

// 1. Explain individual clause
router.post('/explain-clause', async (req, res) => {
  try {
    const { clause, language = 'en' } = req.body;

    if (!clause || !clause.sanitizedText) {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD',
        message: 'Missing required clause object with sanitizedText',
      });
    }

    const explanation = await explainClauseWithGemini(clause, language);
    return res.json(explanation);
  } catch (error) {
    return res.status(500).json({
      error: 'EXPLANATION_FAILED',
      message: error.message || 'Failed to explain clause',
    });
  }
});

// 2. Summarize agreement
router.post('/summarize-agreement', async (req, res) => {
  try {
    const { clauses, contractType = 'all', language = 'en' } = req.body;

    if (!clauses || !Array.isArray(clauses)) {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD',
        message: 'Missing required clauses array for agreement summary',
      });
    }

    const summary = await summarizeAgreementWithGemini(clauses, contractType, language);
    return res.json(summary);
  } catch (error) {
    return res.status(500).json({
      error: 'SUMMARY_FAILED',
      message: error.message || 'Failed to generate agreement summary',
    });
  }
});

// 3. Generate lawyer questions
router.post('/lawyer-questions', async (req, res) => {
  try {
    const { clauses, language = 'en' } = req.body;

    if (!clauses || !Array.isArray(clauses)) {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD',
        message: 'Missing required clauses array for lawyer questions',
      });
    }

    const questions = await generateLawyerQuestionsWithGemini(clauses, language);
    return res.json(questions);
  } catch (error) {
    return res.status(500).json({
      error: 'QUESTIONS_FAILED',
      message: error.message || 'Failed to generate lawyer questions',
    });
  }
});

// 4. Generate AI insights
router.post('/insights', async (req, res) => {
  try {
    const { clauses, language = 'en' } = req.body;

    if (!clauses || !Array.isArray(clauses)) {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD',
        message: 'Missing required clauses array for insights',
      });
    }

    const insights = await generateAiInsightsWithGemini(clauses, language);
    return res.json(insights);
  } catch (error) {
    return res.status(500).json({
      error: 'INSIGHTS_FAILED',
      message: error.message || 'Failed to generate AI insights',
    });
  }
});

// 5. Generate executive document briefing
router.post('/briefing', async (req, res) => {
  try {
    const { clauses, summary = {}, language = 'en' } = req.body;

    if (!clauses || !Array.isArray(clauses)) {
      return res.status(400).json({
        error: 'INVALID_PAYLOAD',
        message: 'Missing required clauses array for document briefing',
      });
    }

    const briefing = await generateDocumentBriefingWithGemini(clauses, summary, language);
    return res.json(briefing);
  } catch (error) {
    return res.status(500).json({
      error: 'BRIEFING_FAILED',
      message: error.message || 'Failed to generate document briefing',
    });
  }
});

export default router;

