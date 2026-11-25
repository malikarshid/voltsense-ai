'use client';

import React from 'react';
import { useTheme } from '@/context/ThemeContext';

interface AnalogRadialGaugeProps {
  title: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  formatDecimals?: number;
}

export const AnalogRadialGauge: React.FC<AnalogRadialGaugeProps> = ({
  title,
  value,
  unit,
  min,
  max,
  warningThreshold,
  criticalThreshold,
  formatDecimals = 1,
}) => {
  const { colors } = useTheme();
  const clamped = Math.min(max, Math.max(min, value));
  const fraction = (clamped - min) / (max - min);
  const needleAngle = -120 + fraction * 240;

  return (
    <div className="surface-card p-3.5 flex flex-col items-center justify-between h-full relative">
      <div className="w-full text-left text-xs font-medium text-text-secondary pb-1 border-b border-border">
        {title}
      </div>

      <div className="relative w-40 h-24 overflow-hidden flex items-end justify-center my-1">
        <svg viewBox="0 0 180 120" className="w-40 h-28">
          {/* Background Arc */}
          <path
            d="M 25 95 A 65 65 0 1 1 155 95"
            fill="none"
            stroke={colors.bgSurfaceSecondary}
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Calibrated Safe Zone (Accent Primary) */}
          <path
            d="M 25 95 A 65 65 0 0 1 120 35"
            fill="none"
            stroke={colors.accentPrimary}
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Caution Zone (Warning Amber) */}
          <path
            d="M 120 35 A 65 65 0 0 1 144 65"
            fill="none"
            stroke={colors.statusWarning}
            strokeWidth="8"
          />

          {/* Upper Limit Zone (Critical Red) */}
          <path
            d="M 144 65 A 65 65 0 0 1 155 95"
            fill="none"
            stroke={colors.statusCritical}
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Needle with pivot */}
          <g transform={`rotate(${needleAngle}, 90, 95)`}>
            <polygon
              points="88,95 92,95 90,34"
              fill={colors.textPrimary}
              className="transition-transform duration-300 ease-out"
            />
            <circle cx="90" cy="95" r="5" fill={colors.bgSurfaceElevated} stroke={colors.border} strokeWidth="1.5" />
          </g>
        </svg>
      </div>

      <div className="text-center pt-1 w-full border-t border-border">
        <span className="text-lg font-bold text-primary-text font-mono tabular-nums">
          {value.toFixed(formatDecimals)}
        </span>{' '}
        <span className="text-xs text-text-muted font-medium">{unit}</span>
      </div>
    </div>
  );
};
