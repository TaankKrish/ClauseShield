/**
 * API Client Facade for ClauseShield Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Sends a sanitized clause to the backend for Gemini AI plain-language analysis.
 *
 * @param {object} clause - Sanitized clause object with rule evaluation
 * @param {'en'|'hi'} [language='en']
 * @returns {Promise<import('../../docs/MODULE_CONTRACTS.md').GeminiExplanationResponse>}
 */
export async function requestClauseExplanation(clause, language = 'en') {
  try {
    const response = await fetch(`${API_BASE_URL}/gemini/explain-clause`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clause: {
          id: clause.id,
          sanitizedText: clause.sanitizedText,
          riskLevel: clause.riskLevel,
          reason: clause.reason,
          legalSource: clause.legalSource,
          caveat: clause.caveat,
        },
        language,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (_err) {
    // Graceful offline mock fallback
    return getOfflineFallbackExplanation(clause, language);
  }
}

/**
 * High-quality offline fallback generator for demonstrations without network or API key.
 */
export function getOfflineFallbackExplanation(clause, language = 'en') {
  if (language === 'hi') {
    return {
      plainLanguageExplanation: `यह नियम (${clause.clauseNumber || clause.id}) आपको प्रतिकूल स्थिति में डाल सकता है। वैधानिक नियम के अनुसार: ${clause.reason || 'इस खंड की समीक्षा आवश्यक है'}।`,
      simpleSummary: 'यह शर्त एकतरफा हो सकती है और इसमें आपके अधिकारों पर सीमाएं लगाई गई हैं।',
      questionsForLawyer: [
        'क्या यह खंड स्थानीय राज्य कानूनों के तहत वैध है?',
        'क्या हम इसे आपसी सहमति से संशोधित कर सकते हैं?'
      ],
      suggestedNextSteps: [
        'हस्ताक्षर करने से पहले इस खंड को हटाने या संतुलित करने का अनुरोध करें।',
        'किसी अधिकृत अधिवक्ता से परामर्श लें।'
      ],
      language: 'hi',
    };
  }

  return {
    plainLanguageExplanation: `This clause (${clause.clauseNumber || clause.id}) introduces substantial contractual imbalance. Under codified rules: ${clause.reason || 'This clause requires legal caution'}.`,
    simpleSummary: `Flags potential liability under ${clause.legalSource || 'Indian Contract standards'}.`,
    questionsForLawyer: [
      `Is this provision legally enforceable under current jurisprudence (${clause.legalSource || 'Contract Act'})?`,
      'What standard amendments would make this term reciprocal and fair?',
    ],
    suggestedNextSteps: [
      'Propose replacing unilateral terms with mutual 30-day notice provisions.',
      'Document all communications regarding this clause in writing.',
    ],
    language: 'en',
  };
}
