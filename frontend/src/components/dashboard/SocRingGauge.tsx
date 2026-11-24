'use client';

import React from 'react';

interface SocRingGaugeProps {
  soc: number;
  estimatedRangeKm: number;
}

export const SocRingGauge: React.FC<SocRingGaugeProps> = ({ soc, estimatedRangeKm }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (soc / 100) * circumference;

  return (
    <div className="glass-card p-5 flex flex-col items-center justify-between h-full relative overflow-hidden">
      <div className="w-full flex items-center justify-between text-xs font-semibold text-[#9BA9BB] mb-2">
        <span>State of Charge (SOC)</span>
        <span className="text-[10px] text-[#55D889] bg-[#55D889]/10 px-2 py-0.5 rounded-full border border-[#55D889]/30">
          Live Telemetry
        </span>
      </div>

      <div className="relative flex items-center justify-center my-2">
        {/* SVG Circular Progress Gauge matching Reference 1 */}
        <svg className="w-44 h-44 transform -rotate-90">
          {/* Background Track */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="#172337"
            strokeWidth="12"
            fill="transparent"
          />
          {/* Active Gradient Stroke */}
          <circle
            cx="88"
            cy="88"
            r={radius}
            stroke="#55D889"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(85, 216, 137, 0.4))',
            }}
          />
        </svg>

        {/* Central Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-extrabold text-[#F4F7FB] tracking-tight">
            {Math.round(soc)}%
          </span>
          <span className="text-xs uppercase tracking-wider text-[#9BA9BB] font-semibold mt-0.5">
            SOC
          </span>
          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-[#172337]/80 border border-[#263449] text-[11px] text-[#F4F7FB]">
            <span className="text-[#9BA9BB]">Est. Range: </span>
            <span className="text-[#55D889] font-bold">{estimatedRangeKm} km</span>
          </div>
        </div>
      </div>

      <div className="w-full text-center text-[11px] text-[#9BA9BB] pt-1 border-t border-[#263449]/40">
        Usable Battery Energy Reserve
      </div>
    </div>
  );
};
