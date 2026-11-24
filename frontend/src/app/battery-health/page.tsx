'use client';

import React, { useEffect, useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { fetchBatteryHealth, fetchDegradationTrend } from '@/lib/api';
import { BatteryHealthOverview } from '@/types';
import { DegradationTrendChart } from '@/components/dashboard/DegradationTrendChart';
import { DegradationSummaryCard } from '@/components/dashboard/DegradationSummaryCard';
import { ShieldCheck, BatteryCharging, Zap, ArrowDownRight, Layers, CheckCircle2 } from 'lucide-react';

export default function BatteryHealthPage() {
  const { selectedVehicle } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [health, setHealth] = useState<BatteryHealthOverview | null>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [period, setPeriod] = useState('6months');
  const [loading, setLoading] = useState(true);

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
  }, [vehicleId, period]);

  const soh = health?.soh_percentage || 88.4;
  const originalAh = health?.original_capacity_ah || 100.0;
  const currentAh = health?.current_capacity_ah || 88.4;
  const capacityLoss = roundTo1(originalAh - currentAh);
  const cycles = health?.cycle_count || 238;

  function roundTo1(val: number) {
    return Math.round(val * 10) / 10;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F4F7FB] tracking-tight flex items-center gap-2">
          State of Health (SOH) Diagnostics
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#55D889]/20 text-[#55D889] border border-[#55D889]/30">
            Capacity-Based Standard
          </span>
        </h1>
        <p className="text-xs text-[#9BA9BB]">
          Electrochemical retention assessment for {selectedVehicle?.name || 'VoltSense Model GT'} ({vehicleId})
        </p>
      </div>

      {/* SOH Formula Context Card as mandated by Module C */}
      <div className="p-4 rounded-xl bg-[#111B2B] border border-[#263449] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-[#4C9FFF]/10 text-[#4C9FFF]">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#4C9FFF]">
              International Standard SOH Measurement Formula
            </h2>
            <div className="font-mono text-sm font-bold text-[#F4F7FB] mt-0.5">
              SOH (%) = (Current Measured Capacity / Original Capacity) × 100
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-[#9BA9BB] border-l border-[#263449] pl-4 hidden md:block">
          <div>Measured: <b className="text-[#F4F7FB]">{currentAh} Ah</b> / {originalAh} Ah</div>
          <div>Result: <b className="text-[#55D889]">{soh}% SOH</b></div>
        </div>
      </div>

      {/* 4 Health Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9BA9BB]">
            <span>State of Health (SOH)</span>
            <ShieldCheck className="w-4 h-4 text-[#55D889]" />
          </div>
          <div className="text-3xl font-extrabold text-[#55D889] font-mono">
            {soh}%
          </div>
          <div className="text-xs text-[#9BA9BB]">
            Benchmark: &gt;= 80.0% retention
          </div>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9BA9BB]">
            <span>Measured Capacity</span>
            <BatteryCharging className="w-4 h-4 text-[#4C9FFF]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F4F7FB] font-mono">
            {currentAh} <span className="text-lg text-[#9BA9BB]">Ah</span>
          </div>
          <div className="text-xs text-[#9BA9BB]">
            Original: {originalAh} Ah
          </div>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9BA9BB]">
            <span>Capacity Loss</span>
            <ArrowDownRight className="w-4 h-4 text-[#F4C44E]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F4C44E] font-mono">
            {capacityLoss} <span className="text-lg text-[#9BA9BB]">Ah</span>
          </div>
          <div className="text-xs text-[#9BA9BB]">
            Cumulative fade: {roundTo1((capacityLoss / originalAh) * 100)}%
          </div>
        </div>

        <div className="glass-card p-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[#9BA9BB]">
            <span>Completed Cycles</span>
            <Layers className="w-4 h-4 text-[#9BA9BB]" />
          </div>
          <div className="text-3xl font-extrabold text-[#F4F7FB] font-mono">
            {cycles}
          </div>
          <div className="text-xs text-[#9BA9BB]">
            Estimated RUL: 1,650 cycles
          </div>
        </div>
      </div>

      {/* Degradation Chart & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
