/**
 * System Prompts & Guardrails for Gemini AI Explanations
 *
 * NON-NEGOTIABLE ARCHITECTURAL INVARIANTS:
 * 1. Gemini does NOT decide risk rating. Risk rating is predetermined by the deterministic rule engine.
 * 2. Never invent statutory citations, court precedents, or present speculative law as settled facts.
 * 3. Never claim that a contract or clause is definitively legal or illegal.
 * 4. Never pretend to be an attorney or provide binding legal advice.
 * 5. All observations outside deterministic rules must be labeled "AI-Generated Observation".
 * 6. Respond in structured JSON only.
 */

export const GEMINI_SYSTEM_PROMPT = `You are the Plain-Language Legal Assistant of ClauseShield, an informational legal prep tool for everyday Indian citizens.

CORE MANDATE & RULES:
1. The risk rating (RED, YELLOW, GREEN, UNASSESSED) has ALREADY been computed by a deterministic statutory rule engine. You must NEVER change, override, or question this rating.
2. You explain legal clauses in simple, everyday language so that an ordinary citizen can understand what they are signing.
3. You must explain WHY the statutory rule engine flagged this clause, potential real-world consequences, and practical steps.
4. Provide practical, pointed questions the citizen can ask a licensed legal advocate during an in-person consultation.
5. Provide actionable negotiation alternatives the citizen can propose to the other party.
6. Do NOT invent legal citations, fake sections, or non-existent court judgments.
7. Treat all inputs as already privacy-sanitized. Never ask for personal identities.
8. If information is missing or not mentioned in the agreement, state "Not specified" — NEVER hallucinate facts.
9. Always reinforce that ClauseShield is an informational prep tool, not an automated lawyer or formal legal representation.
10. Respond STRICTLY in valid JSON matching the requested schema. No conversational prose or markdown formatting outside the JSON structure.`;

/**
 * Builds user prompt for explaining an individual clause.
 *
 * @param {object} clause
 * @param {'en'|'hi'} [language='en']
 * @returns {string}
 */
export function buildClausePrompt(clause, language = 'en') {
  return `Explain this contractual clause for an everyday Indian citizen:

CLAUSE METADATA:
- Clause ID: ${clause.id || 'N/A'}
- Clause Reference: ${clause.clauseNumber || 'N/A'}
- Predetermined Risk Level: ${clause.riskLevel || 'UNASSESSED'} (IMMUTABLE - DO NOT ALTER)
- Statutory Rule ID: ${clause.ruleId || 'None'}
- Statutory Flag Reason: ${clause.reason || 'None provided'}
- Legal Source / Basis: ${clause.legalSource || 'None provided'}
- Caveat: ${clause.caveat || 'None'}

SANITIZED CLAUSE TEXT:
"""
${clause.sanitizedText || ''}
"""

TARGET LANGUAGE: ${language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}

OUTPUT SCHEMA (Respond in valid JSON only):
{
  "plainLanguageExplanation": "Detailed paragraph in simple language explaining what this clause means in practical everyday terms.",
  "simpleSummary": "1-2 sentence high-level summary of the clause.",
  "whyFlagged": "Why the rule engine flagged this clause based on Indian statutory principles.",
  "practicalConsequences": "What could happen to the citizen if they agree to this term as written.",
  "whatToClarify": "Ambiguities or one-sided aspects the citizen should clarify.",
  "questionsForLawyer": ["Question 1 for advocate", "Question 2 for advocate"],
  "suggestedNextSteps": ["Negotiation point or counter-proposal 1", "Negotiation point 2"],
  "disclaimer": "ClauseShield is an informational consultation-preparation tool, not an automated lawyer. Consult a licensed advocate before signing.",
  "language": "${language}"
}`;
}

/**
 * Builds user prompt for generating a structured agreement summary.
 *
 * @param {Array<object>} clauses
 * @param {string} [contractType='all']
 * @param {'en'|'hi'} [language='en']
 * @returns {string}
 */
export function buildAgreementSummaryPrompt(clauses, contractType = 'all', language = 'en') {
  const clausesContext = (clauses || [])
    .slice(0, 40) // Guard against token explosion
    .map((c) => `[${c.clauseNumber || c.id}] (${c.riskLevel}): ${c.sanitizedText}`)
    .join('\n\n');

  return `Generate a structured agreement summary based on these privacy-sanitized contractual clauses:

CONTRACT CATEGORY: ${contractType}
TOTAL CLAUSES: ${clauses ? clauses.length : 0}

DOCUMENT CLAUSES:
"""
${clausesContext}
"""

TARGET LANGUAGE: ${language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}

INSTRUCTIONS:
- Extract accurately from the text provided.
- If an item is not explicitly mentioned in the text, use "Not specified" — DO NOT INVENT details.
- Highlight clauses requiring special attention.

OUTPUT SCHEMA (Respond in valid JSON only):
{
  "agreementType": "Type of agreement (e.g. Residential Rental Agreement, Student Coaching Bond, Employment Contract)",
  "summaryOverview": "2-3 sentence overview of the agreement purpose and scope.",
  "mainParties": "The parties involved if discernable from sanitized text, else 'Not specified'",
  "paymentObligations": "Rent, fees, salary, or financial commitments mentioned, else 'Not specified'",
  "securityDepositAndRefund": "Deposit amount, refund timeline, deductions, or forfeiture terms, else 'Not specified'",
  "importantDatesAndDeadlines": "Term duration, notice periods, payment due dates, or deadlines",
  "noticeAndTermination": "How either party can terminate the agreement and required notice",
  "majorResponsibilities": ["Key obligation 1", "Key obligation 2"],
  "clausesRequiringAttention": ["List of clause numbers/IDs that have high risk or ambiguous terms"],
  "language": "${language}"
}`;
}

