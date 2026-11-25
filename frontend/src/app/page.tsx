'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import {
  fetchBatteryHealth,
  fetchDegradationTrend,
  fetchTemperatureTrend,
  getDownloadReportUrl,
  getWebSocketMonitoringUrl,
} from '@/lib/api';
import { BatteryHealthOverview } from '@/types';
import { SimulationStatusPanel } from '@/components/dashboard/SimulationStatusPanel';
import { SocRingGauge } from '@/components/dashboard/SocRingGauge';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import {
  SohMetricCard,
  PackVoltageCard,
  AvgTempCard,
  RangeMetricCard,
  CycleCountCard,
  CapacityCard,
} from '@/components/dashboard/MetricCards';
import { DegradationTrendChart } from '@/components/dashboard/DegradationTrendChart';
import { DegradationSummaryCard } from '@/components/dashboard/DegradationSummaryCard';
import { TemperatureTrendChart } from '@/components/dashboard/TemperatureTrendChart';
import { SocHistoryChart } from '@/components/dashboard/SocHistoryChart';
import { CellVoltageOverview } from '@/components/dashboard/CellVoltageOverview';
import { Info, Download, Activity, CheckCircle2, AlertTriangle, Zap, Flame, Scale, Clock } from 'lucide-react';

const roundNum = (val: number, decimals: number) => Number(val.toFixed(decimals));

