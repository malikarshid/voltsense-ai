'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { fetchCells } from '@/lib/api';
import { BatteryCell } from '@/types';
import { BatteryCellCard } from '@/components/monitoring/BatteryCellCard';
import { X, Filter, ArrowUpDown, Cpu, Activity, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function CellsPage() {
  const { selectedVehicle, activeScenario, scenarioChangeCount, latestTelemetry } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [cells, setCells] = useState<BatteryCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<BatteryCell | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('index');
  const [loading, setLoading] = useState(true);

  // Apply latest telemetry immediately if available
  useEffect(() => {
    if (latestTelemetry?.cells && latestTelemetry.cells.length > 0) {
      setCells(latestTelemetry.cells.map((c: any, idx: number) => ({
        id: `sim-cell-${idx + 1}`,
        vehicle_id: vehicleId,
        cell_index: c.cell_index,
        cell_serial: `CEL-8840-${String(idx + 1).padStart(2, '0')}`,
        voltage: c.voltage,
        temperature: c.temperature,
        internal_resistance: c.internal_resistance,
        status: c.status,
        updated_at: new Date().toISOString()
      })));
    }
  }, [latestTelemetry, vehicleId]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchCells(vehicleId);
        setCells(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vehicleId, activeScenario, scenarioChangeCount]);

  const voltages = cells.map((c) => c.voltage);
  const minV = voltages.length ? Math.min(...voltages) : 3.56;
  const maxV = voltages.length ? Math.max(...voltages) : 3.62;
  const diffV = Math.round((maxV - minV) * 1000) / 1000;

  const minCell = cells.find((c) => c.voltage === minV);
  const maxCell = cells.find((c) => c.voltage === maxV);

  const warnings = cells.filter((c) => c.status === 'WARNING').length;
  const healthy = cells.filter((c) => c.status === 'HEALTHY').length;
  const critical = cells.filter((c) => c.status === 'CRITICAL').length;

  // Filtered & Sorted cells
  const processedCells = useMemo(() => {
    let result = [...cells];
    if (filterStatus !== 'ALL') {
      result = result.filter((c) => c.status === filterStatus);
    }
    result.sort((a, b) => {
      if (sortBy === 'voltage_desc') return b.voltage - a.voltage;
      if (sortBy === 'voltage_asc') return a.voltage - b.voltage;
      if (sortBy === 'temp_desc') return b.temperature - a.temperature;
      if (sortBy === 'impedance_desc') return b.internal_resistance - a.internal_resistance;
      return a.cell_index - b.cell_index;
    });
    return result;
  }, [cells, filterStatus, sortBy]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            Cell-Level Diagnostics & Telemetry
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/30 font-semibold">
              10-Cell Matrix
            </span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Sub-module impedance, delta-V imbalance, and individual cell thermal metrics for {selectedVehicle?.name || 'VoltSense Model GT'} ({vehicleId})
          </p>
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-surface-primary p-1 rounded-[6px] border border-border text-xs">
            {['ALL', 'HEALTHY', 'WARNING', 'CRITICAL'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-[4px] font-medium transition-colors ${
                  filterStatus === st
                    ? 'bg-surface-secondary text-accent-primary border border-border font-semibold shadow-xs'
                    : 'text-text-muted hover:text-primary-text'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 bg-surface-primary px-3 py-1.5 rounded-[6px] border border-border text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-primary-text outline-none text-xs cursor-pointer font-medium"
            >
              <option value="index">Channel (1–10)</option>
              <option value="voltage_desc">Voltage: High → Low</option>
              <option value="voltage_asc">Voltage: Low → High</option>
              <option value="temp_desc">Temperature: High → Low</option>
              <option value="impedance_desc">Impedance: High → Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Imbalance & Pack Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="surface-card p-5 sm:p-6 shadow-subtle space-y-1">
          <span className="text-text-secondary font-medium">Min Cell Voltage</span>
          <div className="text-2xl font-bold text-primary-text mt-1 font-mono">{minV.toFixed(3)} V</div>
          <span className="text-[11px] text-text-muted font-mono block">Module C{String(minCell?.cell_index || 1).padStart(2, '0')}</span>
        </div>

        <div className="surface-card p-5 sm:p-6 shadow-subtle space-y-1">
          <span className="text-text-secondary font-medium">Max Cell Voltage</span>
          <div className="text-2xl font-bold text-primary-text mt-1 font-mono">{maxV.toFixed(3)} V</div>
          <span className="text-[11px] text-text-muted font-mono block">Module C{String(maxCell?.cell_index || 2).padStart(2, '0')}</span>
        </div>

        <div className="surface-card p-5 sm:p-6 shadow-subtle space-y-1">
          <span className="text-text-secondary font-medium">Voltage Imbalance (ΔV)</span>
          <div className="text-2xl font-bold text-accent-primary mt-1 font-mono">
            {Math.round(diffV * 1000)} mV
          </div>
          <span className="text-[11px] text-text-muted block">Nominal: &lt; 50 mV</span>
        </div>

        <div className="surface-card p-5 sm:p-6 shadow-subtle space-y-1">
          <span className="text-text-secondary font-medium">Module Cell Balance</span>
          <div className="text-2xl font-bold text-primary-text mt-1 font-mono">
            {healthy} <span className="text-xs font-normal text-text-muted">/ 10 Nominal</span>
          </div>
          <span className="text-[11px] text-accent-primary font-mono block">
            {warnings > 0 ? `${warnings} Warnings` : 'All Cells Balanced'}
          </span>
        </div>
      </div>

      {/* Extreme Cells Comparison Banner */}
      <div className="surface-card p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-[4px] bg-surface-secondary text-accent-secondary">
            <Activity className="w-4 h-4 flex-shrink-0" />
          </div>
          <div>
            <span className="font-semibold text-primary-text">Delta-V Balance Assessment: </span>
            <span className="text-text-secondary">
              Delta is {Math.round(diffV * 1000)} mV between Cell {String(minCell?.cell_index || 1).padStart(2, '0')} and Cell {String(maxCell?.cell_index || 2).padStart(2, '0')}. Passive shunt equalization is active.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono flex-shrink-0">
          <span className="px-2 py-0.5 rounded-[4px] bg-surface-secondary text-primary-text border border-border">
            Min: {minV.toFixed(3)} V
          </span>
          <span className="text-text-muted">↔</span>
          <span className="px-2 py-0.5 rounded-[4px] bg-surface-secondary text-accent-primary border border-border font-bold">
            Max: {maxV.toFixed(3)} V
          </span>
        </div>
      </div>

      {/* Cell Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {processedCells.map((cell) => (
          <BatteryCellCard
            key={cell.cell_index}
            cell={cell}
            onClick={() => setSelectedCell(cell)}
          />
        ))}
      </div>

      {/* Selected Cell Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-primary border border-border rounded-[10px] p-5 max-w-lg w-full space-y-3.5 shadow-elevated">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-base font-semibold text-primary-text">
                  Cell {String(selectedCell.cell_index).padStart(2, '0')} Telemetry Inspection
                </h3>
                <p className="text-xs text-text-muted font-mono">
                  Serial: {selectedCell.cell_serial || `CEL-8840-${selectedCell.cell_index}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 rounded-[4px] hover:bg-surface-secondary text-text-muted hover:text-primary-text transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
                <span className="text-text-muted block text-[10px]">Open Circuit Voltage</span>
                <div className="text-lg font-bold text-primary-text mt-0.5">
                  {selectedCell.voltage.toFixed(3)} V
                </div>
              </div>
              <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
                <span className="text-text-muted block text-[10px]">Internal Resistance</span>
                <div className="text-lg font-bold text-primary-text mt-0.5">
                  {selectedCell.internal_resistance.toFixed(4)} Ω
                </div>
              </div>
              <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
                <span className="text-text-muted block text-[10px]">Core Temperature</span>
                <div className="text-lg font-bold text-accent-primary mt-0.5">
                  {selectedCell.temperature.toFixed(1)} °C
                </div>
              </div>
              <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
                <span className="text-text-muted block text-[10px]">Health Classification</span>
                <div className={`text-base font-bold mt-0.5 uppercase ${
                  selectedCell.status === 'CRITICAL' ? 'text-status-critical' : selectedCell.status === 'WARNING' ? 'text-status-warning' : 'text-accent-primary'
                }`}>
                  {selectedCell.status}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedCell(null)}
              className="btn-standard w-full bg-surface-secondary hover:bg-surface-elevated text-primary-text font-semibold text-xs border border-border shadow-subtle"
            >
              Close Inspection Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
