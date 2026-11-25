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

interface RealtimeSensorChartProps {
  title: string;
  dataKey: string;
  unit: string;
  data: any[];
  minThreshold?: number;
  maxThreshold?: number;
  strokeColor?: string;
  yDomain?: [number, number];
}

export const RealtimeSensorChart: React.FC<RealtimeSensorChartProps> = ({
  title,
  dataKey,
  unit,
  data,
  minThreshold,
  maxThreshold,
  strokeColor,
  yDomain,
}) => {
  const { colors } = useTheme();
  const activeStroke = strokeColor || colors.accentSecondary;

  return (
    <div className="surface-card p-3 flex flex-col justify-between h-40">
      <div className="flex items-center justify-between text-xs mb-1 pb-1 border-b border-border">
        <span className="font-medium text-primary-text">{title}</span>
        <div className="text-[10px] text-text-muted space-x-2 font-mono">
          {minThreshold !== undefined && <span>Min: {minThreshold}{unit}</span>}
          {maxThreshold !== undefined && (
            <span style={{ color: colors.statusCritical }}>Max: {maxThreshold}{unit}</span>
          )}
        </div>
      </div>

      <div className="w-full h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke={colors.gridColor} vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis
              domain={yDomain || ['auto', 'auto']}
              stroke={colors.textMuted}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />
            {minThreshold !== undefined && (
              <ReferenceLine y={minThreshold} stroke={colors.statusWarning} strokeDasharray="2 2" />
            )}
            {maxThreshold !== undefined && (
              <ReferenceLine y={maxThreshold} stroke={colors.statusCritical} strokeDasharray="2 2" />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      className="p-1.5 rounded-[4px] text-[10px] shadow-subtle font-mono border"
                      style={{
                        backgroundColor: colors.bgSurface,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      }}
                    >
                      <div>{payload[0].payload.time}</div>
                      <div className="font-bold" style={{ color: colors.accentPrimary }}>
                        {payload[0].value} {unit}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={activeStroke}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
