import express from 'express';
import { explainClauseWithGemini } from '../services/gemini-server-service.js';

const router = express.Router();

router.post('/explain-clause', async (req, res) => {
  try {
    const { clause, language = 'en' } = req.body;

    if (!clause || !clause.sanitizedText) {
      return res.status(400).json({ error: 'Missing required clause object with sanitizedText' });
    }

    const explanation = await explainClauseWithGemini(clause, language);
    return res.json(explanation);
  } catch (error) {
    return res.status(500).json({
      error: 'GEMINI_PROCESSING_FAILED',
      message: error.message || 'Failed to generate explanation from Gemini API',
    });
  }
});

export default router;
