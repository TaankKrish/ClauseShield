import React from 'react';
import { Card } from '../common/Card.jsx';
import { Badge } from '../common/Badge.jsx';
import { Calendar } from 'lucide-react';

export function TimelineView({ items = [] }) {
  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-xs text-slate-500">
        No specific notice periods or deadlines detected in this document.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="p-4 bg-slate-900/60 border-slate-800">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-emerald-400 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{item.title}</span>
            </span>
            <Badge variant={item.urgency === 'HIGH' ? 'red' : 'amber'}>{item.urgency}</Badge>
          </div>
          <p className="text-sm font-bold text-white mb-1">{item.dateText}</p>
          <p className="text-xs text-slate-400">{item.actionRequired}</p>
        </Card>
      ))}
    </div>
  );
}
