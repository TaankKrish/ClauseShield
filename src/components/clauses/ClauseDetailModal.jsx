import React, { useEffect, useState } from 'react';
import { X, Sparkles, AlertTriangle, Shield, HelpCircle, CheckCircle, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { Badge } from '../common/Badge.jsx';
import { Button } from '../common/Button.jsx';
import { speechService } from '../../modules/speech/speech-synthesizer.js';

export function ClauseDetailModal({
  clause,
  explanation,
  loading,
  error,
  language = 'en',
  onClose,
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        speechService.stop();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      speechService.stop();
    };
  }, [onClose]);

  if (!clause) return null;

  const badgeVariant =
    clause.riskLevel === 'RED'
      ? 'red'
      : clause.riskLevel === 'YELLOW'
      ? 'amber'
      : clause.riskLevel === 'GREEN'
      ? 'emerald'
      : 'slate';

  const toggleAudio = () => {
    if (isPlayingAudio) {
      speechService.stop();
      setIsPlayingAudio(false);
      return;
    }

    const textToSpeak = explanation?.plainLanguageExplanation || clause.reason || clause.sanitizedText;
    speechService.speak(textToSpeak, language, {
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
                {clause.clauseNumber || clause.id}
              </span>
              <Badge variant={badgeVariant}>{clause.riskLevel}</Badge>
              {clause.ruleId && (
                <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {clause.ruleId}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>AI Clause Explanation & Consultation Prep</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              speechService.stop();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sanitized Clause Text */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Sanitized Clause Text
          </label>
          <div className="text-xs sm:text-sm font-mono text-slate-200 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 leading-relaxed max-h-40 overflow-y-auto">
            {clause.sanitizedText}
          </div>
        </div>

        {/* Deterministic Rule Engine Statutory Findings */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
          <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold mb-1">
            <Shield className="w-3.5 h-3.5" />
            <span>Deterministic Rule Assessment</span>
          </div>
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

        {/* Loading State */}
        {loading && (
          <div className="p-8 text-center space-y-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-300">
              Generating plain-language explanation & advocate questions...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/50 text-xs text-red-300 flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to fetch live explanation</p>
              <p className="text-slate-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* AI Explanation Content */}
        {explanation && !loading && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Plain Language Explanation */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Plain-Language Explanation (AI-Generated)</span>
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleAudio}
                  className="text-xs h-7 px-2.5"
                >
                  {isPlayingAudio ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 mr-1 text-red-400" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                      <span>Listen</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-sm text-slate-200 leading-relaxed">
                {explanation.plainLanguageExplanation}
              </div>
            </div>

            {/* Why Flagged & Practical Consequences */}
            {(explanation.whyFlagged || explanation.practicalConsequences) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {explanation.whyFlagged && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-semibold text-amber-400 flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Why It Was Flagged</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">{explanation.whyFlagged}</p>
                  </div>
                )}

                {explanation.practicalConsequences && (
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="font-semibold text-red-400 flex items-center space-x-1">
                      <Shield className="w-3 h-3" />
                      <span>Practical Impact on You</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">{explanation.practicalConsequences}</p>
                  </div>
                )}
              </div>
            )}

            {/* Questions for Lawyer */}
            {explanation.questionsForLawyer && explanation.questionsForLawyer.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Questions to Ask Your Legal Advocate</span>
                </span>
                <div className="space-y-2">
                  {explanation.questionsForLawyer.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/90 border border-indigo-900/40 text-xs text-slate-200 flex items-start space-x-2"
                    >
                      <span className="font-bold text-indigo-400 font-mono">Q{idx + 1}.</span>
                      <span className="leading-relaxed">{q}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Next Steps / Negotiation Points */}
            {explanation.suggestedNextSteps && explanation.suggestedNextSteps.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>Suggested Negotiation Points</span>
                </span>
                <div className="space-y-2">
                  {explanation.suggestedNextSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/90 border border-teal-900/40 text-xs text-slate-200 flex items-start space-x-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Statutory Disclaimer */}
            <div className="text-[11px] text-slate-500 italic p-3 rounded-xl bg-slate-950 border border-slate-900">
              ⚖️ {explanation.disclaimer || 'ClauseShield is an informational consultation-preparation tool, not an automated lawyer. Always consult a licensed legal advocate prior to signing.'}
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="flex justify-end border-t border-slate-800 pt-4">
          <Button
            variant="secondary"
            onClick={() => {
              speechService.stop();
              onClose();
            }}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

