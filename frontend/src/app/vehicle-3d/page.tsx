'use client';

import React, { useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { ElectricVehicle3D } from '@/components/3d/ElectricVehicle3D';
import {
  Box,
  Eye,
  Zap,
  Activity,
  AlertTriangle,
  RotateCcw,
  Shield,
  Gauge,
  Sliders,
  Maximize2,
  CheckCircle,
} from 'lucide-react';

export default function Vehicle3DPage() {
  const { selectedVehicle } = useVehicle();
  const [isTransparent, setIsTransparent] = useState(true);
  const [highlightBattery, setHighlightBattery] = useState(true);
  const [animateFlow, setAnimateFlow] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<string>('Battery Pack');

  const componentDetails: { [key: string]: { description: string; voltage: string; temp: string; health: string } } = {
    'Battery Pack': {
      description: 'Underfloor 75 kWh NMC liquid-cooled modular pack with integrated cell contactors and pyrofuse.',
      voltage: '398.2 V',
      temp: '24.5 °C',
      health: '92.0% SOH',
    },
    'Front Motor': {
      description: 'Permanent Magnet Synchronous Motor (PMSM) 150 kW with single-speed helical reduction gearbox.',
      voltage: '400 V AC 3-Phase',
      temp: '42.1 °C',
      health: '95% Efficiency',
    },
    'Rear Motor': {
      description: 'Induction / PMSM dual drive rear traction motor 220 kW with silicon-carbide (SiC) inverter.',
      voltage: '400 V AC 3-Phase',
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
            <span className="text-[10px] text-[#4C9FFF] font-bold">54%</span>
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
                  strokeDashoffset={163 - (54 / 100) * 163}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-bold text-[#F4F7FB]">
                54%
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between gap-3 text-[#9BA9BB]">
                <span>NEDC Range</span>
                <span className="font-bold text-[#F4F7FB]">180 km</span>
              </div>
              <div className="flex items-center justify-between gap-3 text-[#9BA9BB]">
                <span>Real Range</span>
                <span className="font-bold text-[#55D889]">130 km</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM LEFT OVERLAY: Vehicle & Battery Pack Specs (Matching Reference 2) */}
        <div className="absolute bottom-4 left-4 w-72 glass-card p-4 border border-[#263449]/80 shadow-2xl backdrop-blur-md text-xs space-y-1.5">
          <div className="font-bold text-sm text-[#F4F7FB] border-b border-[#263449] pb-1.5 flex items-center justify-between">
            <span>High-Voltage Battery</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#55D889]/20 text-[#55D889]">
              Active Charge
            </span>
          </div>
          <div className="flex justify-between text-[#9BA9BB]">
            <span>Vehicle ID:</span>
            <span className="font-mono text-[#F4F7FB]">HWGHLDZ20842872FS</span>
          </div>
          <div className="flex justify-between text-[#9BA9BB]">
            <span>BMS Vendor:</span>
            <span className="text-[#F4F7FB]">Huawei Electric / Bosch</span>
          </div>
          <div className="flex justify-between text-[#9BA9BB]">
            <span>Chemistry:</span>
            <span className="text-[#55D889]">Ternary Li-ion (NMC)</span>
          </div>
          <div className="flex justify-between text-[#9BA9BB]">
            <span>Pack Architecture:</span>
            <span className="text-[#F4F7FB]">400V 10-Cell Submodule</span>
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
              2 Alerts
            </span>
          </div>
          <div className="text-[11px] p-2 rounded bg-[#EF6262]/10 border border-[#EF6262]/30 text-[#EF6262] leading-tight">
            <b>Thermal Risk:</b> Battery pack cooling loop differential exceeds 3.5°C under high-current DC charge.
          </div>
          <div className="text-[11px] p-2 rounded bg-[#F4C44E]/10 border border-[#F4C44E]/30 text-[#F4C44E] leading-tight">
            <b>Powertrain Advisory:</b> Rear electric motor inverter switching frequency ripple logged.
          </div>
        </div>

        {/* BOTTOM RIGHT OVERLAY: Motor & Inverter Health Dials (Matching Reference 2) */}
        <div className="absolute bottom-4 right-4 w-72 glass-card p-4 border border-[#263449]/80 shadow-2xl backdrop-blur-md space-y-2">
          <div className="font-bold text-xs text-[#F4F7FB] border-b border-[#263449] pb-1 flex items-center justify-between">
            <span>Powertrain Health Status</span>
            <span className="text-[10px] text-[#9BA9BB]">Dual Motors</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center pt-1">
            <div className="p-2 rounded-lg bg-[#172337]/50 border border-[#263449]">
              <div className="text-xl font-bold text-[#F4C44E]">56 / 100</div>
              <div className="text-[10px] text-[#9BA9BB] mt-0.5">Battery Subsystem</div>
              <span className="text-[9px] text-[#F4C44E]">Inspect Imbalance</span>
            </div>
            <div className="p-2 rounded-lg bg-[#172337]/50 border border-[#263449]">
              <div className="text-xl font-bold text-[#55D889]">91 / 100</div>
              <div className="text-[10px] text-[#9BA9BB] mt-0.5">Dual E-Motors</div>
              <span className="text-[9px] text-[#55D889]">Optimal Status</span>
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
