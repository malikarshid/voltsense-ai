'use client';

import React from 'react';
import Link from 'next/link';
import { BatteryCell } from '@/types';

interface CellVoltageOverviewProps {
  cells: BatteryCell[];
  minVoltage: number;
  maxVoltage: number;
  voltageDiff: number;
}

export const CellVoltageOverview: React.FC<CellVoltageOverviewProps> = ({
  cells,
  minVoltage,
  maxVoltage,
  voltageDiff,
}) => {
  // Normalize voltage height (assuming nominal 3.0V - 4.2V scale)
  const maxScale = 4.5;

  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-[#F4F7FB]">
            Cell Voltage Overview
          </h3>
          <p className="text-xs text-[#9BA9BB]">Individual cell potential distribution</p>
        </div>
        <Link
          href="/cells"
          className="text-xs text-[#4C9FFF] hover:text-[#55D889] font-medium transition-colors"
        >
          View Details
        </Link>
      </div>

      {/* 10 Vertical Bars matching Reference 1 (C1 - C10) */}
      <div className="w-full h-44 flex items-end justify-between gap-2 px-1 pt-4 pb-1">
        {cells.map((cell) => {
          const heightPercent = Math.min(100, Math.max(10, ((cell.voltage || 3.6) / maxScale) * 100));
          const isWarning = cell.status === 'WARNING';
          const isCritical = cell.status === 'CRITICAL';

          return (
            <div key={cell.cell_index} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div
                className={`w-full rounded-t transition-all duration-500 relative ${
                  isCritical
                    ? 'bg-[#EF6262]'
                    : isWarning
                    ? 'bg-[#F4C44E]'
                    : 'bg-[#55D889]'
                }`}
                style={{ height: `${heightPercent}%` }}
              >
                {/* Hover Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-[#080D18] border border-[#263449] px-2 py-0.5 rounded text-[10px] text-[#F4F7FB] pointer-events-none whitespace-nowrap z-10 transition-opacity">
                  {cell.voltage.toFixed(2)}V
                </div>
              </div>
              <span className="text-[10px] text-[#9BA9BB] mt-2 font-mono">
                C{cell.cell_index}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary Footer matching Reference 1 */}
      <div className="pt-3 border-t border-[#263449]/40 grid grid-cols-3 text-center text-xs">
        <div>
          <div className="text-[11px] text-[#9BA9BB]">Min Voltage</div>
          <div className="text-sm font-bold text-[#F4F7FB] mt-0.5">{minVoltage.toFixed(2)} V</div>
        </div>
        <div>
          <div className="text-[11px] text-[#9BA9BB]">Max Voltage</div>
          <div className="text-sm font-bold text-[#F4F7FB] mt-0.5">{maxVoltage.toFixed(2)} V</div>
        </div>
        <div>
          <div className="text-[11px] text-[#9BA9BB]">Voltage Diff.</div>
          <div className="text-sm font-bold text-[#55D889] mt-0.5">{voltageDiff.toFixed(2)} V</div>
        </div>
      </div>
    </div>
  );
};
