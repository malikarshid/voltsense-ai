'use client';

import React from 'react';
import { BatteryCell } from '@/types';
import { BatteryCharging, AlertTriangle, CheckCircle, Moon } from 'lucide-react';

interface BatteryCellCardProps {
  cell: BatteryCell;
  onClick?: () => void;
}

export const BatteryCellCard: React.FC<BatteryCellCardProps> = ({ cell, onClick }) => {
  const isHealthy = cell.status === 'HEALTHY';
  const isWarning = cell.status === 'WARNING';
  const isCritical = cell.status === 'CRITICAL';
  const isIdle = cell.status === 'IDLE';

  const borderColor = isCritical
    ? 'border-[#EF6262]'
    : isWarning
    ? 'border-[#F4C44E]'
    : isHealthy
    ? 'border-[#55D889]/60'
    : 'border-[#263449]';

  const badgeBg = isCritical
    ? 'bg-[#EF6262]/20 text-[#EF6262] border-[#EF6262]/40'
    : isWarning
    ? 'bg-[#F4C44E]/20 text-[#F4C44E] border-[#F4C44E]/40'
    : isHealthy
    ? 'bg-[#55D889]/20 text-[#55D889] border-[#55D889]/40'
    : 'bg-[#172337] text-[#9BA9BB] border-[#263449]';

  return (
    <div
      onClick={onClick}
      className={`relative glass-card p-4 border ${borderColor} rounded-xl cursor-pointer hover:border-[#4C9FFF] transition-all duration-200 select-none group`}
    >
      {/* Top Battery Terminals Decoration (+ and -) matching Reference 3 */}
      <div className="absolute -top-1.5 left-4 px-1.5 py-0.2 bg-[#172337] border border-[#263449] rounded text-[9px] font-mono text-[#9BA9BB]">
        +
      </div>
      <div className="absolute -top-1.5 right-4 px-1.5 py-0.2 bg-[#172337] border border-[#263449] rounded text-[9px] font-mono text-[#9BA9BB]">
        -
      </div>

      {/* Header: Cell Number & Status Badge */}
      <div className="flex items-center justify-between mb-3 pt-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#F4F7FB]">
          <BatteryCharging className="w-3.5 h-3.5 text-[#55D889]" />
          <span>{String(cell.cell_index).padStart(2, '0')}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${badgeBg}`}>
          {cell.status}
        </span>
      </div>

      {/* Telemetry Rows */}
      <div className="space-y-2 text-xs">
        {/* Voltage Row (Highlighted in yellow if warning, matching Reference 3) */}
        <div
          className={`flex items-center justify-between p-1.5 rounded ${
            isWarning
              ? 'bg-[#F4C44E]/15 border border-[#F4C44E]/40 text-[#F4C44E]'
              : 'text-[#9BA9BB]'
          }`}
        >
          <span>Voltage</span>
          <span className={`font-mono font-bold ${isWarning ? 'text-[#F4C44E]' : 'text-[#F4F7FB]'}`}>
            {cell.voltage.toFixed(cell.voltage > 10 ? 1 : 2)} V
          </span>
        </div>

        <div className="flex items-center justify-between px-1.5 text-[#9BA9BB]">
          <span>Temperature</span>
          <span className="font-mono font-semibold text-[#F4F7FB]">
            {cell.temperature.toFixed(1)} °C
          </span>
        </div>

        <div className="flex items-center justify-between px-1.5 text-[#9BA9BB]">
          <span>Impedance</span>
          <span className="font-mono font-semibold text-[#F4F7FB]">
            {cell.internal_resistance.toFixed(4)} Ω
          </span>
        </div>
      </div>
    </div>
  );
};
