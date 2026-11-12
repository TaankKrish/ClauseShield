import React, { useState } from 'react';
import { AppHeader } from '../components/layout/AppHeader.jsx';
import { AppFooter } from '../components/layout/AppFooter.jsx';
import { DocumentUploadArea } from '../components/upload/DocumentUploadArea.jsx';
import { StatusBanner } from '../components/dashboard/StatusBanner.jsx';
import { Badge } from '../components/common/Badge.jsx';
import { Button } from '../components/common/Button.jsx';
import { Card } from '../components/common/Card.jsx';
import { analyzeDocument } from '../services/analysis-orchestrator.js';
import { speechService } from '../modules/speech/speech-synthesizer.js';
import { Shield, Sparkles, Volume2, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressState, setProgressState] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [speaking, setSpeaking] = useState(false);

  const runAnalysis = async ({ rawText, file, contractType }) => {
    setIsAnalyzing(true);
    setProgressState({ step: 'INIT', progress: 5, message: 'Starting local inspection...' });

    try {
      const result = await analyzeDocument({
        rawText,
        file,
        contractType,
        onProgress: (p) => setProgressState(p),
      });
      setAnalysisResult(result);
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
                  <span>Statutory Inspection Results</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Privacy Shield Redacted: <span className="text-emerald-400 font-semibold">{analysisResult.privacy.redactionCount} identifiers</span> (Aadhaar, PAN, phone).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  onClick={() => setSelectedLanguage(selectedLanguage === 'en' ? 'hi' : 'en')}
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

            {/* Clauses List */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-white">Segmented Clauses & Statutory Findings</h3>
              {analysisResult.clauses.map((clause) => {
                const badgeVariant =
                  clause.riskLevel === 'RED'
                    ? 'red'
                    : clause.riskLevel === 'YELLOW'
                    ? 'amber'
                    : clause.riskLevel === 'GREEN'
                    ? 'emerald'
                    : 'slate';

                return (
                  <Card key={clause.id} className="p-5 border-slate-800 hover:border-slate-700 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-semibold text-slate-400 uppercase">
                          {clause.clauseNumber || clause.id}
                        </span>
                        <Badge variant={badgeVariant}>{clause.riskLevel}</Badge>
                      </div>
                      {clause.ruleId && (
                        <span className="text-[11px] font-mono text-slate-500">{clause.ruleId}</span>
                      )}
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 mb-3">
                      {clause.sanitizedText}
                    </p>

                    <div className="text-xs space-y-1.5">
                      <p className="text-slate-300">
                        <strong className="text-slate-400">Statutory Reason:</strong> {clause.reason}
                      </p>
                      {clause.legalSource && (
                        <p className="text-slate-400">
                          <strong className="text-slate-500">Legal Source:</strong> {clause.legalSource}
                        </p>
                      )}
                      {clause.caveat && (
                        <p className="text-amber-400/90 italic">
                          <strong className="text-amber-500">Note:</strong> {clause.caveat}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Timeline Highlights */}
            {analysisResult.timeline && analysisResult.timeline.length > 0 && (
              <div className="mt-8 border-t border-slate-800 pt-6">
                <h3 className="text-base font-semibold text-white mb-3">Actionable Notice Deadlines & Commitments</h3>
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
      </main>

      <AppFooter />
    </div>
  );
}
