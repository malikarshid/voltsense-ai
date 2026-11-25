'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '@/context/ThemeContext';
import { Zap } from 'lucide-react';

interface SocHistoryPoint {
  time: string;
  soc: number;
  discharge_rate_kw: number;
}

interface SocHistoryChartProps {
  currentSoc?: number;
}

export const SocHistoryChart: React.FC<SocHistoryChartProps> = ({ currentSoc = 67 }) => {
  const { colors } = useTheme();

  // Synthetic 24-hour SOC curve based on realistic EV commute cycles
  const data: SocHistoryPoint[] = [
    { time: '00:00', soc: 90, discharge_rate_kw: 0.2 },
    { time: '04:00', soc: 89, discharge_rate_kw: 0.1 },
    { time: '07:30', soc: 88, discharge_rate_kw: 18.4 },
    { time: '09:00', soc: 79, discharge_rate_kw: 0.8 },
    { time: '12:00', soc: 78, discharge_rate_kw: 0.2 },
    { time: '13:30', soc: 74, discharge_rate_kw: 14.2 },
    { time: '15:00', soc: 72, discharge_rate_kw: 0.3 },
    { time: '17:30', soc: 70, discharge_rate_kw: 22.1 },
    { time: '19:00', soc: Math.round(currentSoc), discharge_rate_kw: 1.2 },
  ];

  return (
    <div className="surface-card p-4 sm:p-5 h-full flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-border">
        <div>
          <h3 className="text-sm font-semibold text-primary-text flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-accent-primary" />
            <span>SOC Profile & Discharge Rate (Last 24 Hours)</span>
          </h3>
          <p className="text-xs text-text-muted">Dynamic state-of-charge tracking over operational drive cycles</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-text-secondary">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-sm bg-accent-primary" />
            <span>SOC %</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1 rounded-sm bg-accent-secondary" />
            <span>Power (kW)</span>
          </div>
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="socGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.accentPrimary} stopOpacity={0.25} />
                <stop offset="95%" stopColor={colors.accentPrimary} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} vertical={false} />
            <XAxis
              dataKey="time"
              stroke={colors.textMuted}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
            />
            <YAxis
              domain={[50, 100]}
              stroke={colors.textMuted}
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: colors.border }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as SocHistoryPoint;
                  return (
                    <div
                      className="p-2.5 rounded-[6px] shadow-subtle text-xs border"
                      style={{
                        backgroundColor: colors.bgSurface,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      }}
                    >
                      <div className="font-semibold text-primary-text mb-1">Time: {item.time}</div>
                      <div className="flex items-center justify-between gap-4 text-text-secondary">
                        <span>SOC:</span>
                        <span className="font-mono font-bold text-accent-primary">{item.soc}%</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-text-secondary">
                        <span>Power Draw:</span>
                        <span className="font-mono text-accent-secondary">{item.discharge_rate_kw} kW</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="soc"
              stroke={colors.accentPrimary}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#socGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-text-muted">
        <span>Average Daily Discharge: 2.1 kWh/100km</span>
        <span className="font-mono text-accent-primary font-medium">Regen Brake Capture: +14%</span>
      </div>
    </div>
  );
};
