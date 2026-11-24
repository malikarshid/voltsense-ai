'use client';

import React from 'react';

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
  // Semi-circle / 240 degree gauge geometry
  // Map value to angle from -120 deg to +120 deg (total 240 deg sweep)
  const clamped = Math.min(max, Math.max(min, value));
  const fraction = (clamped - min) / (max - min);
  const needleAngle = -120 + fraction * 240;

  // Arc path constants
  const size = 180;
  const cx = 90;
  const cy = 90;
  const r = 68;

  return (
    <div className="glass-card p-4 flex flex-col items-center justify-between h-full relative">
      <div className="w-full text-left text-xs font-semibold text-[#9BA9BB]">
        {title}
      </div>

      <div className="relative w-44 h-28 overflow-hidden flex items-end justify-center my-1">
        <svg viewBox="0 0 180 125" className="w-44 h-32">
          <defs>
            <linearGradient id="gaugeGreen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#55D889" />
              <stop offset="100%" stopColor="#32B96F" />
            </linearGradient>
            <linearGradient id="gaugeYellow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F4C44E" />
              <stop offset="100%" stopColor="#E09F3E" />
            </linearGradient>
            <linearGradient id="gaugeRed" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#EF6262" />
              <stop offset="100%" stopColor="#D93838" />
            </linearGradient>
          </defs>

          {/* Background Arc */}
          <path
            d="M 25 100 A 68 68 0 1 1 155 100"
            fill="none"
            stroke="#172337"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Green Zone (Safe) */}
          <path
            d="M 25 100 A 68 68 0 0 1 125 35"
            fill="none"
            stroke="#55D889"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Yellow Zone (Warning) */}
          <path
            d="M 125 35 A 68 68 0 0 1 148 65"
            fill="none"
            stroke="#F4C44E"
            strokeWidth="10"
          />

          {/* Red Zone (Critical) */}
          <path
            d="M 148 65 A 68 68 0 0 1 155 100"
            fill="none"
            stroke="#EF6262"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Radial Needle with pivot */}
          <g transform={`rotate(${needleAngle}, 90, 95)`}>
            <polygon
              points="88,95 92,95 90,32"
              fill="#F4F7FB"
              style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.7))' }}
            />
            <circle cx="90" cy="95" r="7" fill="#263449" stroke="#55D889" strokeWidth="2" />
          </g>
        </svg>
      </div>

      {/* Numerical Display matching Reference 3 */}
      <div className="text-center mt-1">
        <span className="text-2xl font-extrabold text-[#F4F7FB] font-mono tracking-tight">
          {value.toFixed(formatDecimals)}
        </span>
        <span className="text-xs text-[#9BA9BB] ml-1.5 font-sans font-medium">{unit}</span>
      </div>
    </div>
  );
};
