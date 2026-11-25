'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { DegradationSummary } from '@/types';

interface DegradationSummaryCardProps {
  summary: DegradationSummary;
}

export const DegradationSummaryCard: React.FC<DegradationSummaryCardProps> = ({ summary }) => {
  return (
    <div className="surface-card p-4 h-full flex flex-col justify-between">
      <div>
        <div className="pb-2 mb-3 border-b border-border">
          <h3 className="text-sm font-semibold text-primary-text">
            Degradation Summary
          </h3>
          <p className="text-xs text-text-muted">Capacity retention analytics</p>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs text-text-muted">Total Degradation</div>
            <div className="text-lg font-bold text-primary-text mt-0.5 font-mono tabular-nums">
              {summary.total_degradation_ah} Ah{' '}
              <span className="text-xs font-normal text-text-secondary">
                ({summary.total_degradation_pct}%)
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs text-text-muted">Average Monthly Degradation</div>
            <div className="text-lg font-bold text-accent-primary mt-0.5 font-mono tabular-nums">
              {summary.avg_monthly_degradation_pct}%
            </div>
          </div>

          <div>
            <div className="text-xs text-text-muted">Projected Capacity (1 Year)</div>
            <div className="text-lg font-bold text-accent-secondary mt-0.5 font-mono tabular-nums">
              {summary.projected_capacity_1yr_min_ah} - {summary.projected_capacity_1yr_max_ah} Ah
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 p-2.5 rounded-[6px] bg-surface-secondary border border-border flex items-center gap-2 text-xs text-accent-primary">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-accent-primary" />
        <span className="font-medium leading-tight">{summary.performance_status}</span>
      </div>
    </div>
  );
};
