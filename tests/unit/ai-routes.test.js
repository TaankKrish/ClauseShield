import { describe, it, expect, vi, beforeEach } from 'vitest';

// 1. Intercept @google/genai to verify zero live SDK calls / network requests happen
const mockGoogleGenAIConstructor = vi.fn();
vi.mock('@google/genai', () => ({
  GoogleGenAI: mockGoogleGenAIConstructor,
}));

// 2. Mock gemini-server-service at the route dependency boundary
export const mockExplainClauseWithGemini = vi.fn();
export const mockSummarizeAgreementWithGemini = vi.fn();
export const mockGenerateLawyerQuestionsWithGemini = vi.fn();
export const mockGenerateAiInsightsWithGemini = vi.fn();
export const mockGenerateDocumentBriefingWithGemini = vi.fn();

vi.mock('../../server/services/gemini-server-service.js', () => ({
  explainClauseWithGemini: (...args) => mockExplainClauseWithGemini(...args),
  summarizeAgreementWithGemini: (...args) => mockSummarizeAgreementWithGemini(...args),
  generateLawyerQuestionsWithGemini: (...args) => mockGenerateLawyerQuestionsWithGemini(...args),
  generateAiInsightsWithGemini: (...args) => mockGenerateAiInsightsWithGemini(...args),
  generateDocumentBriefingWithGemini: (...args) => mockGenerateDocumentBriefingWithGemini(...args),
  getResolvedModelName: vi.fn(() => 'gemini-3.8-flash'),
  DEFAULT_GEMINI_MODEL: 'gemini-3.8-flash',
}));

// Import express app after mocks are configured
import app from '../../server/index.js';

// Helper to simulate Express route invocation without needing live open network sockets
function simulateRequest(method, url, body = {}) {
  return new Promise((resolve) => {
    const req = {
      method,
      url,
      originalUrl: url,
      headers: { 'content-type': 'application/json' },
      body,
    };

    const res = {
      statusCode: 200,
      headers: {},
      _body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      setHeader(k, v) {
        this.headers[k] = v;
      },
      json(data) {
        this._body = data;
        resolve({ status: this.statusCode, body: this._body });
        return this;
      },
      send(data) {
        this._body = data;
        resolve({ status: this.statusCode, body: this._body });
        return this;
      },
      end() {
        resolve({ status: this.statusCode, body: this._body });
      },
    };

    app.handle(req, res);
  });
}

