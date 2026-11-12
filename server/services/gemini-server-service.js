/**
 * Reusable Backend Gemini AI Service
 *
 * CRITICAL ARCHITECTURAL CONSTRAINTS:
 * 1. Risk classifications are deterministic and owned exclusively by the Rule Engine.
 * 2. Gemini responses must NEVER override clause.riskLevel.
 * 3. Never log API keys, citizen document text, PII, or raw prompts.
 * 4. Graceful degradation: If Gemini is unreachable or no key is provided,
 *    return structured fallback objects so the user journey remains intact.
 */

import { GoogleGenAI } from '@google/genai';
import {
  GEMINI_SYSTEM_PROMPT,
  buildClausePrompt,
  buildAgreementSummaryPrompt,
  buildLawyerQuestionsPrompt,
  buildAiInsightsPrompt,
  buildDocumentBriefingPrompt,
} from '../../src/modules/intelligence/gemini-prompts.js';

let aiClient = null;
const REQUEST_TIMEOUT_MS = 18000;
export const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';

/**
 * Resolves the configured Gemini model name from environment variables,
 * defaulting to 'gemini-3.8-flash' if unset or empty.
 */
export function getResolvedModelName() {
  const envModel = process.env.GEMINI_MODEL && process.env.GEMINI_MODEL.trim();
  return envModel || DEFAULT_GEMINI_MODEL;
}

/**
 * Returns initialized GoogleGenAI instance or null if unconfigured/dummy.
 */
export function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim().length === 0) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: apiKey.trim() });
  }
  return aiClient;
}

/**
 * Resets cached AI client (useful for unit tests changing env keys).
 */
export function resetAiClient() {
  aiClient = null;
}

/**
 * Utility to parse JSON safely from model response, handling optional markdown code fences.
 */
function cleanAndParseJson(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response received from AI model');
  }

  const trimmed = rawText.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_initialErr) {
    // Strip markdown code fences (```json ... ``` or ``` ... ```)
    const cleaned = trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  }
}

/**
 * Executes a Gemini request with strict timeout protection and structured JSON output.
 */
async function callGeminiJson(prompt, systemInstruction = GEMINI_SYSTEM_PROMPT) {
  const client = getAiClient();
  if (!client) {
    return null;
  }

  const modelName = getResolvedModelName();

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('AI request timed out after 18 seconds')), REQUEST_TIMEOUT_MS);
  });

  const generatePromise = client.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      temperature: 0.2,
    },
  });

  const response = await Promise.race([generatePromise, timeoutPromise]);
  const text = response && (typeof response.text === 'function' ? response.text() : response.text);

  return cleanAndParseJson(text);
}

// ---------------------------------------------------------------------------
// 1. CAPABILITY A: CLAUSE EXPLANATION
// ---------------------------------------------------------------------------

export async function explainClauseWithGemini(clause, language = 'en') {
  if (!clause || !clause.sanitizedText) {
    throw new Error('Clause with sanitizedText is required');
  }

  try {
    const prompt = buildClausePrompt(clause, language);
    const aiResult = await callGeminiJson(prompt);

    if (aiResult) {
      // Invariant: enforce that riskLevel cannot be altered by AI
      return {
        ...aiResult,
        clauseId: clause.id,
        riskLevel: clause.riskLevel, // Immutable preservation
        language,
        isAiGenerated: true,
      };
    }
  } catch (err) {
    console.warn(`[GeminiService] explainClause fallback triggered: ${err.message}`);
  }

  // Graceful Offline / Fallback Explanation
  return getClauseFallbackExplanation(clause, language);
}

