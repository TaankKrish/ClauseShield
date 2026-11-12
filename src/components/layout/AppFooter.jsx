import React from 'react';
import { AlertCircle } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 text-slate-400">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            <strong>Legal Disclaimer:</strong> ClauseShield is an informational and legal consultation-preparation tool, not an automated lawyer. Always consult a licensed advocate before signing.
          </span>
        </div>
        <div className="text-slate-500">
          Developed by <strong>Team Script Squad</strong> • Krish, Pratyush, Mayank, Nakashtra
        </div>
      </div>
    </footer>
  );
}

