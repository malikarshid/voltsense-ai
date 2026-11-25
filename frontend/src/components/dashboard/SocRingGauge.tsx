'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface SocRingGaugeProps {
  soc: number;
  estimatedRangeKm: number;
}

export const SocRingGauge: React.FC<SocRingGaugeProps> = ({ soc, estimatedRangeKm }) => {
  const { colors } = useTheme();
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (soc / 100) * circumference;

  return (
    <div className="surface-card p-4 flex flex-col items-center justify-between h-full relative">
      <div className="w-full flex items-center justify-between text-xs font-medium text-text-secondary pb-1 border-b border-border">
        <span>State of Charge (SOC)</span>
        <span className="text-[10px] text-accent-primary bg-surface-secondary px-2 py-0.5 rounded-[4px] border border-border font-mono">
          CAN Telemetry
        </span>
      </div>

      <div className="relative flex items-center justify-center my-2">
        <svg className="w-40 h-40 transform -rotate-90">
          {/* Background Track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={colors.bgSurfaceSecondary}
            strokeWidth="10"
            fill="transparent"
          />
          {/* Active Calibrated Stroke */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={colors.accentPrimary}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Central Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-primary-text tracking-tight tabular-nums">
            {Math.round(soc)}%
          </span>
          <span className="text-[11px] uppercase tracking-wider text-text-muted font-semibold mt-0.5">
            Pack SOC
          </span>
          <div className="mt-1 px-2.5 py-0.5 rounded-[4px] bg-surface-secondary border border-border text-[11px] text-primary-text">
            <span className="text-text-muted">Est. Range: </span>
            <span className="text-accent-primary font-mono font-bold">{estimatedRangeKm} km</span>
          </div>
        </div>
      </div>

      <div className="w-full text-center text-[11px] text-text-muted pt-1.5 border-t border-border">
        Usable Battery Energy Reserve
      </div>
    </div>
  );
};
