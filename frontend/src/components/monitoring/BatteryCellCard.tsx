'use client';

import React from 'react';
import { BatteryCell } from '@/types';
import { BatteryCharging } from 'lucide-react';

interface BatteryCellCardProps {
  cell: BatteryCell;
  onClick?: () => void;
}

export const BatteryCellCard: React.FC<BatteryCellCardProps> = ({ cell, onClick }) => {
  const isHealthy = cell.status === 'HEALTHY';
  const isWarning = cell.status === 'WARNING';
  const isCritical = cell.status === 'CRITICAL';

  const borderColor = isCritical
    ? 'border-status-critical'
    : isWarning
    ? 'border-status-warning'
    : isHealthy
    ? 'border-border hover:border-accent-primary'
    : 'border-border';

  const badgeBg = isCritical
    ? 'bg-surface-secondary text-status-critical border-status-critical/40'
    : isWarning
    ? 'bg-surface-secondary text-status-warning border-status-warning/40'
    : isHealthy
    ? 'bg-surface-secondary text-accent-primary border-accent-primary/40'
    : 'bg-surface-secondary text-text-muted border-border';

  return (
    <div
      onClick={onClick}
      className={`relative surface-card p-3.5 border ${borderColor} rounded-[8px] cursor-pointer transition-all duration-150 select-none group shadow-subtle`}
    >
      {/* Battery Terminal Indicators */}
      <div className="absolute -top-1.5 left-3 px-1 py-0.1 bg-surface-primary border border-border rounded-[3px] text-[8px] font-mono text-text-muted">
        +
      </div>
      <div className="absolute -top-1.5 right-3 px-1 py-0.1 bg-surface-primary border border-border rounded-[3px] text-[8px] font-mono text-text-muted">
        -
      </div>

      {/* Header: Cell Number & Status */}
      <div className="flex items-center justify-between mb-2.5 pt-0.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary-text">
          <BatteryCharging className="w-4 h-4 text-accent-primary flex-shrink-0" />
          <span className="font-mono">CELL {String(cell.cell_index).padStart(2, '0')}</span>
        </div>
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-[4px] border uppercase font-mono ${badgeBg}`}>
          {cell.status}
        </span>
      </div>

      {/* Telemetry Rows */}
      <div className="space-y-1.5 text-xs">
        <div
          className={`flex items-center justify-between p-1 rounded-[4px] ${
            isWarning
              ? 'bg-surface-secondary border border-status-warning/40 text-status-warning'
              : 'text-text-secondary'
          }`}
        >
          <span>Voltage</span>
          <span className={`font-mono font-bold tabular-nums ${isWarning ? 'text-status-warning' : 'text-primary-text'}`}>
            {cell.voltage.toFixed(cell.voltage > 10 ? 1 : 2)} V
          </span>
        </div>

        <div className="flex items-center justify-between px-1 text-text-muted">
          <span>Temp</span>
          <span className="font-mono font-medium text-primary-text tabular-nums">
            {cell.temperature.toFixed(1)} °C
          </span>
        </div>

        <div className="flex items-center justify-between px-1 text-text-muted">
          <span>Impedance</span>
          <span className="font-mono font-medium text-primary-text tabular-nums">
            {cell.internal_resistance.toFixed(4)} Ω
          </span>
        </div>
      </div>
    </div>
  );
};
