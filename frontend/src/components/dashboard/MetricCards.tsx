'use client';

import React from 'react';
import { RotateCcw, BatteryCharging } from 'lucide-react';

interface MetricCardsProps {
  cycleCount: number;
  designCapacityAh: number;
  currentCapacityAh: number;
  originalCapacityAh: number;
}

export const CycleCountCard: React.FC<{ cycleCount: number; designCapacityAh: number }> = ({
  cycleCount,
  designCapacityAh,
}) => {
  return (
    <div className="glass-card p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs font-semibold text-[#9BA9BB]">
        <span>Total Cycle Count</span>
        <RotateCcw className="w-4 h-4 text-[#9BA9BB]" />
      </div>

      <div className="my-auto py-2">
        <div className="text-4xl font-extrabold text-[#F4F7FB] tracking-tight">
          {cycleCount}
        </div>
        <div className="text-xs text-[#9BA9BB] font-medium mt-1">Cycles Completed</div>
      </div>

      <div className="pt-2 border-t border-[#263449]/40 flex items-center justify-between text-xs">
        <span className="text-[#9BA9BB]">Design Capacity</span>
        <span className="font-semibold text-[#F4F7FB]">{designCapacityAh} Ah</span>
      </div>
    </div>
  );
};

export const CapacityCard: React.FC<{ currentCapacityAh: number; originalCapacityAh: number }> = ({
  currentCapacityAh,
  originalCapacityAh,
}) => {
  return (
    <div className="glass-card p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs font-semibold text-[#9BA9BB]">
        <span>Battery Capacity</span>
        <BatteryCharging className="w-4 h-4 text-[#55D889]" />
      </div>

      <div className="my-auto py-2">
        <div className="text-4xl font-extrabold text-[#F4F7FB] tracking-tight">
          {currentCapacityAh} <span className="text-2xl font-normal text-[#9BA9BB]">Ah</span>
        </div>
        <div className="text-xs text-[#9BA9BB] font-medium mt-1">Current Capacity</div>
      </div>

      <div className="pt-2 border-t border-[#263449]/40 flex items-center justify-between text-xs">
        <span className="text-[#9BA9BB]">Original Capacity</span>
        <span className="font-semibold text-[#F4F7FB]">{originalCapacityAh} Ah</span>
      </div>
    </div>
  );
};
