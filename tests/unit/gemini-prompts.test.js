import { describe, it, expect } from 'vitest';
import {
  GEMINI_SYSTEM_PROMPT,
  buildClausePrompt,
  buildAgreementSummaryPrompt,
  buildLawyerQuestionsPrompt,
  buildAiInsightsPrompt,
  buildDocumentBriefingPrompt,
} from '../../src/modules/intelligence/gemini-prompts.js';

describe('Gemini AI Prompts & Guardrails', () => {
  const sampleClause = {
    id: 'CLAUSE-001',
    clauseNumber: 'Clause 4.1',
    sanitizedText: 'Security deposit of [REDACTED] is non-refundable if tenant leaves early.',
    riskLevel: 'RED',
    ruleId: 'RULE-RENT-001',
    reason: 'Unilateral forfeiture of security deposit is an unlawful penalty.',
    legalSource: 'Indian Contract Act, 1872 - Section 74',
    caveat: 'Landlord may only deduct proven arrears or damages.',
  };

  describe('System Prompt Guardrails', () => {
    it('mandates that risk ratings are predetermined and immutable', () => {
      expect(GEMINI_SYSTEM_PROMPT).toContain('deterministic statutory rule engine');
      expect(GEMINI_SYSTEM_PROMPT).toContain('NEVER change, override, or question this rating');
    });

    it('prohibits inventing fake legal citations', () => {
      expect(GEMINI_SYSTEM_PROMPT).toContain('Do NOT invent legal citations');
    });

    it('prohibits presenting speculative statements as settled law', () => {
      expect(GEMINI_SYSTEM_PROMPT).toContain('ClauseShield is an informational prep tool, not an automated lawyer');
    });

    it('requires structured JSON only', () => {
      expect(GEMINI_SYSTEM_PROMPT).toContain('valid JSON');
    });
  });

  describe('buildClausePrompt', () => {
    it('builds English clause prompt embedding sanitized text and rule metadata', () => {
      const prompt = buildClausePrompt(sampleClause, 'en');

      expect(prompt).toContain('Clause 4.1');
      expect(prompt).toContain('RED');
      expect(prompt).toContain('RULE-RENT-001');
      expect(prompt).toContain('Section 74');
      expect(prompt).toContain('Security deposit of [REDACTED] is non-refundable');
      expect(prompt).toContain('English');
      expect(prompt).toContain('plainLanguageExplanation');
      expect(prompt).toContain('questionsForLawyer');
    });

    it('builds Hindi clause prompt specifying target language', () => {
      const prompt = buildClausePrompt(sampleClause, 'hi');
      expect(prompt).toContain('Hindi');
    });
  });

  describe('buildAgreementSummaryPrompt', () => {
    it('constructs agreement summary prompt with clauses and "Not specified" rule', () => {
      const prompt = buildAgreementSummaryPrompt([sampleClause], 'rental', 'en');

      expect(prompt).toContain('CONTRACT CATEGORY: rental');
      expect(prompt).toContain('TOTAL CLAUSES: 1');
      expect(prompt).toContain('Not specified');
      expect(prompt).toContain('paymentObligations');
      expect(prompt).toContain('securityDepositAndRefund');
      expect(prompt).toContain('noticeAndTermination');
    });
  });

  describe('buildLawyerQuestionsPrompt', () => {
    it('prioritizes flagged clauses and requests actionable advocate questions', () => {
      const yellowClause = {
        id: 'CLAUSE-002',
        clauseNumber: 'Clause 6',
        riskLevel: 'YELLOW',
        sanitizedText: 'Maintenance fee escalates at landlord discretion.',
        reason: 'Unilateral escalation without index.',
      };

      const prompt = buildLawyerQuestionsPrompt([sampleClause, yellowClause], 'en');
      expect(prompt).toContain('FLAGGED CLAUSES');
      expect(prompt).toContain('Clause 4.1');
      expect(prompt).toContain('Clause 6');
      expect(prompt).toContain('questions');
      expect(prompt).toContain('reasonToAsk');
    });
  });

  describe('buildAiInsightsPrompt', () => {
    it('enforces AI-Generated Observation label and references clause IDs', () => {
      const prompt = buildAiInsightsPrompt([sampleClause], 'en');
      expect(prompt).toContain('AI-Generated Observation');
      expect(prompt).toContain('NEVER assign or recommend a RED, YELLOW, or GREEN rating');
      expect(prompt).toContain('potentialRisk');
      expect(prompt).toContain('recommendedAction');
    });
  });

  describe('buildDocumentBriefingPrompt', () => {
    it('requests executive summary and text-to-speech audioScript', () => {
      const prompt = buildDocumentBriefingPrompt([sampleClause], { red: 1, total: 1 }, 'en');
      expect(prompt).toContain('Critical Flags (RED): 1');
      expect(prompt).toContain('audioScript');
      expect(prompt).toContain('overallPurpose');
      expect(prompt).toContain('majorFinancialObligations');
      expect(prompt).toContain('areasRequiringClarification');
    });
  });
});