describe('AI Backend Endpoints & Privacy Pipeline (Deterministic Mocked)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default realistic mock implementations for all 5 capabilities
    mockExplainClauseWithGemini.mockImplementation(async (clause, language = 'en') => ({
      clauseId: clause.id,
      riskLevel: clause.riskLevel,
      plainLanguageExplanation: `Deterministic explanation for ${clause.id}. This clause introduces penalty forfeiture terms.`,
      simpleSummary: 'Non-refundable deposit penalty.',
      whyFlagged: clause.reason || 'Unilateral forfeiture of deposit is an unlawful penalty.',
      practicalConsequences: 'You risk losing your deposit without genuine pre-estimate of loss.',
      whatToClarify: 'Whether deductions require audited receipts.',
      questionsForLawyer: [
        'Is this forfeiture enforceable under state tenancy law?',
        'Can this term be replaced with mutual 30-day notice?',
      ],
      suggestedNextSteps: [
        'Propose mutual 30-day notice exit clause.',
      ],
      disclaimer: 'ClauseShield is an informational prep tool, not an automated lawyer.',
      language,
      isAiGenerated: true,
    }));

    mockSummarizeAgreementWithGemini.mockImplementation(async (clauses, contractType = 'all', language = 'en') => ({
      agreementType: contractType === 'rental' ? 'Residential Rental Agreement' : 'Standard Agreement',
      summaryOverview: `Structured summary covering ${clauses.length} clauses.`,
      mainParties: 'First and Second Contracting Parties',
      paymentObligations: 'Monthly rent due on designated dates.',
      securityDepositAndRefund: 'Deposit refundable post-vacation.',
      importantDatesAndDeadlines: '11-month duration with 30-day notice.',
      noticeAndTermination: '30-day written notice required.',
      majorResponsibilities: ['Pay rent on time', 'Maintain premises'],
      clausesRequiringAttention: (clauses || []).filter((c) => c.riskLevel === 'RED').map((c) => c.id || c.clauseNumber),
      language,
      isAiGenerated: true,
    }));

    mockGenerateLawyerQuestionsWithGemini.mockImplementation(async (clauses, language = 'en') => ({
      questions: [
        {
          clauseId: clauses[0]?.id || 'CLAUSE-001',
          category: 'Deposit Forfeiture',
          question: 'Can the landlord forfeit the entire deposit without demonstrating actual damage?',
          reasonToAsk: 'Section 74 of the Contract Act prohibits penalty clauses.',
        },
      ],
      generalAdvice: 'Bring all payment receipts and draft agreement to your consultation.',
      language,
      isAiGenerated: true,
    }));

    mockGenerateAiInsightsWithGemini.mockImplementation(async (clauses, language = 'en') => ({
      insights: [
        {
          id: 'INSIGHT-01',
          clauseId: clauses[0]?.id || 'CLAUSE-001',
          observation: 'Maintenance repair cap is not specified.',
          potentialRisk: 'Tenant could be liable for structural repairs.',
          recommendedAction: 'Insert a 2,000 INR ceiling for minor repairs.',
          label: 'AI-Generated Observation',
        },
      ],
      language,
      isAiGenerated: true,
    }));

    mockGenerateDocumentBriefingWithGemini.mockImplementation(async (clauses, _summary = {}, language = 'en') => ({
      overallPurpose: 'Binding residential lease defining rights and obligations.',
      majorFinancialObligations: 'Monthly rent and refundable security deposit.',
      importantDeadlines: '1-month written notice prior to termination.',
      keyResponsibilities: ['Timely payment', 'Proper upkeep'],
      areasRequiringClarification: ['Clarify deposit refund timeline.'],
      audioScript: 'ClauseShield executive briefing. Watch out for the security deposit clause.',
      language,
      isAiGenerated: true,
    }));
  });

  describe('Health Check Endpoint', () => {
    it('GET /api/health returns healthy status and service description', async () => {
      const res = await simulateRequest('GET', '/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toContain('ClauseShield');
    });
  });

  describe('Capability A: POST /api/ai/explain-clause', () => {
    it('returns 400 when clause object or sanitizedText is missing', async () => {
      const res = await simulateRequest('POST', '/api/ai/explain-clause', {});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_PAYLOAD');
      expect(mockExplainClauseWithGemini).not.toHaveBeenCalled();
    });

    it('returns explanation for valid sanitized clause payload without calling real Gemini API', async () => {
      const clauseInput = {
        id: 'CLAUSE-001',
        clauseNumber: 'Clause 4',
        sanitizedText: 'Security deposit of [REDACTED] is forfeited on early exit.',
        riskLevel: 'RED',
        reason: 'Unlawful penalty clause.',
      };

      const res = await simulateRequest('POST', '/api/ai/explain-clause', {
        clause: clauseInput,
        language: 'en',
      });

      expect(res.status).toBe(200);
      expect(res.body.plainLanguageExplanation).toContain('Deterministic explanation for CLAUSE-001');
      expect(res.body.riskLevel).toBe('RED');
      expect(res.body.isAiGenerated).toBe(true);
      expect(mockExplainClauseWithGemini).toHaveBeenCalledOnce();
      expect(mockExplainClauseWithGemini).toHaveBeenCalledWith(clauseInput, 'en');

      // REGRESSION ASSERTION: Prove zero real SDK constructor/network calls were made
      expect(mockGoogleGenAIConstructor).not.toHaveBeenCalled();
    });

    it('blocks request and returns 400 when unredacted Aadhaar is detected by PII guard', async () => {
      const res = await simulateRequest('POST', '/api/ai/explain-clause', {
        clause: {
          id: 'CLAUSE-001',
          sanitizedText: 'Tenant Aadhaar is 5421 8832 9912.',
        },
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('PRIVACY_VIOLATION_BLOCKED');
      expect(res.body.message).toContain('Aadhaar Number');
      // Service must never be invoked when PII guard triggers
      expect(mockExplainClauseWithGemini).not.toHaveBeenCalled();
    });

    it('blocks request and returns 400 when unredacted PAN or Email is detected', async () => {
      const res = await simulateRequest('POST', '/api/ai/explain-clause', {
        clause: {
          id: 'CLAUSE-001',
          sanitizedText: 'Send notice to landlord@gmail.com with PAN ABCDE1234F.',
        },
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('PRIVACY_VIOLATION_BLOCKED');
      expect(mockExplainClauseWithGemini).not.toHaveBeenCalled();
    });

    it('returns 500 when backend service encounters an unhandled exception', async () => {
      mockExplainClauseWithGemini.mockRejectedValueOnce(new Error('Internal processing failure'));

      const res = await simulateRequest('POST', '/api/ai/explain-clause', {
        clause: {
          id: 'CLAUSE-001',
          sanitizedText: 'Valid sanitized text.',
        },
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('EXPLANATION_FAILED');
      expect(res.body.message).toContain('Internal processing failure');
    });
  });

  describe('Capability B: POST /api/ai/summarize-agreement', () => {
    it('returns 400 when clauses array is missing or invalid', async () => {
      const res = await simulateRequest('POST', '/api/ai/summarize-agreement', { contractType: 'rental' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_PAYLOAD');
      expect(mockSummarizeAgreementWithGemini).not.toHaveBeenCalled();
    });

    it('returns structured summary for valid clauses without network delay', async () => {
      const clauses = [
        {
          id: 'CLAUSE-001',
          sanitizedText: 'Tenant shall pay monthly rent of [REDACTED].',
          riskLevel: 'GREEN',
        },
        {
          id: 'CLAUSE-002',
          sanitizedText: 'Deposit is forfeited without notice.',
          riskLevel: 'RED',
        },
      ];

      const res = await simulateRequest('POST', '/api/ai/summarize-agreement', {
        clauses,
        contractType: 'rental',
        language: 'en',
      });

      expect(res.status).toBe(200);
      expect(res.body.agreementType).toBe('Residential Rental Agreement');
      expect(res.body.summaryOverview).toContain('Structured summary covering 2 clauses');
      expect(res.body.clausesRequiringAttention).toContain('CLAUSE-002');
      expect(mockSummarizeAgreementWithGemini).toHaveBeenCalledWith(clauses, 'rental', 'en');
      expect(mockGoogleGenAIConstructor).not.toHaveBeenCalled();
    });

    it('returns 500 when agreement summary service fails', async () => {
      mockSummarizeAgreementWithGemini.mockRejectedValueOnce(new Error('Summary generator failure'));

      const res = await simulateRequest('POST', '/api/ai/summarize-agreement', {
        clauses: [{ id: '1', sanitizedText: 'Clause' }],
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('SUMMARY_FAILED');
    });
  });

  describe('Capability C: POST /api/ai/lawyer-questions', () => {
    it('returns 400 when clauses array is missing', async () => {
      const res = await simulateRequest('POST', '/api/ai/lawyer-questions', {});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_PAYLOAD');
      expect(mockGenerateLawyerQuestionsWithGemini).not.toHaveBeenCalled();
    });

    it('returns questions for valid clauses array', async () => {
      const clauses = [
        {
          id: 'CLAUSE-001',
          sanitizedText: 'Security deposit forfeited.',
          riskLevel: 'RED',
          reason: 'Penalty clause',
        },
      ];

      const res = await simulateRequest('POST', '/api/ai/lawyer-questions', {
        clauses,
        language: 'en',
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.questions[0].question).toContain('demonstrating actual damage');
      expect(mockGenerateLawyerQuestionsWithGemini).toHaveBeenCalledWith(clauses, 'en');
      expect(mockGoogleGenAIConstructor).not.toHaveBeenCalled();
    });

    it('returns 500 when lawyer questions service throws an error', async () => {
      mockGenerateLawyerQuestionsWithGemini.mockRejectedValueOnce(new Error('Question generation error'));

      const res = await simulateRequest('POST', '/api/ai/lawyer-questions', {
        clauses: [{ id: '1', sanitizedText: 'Clause' }],
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('QUESTIONS_FAILED');
    });
  });

  describe('Capability D: POST /api/ai/insights', () => {
    it('returns 400 when clauses array is missing', async () => {
      const res = await simulateRequest('POST', '/api/ai/insights', {});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_PAYLOAD');
    });

    it('returns AI observations for valid clauses', async () => {
      const clauses = [
        {
          id: 'CLAUSE-001',
          sanitizedText: 'Tenant maintains premises.',
        },
      ];

      const res = await simulateRequest('POST', '/api/ai/insights', {
        clauses,
        language: 'en',
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.insights)).toBe(true);
      expect(res.body.insights[0].label).toBe('AI-Generated Observation');
      expect(res.body.insights[0].recommendedAction).toContain('ceiling');
      expect(mockGenerateAiInsightsWithGemini).toHaveBeenCalledWith(clauses, 'en');
      expect(mockGoogleGenAIConstructor).not.toHaveBeenCalled();
    });

    it('returns 500 when insights service throws an error', async () => {
      mockGenerateAiInsightsWithGemini.mockRejectedValueOnce(new Error('Insights generation error'));

      const res = await simulateRequest('POST', '/api/ai/insights', {
        clauses: [{ id: '1', sanitizedText: 'Clause' }],
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('INSIGHTS_FAILED');
    });
  });

  describe('Capability E: POST /api/ai/briefing', () => {
    it('returns 400 when clauses array is missing', async () => {
      const res = await simulateRequest('POST', '/api/ai/briefing', {});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_PAYLOAD');
    });

    it('returns executive document briefing and spoken audio script', async () => {
      const clauses = [
        {
          id: 'CLAUSE-001',
          sanitizedText: 'Standard lease.',
          riskLevel: 'GREEN',
        },
      ];
      const summary = { total: 1, green: 1 };

      const res = await simulateRequest('POST', '/api/ai/briefing', {
        clauses,
        summary,
        language: 'en',
      });

      expect(res.status).toBe(200);
      expect(res.body.overallPurpose).toContain('Binding residential lease');
      expect(res.body.audioScript).toContain('ClauseShield executive briefing');
      expect(mockGenerateDocumentBriefingWithGemini).toHaveBeenCalledWith(clauses, summary, 'en');
      expect(mockGoogleGenAIConstructor).not.toHaveBeenCalled();
    });

    it('returns 500 when briefing service throws an error', async () => {
      mockGenerateDocumentBriefingWithGemini.mockRejectedValueOnce(new Error('Briefing error'));

      const res = await simulateRequest('POST', '/api/ai/briefing', {
        clauses: [{ id: '1', sanitizedText: 'Clause' }],
      });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('BRIEFING_FAILED');
    });
  });

  describe('Backwards Compatibility with /api/gemini/*', () => {
    it('POST /api/gemini/explain-clause routes correctly and returns clause explanation', async () => {
      const clauseInput = {
        id: 'CLAUSE-001',
        sanitizedText: 'Notice period is 15 days.',
        riskLevel: 'YELLOW',
        reason: 'Short notice period.',
      };

      const res = await simulateRequest('POST', '/api/gemini/explain-clause', {
        clause: clauseInput,
      });

      expect(res.status).toBe(200);
      expect(res.body.plainLanguageExplanation).toContain('Deterministic explanation for CLAUSE-001');
      expect(res.body.riskLevel).toBe('YELLOW');
      expect(mockExplainClauseWithGemini).toHaveBeenCalledWith(clauseInput, 'en');
      expect(mockGoogleGenAIConstructor).not.toHaveBeenCalled();
    });
  });
});
