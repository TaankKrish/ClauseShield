import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  explainClauseWithGemini,
  summarizeAgreementWithGemini,
  generateLawyerQuestionsWithGemini,
  generateAiInsightsWithGemini,
  generateDocumentBriefingWithGemini,
  resetAiClient,
  getResolvedModelName,
  DEFAULT_GEMINI_MODEL,
} from '../../server/services/gemini-server-service.js';

// Mock @google/genai
const mockGenerateContent = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: {
      generateContent: (...args) => mockGenerateContent(...args),
    },
  })),
}));

describe('Gemini Server-Side Intelligence Service', () => {
  const originalEnv = process.env;

  const sampleClause = {
    id: 'CLAUSE-001',
    clauseNumber: 'Section 4.1',
    sanitizedText: 'Security deposit of [REDACTED] is non-refundable upon early termination.',
    riskLevel: 'RED',
    ruleId: 'RULE-RENT-001',
    reason: 'Unilateral deposit forfeiture is an unlawful penalty.',
    legalSource: 'Indian Contract Act - Sec 74',
    caveat: 'Only actual proven damages can be deducted.',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.GEMINI_API_KEY = 'valid-test-key-12345';
    process.env.GEMINI_MODEL = 'gemini-3.8-flash';
    resetAiClient();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetAiClient();
  });

  describe('Capability A: Clause Explanation', () => {
    it('parses structured JSON returned by Gemini API and preserves immutable riskLevel', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          plainLanguageExplanation: 'You risk losing your entire deposit if you vacate before 11 months.',
          simpleSummary: 'Non-refundable deposit penalty.',
          whyFlagged: 'Section 74 prohibits unilateral penalties.',
          practicalConsequences: 'Forfeiture of money without accounting.',
          whatToClarify: 'Confirm whether refund is guaranteed with 30-day notice.',
          questionsForLawyer: ['Is this enforceable in Bangalore?'],
          suggestedNextSteps: ['Request mutual 1-month notice clause.'],
          disclaimer: 'Informational tool only.',
          riskLevel: 'GREEN', // Attempted override by AI!
        }),
      });

      const result = await explainClauseWithGemini(sampleClause, 'en');

      expect(result.plainLanguageExplanation).toContain('losing your entire deposit');
      expect(result.clauseId).toBe('CLAUSE-001');
      // CRITICAL ARCHITECTURAL INVARIANT: Risk level must remain RED from rule engine, NOT GREEN from AI!
      expect(result.riskLevel).toBe('RED');
      expect(result.isAiGenerated).toBe(true);
    });

    it('correctly handles JSON wrapped in markdown code fences', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: '```json\n{"plainLanguageExplanation": "Markdown wrapped explanation", "simpleSummary": "Summary"}\n```',
      });

      const result = await explainClauseWithGemini(sampleClause, 'en');
      expect(result.plainLanguageExplanation).toBe('Markdown wrapped explanation');
      expect(result.riskLevel).toBe('RED');
    });

    it('gracefully degrades to offline fallback when no API key is provided', async () => {
      delete process.env.GEMINI_API_KEY;
      resetAiClient();

      const result = await explainClauseWithGemini(sampleClause, 'en');

      expect(mockGenerateContent).not.toHaveBeenCalled();
      expect(result.isFallback).toBe(true);
      expect(result.riskLevel).toBe('RED');
      expect(result.plainLanguageExplanation).toContain('Section 4.1');
      expect(result.questionsForLawyer.length).toBeGreaterThan(0);
    });

    it('gracefully degrades to offline fallback when API call throws an error', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Rate limit exceeded (HTTP 429)'));

      const result = await explainClauseWithGemini(sampleClause, 'en');

      expect(result.isFallback).toBe(true);
      expect(result.riskLevel).toBe('RED');
      expect(result.plainLanguageExplanation).toBeDefined();
    });

    it('provides Hindi fallback explanation when requested without API key', async () => {
      delete process.env.GEMINI_API_KEY;
      resetAiClient();

      const result = await explainClauseWithGemini(sampleClause, 'hi');
      expect(result.language).toBe('hi');
      expect(result.plainLanguageExplanation).toContain('अधिकारों को सीमित');
    });
  });

  describe('Capability B: Agreement Summary', () => {
    it('generates structured agreement summary via Gemini API', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          agreementType: 'Residential Rental Agreement',
          summaryOverview: '11-month lease agreement between landlord and tenant.',
          mainParties: 'Landlord and Tenant',
          paymentObligations: 'Rent of 25,000 INR per month.',
          securityDepositAndRefund: 'Deposit of 1,00,000 INR refundable within 30 days.',
          importantDatesAndDeadlines: '11-month term; 1-month notice.',
          noticeAndTermination: '30-day notice required.',
          majorResponsibilities: ['Pay rent by 5th of each month.'],
          clausesRequiringAttention: ['CLAUSE-001'],
        }),
      });

      const result = await summarizeAgreementWithGemini([sampleClause], 'rental', 'en');

      expect(result.agreementType).toBe('Residential Rental Agreement');
      expect(result.paymentObligations).toContain('25,000 INR');
      expect(result.isAiGenerated).toBe(true);
    });

    it('returns structured fallback summary when API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      resetAiClient();

      const result = await summarizeAgreementWithGemini([sampleClause], 'rental', 'en');

      expect(result.isFallback).toBe(true);
      expect(result.agreementType).toContain('Residential Rental Agreement');
      expect(result.clausesRequiringAttention).toContain('Section 4.1');
    });
  });

  describe('Capability C: Lawyer Questions', () => {
    it('generates tailored advocate questions via Gemini API', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          questions: [
            {
              clauseId: 'CLAUSE-001',
              category: 'Deposit',
              question: 'Is complete forfeiture enforceable under local tenancy law?',
              reasonToAsk: 'Section 74 protection against unreasonable penalties.',
            },
          ],
          generalAdvice: 'Bring bank transfer proofs.',
        }),
      });

      const result = await generateLawyerQuestionsWithGemini([sampleClause], 'en');

      expect(result.questions).toHaveLength(1);
      expect(result.questions[0].question).toContain('complete forfeiture');
      expect(result.isAiGenerated).toBe(true);
    });

    it('returns structured fallback lawyer questions when API fails', async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error('Network error'));

      const result = await generateLawyerQuestionsWithGemini([sampleClause], 'en');

      expect(result.isFallback).toBe(true);
      expect(result.questions.length).toBeGreaterThanOrEqual(2);
      expect(result.questions[0].question).toContain('forfeit');
    });
  });

  describe('Capability D: Additional AI Insights', () => {
    it('generates unassessed AI observations without modifying risk ratings', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          insights: [
            {
              id: 'INSIGHT-01',
              clauseId: 'CLAUSE-001',
              observation: 'No maintenance repair ceiling specified.',
              potentialRisk: 'Tenant might be billed for structural maintenance.',
              recommendedAction: 'Add a 2,000 INR repair cap per month.',
              label: 'AI-Generated Observation',
            },
          ],
        }),
      });

      const result = await generateAiInsightsWithGemini([sampleClause], 'en');

      expect(result.insights).toHaveLength(1);
      expect(result.insights[0].label).toBe('AI-Generated Observation');
      expect(result.insights[0].recommendedAction).toContain('repair cap');
    });

    it('returns structured fallback insights when offline', async () => {
      delete process.env.GEMINI_API_KEY;
      resetAiClient();

      const result = await generateAiInsightsWithGemini([sampleClause], 'en');

      expect(result.isFallback).toBe(true);
      expect(result.insights[0].label).toBe('AI-Generated Observation');
      expect(result.insights[0].observation).toContain('wear-and-tear');
    });
  });

  describe('Capability E: Document Briefing', () => {
    it('generates executive briefing with spoken audio script via Gemini API', async () => {
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          overallPurpose: 'Residential lease committing tenant to monthly rent and care of premises.',
          majorFinancialObligations: 'Monthly rent plus 1,00,000 security deposit.',
          importantDeadlines: '1-month written notice prior to exit.',
          keyResponsibilities: ['Timely rent', 'Maintain property'],
          areasRequiringClarification: ['Review Section 4.1 deposit forfeiture with lawyer.'],
          audioScript: 'ClauseShield executive briefing. Watch out for the security deposit clause.',
        }),
      });

      const result = await generateDocumentBriefingWithGemini([sampleClause], { red: 1 }, 'en');

      expect(result.overallPurpose).toContain('Residential lease');
      expect(result.audioScript).toContain('ClauseShield executive briefing');
      expect(result.isAiGenerated).toBe(true);
    });

    it('returns structured fallback briefing when API key is placeholder', async () => {
      process.env.GEMINI_API_KEY = 'your_gemini_api_key_here';
      resetAiClient();

      const result = await generateDocumentBriefingWithGemini([sampleClause], { red: 1 }, 'en');

      expect(result.isFallback).toBe(true);
      expect(result.audioScript).toBeDefined();
      expect(result.overallPurpose).toBeDefined();
    });
  });

  describe('Model Configuration & Resolution', () => {
    it('defaults to gemini-3.8-flash when GEMINI_MODEL is not set in environment', () => {
      delete process.env.GEMINI_MODEL;
      expect(DEFAULT_GEMINI_MODEL).toBe('gemini-3.8-flash');
      expect(getResolvedModelName()).toBe('gemini-3.8-flash');
    });

    it('respects custom GEMINI_MODEL set in environment', () => {
      process.env.GEMINI_MODEL = 'gemini-3.8-pro';
      expect(getResolvedModelName()).toBe('gemini-3.8-pro');
    });

    it('passes the resolved model name to client.models.generateContent', async () => {
      process.env.GEMINI_MODEL = 'gemini-3.8-flash';
      mockGenerateContent.mockResolvedValueOnce({
        text: JSON.stringify({
          plainLanguageExplanation: 'Verified model test',
          simpleSummary: 'Model test',
        }),
      });

      await explainClauseWithGemini(sampleClause, 'en');

      expect(mockGenerateContent).toHaveBeenCalledOnce();
      expect(mockGenerateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-3.8-flash',
        })
      );
    });
  });
});

