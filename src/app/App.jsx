import React, { useState } from 'react';
import { AppHeader } from '../components/layout/AppHeader.jsx';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { DocumentUploadArea } from '../components/upload/DocumentUploadArea.jsx';
import { StatusBanner } from '../components/dashboard/StatusBanner.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { ClauseCard } from '../components/clauses/ClauseCard.jsx';
import { ClauseDetailModal } from '../components/clauses/ClauseDetailModal.jsx';
import { AgreementSummaryView } from '../components/dashboard/AgreementSummaryView.jsx';
import { LawyerQuestionsView } from '../components/dashboard/LawyerQuestionsView.jsx';
import { AiInsightsView } from '../components/dashboard/AiInsightsView.jsx';
import { DocumentBriefingView } from '../components/dashboard/DocumentBriefingView.jsx';
import { analyzeDocument } from '../services/analysis-orchestrator.js';
import { speechService } from '../modules/speech/speech-synthesizer.js';
import { useGemini } from '../hooks/useGemini.js';
import {
  Shield,
  Sparkles,
  Volume2,
  CheckCircle2,
  FileText,
  Scale,
  Eye,
  Compass,
  Clock,
} from 'lucide-react';

export default function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressState, setProgressState] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [activeTab, setActiveTab] = useState('clauses'); // 'clauses' | 'briefing' | 'summary' | 'lawyer' | 'insights' | 'timeline'
  const [speaking, setSpeaking] = useState(false);
  const [activeContractType, setActiveContractType] = useState('all');

  const gemini = useGemini();

  const runAnalysis = async ({ rawText, file, contractType = 'all' }) => {
    setIsAnalyzing(true);
    setActiveContractType(contractType);
    gemini.resetAll();
    setProgressState({ step: 'INIT', progress: 5, message: 'Starting local inspection...' });

    try {
      const result = await analyzeDocument({
        rawText,
        file,
        contractType,
        onProgress: (p) => setProgressState(p),
      });
      setAnalysisResult(result);
      setActiveTab('clauses');
    } catch (err) {
      console.error('Analysis failed:', err);
      alert('Inspection failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAnalyzing(false);
      setProgressState(null);
    }
  };

  const handleSelectSample = (sample) => {
    runAnalysis({ rawText: sample.rawText, contractType: sample.category });
  };

  const handleFileSelected = (file) => {
    runAnalysis({ file });
  };

  const handleVoiceBriefing = () => {
    if (!analysisResult) return;
    if (speaking) {
      speechService.stop();
      setSpeaking(false);
      return;
    }

    const script = speechService.generateBriefingScript(analysisResult.clauses, selectedLanguage);
    speechService.speak(script, selectedLanguage, {
      onStart: () => setSpeaking(true),
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  };

  const handleInspectWithGemini = (clause) => {
    gemini.explainClause(clause, selectedLanguage);
  };

  const toggleLanguage = () => {
    const nextLang = selectedLanguage === 'en' ? 'hi' : 'en';
    setSelectedLanguage(nextLang);
    // If modal is currently open with an explanation, re-fetch in new language
    if (gemini.activeClause) {
      gemini.explainClause(gemini.activeClause, nextLang);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1120] text-slate-100 antialiased">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Explains • Rules Decide • The Citizen Stays Protected</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
            Inspect Unfair Legal Clauses <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
              Before You Sign.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed mb-6">
            A local-first, privacy-preserving legal inspection platform for Indian rental agreements, student coaching bonds, and employment contracts.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400">
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Zero Document Uploads to Cloud</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Deterministic Statutory Rules</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Hindi & English Briefings</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Gemini AI Plain-Language Explanations</span>
            </span>
          </div>
        </div>

        {/* Upload & Inspection Input */}
        <div className="max-w-4xl mx-auto mb-10">
          <DocumentUploadArea
            onSelectSample={handleSelectSample}
            onFileSelected={handleFileSelected}
            isAnalyzing={isAnalyzing}
          />

          {isAnalyzing && progressState && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-center">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>{progressState.message}</span>
                <span className="text-emerald-400 font-mono font-semibold">{progressState.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressState.progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Inspection Results Dashboard */}
        {analysisResult && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span>Statutory Inspection & AI Intelligence</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Privacy Shield Redacted: <span className="text-emerald-400 font-semibold">{analysisResult.privacy.redactionCount} identifiers</span> (Aadhaar, PAN, phone).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  onClick={toggleLanguage}
                  className="text-xs"
                >
                  {selectedLanguage === 'en' ? '🌐 Language: EN' : '🌐 भाषा: हिन्दी'}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleVoiceBriefing}
                  className="text-xs"
                >
                  <Volume2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                  {speaking ? 'Stop Audio' : selectedLanguage === 'hi' ? 'सुनिए' : 'Listen Briefing'}
                </Button>
              </div>
            </div>

            <StatusBanner summary={analysisResult.summary} />

            {/* AI Capability Navigation Tabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-800/80 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('clauses')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  activeTab === 'clauses'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Clauses ({analysisResult.clauses.length})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('briefing');
                  if (!gemini.documentBriefing) {
                    gemini.fetchDocumentBriefing(analysisResult.clauses, analysisResult.summary, selectedLanguage);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  activeTab === 'briefing'
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>AI Briefing</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('summary');
                  if (!gemini.agreementSummary) {
                    gemini.fetchSummary(analysisResult.clauses, activeContractType, selectedLanguage);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  activeTab === 'summary'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Agreement Summary</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('lawyer');
                  if (!gemini.lawyerQuestions) {
                    gemini.fetchLawyerQuestions(analysisResult.clauses, selectedLanguage);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  activeTab === 'lawyer'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Lawyer Questions</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('insights');
                  if (!gemini.aiInsights) {
                    gemini.fetchAiInsights(analysisResult.clauses, selectedLanguage);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                  activeTab === 'insights'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>AI Insights</span>
              </button>

              {analysisResult.timeline && analysisResult.timeline.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('timeline')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                    activeTab === 'timeline'
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Notice Deadlines ({analysisResult.timeline.length})</span>
                </button>
              )}
            </div>

            {/* TAB CONTENT: 1. Clauses List */}
            {activeTab === 'clauses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">Segmented Clauses & Statutory Findings</h3>
                  <span className="text-xs text-slate-400">
                    Click &ldquo;Explain with AI&rdquo; on any clause to generate plain-language breakdown
                  </span>
                </div>

                <div className="space-y-4">
                  {analysisResult.clauses.map((clause) => (
                    <ClauseCard
                      key={clause.id}
                      clause={clause}
                      onInspectWithGemini={handleInspectWithGemini}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. Executive Briefing */}
            {activeTab === 'briefing' && (
              <DocumentBriefingView
                briefing={gemini.documentBriefing}
                loading={gemini.loadingBriefing}
                error={gemini.briefingError}
                language={selectedLanguage}
                onGenerate={() =>
                  gemini.fetchDocumentBriefing(
                    analysisResult.clauses,
                    analysisResult.summary,
                    selectedLanguage
                  )
                }
              />
            )}

            {/* TAB CONTENT: 3. Agreement Summary */}
            {activeTab === 'summary' && (
              <AgreementSummaryView
                summary={gemini.agreementSummary}
                loading={gemini.loadingSummary}
                error={gemini.summaryError}
                onGenerate={() =>
                  gemini.fetchSummary(
                    analysisResult.clauses,
                    activeContractType,
                    selectedLanguage
                  )
                }
              />
            )}

            {/* TAB CONTENT: 4. Lawyer Questions */}
            {activeTab === 'lawyer' && (
              <LawyerQuestionsView
                lawyerQuestions={gemini.lawyerQuestions}
                loading={gemini.loadingQuestions}
                error={gemini.questionsError}
                onGenerate={() =>
                  gemini.fetchLawyerQuestions(analysisResult.clauses, selectedLanguage)
                }
              />
            )}

            {/* TAB CONTENT: 5. AI Insights */}
            {activeTab === 'insights' && (
              <AiInsightsView
                aiInsights={gemini.aiInsights}
                loading={gemini.loadingInsights}
                error={gemini.insightsError}
                onGenerate={() =>
                  gemini.fetchAiInsights(analysisResult.clauses, selectedLanguage)
                }
              />
            )}

            {/* TAB CONTENT: 6. Timeline View */}
            {activeTab === 'timeline' && analysisResult.timeline && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-white">Actionable Notice Deadlines & Commitments</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysisResult.timeline.map((item) => (
                    <Card key={item.id} className="p-4 bg-slate-900/60 border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-emerald-400">{item.title}</span>
                        <Badge variant={item.urgency === 'HIGH' ? 'red' : 'amber'}>{item.urgency}</Badge>
                      </div>
                      <p className="text-sm font-bold text-white mb-1">{item.dateText}</p>
                      <p className="text-xs text-slate-400">{item.actionRequired}</p>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Clause AI Explanation */}
        {gemini.activeClause && (
          <ClauseDetailModal
            clause={gemini.activeClause}
            explanation={gemini.clauseExplanation}
            loading={gemini.loadingExplanation}
            error={gemini.explanationError}
            language={selectedLanguage}
            onClose={gemini.closeExplanationModal}
          />
        )}
      </main>

      <AppFooter />
    </div>
  );
}