export default function DashboardPage() {
  const { selectedVehicle, activeScenario, scenarioChangeCount, latestTelemetry } = useVehicle();
  const [healthData, setHealthData] = useState<BatteryHealthOverview | null>(null);
  const [degradationData, setDegradationData] = useState<any[]>([]);
  const [tempData, setTempData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const latestSeqRef = useRef<number>(0);

  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';
  const isCyberSuv = vehicleId.includes('Cyber') || vehicleId.includes('HWGHL') || (selectedVehicle?.nominal_voltage ?? 0) > 100;

  // Apply latest telemetry immediately if received from scenario activation
  useEffect(() => {
    if (latestTelemetry && Object.keys(latestTelemetry).length > 0) {
      if (latestTelemetry.seq_id) {
        latestSeqRef.current = Math.max(latestSeqRef.current, latestTelemetry.seq_id);
      }
      setHealthData((prev) => {
        if (!prev) return prev;
        const newSoh = latestTelemetry.soh ?? prev.soh_percentage;
        const origAh = prev.original_capacity_ah || (isCyberSuv ? 100.0 : 100.0);
        return {
          ...prev,
          soc_percentage: latestTelemetry.soc ?? prev.soc_percentage,
          soh_percentage: newSoh,
          health_score: latestTelemetry.health_score ?? (newSoh ? Math.round(newSoh * 0.97) : prev.health_score),
          health_status: latestTelemetry.health_status ?? (newSoh >= 80 ? 'Good' : newSoh >= 70 ? 'Fair' : 'Degraded'),
          estimated_range_km: latestTelemetry.range_km ?? prev.estimated_range_km,
          pack_voltage: latestTelemetry.pack_voltage ?? prev.pack_voltage,
          pack_current: latestTelemetry.pack_current ?? prev.pack_current,
          power_kw: latestTelemetry.power_kw ?? prev.power_kw,
          avg_temperature: latestTelemetry.avg_temperature ?? prev.avg_temperature,
          total_impedance: latestTelemetry.total_impedance ?? prev.total_impedance,
          current_capacity_ah: roundNum((newSoh / 100.0) * origAh, 1),
          min_cell_voltage: latestTelemetry.min_cell_voltage ?? prev.min_cell_voltage,
          max_cell_voltage: latestTelemetry.max_cell_voltage ?? prev.max_cell_voltage,
          voltage_diff: latestTelemetry.voltage_diff ?? prev.voltage_diff,
          cells: latestTelemetry.cells || prev.cells,
          cycle_count: latestTelemetry.cycle_count ?? prev.cycle_count,
        };
      });
    }
  }, [latestTelemetry, isCyberSuv]);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [health, deg, temp] = await Promise.all([
          fetchBatteryHealth(vehicleId),
          fetchDegradationTrend(vehicleId, '6months'),
          fetchTemperatureTrend(vehicleId),
        ]);
        if (isMounted) {
          setHealthData(health);
          setDegradationData(deg);
          setTempData(temp);
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getWebSocketMonitoringUrl(vehicleId));
      ws.onmessage = (event) => {
        try {
          const telemetry = JSON.parse(event.data);
          if (telemetry.seq_id) {
            latestSeqRef.current = Math.max(latestSeqRef.current, telemetry.seq_id);
          }
          setHealthData((prev) => {
            if (!prev) return prev;
            const newSoh = telemetry.soh ?? prev.soh_percentage;
            const origAh = prev.original_capacity_ah || (isCyberSuv ? 100.0 : 100.0);
            return {
              ...prev,
              soc_percentage: telemetry.soc ?? prev.soc_percentage,
              soh_percentage: newSoh,
              health_score: telemetry.health_score ?? (newSoh ? Math.round(newSoh * 0.97) : prev.health_score),
              health_status: telemetry.health_status ?? (newSoh >= 80 ? 'Good' : newSoh >= 70 ? 'Fair' : 'Degraded'),
              estimated_range_km: telemetry.range_km ?? prev.estimated_range_km,
              pack_voltage: telemetry.pack_voltage ?? prev.pack_voltage,
              pack_current: telemetry.pack_current ?? prev.pack_current,
              power_kw: telemetry.power_kw ?? prev.power_kw,
              avg_temperature: telemetry.avg_temperature ?? prev.avg_temperature,
              total_impedance: telemetry.total_impedance ?? prev.total_impedance,
              current_capacity_ah: roundNum((newSoh / 100.0) * origAh, 1),
              min_cell_voltage: telemetry.min_cell_voltage ?? prev.min_cell_voltage,
              max_cell_voltage: telemetry.max_cell_voltage ?? prev.max_cell_voltage,
              voltage_diff: telemetry.voltage_diff ?? prev.voltage_diff,
              cells: telemetry.cells || prev.cells,
              cycle_count: telemetry.cycle_count ?? prev.cycle_count,
            };
          });
        } catch (e) {
          console.error('Error parsing live WS telemetry:', e);
        }
      };
    } catch (wsErr) {
      console.warn('WebSocket connection error:', wsErr);
    }

    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, [vehicleId, activeScenario, scenarioChangeCount, isCyberSuv]);

  const handlePeriodChange = async (period: string) => {
    try {
      const data = await fetchDegradationTrend(vehicleId, period);
      setDegradationData(data);
    } catch (e) {
      console.error('Error updating degradation period:', e);
    }
  };

  if (loading && !healthData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-border border-t-accent-primary rounded-full animate-spin" />
          <span className="text-xs text-text-muted font-mono">Syncing CAN-BMS Telemetry Bus...</span>
        </div>
      </div>
    );
  }

  // Calculate SOH percentage if not directly provided
  const sohVal =
    healthData?.soh_percentage ??
    latestTelemetry?.soh ??
    (healthData?.current_capacity_ah && healthData?.original_capacity_ah
      ? (healthData.current_capacity_ah / healthData.original_capacity_ah) * 100
      : 88.4);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Page Title & Vehicle Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-primary-text tracking-tight">
              Battery Health & Fleet Telemetry
            </h1>
            <span className="px-2 py-0.5 rounded-[4px] bg-accent-primary/10 text-accent-primary border border-accent-primary/20 text-xs font-semibold">
              Live CAN-Bus
            </span>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] border text-xs font-mono font-medium ${
              activeScenario === 'high_temp' || activeScenario === 'cell_imbalance'
                ? 'bg-status-critical/10 text-status-critical border-status-critical/30'
                : activeScenario === 'charging'
                ? 'bg-status-info/10 text-status-info border-status-info/30'
                : activeScenario === 'aging'
                ? 'bg-status-warning/10 text-status-warning border-status-warning/30'
                : 'bg-surface-secondary text-primary-text border-border'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                activeScenario === 'high_temp' || activeScenario === 'cell_imbalance'
                  ? 'bg-status-critical animate-ping'
                  : activeScenario === 'charging'
                  ? 'bg-status-info animate-pulse'
                  : 'bg-accent-primary'
              }`} />
              <span className="uppercase text-[11px]">{activeScenario.replace('_', ' ')} SCENARIO</span>
            </div>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Diagnostic analytics for {selectedVehicle?.name || 'VoltSense Model GT'} ({vehicleId}) &bull; Chemistry: {selectedVehicle?.battery_chemistry || 'NMC-811'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={getDownloadReportUrl(vehicleId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-standard bg-surface-primary hover:bg-surface-secondary text-primary-text border border-border hover:border-accent-primary shadow-subtle"
          >
            <Download className="w-4 h-4 text-accent-primary" />
            <span>Download Engineering Report</span>
          </a>
        </div>
      </div>

      {/* Real-time Authoritative Simulation Status Panel */}
      <SimulationStatusPanel telemetry={latestTelemetry || healthData} />

      {/* Row 1: 8 Primary Engineering Metric Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted font-mono">
            Key Telemetry Indices (8 Core Parameters)
          </h2>
          <span className="text-[11px] text-text-muted">Updated real-time via WebSocket</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. SOC */}
          <SocRingGauge
            soc={healthData?.soc_percentage ?? latestTelemetry?.soc ?? 67}
            estimatedRangeKm={healthData?.estimated_range_km ?? latestTelemetry?.range_km ?? (isCyberSuv ? 280 : 48)}
          />

          {/* 2. SOH */}
          <SohMetricCard soh={sohVal} />

          {/* 3. Battery Health Score */}
          <HealthScoreCard
            score={healthData?.health_score ?? latestTelemetry?.health_score ?? 86}
            status={healthData?.health_status ?? latestTelemetry?.health_status ?? 'Good'}
          />

          {/* 4. Total Voltage */}
          <PackVoltageCard
            voltage={healthData?.pack_voltage ?? latestTelemetry?.pack_voltage ?? (isCyberSuv ? 392.0 : 35.5)}
            cellDiff={healthData?.voltage_diff ?? latestTelemetry?.voltage_diff ?? 0.04}
          />

          {/* 5. Avg Temperature */}
          <AvgTempCard temp={healthData?.avg_temperature ?? latestTelemetry?.avg_temperature ?? 24.0} />

          {/* 6. Total Cycle Count */}
          <CycleCountCard
            cycleCount={healthData?.cycle_count ?? latestTelemetry?.cycle_count ?? 238}
            designCapacityAh={healthData?.design_capacity_ah ?? 105}
          />

          {/* 7. Remaining Capacity */}
          <CapacityCard
            currentCapacityAh={healthData?.current_capacity_ah ?? (isCyberSuv ? 92.0 : 88.4)}
            originalCapacityAh={healthData?.original_capacity_ah ?? 100}
          />

          {/* 8. Est Driving Range */}
          <RangeMetricCard rangeKm={healthData?.estimated_range_km ?? latestTelemetry?.range_km ?? (isCyberSuv ? 280 : 48)} />
        </div>
      </div>

      {/* Row 2: Degradation Trend Chart & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DegradationTrendChart
            data={degradationData}
            onPeriodChange={handlePeriodChange}
          />
        </div>
        <div>
          {healthData?.degradation_summary && (
            <DegradationSummaryCard summary={healthData.degradation_summary} />
          )}
        </div>
      </div>

      {/* Row 3: SOC History Profile & Temperature Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <SocHistoryChart currentSoc={healthData?.soc_percentage ?? latestTelemetry?.soc ?? 67} />
        </div>
        <div>
          <TemperatureTrendChart data={tempData} />
        </div>
      </div>

      {/* Row 4: Cell Voltage Overview & Imbalance Bar Chart */}
      <div>
        <CellVoltageOverview
          cells={healthData?.cells || latestTelemetry?.cells || []}
          minVoltage={healthData?.min_cell_voltage ?? latestTelemetry?.min_cell_voltage ?? (isCyberSuv ? 3.90 : 3.56)}
          maxVoltage={healthData?.max_cell_voltage ?? latestTelemetry?.max_cell_voltage ?? (isCyberSuv ? 3.95 : 3.62)}
          voltageDiff={healthData?.voltage_diff ?? latestTelemetry?.voltage_diff ?? 0.04}
        />
      </div>

      {/* Row 5: Bottom Engineering Status & Action Banner */}
      <div className={`p-4 sm:p-5 rounded-[10px] bg-surface-primary border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shadow-subtle ${
        activeScenario === 'high_temp' || activeScenario === 'cell_imbalance'
          ? 'border-status-critical/40'
          : activeScenario === 'aging'
          ? 'border-status-warning/40'
          : 'border-border'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-[6px] flex-shrink-0 ${
            activeScenario === 'high_temp'
              ? 'bg-status-critical/10 text-status-critical'
              : activeScenario === 'cell_imbalance'
              ? 'bg-status-critical/10 text-status-critical'
              : activeScenario === 'charging'
              ? 'bg-status-info/10 text-status-info'
              : activeScenario === 'aging'
              ? 'bg-status-warning/10 text-status-warning'
              : 'bg-accent-primary/10 text-accent-primary'
          }`}>
            {activeScenario === 'high_temp' ? (
              <Flame className="w-5 h-5" />
            ) : activeScenario === 'cell_imbalance' ? (
              <Scale className="w-5 h-5" />
            ) : activeScenario === 'charging' ? (
              <Zap className="w-5 h-5" />
            ) : activeScenario === 'aging' ? (
              <Clock className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="font-semibold text-primary-text text-sm">
              {activeScenario === 'high_temp' && 'THERMAL STRESS DETECTED: Critical Pack Heat (>54°C)'}
              {activeScenario === 'cell_imbalance' && 'CELL IMBALANCE DETECTED: Delta-V Spread > 500 mV'}
              {activeScenario === 'charging' && 'DC FAST CHARGING ACTIVE: 150kW CCS2 Protocol Active (+75A)'}
              {activeScenario === 'discharging' && 'HIGH DYNAMIC LOAD: Peak Acceleration Demand (-58A)'}
              {activeScenario === 'aging' && 'ACCELERATED ASSET DEGRADATION: 840 Cycles / 74.2% SOH'}
              {activeScenario === 'normal' && 'Battery System Status: Nominal Operational Envelope'}
            </div>
            <div className="text-text-secondary text-xs mt-0.5">
              {activeScenario === 'high_temp' && 'Pack average thermal reading elevated. Cell C01 reaches 57.4°C. Active auxiliary chiller circuits engaged.'}
              {activeScenario === 'cell_imbalance' && 'Cell C01 voltage depressed to 3.10V against 3.62V baseline. Equalization shunt resistors recommended.'}
              {activeScenario === 'charging' && 'High-power CCS2 DC charge protocol engaged. Pack voltage rising toward 38.4V with controlled warming.'}
              {activeScenario === 'discharging' && 'Heavy current discharge active. Voltage sag observed at 32.6V. Monitor thermal progression.'}
              {activeScenario === 'aging' && 'Asset shows significant cycle history. Total capacity retention at 74.2 Ah with elevated 0.165Ω impedance.'}
              {activeScenario === 'normal' && 'All 10 battery modules C01–C10 are balanced within ΔV ≤ 40 mV. Maintain 20%–80% SOC window to maximize cycle retention.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <a
            href={getDownloadReportUrl(vehicleId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-standard bg-surface-secondary hover:bg-surface-elevated text-primary-text border border-border"
          >
            <Download className="w-4 h-4 text-accent-primary" />
            <span>Export Technical Report (PDF)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
