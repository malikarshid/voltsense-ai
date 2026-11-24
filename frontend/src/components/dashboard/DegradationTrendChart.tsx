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

interface DegradationTrendChartProps {
  data: Array<{ date: string; capacity_ah: number }>;
  onPeriodChange?: (period: string) => void;
}

export const DegradationTrendChart: React.FC<DegradationTrendChartProps> = ({
  data,
  onPeriodChange,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  const handlePeriod = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPeriod(e.target.value);
    if (onPeriodChange) {
      onPeriodChange(e.target.value);
    }
  };

  return (
    <div className="glass-card p-5 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#F4F7FB]">
            Battery Degradation Trend
          </h3>
          <p className="text-xs text-[#9BA9BB]">Retention curve over cycle aging</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={handlePeriod}
          className="bg-[#172337] border border-[#263449] rounded-lg px-2.5 py-1 text-xs text-[#F4F7FB] outline-none hover:border-[#55D889] transition-colors"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="6months">Last 6 Months</option>
          <option value="12months">Last 12 Months</option>
        </select>
      </div>

      <div className="w-full h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 20, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#263449" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#9BA9BB"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#263449' }}
            />
            <YAxis
              domain={[80, 105]}
              stroke="#9BA9BB"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#263449' }}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#111B2B] border border-[#263449] p-2.5 rounded-lg shadow-xl text-xs">
                      <div className="text-[#9BA9BB]">{payload[0].payload.date}</div>
                      <div className="text-[#55D889] font-bold mt-1 text-sm">
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
              stroke="#55D889"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#080D18', stroke: '#55D889', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#55D889', stroke: '#F4F7FB', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
