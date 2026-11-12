import React from 'react';

export function Badge({ children, variant = 'slate', className = '' }) {
  const variantStyles = {
    red: 'bg-red-500/15 text-red-400 border-red-500/30',
    amber: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
    teal: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
    slate: 'bg-slate-700/40 text-slate-300 border-slate-600/40',
  };

  const selected = variantStyles[variant] || variantStyles.slate;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${selected} ${className}`}>
      {children}
    </span>
  );
}
