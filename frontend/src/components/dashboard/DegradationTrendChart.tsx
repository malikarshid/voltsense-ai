'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';

interface DegradationTrendChartProps {
  data: Array<{ date: string; capacity_ah: number }>;
  onPeriodChange?: (period: string) => void;
}

export const DegradationTrendChart: React.FC<DegradationTrendChartProps> = ({
  data,
  onPeriodChange,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const { colors } = useTheme();

  const handlePeriod = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(e.target.value);
    if (onPeriodChange) {
      onPeriodChange(e.target.value);
    }
  };

  return (
    <div className="surface-card p-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-primary-text">
            Battery Degradation Trend
          </h3>
          <p className="text-xs text-text-muted">Capacity retention curve over cycle aging</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={handlePeriod}
          className="bg-surface-secondary border border-border rounded-[6px] px-2.5 py-1 text-xs text-primary-text outline-none hover:border-accent-primary transition-colors"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
        </select>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={colors.textMuted}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
            />
            <YAxis
              domain={[80, 105]}
              stroke={colors.textMuted}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      className="p-2 rounded-[6px] shadow-subtle text-xs border"
                      style={{
                        backgroundColor: colors.bgSurface,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      }}
                    >
                      <div style={{ color: colors.textMuted }} className="font-mono">{payload[0].payload.date}</div>
                      <div style={{ color: colors.accentPrimary }} className="font-bold font-mono mt-0.5 text-sm">
                        {payload[0].value} Ah
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="capacity_ah"
              stroke={colors.accentPrimary}
              strokeWidth={2}
              dot={{ r: 3, fill: colors.bgMain, stroke: colors.accentPrimary, strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: colors.accentPrimary, stroke: colors.textPrimary, strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
