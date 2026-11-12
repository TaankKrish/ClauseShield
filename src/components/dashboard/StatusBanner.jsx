import React from 'react';
import { ShieldAlert, ShieldCheck, Shield, HelpCircle } from 'lucide-react';

export function StatusBanner({ summary }) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
      <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-red-300 font-medium uppercase tracking-wider">Critical Risk</p>
          <p className="text-2xl font-bold text-red-400 mt-1">{summary.red}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-amber-300 font-medium uppercase tracking-wider">Needs Review</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{summary.yellow}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Shield className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-emerald-300 font-medium uppercase tracking-wider">Standard / Safe</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.green}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Unassessed</p>
          <p className="text-2xl font-bold text-slate-300 mt-1">{summary.unassessed}</p>
        </div>
        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
          <HelpCircle className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
