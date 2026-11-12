import React, { useState } from 'react';
import { Compass, Volume2, VolumeX, Sparkles, CheckCircle2, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { Card } from '../common/Card.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';
import { speechService } from '../../modules/speech/speech-synthesizer.js';

export function DocumentBriefingView({
  briefing,
  loading,
  error,
  language = 'en',
  onGenerate,
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleSpeech = () => {
    if (isSpeaking) {
      speechService.stop();
      setIsSpeaking(false);
      return;
    }

    const script = briefing?.audioScript || briefing?.overallPurpose;
    if (!script) return;

    speechService.speak(script, language, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  if (!briefing && !loading && !error) {
    return (
      <Card className="p-6 border-slate-800 bg-slate-900/40 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mx-auto">
          <Compass className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-white">AI Document Executive Briefing</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Get a comprehensive, spoken-ready briefing covering agreement scope, financial liabilities, deadlines, and critical areas requiring clarification.
        </p>
        <Button variant="outline" size="sm" onClick={onGenerate} className="text-xs">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
          <span>Generate Executive Briefing</span>
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 border-slate-800 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-300">Synthesizing executive briefing & audio script...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-900/40 bg-red-950/20 text-xs text-red-300 flex items-center justify-between">
        <span>Failed to generate briefing: {error}</span>
        <Button variant="outline" size="sm" onClick={onGenerate}>Retry</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-slate-800 bg-slate-900/60 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Executive Document Briefing</h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Actionable overview of rights, deadlines & liabilities
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleSpeech}
            className="text-xs"
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                <span>Stop Spoken Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 mr-1.5 text-teal-400" />
                <span>Listen Spoken Briefing</span>
              </>
            )}
          </Button>
          <Badge variant="emerald">AI Briefing</Badge>
        </div>
      </div>

      {/* Purpose */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
        <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">
          Agreement Purpose & Scope
        </span>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
          {briefing.overallPurpose}
        </p>
      </div>

      {/* Financials & Deadlines */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="font-semibold text-slate-400 flex items-center space-x-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Financial Liabilities</span>
          </span>
          <p className="text-slate-200 leading-relaxed">{briefing.majorFinancialObligations}</p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="font-semibold text-slate-400 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Important Deadlines</span>
          </span>
          <p className="text-slate-200 leading-relaxed">{briefing.importantDeadlines}</p>
        </div>
      </div>

      {/* Responsibilities */}
      {briefing.keyResponsibilities && briefing.keyResponsibilities.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Key Citizen Responsibilities</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {briefing.keyResponsibilities.map((resp, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-slate-300">
                <span className="text-teal-400 font-bold mr-1.5">•</span>
                <span>{resp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas Requiring Clarification */}
      {briefing.areasRequiringClarification && briefing.areasRequiringClarification.length > 0 && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/30 space-y-2 text-xs">
          <span className="font-semibold text-red-400 flex items-center space-x-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Critical Matters to Clarify Before Signing</span>
          </span>
          <ul className="space-y-1.5 text-slate-300">
            {briefing.areasRequiringClarification.map((area, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-red-400 font-bold">!</span>
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

