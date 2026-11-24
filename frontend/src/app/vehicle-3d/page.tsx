'use client';

import React, { useState, useEffect } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { ElectricVehicle3D } from '@/components/3d/ElectricVehicle3D';
import { fetchTelemetryLatest, getWebSocketMonitoringUrl } from '@/lib/api';
import {
  Eye,
  Zap,
  Activity,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

export default function Vehicle3DPage() {
  const { selectedVehicle } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'HWGHLDZ20842872FS';

  const [isTransparent, setIsTransparent] = useState(true);
  const [highlightBattery, setHighlightBattery] = useState(true);
  const [animateFlow, setAnimateFlow] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<string>('Battery Pack');
  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    fetchTelemetryLatest(vehicleId)
      .then((data) => {
        if (isMounted) setTelemetry(data);
      })
      .catch((e) => console.error(e));

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getWebSocketMonitoringUrl(vehicleId));
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (isMounted) setTelemetry(data);
        } catch (e) {
          console.error(e);
        }
      };
    } catch (e) {
      console.warn(e);
    }

    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, [vehicleId]);

  const currentSoc = Math.round(telemetry?.soc ?? selectedVehicle?.pack?.current_soc ?? 54);
  const currentVoltage = telemetry?.pack_voltage ?? selectedVehicle?.pack?.total_voltage ?? selectedVehicle?.nominal_voltage ?? 398.2;
  const currentTemp = telemetry?.avg_temperature ?? selectedVehicle?.pack?.avg_temperature ?? 24.5;
  const currentSoh = telemetry?.soh ?? selectedVehicle?.pack?.current_soh ?? 92.0;

  const nedcRange = Math.round((currentSoc / 100) * ((selectedVehicle?.pack_capacity_kwh ?? 75) * 4.2));
  const realRange = Math.round((currentSoc / 100) * ((selectedVehicle?.pack_capacity_kwh ?? 75) * 3.1));

  const componentDetails: { [key: string]: { description: string; voltage: string; temp: string; health: string } } = {
    'Battery Pack': {
      description: `Underfloor ${selectedVehicle?.pack_capacity_kwh ?? 75} kWh ${selectedVehicle?.battery_chemistry ?? 'NMC'} liquid-cooled modular pack with integrated cell contactors and pyrofuse.`,
      voltage: `${currentVoltage.toFixed(1)} V`,
      temp: `${currentTemp.toFixed(1)} °C`,
      health: `${currentSoh.toFixed(1)}% SOH`,
    },
    'Front Motor': {
      description: 'Permanent Magnet Synchronous Motor (PMSM) 150 kW with single-speed helical reduction gearbox.',
      voltage: `${(selectedVehicle?.nominal_voltage ?? 400).toFixed(0)} V AC 3-Phase`,
      temp: '42.1 °C',
      health: '95% Efficiency',
    },
    'Rear Motor': {
      description: 'Induction / PMSM dual drive rear traction motor 220 kW with silicon-carbide (SiC) inverter.',
      voltage: `${(selectedVehicle?.nominal_voltage ?? 400).toFixed(0)} V AC 3-Phase`,
      temp: '46.8 °C',
      health: '91% Efficiency',
    },
    'Chassis': {
      description: 'High-strength aluminum-steel hybrid monocoque frame designed for torsional rigidity and crash protection.',
      voltage: 'Chassis Ground',
      temp: '21.0 °C',
      health: 'Nominal Struct',
    },
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F4F7FB] tracking-tight flex items-center gap-2">
            3D Electric Vehicle Powertrain Twin
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#4C9FFF]/20 text-[#4C9FFF] border border-[#4C9FFF]/40">
              Interactive WebGL
            </span>
          </h1>
          <p className="text-xs text-[#9BA9BB]">
            Real-time component telemetry for {selectedVehicle?.name || 'VoltSense CyberSUV'} ({selectedVehicle?.vin || 'HWGHLDZ20842872FS'})
          </p>
        </div>

        {/* 3D View Controls Toolbar */}
        <div className="flex items-center gap-2 bg-[#111B2B] p-1.5 rounded-xl border border-[#263449]">
          <button
            onClick={() => setIsTransparent(!isTransparent)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isTransparent
                ? 'bg-[#4C9FFF]/20 text-[#4C9FFF] border border-[#4C9FFF]/40'
                : 'text-[#9BA9BB] hover:text-[#F4F7FB]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isTransparent ? 'X-Ray Chassis' : 'Solid Shell'}</span>
          </button>

          <button
            onClick={() => setHighlightBattery(!highlightBattery)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              highlightBattery
                ? 'bg-[#55D889]/20 text-[#55D889] border border-[#55D889]/40'
                : 'text-[#9BA9BB] hover:text-[#F4F7FB]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Highlight Pack</span>
          </button>

          <button
            onClick={() => setAnimateFlow(!animateFlow)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              animateFlow
                ? 'bg-[#55D889]/20 text-[#55D889] border border-[#55D889]/40'
                : 'text-[#9BA9BB] hover:text-[#F4F7FB]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Energy Flow</span>
          </button>
        </div>
      </div>

      {/* Main 3D Canvas Stage with Overlay Panels matching Reference 2 */}
      <div className="relative glass-card overflow-hidden rounded-2xl border border-[#263449] min-h-[620px] bg-gradient-to-b from-[#080D18] to-[#0B1220]">
        {/* Central 3D Canvas */}
        <ElectricVehicle3D
          isTransparent={isTransparent}
          highlightBattery={highlightBattery}
          animateFlow={animateFlow}
          selectedComponent={selectedComponent}
          onSelectComponent={(name) => setSelectedComponent(name)}
        />

        {/* TOP LEFT OVERLAY: SOC & Estimated Range (Matching Reference 2) */}
        <div className="absolute top-4 left-4 w-64 glass-card p-4 border border-[#263449]/80 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between text-xs text-[#9BA9BB] mb-2">
            <span className="font-semibold text-[#F4F7FB]">Battery SOC</span>
            <span className="text-[10px] text-[#4C9FFF] font-bold">{currentSoc}%</span>
          </div>

          <div className="flex items-center gap-4 my-2">
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke="#172337" strokeWidth="6" fill="transparent" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="#4C9FFF"
                  strokeWidth="6"
                  strokeDasharray={163}
                  strokeDashoffset={163 - (currentSoc / 100) * 163}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-[#F4F7FB]">
                {currentSoc}%
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-3 text-[#9BA9BB]">
                <span>NEDC Range</span>
                <span className="font-bold text-[#F4F7FB]">{nedcRange} km</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[#9BA9BB]">
                <span>Real Range</span>
                <span className="font-bold text-[#55D889]">{realRange} km</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM LEFT OVERLAY: Vehicle & Battery Pack Specs (Matching Reference 2) */}
        <div className="absolute bottom-4 left-4 w-72 glass-card p-4 border border-[#263449]/80 shadow-2xl backdrop-blur-md text-xs space-y-1.5">
          <div className="font-bold text-sm text-[#F4F7FB] border-b border-[#263449] pb-1.5 flex items-center justify-between">
            <span>High-Voltage Battery</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#55D889]/20 text-[#55D889]">
              Active BMS
            </span>
          </div>
          <div className="flex justify-between text-[#9BA9BB]">
            <span>Vehicle ID:</span>
            <span className="font-mono text-[#F4F7FB]">{selectedVehicle?.vin || vehicleId}</span>
          </div>
          <div className="flex justify-between text-[#9BA9BB]">
            <span>BMS Vendor:</span>
            <span className="text-[#F4F7FB]">VoltSense / Bosch Automotive</span>
          </div>
          <div className="flex justify-between text-[#9BA9BB]">
            <span>Chemistry:</span>
            <span className="text-[#55D889]">{selectedVehicle?.battery_chemistry || 'Ternary Li-ion (NMC)'}</span>
          </div>
          <div className="flex justify-between text-[#9BA9BB]">
            <span>Pack Architecture:</span>
            <span className="text-[#F4F7FB]">{(selectedVehicle?.nominal_voltage || 400).toFixed(0)}V {selectedVehicle?.cell_count || 10}-Cell Submodule</span>
          </div>
        </div>

        {/* TOP RIGHT OVERLAY: Diagnostic Fault Warnings (Matching Reference 2) */}
        <div className="absolute top-4 right-4 w-72 glass-card p-4 border border-[#263449]/80 shadow-2xl backdrop-blur-md space-y-2.5">
          <div className="flex items-center justify-between font-bold text-xs text-[#F4F7FB] border-b border-[#263449] pb-1.5">
            <span className="flex items-center gap-1.5 text-[#EF6262]">
              <AlertTriangle className="w-4 h-4" />
              Fault Diagnostics
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EF6262]/20 text-[#EF6262]">
              1 Warning
            </span>
          </div>
          <div className="text-[11px] p-2 rounded bg-[#F4C44E]/10 border border-[#F4C44E]/30 text-[#F4C44E] leading-tight">
            <b>Thermal Monitor:</b> Pack cooling loop temperature delta stable at {currentTemp.toFixed(1)}°C.
          </div>
        </div>

        {/* BOTTOM RIGHT OVERLAY: Motor & Inverter Health Dials (Matching Reference 2) */}
        <div className="absolute bottom-4 right-4 w-72 glass-card p-4 border border-[#263449]/80 shadow-2xl backdrop-blur-md space-y-2">
          <div className="font-bold text-xs text-[#F4F7FB] border-b border-[#263449] pb-1 flex items-center justify-between">
            <span>Powertrain Health Status</span>
            <span className="text-[10px] text-[#9BA9BB]">Dual E-Motors</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center pt-1">
            <div className="p-2 rounded-lg bg-[#172337]/50 border border-[#263449]">
              <div className="text-xl font-bold text-[#55D889]">{Math.round(currentSoh)} / 100</div>
              <div className="text-[10px] text-[#9BA9BB] mt-0.5">Battery Subsystem</div>
              <span className="text-[9px] text-[#55D889]">Optimal SOH</span>
            </div>
            <div className="p-2 rounded-lg bg-[#172337]/50 border border-[#263449]">
              <div className="text-xl font-bold text-[#4C9FFF]">95 / 100</div>
              <div className="text-[10px] text-[#9BA9BB] mt-0.5">Dual E-Motors</div>
              <span className="text-[9px] text-[#4C9FFF]">Optimal Torque</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected Component Deep-Dive Card */}
      {selectedComponent && componentDetails[selectedComponent] && (
        <div className="glass-card p-5 border border-[#4C9FFF]/50 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-[#4C9FFF] font-bold uppercase tracking-wider">
                Selected Component Inspection
              </div>
              <h2 className="text-lg font-bold text-[#F4F7FB] mt-0.5">
                {selectedComponent}
              </h2>
              <p className="text-xs text-[#9BA9BB] mt-1 max-w-2xl leading-relaxed">
                {componentDetails[selectedComponent].description}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-[#172337] border border-[#263449]">
                <span className="text-[#9BA9BB] block text-[10px]">Voltage</span>
                <span className="font-bold text-[#F4F7FB]">{componentDetails[selectedComponent].voltage}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#172337] border border-[#263449]">
                <span className="text-[#9BA9BB] block text-[10px]">Temp</span>
                <span className="font-bold text-[#55D889]">{componentDetails[selectedComponent].temp}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-[#172337] border border-[#263449]">
                <span className="text-[#9BA9BB] block text-[10px]">Health</span>
                <span className="font-bold text-[#4C9FFF]">{componentDetails[selectedComponent].health}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
