'use client';

import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';

interface HealthScoreCardProps {
  score: number;
  status: string;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ score, status }) => {
  return (
    <div className="glass-card p-5 flex flex-col items-center justify-between h-full relative">
      <div className="w-full flex items-center justify-between text-xs font-semibold text-[#9BA9BB]">
        <span>Battery Health Score</span>
        <button title="Calculated from cell balance, internal impedance, and capacity degradation">
          <Info className="w-3.5 h-3.5 text-[#9BA9BB] hover:text-[#F4F7FB]" />
        </button>
      </div>

      <div className="flex flex-col items-center my-auto py-2">
        {/* Green Shield Icon matching Reference 1 */}
        <div className="relative mb-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#55D889]/20 to-transparent border border-[#55D889]/40 flex items-center justify-center shadow-glow-green">
            <ShieldCheck className="w-9 h-9 text-[#55D889]" />
          </div>
        </div>

        <span className="text-2xl font-bold text-[#55D889] tracking-wide mb-1">
          {status}
        </span>
        <div className="text-xs text-[#9BA9BB] flex items-center gap-1.5">
          <span>Health Score</span>
          <span className="text-lg font-bold text-[#F4F7FB]">{score}</span>
          <span className="text-xs text-[#9BA9BB]">/ 100</span>
        </div>
      </div>

      <div className="w-full text-center text-[11px] text-[#9BA9BB] pt-1 border-t border-[#263449]/40">
        Pack degradation within standard envelope
      </div>
    </div>
  );
};
