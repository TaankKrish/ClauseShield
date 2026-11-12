import React from 'react';
import { Shield, Lock, FileCheck } from 'lucide-react';

export function AppHeader() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white">ClauseShield</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                v0.1.0 MVP
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">AI explains. Rules decide. The citizen stays protected.</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-full">
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Client-Side Privacy Active</span>
            <span className="md:hidden">Private</span>
          </div>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Docs & Rules</span>
          </a>
        </div>
      </div>
    </header>
  );
}