function getClauseFallbackExplanation(clause, language = 'en') {
  const isHi = language === 'hi';
  const clauseRef = clause.clauseNumber || clause.id || 'Clause';

  if (isHi) {
    return {
      clauseId: clause.id,
      riskLevel: clause.riskLevel,
      plainLanguageExplanation: `यह नियम (${clauseRef}) कानूनी या व्यावहारिक दृष्टि से आपके अधिकारों को सीमित कर सकता है। वैधानिक नियम का विवरण: ${clause.reason || 'इस शर्त की सावधानीपूर्वक समीक्षा की जानी चाहिए।'}`,
      simpleSummary: `यह खंड ${clause.legalSource || 'भारतीय संविदा मानदंडों'} के तहत चिन्हित किया गया है।`,
      whyFlagged: clause.reason || 'यह शर्त एकतरफा हो सकती है और बिना विवाद निवारण के दायित्व डालती है।',
      practicalConsequences: 'हस्ताक्षर करने पर विवाद की स्थिति में आपको वित्तीय या प्रक्रियात्मक नुकसान उठाना पड़ सकता है।',
      whatToClarify: 'क्या यह शर्त आपसी है और क्या दोनों पक्षों पर समान रूप से लागू होती है?',
      questionsForLawyer: [
        `क्या यह नियम (${clause.legalSource || 'संविदा कानून'}) के तहत पूरी तरह कानूनी और प्रवर्तनीय है?`,
        'क्या हम इस एकतरफा शर्त को 30 दिनों के नोटिस वाले मानक नियम से बदल सकते हैं?',
      ],
      suggestedNextSteps: [
        'हस्ताक्षर करने से पहले इस खंड में आपसी संतुलन का लिखित अनुरोध करें।',
        'किसी अधिकृत अधिवक्ता से सलाह लें।',
      ],
      disclaimer: 'क्लॉज़-शील्ड एक सूचनात्मक तैयारी उपकरण है, अधिकृत अधिवक्ता नहीं।',
      language: 'hi',
      isAiGenerated: false,
      isFallback: true,
    };
  }

  return {
    clauseId: clause.id,
    riskLevel: clause.riskLevel,
    plainLanguageExplanation: `This provision (${clauseRef}) introduces contractual imbalance or financial liability. Under statutory guidelines: ${clause.reason || 'This clause requires careful legal scrutiny.'}`,
    simpleSummary: `Flagged under ${clause.legalSource || 'Indian Contract Norms'}.`,
    whyFlagged: clause.reason || 'Unilateral imposition of penalties or discretionary termination powers.',
    practicalConsequences: 'You may face unexpected financial deductions or forfeiture without a neutral dispute mechanism.',
    whatToClarify: 'Whether obligations are mutual and whether written notice is mandatory prior to action.',
    questionsForLawyer: [
      `Is this provision legally enforceable in this state under ${clause.legalSource || 'applicable statutes'}?`,
      'What standard reciprocal amendment would bring this clause into customary balance?',
    ],
    suggestedNextSteps: [
      'Propose replacing unilateral forfeiture with mutual 30-day notice provisions.',
      'Request deletion or modification before signing.',
    ],
    disclaimer: 'ClauseShield is an informational prep tool, not an automated lawyer. Consult a licensed advocate before signing.',
    language: 'en',
    isAiGenerated: false,
    isFallback: true,
  };
}

// ---------------------------------------------------------------------------
// 2. CAPABILITY B: AGREEMENT SUMMARY
// ---------------------------------------------------------------------------

export async function summarizeAgreementWithGemini(clauses, contractType = 'all', language = 'en') {
  try {
    const prompt = buildAgreementSummaryPrompt(clauses, contractType, language);
    const aiResult = await callGeminiJson(prompt);

    if (aiResult) {
      return {
        ...aiResult,
        language,
        isAiGenerated: true,
      };
    }
  } catch (err) {
    console.warn(`[GeminiService] summarizeAgreement fallback triggered: ${err.message}`);
  }

  return getAgreementSummaryFallback(clauses, contractType, language);
}

