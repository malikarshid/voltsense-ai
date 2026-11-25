'use client';

import React from 'react';
import { useVehicle } from '@/context/VehicleContext';
import {
  Activity,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Flame,
  Scale,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Cpu,
} from 'lucide-react';

interface SimulationStatusPanelProps {
  telemetry?: any;
}

export const SimulationStatusPanel: React.FC<SimulationStatusPanelProps> = ({ telemetry }) => {
  const {
    selectedVehicle,
    activeScenario,
    isSimulating,
    isScenarioActivating,
    setScenario,
    toggleSimulation,
    resetSimulation,
  } = useVehicle();

  const getScenarioMeta = (sc: string) => {
    switch (sc) {
      case 'charging':
        return {
          title: 'DC Fast Charging (CCS2)',
          desc: 'High-voltage 150kW CCS2 rapid charging active. Core temperature preconditioning and positive current (+75A).',
          badgeClass: 'bg-status-info/10 text-status-info border-status-info/30',
          dotClass: 'bg-status-info animate-pulse',
          icon: Zap,
          envelope: 'ACTIVE_CHARGING',
        };
      case 'discharging':
        return {
          title: 'High Dynamic Load',
          desc: 'High acceleration demand cycle with heavy current discharge (-58A) and voltage sag.',
          badgeClass: 'bg-status-warning/10 text-status-warning border-status-warning/30',
          dotClass: 'bg-status-warning animate-pulse',
          icon: Zap,
          envelope: 'LOAD_WARNING',
        };
      case 'high_temp':
        return {
          title: 'Thermal Stress Zone',
          desc: 'Critical pack heat detected (>54°C). Localized hot spot on Cell C01 (57.4°C). Auxiliary chiller engaged.',
          badgeClass: 'bg-status-critical/10 text-status-critical border-status-critical/30',
          dotClass: 'bg-status-critical animate-ping',
          icon: Flame,
          envelope: 'CRITICAL_TEMPERATURE',
        };
      case 'cell_imbalance':
        return {
          title: 'Cell Imbalance Injected',
          desc: 'Sub-module voltage divergence. Cell C01 depressed to 3.10V, exceeding 500 mV Delta-V imbalance threshold.',
          badgeClass: 'bg-status-critical/10 text-status-critical border-status-critical/30',
          dotClass: 'bg-status-critical animate-ping',
          icon: Scale,
          envelope: 'CRITICAL_IMBALANCE',
        };
      case 'aging':
        return {
          title: 'High Degradation Run',
          desc: 'End-of-warranty asset simulation with 840 lifetime cycles, 74.2% SOH retention, and elevated 0.165Ω impedance.',
          badgeClass: 'bg-status-warning/10 text-status-warning border-status-warning/30',
          dotClass: 'bg-status-warning',
          icon: Clock,
          envelope: 'DEGRADED_STATE',
        };
      default:
        return {
          title: 'Standard Driving Profile',
          desc: 'Nominal suburban driving conditions under standard thermal envelope (20°C–25°C) and balanced cell voltages.',
          badgeClass: 'bg-accent-primary/10 text-accent-primary border-accent-primary/30',
          dotClass: 'bg-accent-primary',
          icon: ShieldCheck,
          envelope: 'NOMINAL',
        };
    }
  };

  const meta = getScenarioMeta(activeScenario);
  const IconComponent = meta.icon;

  const vehicleVin = selectedVehicle?.vin || 'KA05ER7777';
  const isHv = vehicleVin.includes('HWGHL') || vehicleVin.includes('Cyber') || (selectedVehicle?.nominal_voltage ?? 0) > 100;
  const architecture = isHv ? '400V High-Voltage EV' : '36V Light EV (10s1p)';

  const powerKw = telemetry?.power_kw ?? (telemetry?.pack_voltage && telemetry?.pack_current ? ((telemetry.pack_voltage * telemetry.pack_current) / 1000).toFixed(2) : '0.00');
  const seqId = telemetry?.seq_id ?? 0;

  return (
    <div className="surface-card p-4 sm:p-5 rounded-[10px] border border-border shadow-subtle mb-6 transition-all">
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-[8px] border flex-shrink-0 ${meta.badgeClass}`}>
            <IconComponent className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-primary-text text-base tracking-tight">
                Simulation Engine: {meta.title}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] border text-xs font-mono font-medium ${meta.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dotClass}`} />
                <span className="uppercase text-[10px] tracking-wider">{meta.envelope}</span>
              </span>
              {isScenarioActivating && (
                <span className="text-[11px] text-accent-primary font-mono animate-pulse">
                  Synchronizing Physics...
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-0.5">
              {meta.desc}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-auto">
          <button
            onClick={toggleSimulation}
            disabled={isScenarioActivating}
            className={`btn-standard text-xs px-3 py-1.5 border transition-all ${
              isSimulating
                ? 'bg-surface-secondary text-primary-text border-border hover:bg-surface-elevated'
                : 'bg-accent-primary text-white border-accent-primary hover:opacity-90'
            }`}
            title={isSimulating ? 'Pause physics loop' : 'Resume live physics loop'}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 text-accent-primary" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </>
            )}
          </button>

          <button
            onClick={resetSimulation}
            disabled={isScenarioActivating}
            className="btn-standard text-xs px-3 py-1.5 bg-surface-secondary text-primary-text border border-border hover:bg-surface-elevated transition-all"
            title="Reset simulation to Standard Driving Profile"
          >
            <RotateCcw className="w-3.5 h-3.5 text-text-muted" />
            <span>Reset Profile</span>
          </button>
        </div>
      </div>

      {/* Real-time CAN-Bus Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-3">
        {/* Metric 1: Vehicle Target */}
        <div className="p-2.5 rounded-[6px] bg-surface-secondary/60 border border-border/80">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
            <span>Target Asset</span>
            <Cpu className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className="text-xs font-bold font-mono text-primary-text truncate" title={vehicleVin}>
            {selectedVehicle?.name || 'VoltSense Model GT'}
          </div>
          <div className="text-[10px] text-text-muted font-mono">{architecture}</div>
        </div>

        {/* Metric 2: Bus Frequency */}
        <div className="p-2.5 rounded-[6px] bg-surface-secondary/60 border border-border/80">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
            <span>CAN Protocol</span>
            <Radio className="w-3.5 h-3.5 text-accent-primary" />
          </div>
          <div className="text-xs font-bold font-mono text-accent-primary">CAN-BMS 500k</div>
          <div className="text-[10px] text-text-muted font-mono">1.0 Hz Real-Time</div>
        </div>

        {/* Metric 3: Packet Sequence */}
        <div className="p-2.5 rounded-[6px] bg-surface-secondary/60 border border-border/80">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
            <span>Packet Sequence</span>
            <Activity className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className="text-xs font-bold font-mono text-primary-text tabular-nums">
            #{seqId > 0 ? seqId : 'SYNC'}
          </div>
          <div className="text-[10px] text-status-healthy font-mono">WebSocket Live</div>
        </div>

        {/* Metric 4: Real-time Power */}
        <div className="p-2.5 rounded-[6px] bg-surface-secondary/60 border border-border/80">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
            <span>Dynamic Power</span>
            <Zap className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className="text-xs font-bold font-mono text-primary-text tabular-nums">
            {powerKw} kW
          </div>
          <div className="text-[10px] text-text-muted font-mono">
            {Number(powerKw) > 0 ? 'Charging Influx' : 'Discharge Drain'}
          </div>
        </div>

        {/* Metric 5: Active Current */}
        <div className="p-2.5 rounded-[6px] bg-surface-secondary/60 border border-border/80">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
            <span>Pack Current</span>
            <Activity className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className={`text-xs font-bold font-mono tabular-nums ${
            (telemetry?.pack_current ?? 0) > 0 ? 'text-status-info' : 'text-primary-text'
          }`}>
            {telemetry?.pack_current !== undefined ? `${telemetry.pack_current} A` : '-14.2 A'}
          </div>
          <div className="text-[10px] text-text-muted font-mono">DC Bus Current</div>
        </div>

        {/* Metric 6: Cell Delta-V Imbalance */}
        <div className="p-2.5 rounded-[6px] bg-surface-secondary/60 border border-border/80">
          <div className="flex items-center justify-between text-[11px] text-text-muted mb-1">
            <span>Delta-V Spread</span>
            <Scale className="w-3.5 h-3.5 text-text-muted" />
          </div>
          <div className={`text-xs font-bold font-mono tabular-nums ${
            (telemetry?.voltage_diff ?? 0) > 0.10 ? 'text-status-critical' : 'text-primary-text'
          }`}>
            {telemetry?.voltage_diff !== undefined ? `${(telemetry.voltage_diff * 1000).toFixed(0)} mV` : '40 mV'}
          </div>
          <div className={`text-[10px] font-mono ${
            (telemetry?.voltage_diff ?? 0) > 0.10 ? 'text-status-critical font-bold' : 'text-text-muted'
          }`}>
            {(telemetry?.voltage_diff ?? 0) > 0.10 ? 'Imbalance Alert' : 'Balanced Window'}
          </div>
        </div>
      </div>
    </div>
  );
};
