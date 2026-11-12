import React, { useState } from 'react';
import { Check, Copy, Sparkles, Scale, Info } from 'lucide-react';
import { Card } from '../common/Card.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';

export function LawyerQuestionsView({
  lawyerQuestions,
  loading,
  error,
  onGenerate,
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!lawyerQuestions && !loading && !error) {
    return (
      <Card className="p-6 border-slate-800 bg-slate-900/40 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
          <Scale className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-white">Lawyer Consultation Questions</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Prepare for an advocate consultation with concrete, pointed legal questions generated from flagged RED and YELLOW clauses.
        </p>
        <Button variant="outline" size="sm" onClick={onGenerate} className="text-xs">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
          <span>Generate Lawyer Questions</span>
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 border-slate-800 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-300">Drafting tailored questions for legal counsel...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-900/40 bg-red-950/20 text-xs text-red-300 flex items-center justify-between">
        <span>Failed to generate questions: {error}</span>
        <Button variant="outline" size="sm" onClick={onGenerate}>Retry</Button>
      </Card>
    );
  }

  const questions = lawyerQuestions.questions || [];

  return (
    <Card className="p-6 border-slate-800 bg-slate-900/60 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Legal Advocate Consultation Prep</h4>
            <span className="text-[11px] text-slate-400 font-mono">
              Targeted questions based on statutory flags
            </span>
          </div>
        </div>

        <Badge variant="indigo">{questions.length} Questions Ready</Badge>
      </div>

      {lawyerQuestions.generalAdvice && (
        <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-800/30 text-xs text-indigo-300 flex items-start space-x-2.5">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{lawyerQuestions.generalAdvice}</p>
        </div>
      )}

      <div className="space-y-3">
        {questions.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-indigo-400">Q{idx + 1}.</span>
                {item.category && (
                  <Badge variant="slate" className="text-[10px]">
                    {item.category}
                  </Badge>
                )}
                {item.clauseId && (
                  <span className="text-[10px] font-mono text-slate-500">{item.clauseId}</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard(item.question, idx)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center space-x-1 p-1 rounded hover:bg-slate-800 transition-colors"
                title="Copy question"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[10px]">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-100 leading-relaxed">
              &ldquo;{item.question}&rdquo;
            </p>

            {item.reasonToAsk && (
              <p className="text-[11px] text-slate-400 italic">
                <strong className="text-slate-500 not-italic">Why ask this: </strong>
                {item.reasonToAsk}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
