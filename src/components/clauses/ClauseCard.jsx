import React from 'react';
import { Sparkles, Shield, AlertTriangle } from 'lucide-react';
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
    <Card className="p-5 border-slate-800 hover:border-slate-700 transition-colors space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono font-semibold text-slate-400 uppercase">
            {clause.clauseNumber || clause.id}
          </span>
          <Badge variant={badgeVariant}>{clause.riskLevel}</Badge>
        </div>
        {clause.ruleId && (
          <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {clause.ruleId}
          </span>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-mono bg-slate-950/70 p-3 rounded-lg border border-slate-800/80">
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
          <p className="text-amber-400/90 italic flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 inline mr-1" />
            <span>
              <strong className="text-amber-500 not-italic">Note:</strong> {clause.caveat}
            </span>
          </p>
        )}
      </div>

      {onInspectWithGemini && (
        <div className="pt-2 border-t border-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onInspectWithGemini(clause)}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center space-x-1.5 cursor-pointer py-1 px-2 rounded-md hover:bg-emerald-500/10 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Explain with AI & Lawyer Questions →</span>
          </button>

          <span className="text-[10px] text-slate-500 flex items-center space-x-1">
            <Shield className="w-2.5 h-2.5 text-slate-500" />
            <span>Rules classify • AI explains</span>
          </span>
        </div>
      )}
    </Card>
  );
}
