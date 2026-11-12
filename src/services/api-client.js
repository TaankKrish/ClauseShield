/**
 * API Client Facade for ClauseShield Backend
 * Connects frontend components to secure backend AI routes.
 *
 * CRITICAL ARCHITECTURAL GUARANTEE:
 * - If backend server is unreachable or offline, each function gracefully falls back
 *   to local structured mock responses so user flow never breaks.
 * - Sensitive raw PII is never passed here; only sanitized clauses are transmitted.
 */

const API_BASE_URL = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || '/api';

/**
 * Helper to post JSON to backend with timeout and fallback handling.
 */
async function postApiJson(endpoint, body, fallbackFn) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (_err) {
    // Graceful offline mock fallback
    return fallbackFn();
  }
}

// ---------------------------------------------------------------------------
// 1. CLAUSE EXPLANATION
// ---------------------------------------------------------------------------

export async function requestClauseExplanation(clause, language = 'en') {
  return postApiJson(
    '/ai/explain-clause',
    {
      clause: {
        id: clause.id,
        clauseNumber: clause.clauseNumber,
        sanitizedText: clause.sanitizedText,
        riskLevel: clause.riskLevel,
        ruleId: clause.ruleId,
        reason: clause.reason,
        legalSource: clause.legalSource,
        caveat: clause.caveat,
      },
      language,
    },
    () => getOfflineFallbackExplanation(clause, language)
  );
}

export function getOfflineFallbackExplanation(clause, language = 'en') {
  const isHi = language === 'hi';
  const clauseRef = clause.clauseNumber || clause.id || 'Clause';

  if (isHi) {
    return {
      clauseId: clause.id,
      riskLevel: clause.riskLevel,
      plainLanguageExplanation: `यह नियम (${clauseRef}) कानूनी या व्यावहारिक रूप से आपके पक्ष को कमजोर कर सकता है। वैधानिक नियम का विवरण: ${clause.reason || 'इस खंड की समीक्षा आवश्यक है'}।`,
      simpleSummary: 'यह शर्त एकतरफा हो सकती है और इसमें आपके अधिकारों पर अनुचित सीमाएं लगाई गई हैं।',
      whyFlagged: clause.reason || 'अनुचित जुर्माना या बिना कारण जब्ती का प्रावधान।',
      practicalConsequences: 'विवाद होने पर आपको आर्थिक नुकसान या अचानक बेदखली का सामना करना पड़ सकता है।',
      whatToClarify: 'क्या यह शर्त दोनों पक्षों पर समान रूप से लागू होती है?',
      questionsForLawyer: [
        `क्या यह खंड राज्य कानून (${clause.legalSource || 'संविदा कानून'}) के तहत पूरी तरह वैध है?`,
        'क्या हम इसे आपसी सहमति से 30 दिन के पूर्व नोटिस से बदल सकते हैं?',
      ],
      suggestedNextSteps: [
        'हस्ताक्षर करने से पहले इस खंड को संतुलित करने का लिखित अनुरोध करें।',
        'किसी अधिकृत अधिवक्ता से परामर्श लें।',
      ],
      disclaimer: 'क्लॉज़-शील्ड एक सूचनात्मक तैयारी उपकरण है, कानूनी वकील नहीं।',
      language: 'hi',
      isAiGenerated: false,
      isFallback: true,
    };
  }

  return {
    clauseId: clause.id,
    riskLevel: clause.riskLevel,
    plainLanguageExplanation: `This clause (${clauseRef}) introduces contractual imbalance. Under codified rules: ${clause.reason || 'This clause requires legal caution'}.`,
    simpleSummary: `Flags potential liability under ${clause.legalSource || 'Indian Contract standards'}.`,
    whyFlagged: clause.reason || 'Imposes unilateral penalties or discretionary termination without reciprocal rights.',
    practicalConsequences: 'You may be subjected to arbitrary deposit deductions or contract cancellation without dispute recourse.',
    whatToClarify: 'Ensure written notice is required and that deposit deductions require audited damage receipts.',
    questionsForLawyer: [
      `Is this provision legally enforceable under current jurisprudence (${clause.legalSource || 'Indian Contract Act'})?`,
      'What standard amendments would make this term reciprocal and fair?',
    ],
    suggestedNextSteps: [
      'Propose replacing unilateral forfeiture with mutual 30-day notice provisions.',
      'Document all communications regarding this clause in writing.',
    ],
    disclaimer: 'ClauseShield is an informational consultation-preparation tool, not an automated lawyer.',
    language: 'en',
    isAiGenerated: false,
    isFallback: true,
  };
}

