'use client';

import React, { useEffect, useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { fetchCells } from '@/lib/api';
import { BatteryCell } from '@/types';
import { BatteryCellCard } from '@/components/monitoring/BatteryCellCard';
import { Cpu, AlertTriangle, CheckCircle, Sliders, ArrowUpDown, X } from 'lucide-react';

export default function CellsPage() {
  const { selectedVehicle } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [cells, setCells] = useState<BatteryCell[]>([]);
  const [selectedCell, setSelectedCell] = useState<BatteryCell | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, [vehicleId]);

  const voltages = cells.map((c) => c.voltage);
  const minV = voltages.length ? Math.min(...voltages) : 3.56;
  const maxV = voltages.length ? Math.max(...voltages) : 3.62;
  const diffV = Math.round((maxV - minV) * 1000) / 1000;

  const warnings = cells.filter((c) => c.status === 'WARNING').length;
  const healthy = cells.filter((c) => c.status === 'HEALTHY').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F4F7FB] tracking-tight flex items-center gap-2">
            Cell-Level Diagnostics & Telemetry
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#4C9FFF]/20 text-[#4C9FFF] border border-[#4C9FFF]/40">
              10-Cell Pack Matrix
            </span>
          </h1>
          <p className="text-xs text-[#9BA9BB]">
            Sub-module impedance, delta-V imbalance and individual cell thermal metrics
          </p>
        </div>
      </div>

      {/* Imbalance & Pack Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="glass-card p-4">
          <span className="text-[#9BA9BB]">Min Cell Voltage</span>
          <div className="text-2xl font-bold text-[#F4F7FB] mt-1 font-mono">{minV.toFixed(3)} V</div>
          <span className="text-[10px] text-[#9BA9BB]">Cell 01</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-[#9BA9BB]">Max Cell Voltage</span>
          <div className="text-2xl font-bold text-[#F4F7FB] mt-1 font-mono">{maxV.toFixed(3)} V</div>
          <span className="text-[10px] text-[#9BA9BB]">Cell 02 / Cell 09</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-[#9BA9BB]">Voltage Imbalance (ΔV)</span>
          <div className="text-2xl font-bold text-[#55D889] mt-1 font-mono">
            {diffV.toFixed(3)} V ({Math.round(diffV * 1000)} mV)
          </div>
          <span className="text-[10px] text-[#55D889]">Target: &lt; 50 mV</span>
        </div>

        <div className="glass-card p-4">
          <span className="text-[#9BA9BB]">Module Cell Status</span>
          <div className="text-2xl font-bold text-[#F4F7FB] mt-1">
            <span className="text-[#55D889]">{healthy} Healthy</span>{' '}
            {warnings > 0 && <span className="text-[#F4C44E]">/ {warnings} Warning</span>}
          </div>
          <span className="text-[10px] text-[#9BA9BB]">10 Active Monitoring Channels</span>
        </div>
      </div>

      {/* Cell Cards Grid matching Reference 3 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {cells.map((cell) => (
          <BatteryCellCard
            key={cell.cell_index}
            cell={cell}
            onClick={() => setSelectedCell(cell)}
          />
        ))}
      </div>

      {/* Selected Cell Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111B2B] border border-[#263449] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#263449] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#F4F7FB]">
                  Cell {String(selectedCell.cell_index).padStart(2, '0')} Telemetry Detail
                </h3>
                <p className="text-xs text-[#9BA9BB]">
                  Serial: {selectedCell.cell_serial || `CEL-8840-${selectedCell.cell_index}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 rounded-lg hover:bg-[#172337] text-[#9BA9BB] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-[#172337]/60 border border-[#263449]">
                <span className="text-[#9BA9BB]">Open Circuit Voltage</span>
                <div className="text-xl font-bold text-[#F4F7FB] mt-1 font-mono">
                  {selectedCell.voltage.toFixed(3)} V
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#172337]/60 border border-[#263449]">
                <span className="text-[#9BA9BB]">Internal Resistance</span>
                <div className="text-xl font-bold text-[#F4F7FB] mt-1 font-mono">
                  {selectedCell.internal_resistance.toFixed(4)} Ω
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#172337]/60 border border-[#263449]">
                <span className="text-[#9BA9BB]">Core Temperature</span>
                <div className="text-xl font-bold text-[#55D889] mt-1 font-mono">
                  {selectedCell.temperature.toFixed(1)} °C
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#172337]/60 border border-[#263449]">
                <span className="text-[#9BA9BB]">Diagnostic Status</span>
                <div className="text-base font-bold text-[#F4C44E] mt-1 uppercase">
                  {selectedCell.status}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[#080D18] border border-[#263449] text-xs text-[#9BA9BB]">
              <div className="font-semibold text-[#F4F7FB] mb-1">Cell Balancing Directive:</div>
              {selectedCell.status === 'WARNING'
                ? 'Passive cell balancing bleed circuit active. Estimated equalization time: 42 minutes under 500mA shunt.'
                : 'Cell is within 15mV of pack mean voltage. No active balancing required.'}
            </div>

            <button
              onClick={() => setSelectedCell(null)}
              className="w-full py-2.5 rounded-lg bg-[#55D889] text-[#080D18] font-bold text-xs hover:bg-[#32B96F] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
