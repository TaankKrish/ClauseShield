import { GoogleGenAI } from '@google/genai';
import { GEMINI_SYSTEM_PROMPT, buildClausePrompt } from '../../src/modules/intelligence/gemini-prompts.js';

let aiClient = null;

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export async function explainClauseWithGemini(clause, language = 'en') {
  const client = getAiClient();
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!client) {
    // Return structured offline fallback if no API key is configured
    return {
      plainLanguageExplanation: `[Demo Mode / No API Key] This clause (${clause.clauseNumber || clause.id}) imposes terms flagged under ${clause.legalSource || 'Indian Contract Norms'}. Reason: ${clause.reason}.`,
      simpleSummary: `Flagged under ${clause.legalSource || 'statutory guidelines'}.`,
      questionsForLawyer: [
        'Is this specific restriction customary or enforceable in this jurisdiction?',
        'Can this term be struck or replaced with reciprocal notice?'
      ],
      suggestedNextSteps: [
        'Propose standard mutual notice terms.',
        'Request legal counsel review before contract execution.'
      ],
      language,
    };
  }

  const prompt = buildClausePrompt(clause, language);

  const response = await client.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction: GEMINI_SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const text = response.text;
  try {
    return JSON.parse(text);
  } catch (_e) {
    // If model returned json within markdown fences
    const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanText);
  }
}
