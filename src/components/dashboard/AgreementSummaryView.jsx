import React from 'react';
import { FileText, Calendar, CreditCard, ShieldCheck, AlertCircle, Sparkles, Building2, UserCheck } from 'lucide-react';
import { Card } from '../common/Card.jsx';
import { Button } from '../common/Button.jsx';
import { Badge } from '../common/Badge.jsx';

export function AgreementSummaryView({
  summary,
  loading,
  error,
  onGenerate,
}) {
  if (!summary && !loading && !error) {
    return (
      <Card className="p-6 border-slate-800 bg-slate-900/40 text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
          <FileText className="w-5 h-5" />
        </div>
        <h4 className="text-sm font-bold text-white">AI Agreement Summary</h4>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Generate a structured breakdown of agreement type, parties, financial liabilities, deposit refund rules, and termination terms.
        </p>
        <Button variant="outline" size="sm" onClick={onGenerate} className="text-xs">
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
          <span>Generate Agreement Summary</span>
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="p-8 border-slate-800 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-300">Compiling structured agreement summary...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-900/40 bg-red-950/20 text-xs text-red-300 flex items-center justify-between">
        <span>Failed to generate summary: {error}</span>
        <Button variant="outline" size="sm" onClick={onGenerate}>Retry</Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 border-slate-800 bg-slate-900/60 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">{summary.agreementType || 'Contractual Summary'}</h4>
            <span className="text-[11px] text-slate-400 font-mono">
              AI-Generated Structured Overview
            </span>
          </div>
        </div>

        <Badge variant="emerald">AI Analyzed</Badge>
      </div>

      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80">
        {summary.summaryOverview}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Parties */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="font-semibold text-slate-400 flex items-center space-x-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Contracting Parties</span>
          </span>
          <p className="text-slate-200">{summary.mainParties || 'Not specified'}</p>
        </div>

        {/* Financial Commitments */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="font-semibold text-slate-400 flex items-center space-x-1.5">
            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
            <span>Payment Obligations</span>
          </span>
          <p className="text-slate-200">{summary.paymentObligations || 'Not specified'}</p>
        </div>

        {/* Security Deposit */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="font-semibold text-slate-400 flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Security Deposit & Refund Terms</span>
          </span>
          <p className="text-slate-200">{summary.securityDepositAndRefund || 'Not specified'}</p>
        </div>

        {/* Deadlines & Notice */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="font-semibold text-slate-400 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>Notice & Termination Timelines</span>
          </span>
          <p className="text-slate-200">{summary.noticeAndTermination || 'Not specified'}</p>
        </div>
      </div>

      {/* Major Responsibilities */}
      {summary.majorResponsibilities && summary.majorResponsibilities.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
            <UserCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>Citizen Key Responsibilities</span>
          </span>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {summary.majorResponsibilities.map((resp, i) => (
              <li key={i} className="flex items-start space-x-2">
                <span className="text-teal-400 font-bold">•</span>
                <span>{resp}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Flagged Clauses */}
      {summary.clausesRequiringAttention && summary.clausesRequiringAttention.length > 0 && (
        <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-300 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-400">Clauses Requiring Careful Review: </strong>
            <span>{summary.clausesRequiringAttention.join(', ')}</span>
          </div>
        </div>
      )}
    </Card>
  );
}

