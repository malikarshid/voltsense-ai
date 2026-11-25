'use client';

import React, { useEffect, useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { fetchBatteryHealth, fetchDegradationTrend } from '@/lib/api';
import { BatteryHealthOverview } from '@/types';
import { DegradationTrendChart } from '@/components/dashboard/DegradationTrendChart';
import { DegradationSummaryCard } from '@/components/dashboard/DegradationSummaryCard';
import { ShieldCheck, BatteryCharging, Zap, ArrowDownRight, Layers } from 'lucide-react';

export default function BatteryHealthPage() {
  const { selectedVehicle, activeScenario, scenarioChangeCount, latestTelemetry } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [health, setHealth] = useState<BatteryHealthOverview | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [period, setPeriod] = useState('6months');
  const [loading, setLoading] = useState(true);

  // Apply latest telemetry immediately if available
  useEffect(() => {
    if (latestTelemetry && Object.keys(latestTelemetry).length > 0) {
      setHealth((prev) => {
        if (!prev) return prev;
        const newSoh = latestTelemetry.soh ?? prev.soh_percentage;
        const origAh = prev.original_capacity_ah || 100.0;
        return {
          ...prev,
          soh_percentage: newSoh,
          current_capacity_ah: Math.round(((newSoh / 100.0) * origAh) * 10) / 10,
          cycle_count: latestTelemetry.cycle_count ?? prev.cycle_count,
          health_score: latestTelemetry.health_score ?? prev.health_score,
          health_status: latestTelemetry.health_status ?? prev.health_status,
          total_impedance: latestTelemetry.total_impedance ?? prev.total_impedance,
        };
      });
    }
  }, [latestTelemetry]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [h, t] = await Promise.all([
          fetchBatteryHealth(vehicleId),
          fetchDegradationTrend(vehicleId, period),
        ]);
        setHealth(h);
        setTrendData(t);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vehicleId, period, activeScenario, scenarioChangeCount]);

  const soh = health?.soh_percentage || 88.4;
  const originalAh = health?.original_capacity_ah || 100.0;
  const currentAh = health?.current_capacity_ah || 88.4;
  const capacityLoss = roundTo1(originalAh - currentAh);
  const cycles = health?.cycle_count || 238;

  function roundTo1(val: number) {
    return Math.round(val * 10) / 10;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            State of Health (SOH) Diagnostics
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-accent-primary/10 text-accent-primary border border-accent-primary/30 font-semibold">
              Capacity Reference
            </span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Electrochemical retention assessment for {selectedVehicle?.name || 'VoltSense Model GT'} ({vehicleId})
          </p>
        </div>
      </div>

      {/* SOH Formula Context Card */}
      <div className="surface-card p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[8px] bg-surface-secondary text-accent-secondary border border-border">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-text-muted font-mono">
              International Standard SOH Measurement Formula
            </h2>
            <div className="font-mono text-sm font-semibold text-primary-text mt-0.5">
              SOH (%) = (Current Measured Capacity / Original Capacity) × 100
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-text-muted border-l border-border pl-5 hidden md:block font-mono space-y-1">
          <div>Measured: <span className="text-primary-text font-bold">{currentAh} Ah</span> / {originalAh} Ah</div>
          <div>Retention: <span className="text-accent-primary font-bold">{soh}% SOH</span></div>
        </div>
      </div>

      {/* 4 Health Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>State of Health (SOH)</span>
            <ShieldCheck className="w-4 h-4 text-accent-primary flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-accent-primary font-mono tabular-nums">
            {soh}%
          </div>
          <div className="text-[11px] text-text-muted">
            Benchmark: ≥ 80.0% retention
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Measured Capacity</span>
            <BatteryCharging className="w-4 h-4 text-accent-secondary flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-primary-text font-mono tabular-nums">
            {currentAh} <span className="text-sm font-normal text-text-muted">Ah</span>
          </div>
          <div className="text-[11px] text-text-muted">
            Original: {originalAh} Ah
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Capacity Loss</span>
            <ArrowDownRight className="w-4 h-4 text-status-warning flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-status-warning font-mono tabular-nums">
            {capacityLoss} <span className="text-sm font-normal text-text-muted">Ah</span>
          </div>
          <div className="text-[11px] text-text-muted">
            Cumulative fade: {roundTo1((capacityLoss / originalAh) * 100)}%
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Completed Cycles</span>
            <Layers className="w-4 h-4 text-text-muted flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-primary-text font-mono tabular-nums">
            {cycles}
          </div>
          <div className="text-[11px] text-text-muted">
            Estimated RUL: 1,650 cycles
          </div>
        </div>
      </div>

      {/* Degradation Chart & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
        <div className="lg:col-span-2">
          <DegradationTrendChart
            data={trendData}
            onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
          />
        </div>
        <div>
          {health?.degradation_summary && (
            <DegradationSummaryCard summary={health.degradation_summary} />
          )}
        </div>
      </div>
    </div>
  );
}
