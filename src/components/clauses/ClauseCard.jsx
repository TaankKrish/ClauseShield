import React from 'react';
import { Badge } from '../common/Badge.jsx';
import { Card } from '../common/Card.jsx';

export function ClauseCard({ clause, onInspectWithGemini }) {
  const badgeVariant =
    clause.riskLevel === 'RED'
      ? 'red'
      : clause.riskLevel === 'YELLOW'
      ? 'amber'
      : clause.riskLevel === 'GREEN'
      ? 'emerald'
      : 'slate';

  return (
    <Card className="p-5 border-slate-800 hover:border-slate-700 transition-colors">
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

      <div className="text-xs space-y-1.5 mb-3">
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

      {onInspectWithGemini && (
        <button
          type="button"
          onClick={() => onInspectWithGemini(clause)}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center space-x-1 cursor-pointer"
        >
          <span>Ask Gemini to explain & generate questions →</span>
        </button>
      )}
    </Card>
  );
}