function getAgreementSummaryFallback(clauses, contractType = 'all', language = 'en') {
  const isHi = language === 'hi';
  const flagged = (clauses || []).filter((c) => c.riskLevel === 'RED' || c.riskLevel === 'YELLOW');

  const prettyType =
    contractType === 'rental'
      ? isHi ? 'आवासीय किराया अनुबंध (Rental Agreement)' : 'Residential Rental Agreement'
      : contractType === 'student_bond'
      ? isHi ? 'कोचिंग संस्थान बॉन्ड (Coaching Bond)' : 'Student Coaching Institute Bond'
      : contractType === 'employment'
      ? isHi ? 'रोजगार अनुबंध (Employment Agreement)' : 'Employment Agreement'
      : isHi ? 'कानूनी अनुबंध (Legal Agreement)' : 'Standard Legal Agreement';

  if (isHi) {
    return {
      agreementType: prettyType,
      summaryOverview: `यह दस्तावेज़ ${prettyType} है जिसमें कुल ${clauses ? clauses.length : 0} खंड हैं। इसमें ${flagged.length} खंडों की विशेष कानूनी समीक्षा आवश्यक है।`,
      mainParties: 'अनुबंध में उल्लिखित प्रथम एवं द्वितीय पक्ष (गोपनीयता के लिए नाम सुरक्षित)',
      paymentObligations: 'मासिक शुल्क या किराए की देयता नियत तारीख पर।',
      securityDepositAndRefund: 'जमानत राशि (सिक्योरिटी डिपॉजिट) खाली करने के बाद वापसी योग्य, जब तक कि कटौती का विवाद न हो।',
      importantDatesAndDeadlines: 'अनुबंध की अवधि और नोटिस अवधि का पालन अनिवार्य।',
      noticeAndTermination: 'लिखित नोटिस द्वारा समाप्ति का प्रावधान (नियमों की पुष्टि करें)।',
      majorResponsibilities: [
        'नियत समय पर भुगतान करना।',
        'अनुबंध की शर्तों और नियमों का पालन करना।',
      ],
      clausesRequiringAttention: flagged.map((c) => c.clauseNumber || c.id),
      language: 'hi',
      isAiGenerated: false,
      isFallback: true,
    };
  }

  return {
    agreementType: prettyType,
    summaryOverview: `This document is a ${prettyType} comprising ${clauses ? clauses.length : 0} segmented clauses. ${flagged.length} clauses have been flagged for special citizen attention.`,
    mainParties: 'First and Second Contracting Parties (PII protected by Privacy Shield)',
    paymentObligations: 'Periodic payments and associated financial commitments as specified in clauses.',
    securityDepositAndRefund: 'Security deposit refundable subject to legitimate arrears/damage inspection.',
    importantDatesAndDeadlines: 'Term duration and written notice timelines stipulated in the text.',
    noticeAndTermination: 'Notice period required prior to termination or vacation of premises/role.',
    majorResponsibilities: [
      'Maintain timely remittances and adhere to contractual operational guidelines.',
      'Provide required written advance notice before early departure or contract severance.',
    ],
    clausesRequiringAttention: flagged.map((c) => c.clauseNumber || c.id),
    language: 'en',
    isAiGenerated: false,
    isFallback: true,
  };
}

// ---------------------------------------------------------------------------
// 3. CAPABILITY C: LAWYER QUESTIONS
// ---------------------------------------------------------------------------

export async function generateLawyerQuestionsWithGemini(clauses, language = 'en') {
  try {
    const prompt = buildLawyerQuestionsPrompt(clauses, language);
    const aiResult = await callGeminiJson(prompt);

    if (aiResult && Array.isArray(aiResult.questions)) {
      return {
        ...aiResult,
        language,
        isAiGenerated: true,
      };
    }
  } catch (err) {
    console.warn(`[GeminiService] lawyerQuestions fallback triggered: ${err.message}`);
  }

  return getLawyerQuestionsFallback(clauses, language);
}

