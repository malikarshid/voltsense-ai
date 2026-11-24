'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DegradationSummary } from '@/types';

interface DegradationSummaryCardProps {
  summary: DegradationSummary;
}

export const DegradationSummaryCard: React.FC<DegradationSummaryCardProps> = ({ summary }) => {
  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between">
      <div>
        <h3 className="text-sm font-semibold text-[#F4F7FB] mb-1">
          Degradation Summary
        </h3>
        <p className="text-xs text-[#9BA9BB] mb-4">Capacity retention statistics</p>

        <div className="space-y-3.5">
          <div>
            <div className="text-xs text-[#9BA9BB]">Total Degradation</div>
            <div className="text-xl font-bold text-[#F4F7FB] mt-0.5">
              {summary.total_degradation_ah} Ah{' '}
              <span className="text-sm font-medium text-[#9BA9BB]">
                ({summary.total_degradation_pct}%)
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-[#9BA9BB]">Average Monthly Degradation</div>
            <div className="text-xl font-bold text-[#55D889] mt-0.5">
              {summary.avg_monthly_degradation_pct}%
            </div>
          </div>

          <div>
            <div className="text-xs text-[#9BA9BB]">Projected Capacity (1 Year)</div>
            <div className="text-xl font-bold text-[#4C9FFF] mt-0.5">
              {summary.projected_capacity_1yr_min_ah} - {summary.projected_capacity_1yr_max_ah} Ah
            </div>
          </div>
        </div>
      </div>

      {/* Optimal Performance Status Badge matching Reference 1 */}
      <div className="mt-4 p-3 rounded-lg bg-[#55D889]/10 border border-[#55D889]/30 flex items-center gap-2.5 text-xs text-[#55D889]">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#55D889]" />
        <span className="font-medium leading-tight">{summary.performance_status}</span>
      </div>
    </div>
  );
};
