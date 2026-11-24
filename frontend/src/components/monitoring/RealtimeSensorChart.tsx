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
  strokeColor = '#4C9FFF',
  yDomain,
}) => {
  return (
    <div className="glass-card p-3.5 flex flex-col justify-between h-44">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-semibold text-[#F4F7FB]">{title}</span>
        <div className="text-[10px] text-[#9BA9BB] space-x-2">
          {minThreshold !== undefined && <span>Min: {minThreshold}{unit}</span>}
          {maxThreshold !== undefined && (
            <span className="text-[#EF6262]">Max: {maxThreshold}{unit}</span>
          )}
        </div>
      </div>

      <div className="w-full h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="2 2" stroke="#263449" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis
              domain={yDomain || ['auto', 'auto']}
              stroke="#9BA9BB"
              fontSize={9}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}`}
            />
            {minThreshold !== undefined && (
              <ReferenceLine y={minThreshold} stroke="#F4C44E" strokeDasharray="3 3" />
            )}
            {maxThreshold !== undefined && (
              <ReferenceLine y={maxThreshold} stroke="#EF6262" strokeDasharray="3 3" />
            )}
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-[#111B2B] border border-[#263449] p-1.5 rounded text-[10px] text-[#F4F7FB]">
                      <div>{payload[0].payload.time}</div>
                      <div className="font-bold text-[#55D889]">
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
              stroke={strokeColor}
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