// ---------------------------------------------------------------------------
// 2. AGREEMENT SUMMARY
// ---------------------------------------------------------------------------

export async function requestAgreementSummary(clauses, contractType = 'all', language = 'en') {
  return postApiJson(
    '/ai/summarize-agreement',
    {
      clauses: (clauses || []).map((c) => ({
        id: c.id,
        clauseNumber: c.clauseNumber,
        sanitizedText: c.sanitizedText,
        riskLevel: c.riskLevel,
        ruleId: c.ruleId,
      })),
      contractType,
      language,
    },
    () => getOfflineFallbackSummary(clauses, contractType, language)
  );
}

export function getOfflineFallbackSummary(clauses, contractType = 'all', language = 'en') {
  const isHi = language === 'hi';
  const flagged = (clauses || []).filter((c) => c.riskLevel === 'RED' || c.riskLevel === 'YELLOW');

  const prettyType =
    contractType === 'rental'
      ? isHi ? 'किराया अनुबंध (Rental Agreement)' : 'Residential Rental Agreement'
      : contractType === 'student_bond'
      ? isHi ? 'कोचिंग संस्थान बॉन्ड (Student Bond)' : 'Student Coaching Institute Bond'
      : contractType === 'employment'
      ? isHi ? 'रोजगार अनुबंध (Employment Agreement)' : 'Employment Agreement'
      : isHi ? 'मानक अनुबंध (Standard Agreement)' : 'Standard Agreement';

  if (isHi) {
    return {
      agreementType: prettyType,
      summaryOverview: `यह दस्तावेज़ कुल ${clauses ? clauses.length : 0} खंडों वाला ${prettyType} है। इनमें से ${flagged.length} खंडों में विशेष सतर्कता आवश्यक है।`,
      mainParties: 'अनुबंध में उल्लिखित प्रथम एवं द्वितीय पक्ष (गोपनीयता के तहत सुरक्षित)',
      paymentObligations: 'नियमित मासिक या आवधिक भुगतान समय पर देय है।',
      securityDepositAndRefund: 'जमानत राशि (सिक्योरिटी डिपॉजिट) खाली करने के बाद वापसी योग्य, यदि कोई वास्तविक नुकसान न हो।',
      importantDatesAndDeadlines: 'अनुबंध की समय-सीमा और समाप्ति के लिए आवश्यक पूर्व नोटिस।',
      noticeAndTermination: 'लिखित पूर्व सूचना द्वारा अनुबंध समाप्ति का प्रावधान।',
      majorResponsibilities: [
        'नियत समय पर शुल्क/किराया जमा करना।',
        'संबंधित नियमों और आचार संहिता का पालन करना।',
      ],
      clausesRequiringAttention: flagged.map((c) => c.clauseNumber || c.id),
      language: 'hi',
      isAiGenerated: false,
      isFallback: true,
    };
  }

  return {
    agreementType: prettyType,
    summaryOverview: `This document is a ${prettyType} with ${clauses ? clauses.length : 0} segmented clauses. ${flagged.length} clauses have been flagged for special review.`,
    mainParties: 'Primary contracting parties (PII masked by Privacy Shield)',
    paymentObligations: 'Stipulated periodic remittances payable as designated in the agreement.',
    securityDepositAndRefund: 'Security deposit refundable post-vacation subject to verified damage assessment.',
    importantDatesAndDeadlines: 'Agreement term duration and advance notice period requirements.',
    noticeAndTermination: 'Notice period required for premature exit or ordinary termination.',
    majorResponsibilities: [
      'Remit scheduled payments on or before designated due dates.',
      'Maintain property or role responsibilities as outlined in terms.',
    ],
    clausesRequiringAttention: flagged.map((c) => c.clauseNumber || c.id),
    language: 'en',
    isAiGenerated: false,
    isFallback: true,
  };
}

