'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';

interface TemperatureTrendChartProps {
  data: Array<{
    day: string;
    temperature: number;
    optimal_min?: number;
    optimal_max?: number;
    tooltip?: string;
  }>;
}

export const TemperatureTrendChart: React.FC<TemperatureTrendChartProps> = ({ data }) => {
  const { colors } = useTheme();

  return (
    <div className="surface-card p-4 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-primary-text">
            Temperature Trend (Last 7 Days)
          </h3>
          <p className="text-xs text-text-muted">Continuous pack core thermal tracking</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-accent-primary" />
            <span>Core Temp</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t border-dashed border-text-muted" />
            <span>Optimal (15°C - 45°C)</span>
          </div>
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} vertical={false} />
            <XAxis
              dataKey="day"
              stroke={colors.textMuted}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
            />
            <YAxis
              domain={[0, 60]}
              stroke={colors.textMuted}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              tickFormatter={(v) => `${v}°C`}
            />
            <ReferenceLine y={15} stroke={colors.border} strokeDasharray="3 3" />
            <ReferenceLine y={45} stroke={colors.border} strokeDasharray="3 3" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div
                      className="p-2 rounded-[6px] shadow-subtle text-xs border"
                      style={{
                        backgroundColor: colors.bgSurface,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      }}
                    >
                      <div style={{ color: colors.textMuted }} className="font-mono">{item.tooltip || item.day}</div>
                      <div style={{ color: colors.accentPrimary }} className="font-bold font-mono mt-0.5 text-sm">
                        {item.temperature}°C
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke={colors.accentPrimary}
              strokeWidth={2}
              dot={{ r: 2.5, fill: colors.accentPrimary }}
              activeDot={{ r: 5, fill: colors.accentPrimary, stroke: colors.textPrimary, strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
