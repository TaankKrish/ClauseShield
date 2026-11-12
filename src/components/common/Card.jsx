import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
}

