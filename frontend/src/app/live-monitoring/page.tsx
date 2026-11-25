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
  Layers,
  Clock,
  X,
} from 'lucide-react';

export default function LiveMonitoringPage() {
  const { selectedVehicle, activeScenario, scenarioChangeCount, latestTelemetry } = useVehicle();
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
    if (latestTelemetry && Object.keys(latestTelemetry).length > 0) {
      setTelemetry(latestTelemetry);
      setLastSeenTime('just now');
    }
  }, [latestTelemetry]);

  useEffect(() => {
    let isMounted = true;

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
  }, [vehicleId, activeScenario, scenarioChangeCount]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-[6px] bg-surface-primary text-accent-primary border border-border shadow-subtle">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
              Battery Box
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-surface-secondary text-accent-primary border border-border">
                Module Rack
              </span>
            </h1>
            <p className="text-xs text-text-muted">
              Industrial Battery Telemetry • Module ID: {vehicleId}
            </p>
          </div>
        </div>

        {/* Live heartbeat indicator */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] bg-surface-primary border border-border text-xs font-mono shadow-subtle">
          <span className="w-2 h-2 rounded-full bg-accent-primary" />
          <span className="text-text-muted">Seen: </span>
          <span className="text-primary-text font-semibold">{lastSeenTime}</span>
        </div>
      </div>

      {/* Main Grid: Left 2/3 and Right 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Columns: 3 Gauges + 10 Cell Cards */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top 3 Analog Radial Gauges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

          {/* Cell Cards Grid */}
          <div className="surface-card p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
              <div>
                <h3 className="text-sm font-semibold text-primary-text">
                  Individual Battery Cells
                </h3>
                <p className="text-xs text-text-muted">Select any cell to inspect detailed potential & impedance</p>
              </div>
              <span className="text-xs text-text-muted font-mono">
                Total: {telemetry.cells?.length || 10} Cells
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
              {(telemetry.cells || []).map((cell: BatteryCell) => (
                <BatteryCellCard
                  key={cell.cell_index}
                  cell={cell}
                  onClick={() => setSelectedCell(cell)}
                />
              ))}
            </div>
          </div>

          {/* System Communication & Alarm Status Footer */}
          <div className="surface-card p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted">Data Server</span>
              <span className="px-1.5 py-0.2 rounded-[4px] font-mono text-[10px] bg-surface-primary text-accent-primary border border-accent-primary/30">
                {telemetry.data_server_status || 'OK'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted">Message Queue</span>
              <span className="px-1.5 py-0.2 rounded-[4px] font-mono text-[10px] bg-surface-primary text-accent-primary border border-accent-primary/30">
                {telemetry.message_queue_status || 'OK'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted">Warnings</span>
              <span className="px-1.5 py-0.2 rounded-[4px] font-mono text-[10px] bg-surface-primary text-status-warning border border-status-warning/30">
                {telemetry.warnings_count ?? 1}
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted">Alarms</span>
              <span className="px-1.5 py-0.2 rounded-[4px] font-mono text-[10px] bg-surface-primary text-accent-primary border border-border">
                {telemetry.alarms_count ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Strip Charts */}
        <div className="space-y-3">
          <div className="surface-card p-2.5 flex items-center justify-between text-xs text-text-muted">
            <div className="flex items-center gap-1.5 font-medium text-primary-text">
              <Clock className="w-3.5 h-3.5 text-accent-primary" />
              <span>Telemetry Interval: 1h</span>
            </div>
            <span className="text-[10px] font-mono">CAN-BMS 10Hz</span>
          </div>

          <RealtimeSensorChart
            title="Voltage (V)"
            dataKey="voltage"
            unit="V"
            data={history}
            minThreshold={32.0}
            maxThreshold={42.0}
            yDomain={[25, 48]}
          />

          <RealtimeSensorChart
            title="Temperature (°C)"
            dataKey="temperature"
            unit="°C"
            data={history}
            minThreshold={15.0}
            maxThreshold={45.0}
            yDomain={[10, 60]}
          />

          <RealtimeSensorChart
            title="Impedance (Ω)"
            dataKey="impedance"
            unit="Ω"
            data={history}
            maxThreshold={0.1500}
            yDomain={[0.0, 0.2]}
          />
        </div>
      </div>

      {/* Cell Detailed Inspection Modal */}
      {selectedCell && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="surface-elevated border border-border rounded-[10px] p-5 max-w-lg w-full space-y-4 shadow-elevated">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div>
                <h3 className="text-base font-semibold text-primary-text">
                  Cell {String(selectedCell.cell_index).padStart(2, '0')} Telemetry Inspection
                </h3>
                <p className="text-xs text-text-muted font-mono">{selectedCell.cell_serial || `CEL-8840-${selectedCell.cell_index}`}</p>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="p-1 rounded-[4px] hover:bg-surface-secondary text-text-muted hover:text-primary-text"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
                <span className="text-text-muted">Voltage Potential</span>
                <div className="text-lg font-bold text-primary-text mt-0.5 font-mono">
                  {selectedCell.voltage.toFixed(3)} V
                </div>
              </div>
              <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
                <span className="text-text-muted">Internal Resistance</span>
                <div className="text-lg font-bold text-primary-text mt-0.5 font-mono">
                  {selectedCell.internal_resistance.toFixed(4)} Ω
                </div>
              </div>
              <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
                <span className="text-text-muted">Surface Temp</span>
                <div className="text-lg font-bold text-accent-primary mt-0.5 font-mono">
                  {selectedCell.temperature.toFixed(1)} °C
                </div>
              </div>
              <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
                <span className="text-text-muted">Status Classification</span>
                <div className={`text-base font-bold mt-0.5 font-mono uppercase ${
                  selectedCell.status === 'CRITICAL' ? 'text-status-critical' : selectedCell.status === 'WARNING' ? 'text-status-warning' : 'text-accent-primary'
                }`}>
                  {selectedCell.status}
                </div>
              </div>
            </div>

            <div className="text-xs text-text-secondary bg-surface-secondary p-3 rounded-[6px] border border-border">
              <span className="font-semibold text-primary-text">BMS Recommendation: </span>
              {selectedCell.status === 'WARNING'
                ? 'Passive cell balancing bleed resistance active during upcoming charge cycle to eliminate 60mV imbalance.'
                : 'Cell is operating within balanced nominal tolerances.'}
            </div>

            <button
              onClick={() => setSelectedCell(null)}
              className="w-full py-1.5 rounded-[6px] bg-surface-secondary hover:bg-surface-primary text-primary-text font-medium text-xs border border-border transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
