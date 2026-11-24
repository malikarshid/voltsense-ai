'use client';

import React, { useEffect, useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import {
  fetchTelemetryLatest,
  fetchTelemetryHistory,
  getWebSocketMonitoringUrl,
} from '@/lib/api';
import { AnalogRadialGauge } from '@/components/monitoring/AnalogRadialGauge';
import { BatteryCellCard } from '@/components/monitoring/BatteryCellCard';
import { RealtimeSensorChart } from '@/components/monitoring/RealtimeSensorChart';
import { BatteryCell } from '@/types';
import {
  Activity,
  Layers,
  Radio,
  Clock,
  Server,
  MessageSquare,
  AlertTriangle,
  Wrench,
  X,
} from 'lucide-react';

export default function LiveMonitoringPage() {
  const { selectedVehicle } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [telemetry, setTelemetry] = useState<any>({
    pack_voltage: 34.9,
    avg_temperature: 23.6,
    total_impedance: 0.1085,
    cells: [],
    data_server_status: 'OK',
    message_queue_status: 'OK',
    warnings_count: 1,
    alarms_count: 0,
  });

  const [history, setHistory] = useState<any[]>([]);
  const [selectedCell, setSelectedCell] = useState<BatteryCell | null>(null);
  const [lastSeenTime, setLastSeenTime] = useState<string>('a few seconds ago');

  useEffect(() => {
    let isMounted = true;

    // Load initial
    Promise.all([fetchTelemetryLatest(vehicleId), fetchTelemetryHistory(vehicleId)])
      .then(([latest, hist]) => {
        if (!isMounted) return;
        setTelemetry(latest);
        setHistory(hist.length > 0 ? hist : [
          { time: '15:20', voltage: 34.9, temperature: 23.6, impedance: 0.1085 },
          { time: '15:25', voltage: 35.1, temperature: 23.7, impedance: 0.1084 },
          { time: '15:30', voltage: 34.9, temperature: 23.6, impedance: 0.1085 },
        ]);
      })
      .catch((e) => console.error('Error fetching live telemetry:', e));

    // Connect to WebSocket stream
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getWebSocketMonitoringUrl(vehicleId));
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (!isMounted) return;
          setTelemetry(data);
          setLastSeenTime('just now');
          setHistory((prev) => {
            const next = [...prev, {
              time: new Date().toLocaleTimeString('en-US', { hour12: false }),
              voltage: data.pack_voltage,
              temperature: data.avg_temperature,
              impedance: data.total_impedance,
            }];
            if (next.length > 40) next.shift();
            return next;
          });
        } catch (err) {
          console.error('Error parsing live WS:', err);
        }
      };
    } catch (wsErr) {
      console.warn('Live monitoring WS error:', wsErr);
    }

    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, [vehicleId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header matching Reference 3: "Battery Box" */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#55D889]/10 text-[#55D889] border border-[#55D889]/30">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#F4F7FB] tracking-tight flex items-center gap-2">
              Battery Box
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#172337] text-[#55D889] border border-[#263449]">
                Live Module Rack
              </span>
            </h1>
            <p className="text-xs text-[#9BA9BB]">
              Industrial Battery Monitoring System • Pack ID: {vehicleId}
            </p>
          </div>
        </div>

        {/* Live heartbeat indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111B2B] border border-[#263449] text-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-[#55D889] animate-ping" />
          <span className="text-[#9BA9BB]">Seen: </span>
          <span className="text-[#F4F7FB] font-semibold">{lastSeenTime}</span>
        </div>
      </div>

      {/* Main Grid: Left 2/3 (Gauges + Cells) and Right 1/3 (Strip Charts) matching Reference 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: 3 Gauges + 10 Cell Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top 3 Analog Radial Gauges matching Reference 3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AnalogRadialGauge
              title="Total Voltage"
              value={telemetry.pack_voltage || 34.9}
              unit="V"
              min={20}
              max={50}
              warningThreshold={42}
              criticalThreshold={45}
              formatDecimals={1}
            />
            <AnalogRadialGauge
              title="Avg Temperature"
              value={telemetry.avg_temperature || 23.6}
              unit="°C"
              min={0}
              max={80}
              warningThreshold={45}
              criticalThreshold={60}
              formatDecimals={1}
            />
            <AnalogRadialGauge
              title="Total Impedance"
              value={telemetry.total_impedance || 0.1085}
              unit="Ω"
              min={0.0}
              max={0.3}
              warningThreshold={0.15}
              criticalThreshold={0.2}
              formatDecimals={4}
            />
          </div>

          {/* Cell Cards Grid matching Reference 3 */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-[#F4F7FB]">
                  Individual Battery Cells
                </h3>
                <p className="text-xs text-[#9BA9BB]">Click any cell to inspect detailed impedance and thermal telemetry</p>
              </div>
              <span className="text-xs text-[#9BA9BB]">
                Total: {telemetry.cells?.length || 10} Cells
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-4">
              {(telemetry.cells || []).map((cell: BatteryCell) => (
                <BatteryCellCard
                  key={cell.cell_index}
                  cell={cell}
                  onClick={() => setSelectedCell(cell)}
                />
              ))}
            </div>
          </div>

          {/* System Communication & Alarm Status Footer matching Reference 3 bottom-left */}
          <div className="glass-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-[#172337]/50 border border-[#263449]">
              <span className="text-[#9BA9BB]">Data Server</span>
              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-[#55D889]/20 text-[#55D889] border border-[#55D889]/40">
                {telemetry.data_server_status || 'OK'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#172337]/50 border border-[#263449]">
              <span className="text-[#9BA9BB]">Message Queue</span>
              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-[#55D889]/20 text-[#55D889] border border-[#55D889]/40">
                {telemetry.message_queue_status || 'OK'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#172337]/50 border border-[#263449]">
              <span className="text-[#9BA9BB]">Current Warnings</span>
              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-[#F4C44E]/20 text-[#F4C44E] border border-[#F4C44E]/40">
                {telemetry.warnings_count ?? 1}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-[#172337]/50 border border-[#263449]">
              <span className="text-[#9BA9BB]">Current Alarms</span>
              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-[#EF6262]/20 text-[#EF6262] border border-[#EF6262]/40">
                {telemetry.alarms_count ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Strip Charts matching Reference 3 */}
        <div className="space-y-4">
          <div className="glass-card p-3 flex items-center justify-between text-xs text-[#9BA9BB]">
            <div className="flex items-center gap-1.5 font-semibold text-[#F4F7FB]">
              <Clock className="w-4 h-4 text-[#55D889]" />
              <span>01 — Last 1 hour</span>
            </div>
            <span className="text-[10px]">Rolling 1-Sec Telemetry</span>
          </div>

          <RealtimeSensorChart
            title="Voltage (V)"
            dataKey="voltage"
            unit="V"
            data={history}
            minThreshold={32.0}
            maxThreshold={42.0}
            strokeColor="#4C9FFF"
            yDomain={[25, 48]}
          />

          <RealtimeSensorChart
            title="Temperature (°C)"
            dataKey="temperature"
            unit="°C"
            data={history}
            minThreshold={15.0}
            maxThreshold={45.0}
            strokeColor="#55D889"
            yDomain={[10, 60]}
          />

          <RealtimeSensorChart
            title="Impedance (Ω)"
            dataKey="impedance"
            unit="Ω"
            data={history}
            maxThreshold={0.1500}
            strokeColor="#F4C44E"
            yDomain={[0.0, 0.2]}
          />
        </div>
      </div>

      {/* Cell Detailed Inspection Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111B2B] border border-[#263449] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#263449] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#F4F7FB]">
                  Cell {String(selectedCell.cell_index).padStart(2, '0')} Detailed Diagnostics
                </h3>
                <p className="text-xs text-[#9BA9BB]">{selectedCell.cell_serial || `CEL-8840-${selectedCell.cell_index}`}</p>
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
                <span className="text-[#9BA9BB]">Measured Voltage</span>
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
                <span className="text-[#9BA9BB]">Surface Temperature</span>
                <div className="text-xl font-bold text-[#55D889] mt-1 font-mono">
                  {selectedCell.temperature.toFixed(1)} °C
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#172337]/60 border border-[#263449]">
                <span className="text-[#9BA9BB]">Health Classification</span>
                <div className="text-base font-bold text-[#F4C44E] mt-1 uppercase">
                  {selectedCell.status}
                </div>
              </div>
            </div>

            <div className="text-xs text-[#9BA9BB] bg-[#080D18] p-3 rounded-lg border border-[#263449]">
              <span className="font-semibold text-[#F4F7FB]">BMS Balance Recommendation: </span>
              {selectedCell.status === 'WARNING'
                ? 'Passive bleed resistor activation recommended during next charge soak cycle to eliminate 60mV delta.'
                : 'Cell is operating within balanced nominal tolerances.'}
            </div>

            <button
              onClick={() => setSelectedCell(null)}
              className="w-full py-2 rounded-lg bg-[#55D889] text-[#080D18] font-bold text-xs hover:bg-[#32B96F] transition-colors"
            >
              Close Inspection
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