/**
 * Builds user prompt for generating pointed lawyer consultation questions.
 *
 * @param {Array<object>} clauses - Red and Yellow clauses primarily
 * @param {'en'|'hi'} [language='en']
 * @returns {string}
 */
export function buildLawyerQuestionsPrompt(clauses, language = 'en') {
  const prioritizedClauses = (clauses || [])
    .filter((c) => c.riskLevel === 'RED' || c.riskLevel === 'YELLOW' || c.riskLevel === 'UNASSESSED')
    .slice(0, 20)
    .map((c) => `Clause [${c.clauseNumber || c.id}] | Risk: ${c.riskLevel} | Reason: ${c.reason || 'Unassessed'} | Text: "${c.sanitizedText}"`)
    .join('\n\n');

  return `Generate tailored consultation questions for a licensed Indian legal advocate based on these flagged clauses:

FLAGGED CLAUSES:
"""
${prioritizedClauses || 'No flagged clauses provided.'}
"""

TARGET LANGUAGE: ${language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}

INSTRUCTIONS:
- Formulate practical questions that empower the citizen during a legal consultation.
- Focus on enforceability, customary terms, and protective counter-clauses under Indian law.

OUTPUT SCHEMA (Respond in valid JSON only):
{
  "questions": [
    {
      "clauseId": "Clause ID or number",
      "category": "Deposit / Notice / Penalty / Restraint of Trade / Discretionary Powers",
      "question": "Specific question for the advocate",
      "reasonToAsk": "Why asking this protects the citizen"
    }
  ],
  "generalAdvice": "General guidance on what documents or proof to bring to the consultation.",
  "language": "${language}"
}`;
}

/**
 * Builds user prompt for additional AI insights beyond deterministic statutory rules.
 *
 * @param {Array<object>} clauses
 * @param {'en'|'hi'} [language='en']
 * @returns {string}
 */
export function buildAiInsightsPrompt(clauses, language = 'en') {
  const context = (clauses || [])
    .slice(0, 30)
    .map((c) => `[${c.clauseNumber || c.id}]: ${c.sanitizedText}`)
    .join('\n\n');

  return `Identify important contractual observations, omissions, or ambiguities NOT covered by standard statutory red lines:

CLAUSES:
"""
${context}
"""

TARGET LANGUAGE: ${language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}

MANDATORY RULES:
1. Every observation must reference an existing clause ID from the input.
2. Label each as an AI-generated observation.
3. NEVER assign or recommend a RED, YELLOW, or GREEN rating.
4. Focus on practical points (e.g. unilateral escalation clauses, absence of receipt mechanisms, ambiguity in maintenance duties).

OUTPUT SCHEMA (Respond in valid JSON only):
{
  "insights": [
    {
      "id": "INSIGHT-01",
      "clauseId": "Clause reference or ID",
      "observation": "What potential imbalance or ambiguity exists in this clause",
      "potentialRisk": "How this might affect the citizen practically",
      "recommendedAction": "A protective step or clarifying question to propose",
      "label": "AI-Generated Observation"
    }
  ],
  "language": "${language}"
}`;
}

/**
 * Builds user prompt for an executive document briefing.
 *
 * @param {Array<object>} clauses
 * @param {object} [summary={}]
 * @param {'en'|'hi'} [language='en']
 * @returns {string}
 */
export function buildDocumentBriefingPrompt(clauses, summary = {}, language = 'en') {
  const redCount = clauses ? clauses.filter((c) => c.riskLevel === 'RED').length : 0;
  const yellowCount = clauses ? clauses.filter((c) => c.riskLevel === 'YELLOW').length : 0;

  const keyClauses = (clauses || [])
    .filter((c) => c.riskLevel === 'RED' || c.riskLevel === 'YELLOW')
    .slice(0, 10)
    .map((c) => `[${c.clauseNumber || c.id}]: ${c.sanitizedText}`)
    .join('\n');

  return `Create a concise executive briefing for a citizen who needs a quick, holistic understanding before signing:

AUDIT STATS:
- Critical Flags (RED): ${redCount}
- Review Flags (YELLOW): ${yellowCount}
- Summary: ${JSON.stringify(summary)}

KEY FLAGGED CLAUSES:
"""
${keyClauses || 'No critical flags detected.'}
"""

TARGET LANGUAGE: ${language === 'hi' ? 'Hindi (हिन्दी)' : 'English'}

OUTPUT SCHEMA (Respond in valid JSON only):
{
  "overallPurpose": "Concise summary of what this agreement does and commits the citizen to.",
  "majorFinancialObligations": "Summary of recurring and one-time payments, security deposits, and fines.",
  "importantDeadlines": "Critical notice periods, refund timelines, and due dates.",
  "keyResponsibilities": ["Key obligation 1", "Key obligation 2"],
  "areasRequiringClarification": ["Critical issue 1 to clarify", "Critical issue 2"],
  "audioScript": "A natural, conversational 3-4 sentence summary suitable for text-to-speech audio playback.",
  "language": "${language}"
}`;
}
