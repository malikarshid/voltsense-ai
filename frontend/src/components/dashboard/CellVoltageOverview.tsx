'use client';

import React from 'react';
import Link from 'next/link';
import { BatteryCell } from '@/types';
import { useTheme } from '@/context/ThemeContext';

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
  const { colors } = useTheme();
  const maxScale = 4.5;

  return (
    <div className="surface-card p-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-primary-text">
            Cell Voltage Overview
          </h3>
          <p className="text-xs text-text-muted">Individual cell potential distribution</p>
        </div>
        <Link
          href="/cells"
          className="text-xs text-accent-secondary hover:text-accent-primary font-medium transition-colors"
        >
          View Details →
        </Link>
      </div>

      {/* 10 Vertical Bars */}
      <div className="w-full h-44 flex items-end justify-between gap-2 px-1 pt-4 pb-1">
        {cells.map((cell) => {
          const heightPercent = Math.min(100, Math.max(10, ((cell.voltage || 3.6) / maxScale) * 100));
          const isWarning = cell.status === 'WARNING';
          const isCritical = cell.status === 'CRITICAL';

          const barColor = isCritical
            ? colors.statusCritical
            : isWarning
            ? colors.statusWarning
            : colors.accentPrimary;

          return (
            <div key={cell.cell_index} className="flex-1 flex flex-col items-center h-full justify-end group">
              <div
                className="w-full rounded-t-[4px] transition-all duration-300 relative"
                style={{ height: `${heightPercent}%`, backgroundColor: barColor }}
              >
                <div
                  className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 px-2 py-0.5 rounded-[4px] text-[10px] pointer-events-none whitespace-nowrap z-10 transition-opacity font-mono shadow-subtle border"
                  style={{
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                  }}
                >
                  {cell.voltage.toFixed(2)}V
                </div>
              </div>
              <span className="text-[10px] text-text-muted mt-2 font-mono">
                C{cell.cell_index}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div className="pt-2.5 border-t border-border grid grid-cols-3 text-center text-xs">
        <div>
          <div className="text-[11px] text-text-muted">Min Voltage</div>
          <div className="text-sm font-semibold text-primary-text mt-0.5 font-mono">{minVoltage.toFixed(2)} V</div>
        </div>
        <div>
          <div className="text-[11px] text-text-muted">Max Voltage</div>
          <div className="text-sm font-semibold text-primary-text mt-0.5 font-mono">{maxVoltage.toFixed(2)} V</div>
        </div>
        <div>
          <div className="text-[11px] text-text-muted">Voltage Diff.</div>
          <div className="text-sm font-semibold text-accent-primary mt-0.5 font-mono">Δ {voltageDiff.toFixed(2)} V</div>
        </div>
      </div>
    </div>
  );
};