function getLawyerQuestionsFallback(clauses, language = 'en') {
  const isHi = language === 'hi';
  const redClauses = (clauses || []).filter((c) => c.riskLevel === 'RED');

  if (isHi) {
    return {
      questions: [
        {
          clauseId: redClauses[0]?.id || 'सामान्य',
          category: 'जमानत राशि और जब्ती (Security Deposit)',
          question: 'क्या मकान मालिक या संस्थान बिना किसी वास्तविक नुकसान के पूरी जमानत राशि जब्त कर सकता है?',
          reasonToAsk: 'भारतीय संविदा अधिनियम की धारा 74 के तहत अनुचित जुर्माने पर रोक है।',
        },
        {
          clauseId: redClauses[1]?.id || 'सामान्य',
          category: 'नोटिस अवधि और समाप्ति (Notice Period)',
          question: 'क्या एकतरफा नोटिस अवधि को दोनों पक्षों के लिए 30 दिनों का अनिवार्य नोटिस बनाया जा सकता है?',
          reasonToAsk: 'असंतुलित नोटिस अवधि से नागरिक को अचानक बेदखली या वेतन नुकसान हो सकता है।',
        },
        {
          clauseId: 'सामान्य',
          category: 'विवाद समाधान (Dispute Resolution)',
          question: 'विवाद होने पर स्थानीय न्यायालय या मध्यस्थता का अधिकार क्षेत्र क्या होगा?',
          reasonToAsk: 'सुदूर क्षेत्राधिकार तय करने से नागरिक के लिए कानूनी लड़ाई बहुत महंगी हो जाती है।',
        },
      ],
      generalAdvice: 'परामर्श के समय मूल अनुबंध की प्रति, भुगतान रसीदें और दोनों पक्षों के बीच हुए ईमेल/संदेश साथ रखें।',
      language: 'hi',
      isAiGenerated: false,
      isFallback: true,
    };
  }

  return {
    questions: [
      {
        clauseId: redClauses[0]?.id || 'General',
        category: 'Deposit Forfeiture / Penalties',
        question: 'Can the other party legally forfeit the entire security deposit without demonstrating actual financial damages or rent default?',
        reasonToAsk: 'Section 74 of the Indian Contract Act prohibits unreasonable penalty clauses beyond genuine pre-estimated losses.',
      },
      {
        clauseId: redClauses[1]?.id || 'General',
        category: 'Unilateral Termination & Notice',
        question: 'How can we structure this exit clause to ensure mutual 30-day notice with pro-rata settlement?',
        reasonToAsk: 'Protects the citizen from immediate unilateral eviction or arbitrary contract termination.',
      },
      {
        clauseId: 'General',
        category: 'Jurisdiction & Dispute Mechanism',
        question: 'Does the stated dispute resolution jurisdiction create undue procedural hardship or travel burdens?',
        reasonToAsk: 'Prevents distant jurisdictional traps that make legal recourse cost-prohibitive.',
      },
    ],
    generalAdvice: 'Bring all payment receipts, draft agreement versions, and written correspondence to your advocate consultation.',
    language: 'en',
    isAiGenerated: false,
    isFallback: true,
  };
}

// ---------------------------------------------------------------------------
// 4. CAPABILITY D: ADDITIONAL AI INSIGHTS
// ---------------------------------------------------------------------------

export async function generateAiInsightsWithGemini(clauses, language = 'en') {
  try {
    const prompt = buildAiInsightsPrompt(clauses, language);
    const aiResult = await callGeminiJson(prompt);

    if (aiResult && Array.isArray(aiResult.insights)) {
      return {
        ...aiResult,
        language,
        isAiGenerated: true,
      };
    }
  } catch (err) {
    console.warn(`[GeminiService] aiInsights fallback triggered: ${err.message}`);
  }

  return getAiInsightsFallback(clauses, language);
}

function getAiInsightsFallback(clauses, language = 'en') {
  const isHi = language === 'hi';
  const sampleClause = (clauses && clauses[0]) || { id: 'CLAUSE-001' };

  if (isHi) {
    return {
      insights: [
        {
          id: 'INSIGHT-01',
          clauseId: sampleClause.clauseNumber || sampleClause.id,
          observation: 'रखरखाव और सामान्य टूट-फूट की स्पष्ट सीमाएं परिभाषित नहीं हैं।',
          potentialRisk: 'खाली करते समय सामान्य टूट-फूट का खर्च भी आपसे वसूला जा सकता है।',
          recommendedAction: 'प्रवेश के समय संयुक्त निरीक्षण सूची (Inspection Checklist) बनाएं और फोटो संलग्न करें।',
          label: 'AI-Generated Observation',
        },
        {
          id: 'INSIGHT-02',
          clauseId: 'General',
          observation: 'भुगतान की रसीद जारी करने की कोई स्पष्ट समय-सीमा उल्लिखित नहीं है।',
          potentialRisk: 'नकद या बैंक ट्रांसफर के बाद औपचारिक पावती न मिलने पर भविष्य में विवाद हो सकता है।',
          recommendedAction: 'स्पष्ट शर्त जोड़ें कि भुगतान के 7 दिनों के भीतर आधिकारिक रसीद अनिवार्य होगी।',
          label: 'AI-Generated Observation',
        },
      ],
      language: 'hi',
      isAiGenerated: false,
      isFallback: true,
    };
  }

  return {
    insights: [
      {
        id: 'INSIGHT-01',
        clauseId: sampleClause.clauseNumber || sampleClause.id,
        observation: 'Fair wear-and-tear standards are not distinguished from tenant damage.',
        potentialRisk: 'The citizen may be billed for pre-existing building depreciation upon vacating.',
        recommendedAction: 'Attach a signed Move-In Inspection Checklist with dated photographic records.',
        label: 'AI-Generated Observation',
      },
      {
        id: 'INSIGHT-02',
        clauseId: 'General',
        observation: 'Absence of an explicit written receipt timeline for remittances.',
        potentialRisk: 'Lack of formal acknowledgment could create audit or dispute difficulties later.',
        recommendedAction: 'Insert a requirement that digital or physical receipts be issued within 7 days of payment.',
        label: 'AI-Generated Observation',
      },
    ],
    language: 'en',
    isAiGenerated: false,
    isFallback: true,
  };
}

