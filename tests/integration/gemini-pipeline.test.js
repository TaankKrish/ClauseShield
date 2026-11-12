import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geminiService } from '../../src/services/gemini-service.js';
import { requestClauseExplanation } from '../../src/services/api-client.js';

describe('Gemini AI Client Integration Pipeline', () => {
  const sampleClause = {
    id: 'CLAUSE-001',
    clauseNumber: 'Clause 4.1',
    sanitizedText: 'Security deposit of [REDACTED] is non-refundable upon early vacation.',
    riskLevel: 'RED',
    ruleId: 'RULE-RENT-001',
    reason: 'Unlawful penalty under Section 74.',
    legalSource: 'Indian Contract Act - Section 74',
    caveat: 'Landlord may only deduct proven actual damages.',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Client-Side Explanations & Offline Fallback Safety', () => {
    it('requestClauseExplanation falls back gracefully to structured offline explanation if server is unreachable', async () => {
      // Global fetch throws network error (simulating offline/no backend)
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      const result = await requestClauseExplanation(sampleClause, 'en');

      expect(result).toBeDefined();
      expect(result.clauseId).toBe('CLAUSE-001');
      expect(result.riskLevel).toBe('RED');
      expect(result.plainLanguageExplanation).toContain('Section 74');
      expect(result.questionsForLawyer.length).toBeGreaterThan(0);
      expect(result.isFallback).toBe(true);
    });

    it('requestClauseExplanation provides Hindi fallback when requested', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));

      const result = await requestClauseExplanation(sampleClause, 'hi');

      expect(result.language).toBe('hi');
      expect(result.plainLanguageExplanation).toContain('यह नियम');
      expect(result.questionsForLawyer.length).toBeGreaterThan(0);
    });
  });

  describe('geminiService Unified Facade', () => {
    it('geminiService.explainClause delegates correctly and returns validated response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          clauseId: 'CLAUSE-001',
          riskLevel: 'RED',
          plainLanguageExplanation: 'Mocked live explanation from server.',
          simpleSummary: 'Summary text.',
          questionsForLawyer: ['Question 1?'],
          suggestedNextSteps: ['Step 1.'],
          language: 'en',
          isAiGenerated: true,
        }),
      });

      const response = await geminiService.explainClause(sampleClause, 'en');

      expect(response.plainLanguageExplanation).toBe('Mocked live explanation from server.');
      expect(response.riskLevel).toBe('RED');
      expect(response.isAiGenerated).toBe(true);
    });

    it('geminiService.summarizeAgreement returns structured agreement summary', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const summary = await geminiService.summarizeAgreement([sampleClause], 'rental', 'en');

      expect(summary.agreementType).toContain('Residential Rental Agreement');
      expect(summary.summaryOverview).toBeDefined();
      expect(summary.clausesRequiringAttention).toContain('Clause 4.1');
    });

    it('geminiService.getLawyerQuestions returns targeted advocate questions', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const questions = await geminiService.getLawyerQuestions([sampleClause], 'en');

      expect(Array.isArray(questions.questions)).toBe(true);
      expect(questions.questions.length).toBeGreaterThan(0);
      expect(questions.generalAdvice).toBeDefined();
    });

    it('geminiService.getAiInsights returns labeled observations', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const insights = await geminiService.getAiInsights([sampleClause], 'en');

      expect(Array.isArray(insights.insights)).toBe(true);
      expect(insights.insights[0].label).toBe('AI-Generated Observation');
    });

    it('geminiService.getDocumentBriefing returns executive overview with audioScript', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const briefing = await geminiService.getDocumentBriefing([sampleClause], { red: 1 }, 'en');

      expect(briefing.overallPurpose).toBeDefined();
      expect(briefing.audioScript).toContain('ClauseShield executive briefing');
    });
  });

  describe('Outbound PII Safety Invariant', () => {
    it('verifies that outbound request payloads transmit only sanitizedText, never raw PII', async () => {
      let capturedPayload = null;

      globalThis.fetch = vi.fn().mockImplementation((_url, options) => {
        capturedPayload = JSON.parse(options.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({ status: 'success' }),
        });
      });

      const clauseWithOriginal = {
        id: 'CLAUSE-001',
        originalText: 'Aadhaar 5421 8832 9912 and PAN ABCDE1234F shall be furnished.',
        sanitizedText: 'Aadhaar [REDACTED_AADHAAR] and PAN [REDACTED_PAN] shall be furnished.',
        riskLevel: 'GREEN',
        reason: 'Identification clause',
      };

      await requestClauseExplanation(clauseWithOriginal, 'en');

      expect(capturedPayload).not.toBeNull();
      // Ensure originalText is never transmitted to the API endpoint
      expect(capturedPayload.clause.originalText).toBeUndefined();
      expect(capturedPayload.clause.sanitizedText).toContain('[REDACTED_AADHAAR]');
      expect(JSON.stringify(capturedPayload)).not.toContain('5421 8832 9912');
      expect(JSON.stringify(capturedPayload)).not.toContain('ABCDE1234F');
    });
  });
});