// ---------------------------------------------------------------------------
// 3. LAWYER QUESTIONS
// ---------------------------------------------------------------------------

export async function requestLawyerQuestions(clauses, language = 'en') {
  return postApiJson(
    '/ai/lawyer-questions',
    {
      clauses: (clauses || []).map((c) => ({
        id: c.id,
        clauseNumber: c.clauseNumber,
        sanitizedText: c.sanitizedText,
        riskLevel: c.riskLevel,
        reason: c.reason,
        legalSource: c.legalSource,
      })),
      language,
    },
    () => getOfflineFallbackLawyerQuestions(clauses, language)
  );
}

export function getOfflineFallbackLawyerQuestions(clauses, language = 'en') {
  const isHi = language === 'hi';
  const redClauses = (clauses || []).filter((c) => c.riskLevel === 'RED');

  if (isHi) {
    return {
      questions: [
        {
          clauseId: redClauses[0]?.id || 'सामान्य',
          category: 'जमानत राशि और जब्ती',
          question: 'क्या मकान मालिक या संस्थान बिना वास्तविक नुकसान साबित किए पूरी जमानत राशि रख सकता है?',
          reasonToAsk: 'भारतीय संविदा कानून की धारा 74 के अनुसार अनुचित जुर्माना गैर-कानूनी है।',
        },
        {
          clauseId: redClauses[1]?.id || 'सामान्य',
          category: 'नोटिस अवधि',
          question: 'क्या एकतरफा नोटिस अवधि को दोनों पक्षों के लिए 30 दिनों का अनिवार्य नोटिस बनाया जा सकता है?',
          reasonToAsk: 'नागरिक को अचानक बेदखली या वेतन रोकने से बचाता है।',
        },
      ],
      generalAdvice: 'वकील से परामर्श करते समय सभी भुगतान रसीदें और लिखित बातचीत साथ रखें।',
      language: 'hi',
      isAiGenerated: false,
      isFallback: true,
    };
  }

  return {
    questions: [
      {
        clauseId: redClauses[0]?.id || 'General',
        category: 'Deposit Forfeiture / Penalty',
        question: 'Can the other party legally forfeit the entire security deposit without demonstrating actual financial damages?',
        reasonToAsk: 'Section 74 of the Indian Contract Act prohibits penalty clauses exceeding genuine pre-estimated losses.',
      },
      {
        clauseId: redClauses[1]?.id || 'General',
        category: 'Termination Notice',
        question: 'How can this exit clause be amended to mandate reciprocal 30-day notice with pro-rata settlement?',
        reasonToAsk: 'Protects the citizen against arbitrary unilateral eviction or sudden cancellation.',
      },
    ],
    generalAdvice: 'Bring original draft contracts and written messages to your legal consultation.',
    language: 'en',
    isAiGenerated: false,
    isFallback: true,
  };
}

// ---------------------------------------------------------------------------
// 4. ADDITIONAL AI INSIGHTS
// ---------------------------------------------------------------------------

export async function requestAiInsights(clauses, language = 'en') {
  return postApiJson(
    '/ai/insights',
    {
      clauses: (clauses || []).map((c) => ({
        id: c.id,
        clauseNumber: c.clauseNumber,
        sanitizedText: c.sanitizedText,
      })),
      language,
    },
    () => getOfflineFallbackInsights(clauses, language)
  );
}