// ---------------------------------------------------------------------------
// 5. CAPABILITY E: AI DOCUMENT BRIEFING
// ---------------------------------------------------------------------------

export async function generateDocumentBriefingWithGemini(clauses, summary = {}, language = 'en') {
  try {
    const prompt = buildDocumentBriefingPrompt(clauses, summary, language);
    const aiResult = await callGeminiJson(prompt);

    if (aiResult && aiResult.overallPurpose) {
      return {
        ...aiResult,
        language,
        isAiGenerated: true,
      };
    }
  } catch (err) {
    console.warn(`[GeminiService] documentBriefing fallback triggered: ${err.message}`);
  }

  return getDocumentBriefingFallback(clauses, summary, language);
}

function getDocumentBriefingFallback(clauses, _summary = {}, language = 'en') {
  const isHi = language === 'hi';
  const redCount = clauses ? clauses.filter((c) => c.riskLevel === 'RED').length : 0;

  if (isHi) {
    return {
      overallPurpose: 'यह दस्तावेज़ एक कानूनी अनुबंध है जो दोनों पक्षों के वैधानिक अधिकारों, भुगतान और जिम्मेदारियों को तय करता है।',
      majorFinancialObligations: 'नियमित किराया या शुल्क, अग्रिम जमानत राशि और देरी से भुगतान पर लगने वाले शुल्क।',
      importantDeadlines: 'मासिक देय तिथि, अग्रिम नोटिस अवधि और अनुबंध नवीनीकरण की समय-सीमा।',
      keyResponsibilities: [
        'नियमों के अनुसार समय पर भुगतान करना।',
        'परिसर या संसाधनों की उचित देखभाल करना।',
        'नियम समाप्ति से पहले आवश्यक लिखित नोटिस देना।',
      ],
      areasRequiringClarification: [
        redCount > 0
          ? `${redCount} चिन्हित गंभीर जोखिम वाले खंडों पर वकील से बात करें।`
          : 'जमानत राशि की वापसी की प्रक्रिया और समय-सीमा स्पष्ट करें।',
        'एकतरफा समाप्ति और जुर्माने की शर्तों को संतुलित करवाएं।',
      ],
      audioScript: `क्लॉज़-शील्ड सुरक्षा ब्रीफिंग। इस अनुबंध में ${redCount} महत्वपूर्ण जोखिम वाले नियम चिन्हित किए गए हैं। हस्ताक्षर करने से पहले जमानत राशि की वापसी और नोटिस अवधि की शर्तों को स्पष्ट करना सबसे आवश्यक है।`,
      language: 'hi',
      isAiGenerated: false,
      isFallback: true,
    };
  }

  return {
    overallPurpose: 'This document is a binding contract defining legal duties, payment schedules, and performance requirements between the parties.',
    majorFinancialObligations: 'Regular remittances, refundable security deposit, and potential penalties for delayed performance.',
    importantDeadlines: 'Monthly payment cutoff dates, written termination notice periods, and deposit refund windows.',
    keyResponsibilities: [
      'Remit stipulated fees on or before designated due dates.',
      'Maintain proper upkeep and comply with lawful operational guidelines.',
      'Serve documented advance written notice prior to departure or termination.',
    ],
    areasRequiringClarification: [
      redCount > 0
        ? `Review the ${redCount} critical risk clauses flagged by the statutory engine with an advocate.`
        : 'Confirm explicit deposit refund timeline in writing.',
      'Ensure exit notice requirements are mutual rather than unilateral.',
    ],
    audioScript: `ClauseShield executive briefing. We identified ${redCount} critical risk flags in this document. Prior to signing, your top priorities are clarifying the exact security deposit refund timeframe and ensuring exit notice terms are strictly mutual.`,
    language: 'en',
    isAiGenerated: false,
    isFallback: true,
  };
}
