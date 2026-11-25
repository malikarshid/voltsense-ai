'use client';

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface HealthScoreCardProps {
  score: number;
  status: string;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ score, status }) => {
  return (
    <div className="surface-card p-4 flex flex-col items-center justify-between h-full relative">
      <div className="w-full flex items-center justify-between text-xs font-medium text-text-secondary pb-1 border-b border-border">
        <span>Battery Health Score</span>
        <button title="Calculated from cell balance, internal impedance, and capacity degradation" aria-label="Health score details">
          <Info className="w-3.5 h-3.5 text-text-muted hover:text-primary-text transition-colors" />
        </button>
      </div>

      <div className="flex flex-col items-center my-auto py-2">
        <div className="w-14 h-14 rounded-[8px] bg-surface-secondary border border-border flex items-center justify-center mb-2 text-accent-primary">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <span className="text-xl font-bold text-accent-primary tracking-wide mb-1">
          {status}
        </span>
        <div className="text-xs text-text-secondary flex items-center gap-1.5">
          <span>Health Index</span>
          <span className="text-lg font-bold text-primary-text tabular-nums font-mono">{score}</span>
          <span className="text-xs text-text-muted">/ 100</span>
        </div>
      </div>

      <div className="w-full text-center text-[11px] text-text-muted pt-1.5 border-t border-border">
        Cell impedance within nominal envelope
      </div>
    </div>
  );
};