export function getOfflineFallbackInsights(clauses, language = 'en') {
  const isHi = language === 'hi';
  const firstClause = (clauses && clauses[0]) || { id: 'CLAUSE-001' };

  if (isHi) {
    return {
      insights: [
        {
          id: 'INSIGHT-01',
          clauseId: firstClause.clauseNumber || firstClause.id,
          observation: 'सामान्य टूट-फूट और क्षति के बीच स्पष्ट अंतर नहीं किया गया है।',
          potentialRisk: 'खाली करते समय पुरानी टूट-फूट का खर्च भी आपसे मांगा जा सकता है।',
          recommendedAction: 'प्रवेश के समय दोनों पक्षों द्वारा हस्ताक्षरित फोटो चेकलिस्ट बनाएं।',
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
        clauseId: firstClause.clauseNumber || firstClause.id,
        observation: 'Fair wear-and-tear is not explicitly distinguished from tenant/user damage.',
        potentialRisk: 'You may be billed for natural depreciation upon departure.',
        recommendedAction: 'Document the property condition with dated photographs upon moving in.',
        label: 'AI-Generated Observation',
      },
    ],
    language: 'en',
    isAiGenerated: false,
    isFallback: true,
  };
}

// ---------------------------------------------------------------------------
// 5. DOCUMENT BRIEFING
// ---------------------------------------------------------------------------

export async function requestDocumentBriefing(clauses, summary = {}, language = 'en') {
  return postApiJson(
    '/ai/briefing',
    {
      clauses: (clauses || []).map((c) => ({
        id: c.id,
        clauseNumber: c.clauseNumber,
        sanitizedText: c.sanitizedText,
        riskLevel: c.riskLevel,
        reason: c.reason,
      })),
      summary,
      language,
    },
    () => getOfflineFallbackBriefing(clauses, summary, language)
  );
}

export function getOfflineFallbackBriefing(clauses, _summary = {}, language = 'en') {
  const isHi = language === 'hi';
  const redCount = clauses ? clauses.filter((c) => c.riskLevel === 'RED').length : 0;

  if (isHi) {
    return {
      overallPurpose: 'यह दस्तावेज़ दोनों पक्षों के कानूनी अधिकारों और भुगतान की शर्तों को निर्धारित करता है।',
      majorFinancialObligations: 'नियमित किराया/शुल्क, अग्रिम जमानत राशि और विलंब शुल्क।',
      importantDeadlines: 'मासिक देय तिथि और समाप्ति के लिए आवश्यक पूर्व नोटिस।',
      keyResponsibilities: [
        'समय पर भुगतान करना।',
        'परिसर और संसाधनों की रक्षा करना।',
        'नियमों का पालन करना।',
      ],
      areasRequiringClarification: [
        redCount > 0 ? `${redCount} गंभीर जोखिम वाले खंडों पर वकील से बात करें।` : 'जमानत राशि वापसी की प्रक्रिया स्पष्ट करें।',
      ],
      audioScript: `क्लॉज़-शील्ड सुरक्षा ब्रीफिंग। इस अनुबंध में ${redCount} महत्वपूर्ण जोखिम वाले नियम चिन्हित किए गए हैं। हस्ताक्षर करने से पहले जमानत राशि की वापसी की शर्तों को स्पष्ट करना सबसे आवश्यक है।`,
      language: 'hi',
      isAiGenerated: false,
      isFallback: true,
    };
  }

  return {
    overallPurpose: 'This document defines binding payment, conduct, and performance obligations between the signing parties.',
    majorFinancialObligations: 'Scheduled remittances, refundable security deposit, and late fee consequences.',
    importantDeadlines: 'Due dates for payments, deposit refund windows, and written exit notices.',
    keyResponsibilities: [
      'Remit scheduled dues on or before specified cutoff dates.',
      'Comply with standard operational or tenancy guidelines.',
    ],
    areasRequiringClarification: [
      redCount > 0 ? `Review the ${redCount} critical flags with a legal advocate.` : 'Clarify written deposit refund timelines.',
    ],
    audioScript: `ClauseShield executive briefing. We identified ${redCount} critical risk flags in this document. Prior to signing, your top priority is clarifying the exact deposit refund timeline and ensuring exit notice terms are reciprocal.`,
    language: 'en',
    isAiGenerated: false,
    isFallback: true,
  };
}
