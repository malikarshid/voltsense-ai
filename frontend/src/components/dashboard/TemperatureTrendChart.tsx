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
  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#F4F7FB]">
            Temperature Trend (Last 7 Days)
          </h3>
          <p className="text-xs text-[#9BA9BB]">Continuous pack core thermal tracking</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#9BA9BB]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#55D889]" />
            <span>Battery Temperature</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 border-t border-dashed border-[#9BA9BB]" />
            <span>Optimal Range (15°C - 45°C)</span>
          </div>
        </div>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#263449" vertical={false} />
            <XAxis
              dataKey="day"
              stroke="#9BA9BB"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#263449' }}
            />
            <YAxis
              domain={[0, 60]}
              stroke="#9BA9BB"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#263449' }}
              tickFormatter={(v) => `${v}°C`}
            />
            {/* Optimal Min and Max Threshold Lines */}
            <ReferenceLine y={15} stroke="#3b506d" strokeDasharray="3 3" />
            <ReferenceLine y={45} stroke="#3b506d" strokeDasharray="3 3" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="bg-[#111B2B] border border-[#263449] p-2.5 rounded-lg shadow-xl text-xs">
                      <div className="text-[#9BA9BB]">{item.tooltip || item.day}</div>
                      <div className="text-[#55D889] font-bold mt-1 text-sm">
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
              stroke="#55D889"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#55D889' }}
              activeDot={{ r: 6, fill: '#55D889', stroke: '#F4F7FB', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
