'use client';

import React from 'react';
import {
  RotateCcw,
  BatteryCharging,
  Zap,
  Thermometer,
  ShieldCheck,
  Compass,
} from 'lucide-react';

export const SohMetricCard: React.FC<{ soh: number }> = ({ soh }) => {
  return (
    <div className="surface-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs font-medium text-text-secondary pb-1 border-b border-border">
        <span>State of Health (SOH)</span>
        <ShieldCheck className="w-4 h-4 text-accent-primary flex-shrink-0" />
      </div>

      <div className="my-auto py-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-primary-text tracking-tight tabular-nums font-mono">
            {typeof soh === 'number' ? soh.toFixed(1) : soh}
          </span>
          <span className="text-xl font-normal text-text-muted">%</span>
        </div>
        <div className="text-xs text-text-muted font-medium mt-0.5">Cell Capacity Retention</div>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
        <span className="text-text-secondary">Degradation Status</span>
        <span className="font-semibold text-accent-primary font-mono">Nominal</span>
      </div>
    </div>
  );
};

export const PackVoltageCard: React.FC<{ voltage: number; cellDiff?: number }> = ({
  voltage,
  cellDiff = 0.04,
}) => {
  return (
    <div className="surface-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs font-medium text-text-secondary pb-1 border-b border-border">
        <span>Total Pack Voltage</span>
        <Zap className="w-4 h-4 text-accent-primary flex-shrink-0" />
      </div>

      <div className="my-auto py-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-primary-text tracking-tight tabular-nums font-mono">
            {typeof voltage === 'number' ? voltage.toFixed(1) : voltage}
          </span>
          <span className="text-xl font-normal text-text-muted">V</span>
        </div>
        <div className="text-xs text-text-muted font-medium mt-0.5">CAN High-Voltage Bus</div>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
        <span className="text-text-secondary">Delta V Imbalance</span>
        <span className="font-semibold text-primary-text font-mono">{(cellDiff * 1000).toFixed(0)} mV</span>
      </div>
    </div>
  );
};

export const AvgTempCard: React.FC<{ temp: number }> = ({ temp }) => {
  return (
    <div className="surface-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs font-medium text-text-secondary pb-1 border-b border-border">
        <span>Average Temperature</span>
        <Thermometer className="w-4 h-4 text-accent-primary flex-shrink-0" />
      </div>

      <div className="my-auto py-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-primary-text tracking-tight tabular-nums font-mono">
            {typeof temp === 'number' ? temp.toFixed(1) : temp}
          </span>
          <span className="text-xl font-normal text-text-muted">°C</span>
        </div>
        <div className="text-xs text-text-muted font-medium mt-0.5">Liquid Coolant Loop</div>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
        <span className="text-text-secondary">Operating Window</span>
        <span className="font-semibold text-accent-primary font-mono">15°C – 35°C</span>
      </div>
    </div>
  );
};

export const RangeMetricCard: React.FC<{ rangeKm: number }> = ({ rangeKm }) => {
  return (
    <div className="surface-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs font-medium text-text-secondary pb-1 border-b border-border">
        <span>Est. Driving Range</span>
        <Compass className="w-4 h-4 text-accent-primary flex-shrink-0" />
      </div>

      <div className="my-auto py-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-primary-text tracking-tight tabular-nums font-mono">
            {Math.round(rangeKm)}
          </span>
          <span className="text-xl font-normal text-text-muted">km</span>
        </div>
        <div className="text-xs text-text-muted font-medium mt-0.5">Based on Current SOC</div>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
        <span className="text-text-secondary">Powertrain Mode</span>
        <span className="font-semibold text-primary-text font-mono">Eco / Efficient</span>
      </div>
    </div>
  );
};

export const CycleCountCard: React.FC<{ cycleCount: number; designCapacityAh: number }> = ({
  cycleCount,
  designCapacityAh,
}) => {
  return (
    <div className="surface-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs font-medium text-text-secondary pb-1 border-b border-border">
        <span>Total Cycle Count</span>
        <RotateCcw className="w-4 h-4 text-text-muted flex-shrink-0" />
      </div>

      <div className="my-auto py-2">
        <div className="text-3xl font-bold text-primary-text tracking-tight tabular-nums font-mono">
          {cycleCount}
        </div>
        <div className="text-xs text-text-muted font-medium mt-0.5">Cycles Completed</div>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
        <span className="text-text-secondary">Design Rating</span>
        <span className="font-semibold text-primary-text font-mono">{designCapacityAh} Ah</span>
      </div>
    </div>
  );
};

export const CapacityCard: React.FC<{ currentCapacityAh: number; originalCapacityAh: number }> = ({
  currentCapacityAh,
  originalCapacityAh,
}) => {
  return (
    <div className="surface-card p-4 sm:p-5 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between text-xs font-medium text-text-secondary pb-1 border-b border-border">
        <span>Battery Capacity</span>
        <BatteryCharging className="w-4 h-4 text-accent-primary flex-shrink-0" />
      </div>

      <div className="my-auto py-2">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-primary-text tracking-tight tabular-nums font-mono">
            {typeof currentCapacityAh === 'number' ? currentCapacityAh.toFixed(1) : currentCapacityAh}
          </span>
          <span className="text-xl font-normal text-text-muted">Ah</span>
        </div>
        <div className="text-xs text-text-muted font-medium mt-0.5">Full Charge Capacity</div>
      </div>

      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
        <span className="text-text-secondary">Factory Original</span>
        <span className="font-semibold text-primary-text font-mono">{originalCapacityAh} Ah</span>
      </div>
    </div>
  );
};
