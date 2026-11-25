'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useVehicle } from '@/context/VehicleContext';
import { useTheme } from '@/context/ThemeContext';
import { ExplorationMode, ComponentVisibility, CellTelemetryItem } from '@/components/3d/ElectricVehicle3D';
import { fetchTelemetryLatest, fetchCells, getWebSocketMonitoringUrl } from '@/lib/api';
import { BatteryCell } from '@/types';

// Dynamic import with SSR disabled to optimize bundle size and hydration performance
const ElectricVehicle3D = dynamic(
  () => import('@/components/3d/ElectricVehicle3D').then((mod) => mod.ElectricVehicle3D),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[560px] surface-card flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
        <span className="text-xs font-mono text-text-muted">Initializing WebGL Engine & 3D Powertrain...</span>
      </div>
    ),
  }
);

import {
  Eye,
  Zap,
  Activity,
  AlertTriangle,
  RotateCcw,
  Layers,
  Radio,
  CheckCircle,
  HelpCircle,
  ShieldCheck,
  Cpu,
  Compass,
  Sliders,
  Filter,
  Flame,
  Gauge,
  Thermometer,
  Check,
} from 'lucide-react';

export default function Vehicle3DPage() {
  const { selectedVehicle, isSimulating, activeScenario, scenarioChangeCount, latestTelemetry } = useVehicle();
  const { colors } = useTheme();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';
  const isCyberSuv = vehicleId.includes('Cyber') || vehicleId.includes('HWGHL') || (selectedVehicle?.nominal_voltage ?? 0) > 100;

  const [explorationMode, setExplorationMode] = useState<ExplorationMode>('complete');
  const [selectedComponent, setSelectedComponent] = useState<string>('Battery Pack');
  const [selectedCellIndex, setSelectedCellIndex] = useState<number | null>(1);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [cells, setCells] = useState<BatteryCell[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  // Advanced controls: Explode percentage, animation speed, visibility
  const [explodePercentage, setExplodePercentage] = useState<number>(0);
  const [animationSpeed, setAnimationSpeed] = useState<number>(1.0);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState<boolean>(false);
  const [visibility, setVisibility] = useState<ComponentVisibility>({
    body: true,
    glass: true,
    chassis: true,
    battery: true,
    powertrain: true,
    wheels: true,
    cooling: true,
  });

  // Toggle subsystem visibility
  const toggleVisibility = useCallback((key: keyof ComponentVisibility) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Stable callbacks for 3D interactions
  const handleSelectComponent = useCallback((name: string) => {
    setSelectedComponent(name);
  }, []);

  const handleSelectCell = useCallback((cellIndex: number) => {
    setSelectedCellIndex(cellIndex);
    setSelectedComponent(`Battery Cell ${String(cellIndex).padStart(2, '0')}`);
  }, []);

  const handleSelectModule = useCallback((moduleIndex: number) => {
    setSelectedCellIndex(moduleIndex);
    setSelectedComponent(`Battery Cell ${String(moduleIndex).padStart(2, '0')}`);
  }, []);

  const handleExplorationModeChange = useCallback((mode: ExplorationMode) => {
    setExplorationMode(mode);
    if (mode === 'exploded' && explodePercentage === 0) {
      setExplodePercentage(80);
    }
  }, [explodePercentage]);

  useEffect(() => {
    if (latestTelemetry && Object.keys(latestTelemetry).length > 0) {
      setTelemetry(latestTelemetry);
      if (latestTelemetry.cells && latestTelemetry.cells.length > 0) {
        setCells(latestTelemetry.cells.map((c: any, idx: number) => ({
          id: `cell-${idx + 1}`,
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
    }
  }, [latestTelemetry, vehicleId]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      fetchTelemetryLatest(vehicleId).catch(() => null),
      fetchCells(vehicleId).catch(() => []),
    ]).then(([telemetryData, cellList]) => {
      if (!isMounted) return;
      if (telemetryData) setTelemetry(telemetryData);
      if (cellList && cellList.length > 0) setCells(cellList);
    });

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getWebSocketMonitoringUrl(vehicleId));
      ws.onopen = () => {
        if (isMounted) setWsConnected(true);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (isMounted) {
            setTelemetry(data);
            setWsConnected(true);
          }
        } catch (e) {
          console.error(e);
        }
      };
      ws.onerror = () => {
        if (isMounted) setWsConnected(false);
      };
      ws.onclose = () => {
        if (isMounted) setWsConnected(false);
      };
    } catch (e) {
      console.warn(e);
    }

    return () => {
      isMounted = false;
      if (ws) ws.close();
    };
  }, [vehicleId, activeScenario, scenarioChangeCount]);

  const currentSoc = Math.round(telemetry?.soc ?? 67);
  const currentVoltage = telemetry?.pack_voltage ?? (isCyberSuv ? 392.0 : 35.5);
  const currentTemp = telemetry?.avg_temperature ?? 24.0;
  const currentSoh = telemetry?.soh ?? (isCyberSuv ? 92.0 : 88.4);
  const currentCurrent = telemetry?.pack_current ?? -14.2;
  const currentRange = telemetry?.range_km ?? (isCyberSuv ? 280 : 48);

  const nedcRange = Math.round(currentRange * 1.15);
  const realRange = currentRange;

  // Format cell telemetry for 3D component status mapping
  const cellTelemetryItems: CellTelemetryItem[] = useMemo(() => {
    if (cells && cells.length > 0) {
      return cells.map((c) => ({
        cell_index: c.cell_index,
        voltage: c.voltage,
        temperature: c.temperature,
        status: c.status,
      }));
    }
    // Fallback based on telemetry.cells or nominal series
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((idx) => ({
      cell_index: idx,
      voltage: telemetry?.cells?.[idx - 1]?.voltage ?? (isCyberSuv ? 3.92 : 3.55),
      temperature: telemetry?.cells?.[idx - 1]?.temperature ?? (24.0 + (idx === 1 ? 4.5 : 0)),
      status: telemetry?.cells?.[idx - 1]?.status ?? (idx === 1 ? 'WARNING' : 'HEALTHY'),
    }));
  }, [cells, telemetry, isCyberSuv]);

  // Current selected cell details
  const activeCell = cells.find((c) => c.cell_index === (selectedCellIndex || 1)) || {
    cell_index: selectedCellIndex || 1,
    voltage: telemetry?.cells?.[(selectedCellIndex || 1) - 1]?.voltage ?? (isCyberSuv ? 3.92 : 3.58),
    temperature: telemetry?.cells?.[(selectedCellIndex || 1) - 1]?.temperature ?? 24.2,
    internal_resistance: telemetry?.cells?.[(selectedCellIndex || 1) - 1]?.internal_resistance ?? 0.0210,
    status: telemetry?.cells?.[(selectedCellIndex || 1) - 1]?.status ?? 'HEALTHY',
  };

  const componentDetails: { [key: string]: { description: string; voltage: string; temp: string; health: string; color: string } } = {
    'Battery Pack': {
      description: `Underfloor modular high-voltage battery enclosure with 10 discrete series-coupled cell bricks, dual longitudinal cooling channels, and high-strength aluminum ballistic undertray.`,
      voltage: `${currentVoltage.toFixed(1)} V DC Bus`,
      temp: `${currentTemp.toFixed(1)} °C Core`,
      health: `${currentSoh.toFixed(1)}% SOH Retention`,
      color: '#06B6D4',
    },
    'Front Motor': {
      description: 'Permanent Magnet Synchronous Motor (PMSM) 150 kW front traction drive with integrated single-speed helical reduction gearbox and dynamic torque vectoring.',
      voltage: `${(isCyberSuv ? 400 : 36).toFixed(0)} V AC 3-Phase`,
      temp: `${(currentTemp + 12.0).toFixed(1)} °C Stator`,
      health: '96.2% Inversion Eff',
      color: '#8B5CF6',
    },
    'Rear Motor': {
      description: 'High-output 220 kW Dual Drive Rear Traction Motor coupled with silicon-carbide (SiC) high-voltage variable frequency inverter.',
      voltage: `${(isCyberSuv ? 400 : 36).toFixed(0)} V AC 3-Phase`,
      temp: `${(currentTemp + 15.5).toFixed(1)} °C Stator`,
      health: '94.8% Inversion Eff',
      color: '#8B5CF6',
    },
    'Inverter': {
      description: 'Automotive Silicon-Carbide (SiC) MOSFET high-efficiency traction inverter converting high-voltage DC to variable-frequency 3-phase AC.',
      voltage: `${currentVoltage.toFixed(1)} V DC In`,
      temp: `${(currentTemp + 8.2).toFixed(1)} °C Junction`,
      health: '98.5% Efficiency',
      color: '#EAB308',
    },
    'Cooling System': {
      description: 'Dual-loop active liquid thermal management system regulating battery cell core temperatures and inverter power stages via ethylene glycol coolant.',
      voltage: '12V Auxiliary Circuit',
      temp: `${(currentTemp - 2.5).toFixed(1)} °C Coolant`,
      health: 'Nominal Flow (4.2 L/min)',
      color: '#2563EB',
    },
    'BMS': {
      description: 'Master Battery Management System (BMS) with high-speed CAN-BMS 500k bus, isolation monitoring, pyrofuse contactors, and active cell balancing shunts.',
      voltage: 'CAN 2.0B / 500k Sense',
      temp: `${(currentTemp + 3.0).toFixed(1)} °C PCB`,
      health: '10S Interlock Nominal',
      color: '#0F172A',
    },
    'Chassis': {
      description: 'Aerodynamic electric sedan monocoque chassis finished in premium Deep Metallic Sapphire Blue (#0756B8) with multi-layer clearcoat gloss reflections.',
      voltage: 'Chassis Earth Ground',
      temp: '21.0 °C Ambient',
      health: 'Structural Integrity 100%',
      color: '#0756B8',
    },
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-10">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-primary-text tracking-tight">
              3D Electric Vehicle Digital Twin
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-accent-primary/10 text-accent-primary border border-accent-primary/20 font-semibold">
              Metallic Sapphire Blue
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-[4px] border ${
              wsConnected ? 'bg-status-healthy/10 text-status-healthy border-status-healthy/30' : 'bg-surface-secondary text-text-muted border-border'
            }`}>
              {wsConnected ? 'CAN-BMS 500k Live' : isSimulating ? 'CAN Simulator' : 'Telemetry Sync'}
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            Photorealistic powertrain, underfloor battery architecture, and cell-level diagnostic twins for {selectedVehicle?.name || 'VoltSense GT'} ({vehicleId})
          </p>
        </div>

        {/* Global Controls & Status Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          {/* Subsystem Visibility Toggle Menu */}
          <div className="relative">
            <button
              onClick={() => setShowVisibilityMenu(!showVisibilityMenu)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-[4px] bg-surface-secondary text-primary-text border border-border hover:border-accent-primary transition-colors text-xs"
            >
              <Filter className="w-3.5 h-3.5 text-accent-primary" />
              <span>Subsystems</span>
            </button>
            {showVisibilityMenu && (
              <div className="absolute right-0 mt-1 w-44 bg-surface-primary border border-border rounded-[6px] shadow-lg p-2 z-30 space-y-1">
                {(['body', 'glass', 'chassis', 'battery', 'powertrain', 'wheels', 'cooling'] as Array<keyof ComponentVisibility>).map((key) => (
                  <button
                    key={key}
                    onClick={() => toggleVisibility(key)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded-[4px] text-xs hover:bg-surface-secondary transition-colors capitalize text-left"
                  >
                    <span className="text-primary-text">{key}</span>
                    <span className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center ${
                      visibility[key] ? 'bg-accent-primary border-accent-primary text-white' : 'border-border'
                    }`}>
                      {visibility[key] && <Check className="w-2.5 h-2.5" />}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speed Preset Buttons */}
          <div className="flex items-center rounded-[4px] bg-surface-secondary border border-border p-0.5">
            <span className="px-1.5 text-[10px] text-text-muted">Speed:</span>
            {[0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setAnimationSpeed(spd)}
                className={`px-1.5 py-0.5 rounded-[3px] text-[10px] font-mono ${
                  animationSpeed === spd ? 'bg-surface-primary text-accent-primary font-bold shadow-xs' : 'text-text-muted'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Active Scenario Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-text-muted hidden sm:inline">Scenario:</span>
            <span className="px-2 py-0.5 rounded-[4px] bg-surface-secondary text-primary-text border border-border uppercase font-semibold text-[11px]">
              {activeScenario.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas Viewport (Unobstructed, zero-overlap stage) */}
      <div className="surface-card overflow-hidden rounded-[10px] border border-border shadow-subtle min-h-[560px] relative">
        <ElectricVehicle3D
          explorationMode={explorationMode}
          selectedComponent={selectedComponent}
          selectedCellIndex={selectedCellIndex}
          explodePercentage={explodePercentage}
          animationSpeed={animationSpeed}
          visibility={visibility}
          cellTelemetry={cellTelemetryItems}
          onSelectComponent={handleSelectComponent}
          onSelectCell={handleSelectCell}
          onSelectModule={handleSelectModule}
          onExplorationModeChange={handleExplorationModeChange}
          onExplodePercentageChange={(pct) => setExplodePercentage(pct)}
        />
      </div>

      {/* Clean, Non-Overlapping Structured Telemetry Grid Below Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Pack Electrical Potential & Real Range */}
        <div className="surface-card p-4 rounded-[10px] border border-border space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
            <span className="font-semibold text-primary-text flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-accent-primary" />
              Pack Energy & Real Range
            </span>
            <span className="text-[10px] font-mono text-accent-primary font-bold">
              {currentSoc}% SOC
            </span>
          </div>

          <div className="flex items-center gap-4 py-1">
            <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0">
              <svg className="w-16 h-16 transform -rotate-90">
                <circle cx="32" cy="32" r="26" stroke={colors.bgSurfaceSecondary} strokeWidth="6" fill="transparent" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke={colors.accentPrimary}
                  strokeWidth="6"
                  strokeDasharray={163.3}
                  strokeDashoffset={163.3 - (currentSoc / 100) * 163.3}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-xs font-mono font-bold text-primary-text">
                {currentSoc}%
              </div>
            </div>

            <div className="space-y-1.5 text-xs font-mono flex-1">
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Pack Voltage:</span>
                <span className="font-bold text-primary-text">{currentVoltage.toFixed(1)} V</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Pack Current:</span>
                <span className={`font-bold ${currentCurrent > 0 ? 'text-status-info' : 'text-primary-text'}`}>
                  {currentCurrent > 0 ? `+${currentCurrent.toFixed(1)}` : currentCurrent.toFixed(1)} A
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-muted">Est. Range:</span>
                <span className="font-bold text-accent-primary">{realRange.toFixed(1)} km</span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] font-mono text-text-muted">
            <span>SOH Capacity: {currentSoh.toFixed(1)}%</span>
            <span>NEDC: {nedcRange.toFixed(0)} km</span>
          </div>
        </div>

        {/* Card 2: Selected Powertrain Subsystem Deep-Dive */}
        <div className="surface-card p-4 rounded-[10px] border border-border space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
            <div>
              <span className="text-[10px] text-text-muted uppercase font-mono block">Subsystem Telemetry</span>
              <span className="font-semibold text-primary-text text-sm flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: componentDetails[selectedComponent]?.color || '#0756B8' }}
                />
                {selectedComponent}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-surface-secondary text-accent-primary border border-border">
              Inspected
            </span>
          </div>

          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
            {componentDetails[selectedComponent]?.description ||
              `Interactive 3D representation of ${selectedComponent} within the VoltSense powertrain.`}
          </p>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono pt-1">
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted block text-[10px]">Voltage</span>
              <span className="font-semibold text-primary-text text-[11px] truncate block">
                {componentDetails[selectedComponent]?.voltage || `${currentVoltage.toFixed(1)} V`}
              </span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted block text-[10px]">Thermal</span>
              <span className="font-semibold text-accent-primary text-[11px] truncate block">
                {componentDetails[selectedComponent]?.temp || `${currentTemp.toFixed(1)} °C`}
              </span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted block text-[10px]">Status</span>
              <span className="font-semibold text-accent-secondary text-[11px] truncate block">
                {componentDetails[selectedComponent]?.health || `${currentSoh.toFixed(1)}% SOH`}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Individual Battery Cell Module HUD & Matrix */}
        <div className="surface-card p-4 rounded-[10px] border border-border space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-border">
            <div>
              <span className="text-[10px] text-text-muted uppercase font-mono block">Micro-Cell Sensor</span>
              <span className="font-semibold text-primary-text text-sm">
                Module C{String(activeCell.cell_index).padStart(2, '0')} Telemetry
              </span>
            </div>
            <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-[4px] uppercase ${
              activeCell.status === 'WARNING' || activeCell.status === 'CRITICAL'
                ? 'bg-status-warning/10 text-status-warning border border-status-warning/30'
                : 'bg-status-healthy/10 text-status-healthy border border-status-healthy/30'
            }`}>
              {activeCell.status}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs font-mono">
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted block text-[10px]">Cell OCV</span>
              <span className="font-bold text-primary-text text-xs">{activeCell.voltage.toFixed(3)} V</span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted block text-[10px]">Core Temp</span>
              <span className={`font-bold text-xs ${
                activeCell.temperature > 50 ? 'text-status-critical' : 'text-accent-primary'
              }`}>
                {activeCell.temperature.toFixed(1)} °C
              </span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-text-muted block text-[10px]">Impedance</span>
              <span className="font-bold text-accent-secondary text-xs">{activeCell.internal_resistance.toFixed(4)} Ω</span>
            </div>
          </div>

          {/* 10 Module Channel Buttons */}
          <div className="pt-1 border-t border-border">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-text-muted font-mono">Select Module Brick (1–10):</span>
              <button
                onClick={() => {
                  setSelectedCellIndex(1);
                  setSelectedComponent('Battery Pack');
                }}
                className="text-[10px] text-text-muted hover:text-accent-primary transition-colors font-mono"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-5 gap-1 font-mono">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                const cellStatus = cellTelemetryItems.find((c) => c.cell_index === num)?.status || 'HEALTHY';
                const isWarning = cellStatus === 'WARNING' || cellStatus === 'CRITICAL';
                return (
                  <button
                    key={num}
                    onClick={() => handleSelectCell(num)}
                    className={`py-1 rounded-[4px] text-[10px] font-mono transition-colors border flex items-center justify-center gap-1 ${
                      activeCell.cell_index === num
                        ? 'bg-accent-primary text-white border-accent-primary font-bold shadow-xs'
                        : 'bg-surface-secondary text-text-muted border-border hover:text-primary-text hover:border-accent-primary'
                    }`}
                  >
                    {isWarning && <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />}
                    C{String(num).padStart(2, '0')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Exploded View Subsystem Breakdown Panel (Enhanced with 10 Subsystems) */}
      {explorationMode === 'exploded' && (
        <div className="surface-card p-4 rounded-[10px] border border-border space-y-2.5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2">
            <div>
              <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent-primary" />
                <span>10-Axis Exploded Engineering Disassembly</span>
              </h3>
              <p className="text-xs text-text-muted">
                Spatial decomposition along vertical, lateral, and longitudinal axes at {explodePercentage}% expansion
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                10 Subsystems Isolated
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 text-xs font-mono">
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[9px] text-text-muted block">01. Body Shell</span>
              <span className="font-semibold text-primary-text text-[11px] truncate block">+Y Lift</span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[9px] text-text-muted block">02. Glass Canopy</span>
              <span className="font-semibold text-accent-primary text-[11px] truncate block">+Y Max</span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[9px] text-text-muted block">03. Spaceframe</span>
              <span className="font-semibold text-text-muted text-[11px] truncate block">Center Datum</span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[9px] text-text-muted block">04. Ballistic Tray</span>
              <span className="font-semibold text-primary-text text-[11px] truncate block">-Y Drop</span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[9px] text-text-muted block">05. 10 Modules</span>
              <span className="font-semibold text-status-info text-[11px] truncate block">+/- X Out</span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[9px] text-text-muted block">06. Cu Busbars</span>
              <span className="font-semibold text-[#b87333] text-[11px] truncate block">+Y Lift</span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[9px] text-text-muted block">07. Cold Plate</span>
              <span className="font-semibold text-accent-secondary text-[11px] truncate block">-Y Lower</span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[9px] text-text-muted block">08. Dual Motors</span>
              <span className="font-semibold text-[#8b5cf6] text-[11px] truncate block">+/- Z Driveline</span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[9px] text-text-muted block">09. SiC Inverter</span>
              <span className="font-semibold text-[#eab308] text-[11px] truncate block">+Y / -Z Rear</span>
            </div>
            <div className="p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[9px] text-text-muted block">10. 4x Wheels</span>
              <span className="font-semibold text-primary-text text-[11px] truncate block">+/- X Out</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
