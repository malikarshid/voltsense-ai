'use client';

import React, { useEffect, useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { useTheme } from '@/context/ThemeContext';
import { fetchAnalytics } from '@/lib/api';
import { Download, FileSpreadsheet, Activity, Zap, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AnalyticsPage() {
  const { selectedVehicle } = useVehicle();
  const { colors } = useTheme();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchAnalytics(vehicleId);
        setAnalytics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vehicleId]);

  const stateData = [
    { name: 'Driving / Load', value: analytics?.state_distribution?.driving ?? 22.4, color: colors.accentSecondary },
    { name: 'DC Fast Charging', value: analytics?.state_distribution?.charging ?? 14.8, color: colors.accentPrimary },
    { name: 'Standby / Parked', value: analytics?.state_distribution?.idle ?? 62.8, color: colors.textMuted },
  ];

  const handleExportCsv = () => {
    const rows = [
      ['Metric', 'Value', 'Unit'],
      ['Asset VIN', vehicleId, ''],
      ['Export Timestamp', new Date().toISOString(), 'UTC'],
      ['Total Energy Throughput', '14280', 'kWh'],
      ['Average Consumption', '15.6', 'kWh/100km'],
      ['Regenerative Recovery', '18.4', '%'],
      ['BMS Equalization Index', '94.2', '/100'],
      [],
      ['Operating State', 'Share (%)'],
      ['Driving / Load', (analytics?.state_distribution?.driving ?? 22.4).toString()],
      ['DC Fast Charging', (analytics?.state_distribution?.charging ?? 14.8).toString()],
      ['Standby / Parked', (analytics?.state_distribution?.idle ?? 62.8).toString()],
      [],
      ['Thermal Exposure Bracket', 'Percentage (%)'],
      ...(analytics?.temperature_distribution || [
        { range: '<15°C', percentage: 8.5 },
        { range: '15-25°C', percentage: 46.2 },
        { range: '25-35°C', percentage: 35.8 },
        { range: '35-45°C', percentage: 8.1 },
        { range: '>45°C', percentage: 1.4 },
      ]).map((t: any) => [t.range, t.percentage.toString()]),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `voltsense_analytics_${vehicleId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            Fleet Analytics & Historical Performance
          </h1>
          <p className="text-xs text-text-muted">
            Energy throughput, thermal exposure histograms, and charge cycle distribution for {vehicleId}
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="btn-standard bg-surface-primary hover:bg-surface-secondary text-primary-text border border-border hover:border-accent-primary shadow-subtle"
        >
          <FileSpreadsheet className="w-4 h-4 text-accent-primary" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-5 sm:p-6 space-y-1.5">
          <span className="text-xs text-text-secondary font-medium">Total Energy Throughput</span>
          <div className="text-2xl font-bold text-primary-text font-mono tabular-nums">
            14,280 <span className="text-xs font-normal text-text-muted">kWh</span>
          </div>
          <span className="text-[11px] text-accent-primary font-mono block">≈ 91,500 km</span>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5">
          <span className="text-xs text-text-secondary font-medium">Average Consumption</span>
          <div className="text-2xl font-bold text-accent-secondary font-mono tabular-nums">
            15.6 <span className="text-xs font-normal text-text-muted">kWh/100km</span>
          </div>
          <span className="text-[11px] text-text-muted block">High Efficiency Tier</span>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5">
          <span className="text-xs text-text-secondary font-medium">Regenerative Recovery</span>
          <div className="text-2xl font-bold text-accent-primary font-mono tabular-nums">
            18.4%
          </div>
          <span className="text-[11px] text-text-muted block">Kinetic recapture</span>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5">
          <span className="text-xs text-text-secondary font-medium">Balancing Efficiency</span>
          <div className="text-2xl font-bold text-status-warning font-mono tabular-nums">
            94.2 / 100
          </div>
          <span className="text-[11px] text-text-muted block">BMS Equalization</span>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thermal Histogram */}
        <div className="surface-card p-5 sm:p-6 space-y-4">
          <div className="border-b border-border pb-2.5">
            <h3 className="text-sm font-semibold text-primary-text">
              Lifetime Thermal Exposure Distribution
            </h3>
            <p className="text-xs text-text-muted">Cumulative percentage of operation across temperature brackets</p>
          </div>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.temperature_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke={colors.gridColor} vertical={false} />
                <XAxis dataKey="range" stroke={colors.textMuted} fontSize={11} />
                <YAxis stroke={colors.textMuted} fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderColor,
                    borderRadius: 6,
                    fontSize: 12,
                    color: colors.textPrimary,
                  }}
                />
                <Bar dataKey="percentage" fill={colors.accentPrimary} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating State Pie Chart */}
        <div className="surface-card p-5 sm:p-6 space-y-4">
          <div className="border-b border-border pb-2.5">
            <h3 className="text-sm font-semibold text-primary-text">
              Vehicle Operating State Distribution
            </h3>
            <p className="text-xs text-text-muted">Time proportion spent driving, charging, or in standby</p>
          </div>
          <div className="w-full h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke={colors.borderColor} strokeWidth={1} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: colors.bgSurface,
                    borderColor: colors.borderColor,
                    borderRadius: 6,
                    fontSize: 12,
                    color: colors.textPrimary,
                  }}
                  formatter={(value: any) => [`${value}%`, 'Proportion']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 text-xs font-mono">
            {stateData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: s.color }} />
                <span className="text-text-secondary">{s.name}: {s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
