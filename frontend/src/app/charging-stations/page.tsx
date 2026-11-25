'use client';

import React, { useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import {
  Zap,
  BatteryCharging,
  ShieldCheck,
  ChevronRight,
  Flame,
} from 'lucide-react';

interface ChargingStation {
  id: string;
  name: string;
  location: string;
  connectorType: 'CCS2 Combo' | 'NACS' | 'Type 2 AC';
  maxPowerKw: number;
  currentPowerKw: number;
  status: 'CHARGING' | 'AVAILABLE' | 'PRECONDITIONING' | 'MAINTENANCE';
  voltageV: number;
  currentA: number;
  sessionDurationMin: number;
  energyDeliveredKwh: number;
  coolantTempC: number;
}

export default function ChargingStationsPage() {
  const { selectedVehicle } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [stations, setStations] = useState<ChargingStation[]>([
    {
      id: 'CS-STN-01',
      name: 'Supercharger Hub Alpha - Bay 01',
      location: 'VoltSense Test Facility, Bay A',
      connectorType: 'CCS2 Combo',
      maxPowerKw: 350,
      currentPowerKw: 142.8,
      status: 'CHARGING',
      voltageV: 402.4,
      currentA: 354.8,
      sessionDurationMin: 24,
      energyDeliveredKwh: 48.6,
      coolantTempC: 31.4,
    },
    {
      id: 'CS-STN-02',
      name: 'Supercharger Hub Alpha - Bay 02',
      location: 'VoltSense Test Facility, Bay B',
      connectorType: 'NACS',
      maxPowerKw: 250,
      currentPowerKw: 0.0,
      status: 'AVAILABLE',
      voltageV: 0.0,
      currentA: 0.0,
      sessionDurationMin: 0,
      energyDeliveredKwh: 0.0,
      coolantTempC: 22.0,
    },
    {
      id: 'CS-STN-03',
      name: 'Dynamic Fleet DC Fast Inverter',
      location: 'Depot Charging Dock #3',
      connectorType: 'CCS2 Combo',
      maxPowerKw: 180,
      currentPowerKw: 74.2,
      status: 'CHARGING',
      voltageV: 396.1,
      currentA: 187.3,
      sessionDurationMin: 42,
      energyDeliveredKwh: 36.2,
      coolantTempC: 38.2,
    },
    {
      id: 'CS-STN-04',
      name: 'Overnight AC Equalization Terminal',
      location: 'Maintenance Hangar, Unit 04',
      connectorType: 'Type 2 AC',
      maxPowerKw: 22,
      currentPowerKw: 11.0,
      status: 'PRECONDITIONING',
      voltageV: 230.0,
      currentA: 47.8,
      sessionDurationMin: 180,
      energyDeliveredKwh: 21.5,
      coolantTempC: 24.5,
    },
  ]);

  const [selectedStation, setSelectedStation] = useState<ChargingStation>(stations[0]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            EV Charging Infrastructure & Thermal Telemetry
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-accent-primary/10 text-accent-primary border border-accent-primary/30 font-semibold">
              CCS2 / NACS Protocol
            </span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            High-voltage DC fast-charging terminals, cable thermal dissipation, and cell preconditioning for {selectedVehicle?.name || 'VoltSense Model GT'} ({vehicleId})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted bg-surface-primary px-3 py-1.5 rounded-[6px] border border-border shadow-subtle">
            Fleet Bus: <span className="text-accent-primary font-semibold">Online (500k)</span>
          </span>
        </div>
      </div>

      {/* Top 4 Industrial Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Active Fast Charging Power</span>
            <Zap className="w-4 h-4 text-accent-primary flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-primary-text font-mono tabular-nums">
            {selectedStation.currentPowerKw.toFixed(1)}{' '}
            <span className="text-xs font-normal text-text-muted">kW</span>
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Terminal Max: {selectedStation.maxPowerKw} kW
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>DC Pack Potential</span>
            <BatteryCharging className="w-4 h-4 text-accent-secondary flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-accent-secondary font-mono tabular-nums">
            {selectedStation.voltageV.toFixed(1)}{' '}
            <span className="text-xs font-normal text-text-muted">V DC</span>
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Rate: {selectedStation.currentA.toFixed(1)} A
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Thermal Loop Dissipation</span>
            <Flame className="w-4 h-4 text-status-warning flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-status-warning font-mono tabular-nums">
            {selectedStation.coolantTempC.toFixed(1)} °C
          </div>
          <div className="text-[11px] text-text-muted">
            Jacket Coolant Nominal
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Energy Delivered</span>
            <ShieldCheck className="w-4 h-4 text-accent-primary flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-accent-primary font-mono tabular-nums">
            {selectedStation.energyDeliveredKwh.toFixed(1)}{' '}
            <span className="text-xs font-normal text-text-muted">kWh</span>
          </div>
          <div className="text-[11px] text-text-muted font-mono">
            Session: {selectedStation.sessionDurationMin} min elapsed
          </div>
        </div>
      </div>

      {/* Main Terminals Grid and Station Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Station Terminals List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="surface-card p-5 sm:p-6 space-y-4 shadow-subtle">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-primary-text">
                  DC Fast Charging Bays
                </h3>
                <p className="text-xs text-text-muted">Live status and terminal allocation</p>
              </div>
              <span className="text-xs font-mono text-text-muted">
                {stations.filter((s) => s.status === 'CHARGING').length} Active Sessions
              </span>
            </div>

            <div className="space-y-2.5">
              {stations.map((stn) => {
                const isSelected = selectedStation.id === stn.id;
                const isCharging = stn.status === 'CHARGING';
                const isAvailable = stn.status === 'AVAILABLE';

                return (
                  <div
                    key={stn.id}
                    onClick={() => setSelectedStation(stn)}
                    className={`p-3 rounded-[8px] border transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-surface-secondary border-accent-primary'
                        : 'bg-surface-primary border-border hover:border-accent-secondary'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-[6px] border ${
                        isCharging
                          ? 'bg-surface-secondary text-accent-primary border-accent-primary/40'
                          : isAvailable
                          ? 'bg-surface-secondary text-accent-secondary border-accent-secondary/40'
                          : 'bg-surface-secondary text-status-warning border-status-warning/40'
                      }`}>
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-primary-text">{stn.name}</h4>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded-[3px] border uppercase ${
                            isCharging
                              ? 'bg-surface-primary text-accent-primary border-accent-primary/30'
                              : isAvailable
                              ? 'bg-surface-primary text-accent-secondary border-accent-secondary/30'
                              : 'bg-surface-primary text-status-warning border-status-warning/30'
                          }`}>
                            {stn.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-text-muted mt-0.5">
                          <span>{stn.connectorType}</span>
                          <span>•</span>
                          <span className="font-mono">{stn.id}</span>
                          <span>•</span>
                          <span>{stn.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="text-right">
                        <div className="text-primary-text font-bold">{stn.currentPowerKw.toFixed(1)} kW</div>
                        <div className="text-[10px] text-text-muted">Max {stn.maxPowerKw} kW</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Station Telemetry Card */}
        <div className="surface-card p-4 space-y-3">
          <div className="border-b border-border/60 pb-2">
            <h3 className="text-sm font-semibold text-primary-text">
              Terminal Telemetry
            </h3>
            <p className="text-xs text-text-muted font-mono">{selectedStation.name}</p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted">Terminal Protocol</span>
              <span className="text-primary-text font-mono">{selectedStation.connectorType}</span>
            </div>
            <div className="flex justify-between p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted">Voltage Level</span>
              <span className="text-primary-text font-mono">{selectedStation.voltageV.toFixed(1)} V</span>
            </div>
            <div className="flex justify-between p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted">Current Amplitude</span>
              <span className="text-accent-primary font-mono">{selectedStation.currentA.toFixed(1)} A</span>
            </div>
            <div className="flex justify-between p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted">Cable Cooling Temp</span>
              <span className="text-status-warning font-mono">{selectedStation.coolantTempC.toFixed(1)} °C</span>
            </div>
            <div className="flex justify-between p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted">Session Energy</span>
              <span className="text-accent-secondary font-mono">{selectedStation.energyDeliveredKwh.toFixed(1)} kWh</span>
            </div>
          </div>

          <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border text-[11px] text-text-secondary leading-relaxed">
            <span className="text-accent-primary font-semibold">Active Preconditioning:</span> Battery thermal management loop maintaining 28°C core temperature for optimal DC fast charge acceptance.
          </div>
        </div>
      </div>
    </div>
  );
}
