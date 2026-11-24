'use client';

import React, { useEffect, useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import {
  fetchBatteryHealth,
  fetchDegradationTrend,
  fetchTemperatureTrend,
  getDownloadReportUrl,
  getWebSocketMonitoringUrl,
} from '@/lib/api';
import { BatteryHealthOverview } from '@/types';
import { SocRingGauge } from '@/components/dashboard/SocRingGauge';
import { HealthScoreCard } from '@/components/dashboard/HealthScoreCard';
import { CycleCountCard, CapacityCard } from '@/components/dashboard/MetricCards';
import { DegradationTrendChart } from '@/components/dashboard/DegradationTrendChart';
import { DegradationSummaryCard } from '@/components/dashboard/DegradationSummaryCard';
import { TemperatureTrendChart } from '@/components/dashboard/TemperatureTrendChart';
import { CellVoltageOverview } from '@/components/dashboard/CellVoltageOverview';
import { Info, Download, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { selectedVehicle } = useVehicle();
  const [healthData, setHealthData] = useState<BatteryHealthOverview | null>(null);
  const [degradationData, setDegradationData] = useState<any[]>([]);
  const [tempData, setTempData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  // Fetch initial telemetry & trends
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

    // WebSocket real-time subscription for live SOC and Cell updates
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getWebSocketMonitoringUrl(vehicleId));
      ws.onmessage = (event) => {
        try {
          const telemetry = JSON.parse(event.data);
          setHealthData((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              soc_percentage: telemetry.soc,
              pack_voltage: telemetry.pack_voltage,
              avg_temperature: telemetry.avg_temperature,
              total_impedance: telemetry.total_impedance,
              min_cell_voltage: telemetry.min_cell_voltage,
              max_cell_voltage: telemetry.max_cell_voltage,
              voltage_diff: telemetry.voltage_diff,
              cells: telemetry.cells || prev.cells,
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
  }, [vehicleId]);

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
          <div className="w-10 h-10 border-4 border-[#263449] border-t-[#55D889] rounded-full animate-spin" />
          <span className="text-sm text-[#9BA9BB]">Connecting to CAN-BMS Telemetry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Page Title & Vehicle Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F4F7FB] tracking-tight">
            Battery Health Overview
          </h1>
          <p className="text-xs text-[#9BA9BB] mt-0.5">
            Diagnostic analytics for {selectedVehicle?.name || 'VoltSense Model GT'} ({vehicleId})
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={getDownloadReportUrl(vehicleId)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172337] hover:bg-[#55D889] hover:text-[#080D18] text-xs font-semibold text-[#55D889] border border-[#55D889]/30 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Download Report (PDF)</span>
          </a>
        </div>
      </div>

      {/* Row 1: 4 Key Metric Cards (Matching Reference 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SocRingGauge
          soc={healthData?.soc_percentage || 67}
          estimatedRangeKm={healthData?.estimated_range_km || 48}
        />
        <HealthScoreCard
          score={healthData?.health_score || 86}
          status={healthData?.health_status || 'Good'}
        />
        <CycleCountCard
          cycleCount={healthData?.cycle_count || 238}
          designCapacityAh={healthData?.design_capacity_ah || 105}
        />
        <CapacityCard
          currentCapacityAh={healthData?.current_capacity_ah || 88.4}
          originalCapacityAh={healthData?.original_capacity_ah || 100}
        />
      </div>

      {/* Row 2: Degradation Trend & Summary (Matching Reference 1) */}
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

      {/* Row 3: Temperature Trend & Cell Voltage Overview (Matching Reference 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <TemperatureTrendChart data={tempData} />
        </div>
        <div>
          <CellVoltageOverview
            cells={healthData?.cells || []}
            minVoltage={healthData?.min_cell_voltage || 3.56}
            maxVoltage={healthData?.max_cell_voltage || 3.62}
            voltageDiff={healthData?.voltage_diff || 0.06}
          />
        </div>
      </div>

      {/* Row 4: Bottom Notification & Action Banner (Matching Reference 1) */}
      <div className="p-4 rounded-xl bg-[#111B2B] border border-[#263449] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#55D889]/10 text-[#55D889] flex-shrink-0">
            <Info className="w-5 h-5" />
          </div>
          <span className="text-xs text-[#9BA9BB] leading-relaxed">
            Battery health is good. Continue regular usage and avoid deep discharges to maintain optimal performance.
          </span>
        </div>
        <a
          href={getDownloadReportUrl(vehicleId)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg bg-[#172337] hover:bg-[#55D889] hover:text-[#080D18] text-xs font-semibold text-[#55D889] border border-[#55D889]/30 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download Report</span>
        </a>
      </div>
    </div>
  );
}
