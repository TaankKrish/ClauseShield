import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { piiGuardMiddleware } from './middleware/pii-guard.js';
import aiRoutes from './routes/ai.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'ClauseShield API Gateway',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(
      process.env.GEMINI_API_KEY &&
      process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here' &&
      process.env.GEMINI_API_KEY.trim().length > 0
    ),
  });
});

// Guard all intelligence endpoints against unredacted PII leakage
app.use('/api/ai', piiGuardMiddleware, aiRoutes);
app.use('/api/gemini', piiGuardMiddleware, aiRoutes); // Backwards-compatible route prefix

// Only listen if not running in test suite
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`ClauseShield API Gateway running on port ${PORT}`);
  });
}

export default app;
