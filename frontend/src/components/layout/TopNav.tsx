'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useVehicle } from '@/context/VehicleContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Calendar,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  Car,
  Play,
  Square,
  Menu,
  Sun,
  Moon,
  Eye,
  Loader2,
  Check,
  AlertCircle,
} from 'lucide-react';

export const TopNav: React.FC = () => {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const {
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    activeScenario,
    isScenarioActivating,
    scenarioFeedback,
    setScenario,
    isSimulating,
    toggleSimulation,
    resetSimulation,
    setIsMobileMenuOpen,
  } = useVehicle();

  const [currentTime, setCurrentTime] = useState('');
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [showVehicleMenu, setShowVehicleMenu] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) +
          ' ' +
          now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/') return 'Overview';
    const clean = pathname.replace('/', '').replace('-', ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-background/95 backdrop-blur-sm border-b border-border px-3 sm:px-5 flex items-center justify-between select-none transition-colors duration-200">
      {/* Left: Mobile Trigger + Breadcrumbs */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-1.5 rounded-[6px] bg-surface-primary border border-border text-text-secondary hover:text-text-primary"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex items-center text-xs text-text-muted font-mono">
          <span>FLEET</span>
          <span className="mx-1.5 text-border">/</span>
          <span className="text-accent-primary font-semibold">
            {selectedVehicle ? selectedVehicle.vin : 'KA05ER7777'}
          </span>
          <span className="mx-1.5 text-border">/</span>
          <span className="text-primary-text font-sans font-medium">{getPageTitle()}</span>
        </div>

        {/* Muted Simulation Mode Chip */}
        <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] bg-surface-primary border border-border text-status-warning text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
          <span>SIMULATION: CAN-BMS 500k</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Theme Switcher (Day / Dark / Eye) */}
        <div className="flex items-center bg-surface-primary p-0.5 rounded-[6px] border border-border shadow-subtle">
          <button
            onClick={() => setTheme('day')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-xs transition-all ${
              theme === 'day'
                ? 'bg-surface-secondary text-primary-text font-semibold shadow-xs'
                : 'text-text-muted hover:text-primary-text'
            }`}
            title="Day Mode (Default Light)"
            aria-label="Switch to Day Mode"
          >
            <Sun className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span className="hidden xl:inline text-[11px]">Day</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-xs transition-all ${
              theme === 'dark'
                ? 'bg-surface-secondary text-primary-text font-semibold shadow-xs'
                : 'text-text-muted hover:text-primary-text'
            }`}
            title="Dark Mode"
            aria-label="Switch to Dark Mode"
          >
            <Moon className="w-4 h-4 text-accent-secondary flex-shrink-0" />
            <span className="hidden xl:inline text-[11px]">Dark</span>
          </button>
          <button
            onClick={() => setTheme('eye')}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-[4px] text-xs transition-all ${
              theme === 'eye'
                ? 'bg-surface-secondary text-primary-text font-semibold shadow-xs'
                : 'text-text-muted hover:text-primary-text'
            }`}
            title="Eye Protection Mode (Warm Comfort)"
            aria-label="Switch to Eye Protection Mode"
          >
            <Eye className="w-4 h-4 text-accent-primary flex-shrink-0" />
            <span className="hidden xl:inline text-[11px]">Eye Care</span>
          </button>
        </div>

        {/* Vehicle Selector */}
        <div className="relative">
          <button
            onClick={() => setShowVehicleMenu(!showVehicleMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-surface-primary hover:bg-surface-secondary border border-border text-xs font-medium text-primary-text transition-colors"
          >
            <Car className="w-4 h-4 text-accent-primary flex-shrink-0" />
            <span className="hidden sm:inline">{selectedVehicle ? selectedVehicle.name : 'Select Vehicle'}</span>
            <span className="sm:hidden">{selectedVehicle ? selectedVehicle.vin.slice(0, 6) : 'Fleet'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          </button>
          {showVehicleMenu && (
            <div className="absolute right-0 mt-1.5 w-60 rounded-[8px] bg-surface-primary border border-border shadow-elevated py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase font-semibold text-text-muted border-b border-border">
                Configured EV Assets
              </div>
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicle(v);
                    setShowVehicleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-surface-secondary transition-colors ${
                    selectedVehicle?.id === v.id ? 'bg-surface-secondary text-accent-primary font-semibold' : 'text-primary-text'
                  }`}
                >
                  <span>{v.name}</span>
                  <span className="text-[10px] text-text-muted font-mono">{v.vin} • {v.battery_chemistry}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Operating Scenario Selector */}
        <div className="relative">
          <button
            onClick={() => !isScenarioActivating && setShowScenarioMenu(!showScenarioMenu)}
            disabled={isScenarioActivating}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] bg-surface-primary hover:bg-surface-secondary border border-border text-xs font-medium transition-colors ${
              isScenarioActivating ? 'opacity-70 cursor-wait' : 'text-primary-text'
            }`}
            title="Operational profile scenario"
          >
            {isScenarioActivating ? (
              <Loader2 className="w-4 h-4 text-accent-primary animate-spin flex-shrink-0" />
            ) : (
              <SlidersHorizontal className="w-4 h-4 text-accent-secondary flex-shrink-0" />
            )}
            <span className="capitalize text-text-secondary">
              <span className="hidden md:inline">Scenario: </span>
              <span className="text-primary-text font-semibold">{activeScenario.replace('_', ' ')}</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          </button>
          {showScenarioMenu && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-[8px] bg-surface-primary border border-border shadow-elevated py-1 z-50 text-xs">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-text-muted border-b border-border tracking-wider">
                Select Simulation Scenario
              </div>
              {[
                { id: 'normal', label: '1. Standard Driving Profile', desc: 'Nominal discharge & balanced cells' },
                { id: 'charging', label: '2. DC Fast Charging (CCS2)', desc: '+75A positive charge & cell warming' },
                { id: 'discharging', label: '3. High Dynamic Load', desc: '-58A peak demand & voltage sag' },
                { id: 'high_temp', label: '4. Thermal Stress Zone', desc: '>54°C pack heat & critical alerts' },
                { id: 'cell_imbalance', label: '5. Cell Imbalance Injected', desc: '520mV Delta-V & C01 critical' },
                { id: 'aging', label: '6. High Degradation Run', desc: '74.2% SOH, 840 cycles, 0.165Ω' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setScenario(s.id);
                    setShowScenarioMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-surface-secondary transition-colors flex items-start justify-between ${
                    activeScenario === s.id ? 'bg-surface-secondary text-accent-primary font-semibold' : 'text-primary-text'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-xs">{s.label}</span>
                    <span className="text-[10px] text-text-muted font-normal">{s.desc}</span>
                  </div>
                  {activeScenario === s.id && (
                    <Check className="w-4 h-4 text-accent-primary flex-shrink-0 mt-0.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Simulation Play / Pause / Reset */}
        <div className="flex items-center gap-1 bg-surface-primary p-0.5 rounded-[6px] border border-border">
          <button
            onClick={toggleSimulation}
            className={`p-1.5 rounded-[4px] transition-colors ${
              isSimulating
                ? 'bg-surface-secondary text-status-warning hover:bg-surface-elevated'
                : 'bg-surface-secondary text-accent-primary hover:bg-surface-elevated'
            }`}
            title={isSimulating ? 'Pause Telemetry Bus' : 'Resume Telemetry Bus'}
            aria-label={isSimulating ? 'Pause Telemetry Bus' : 'Resume Telemetry Bus'}
          >
            {isSimulating ? <Square className="w-3.5 h-3.5 fill-current flex-shrink-0" /> : <Play className="w-3.5 h-3.5 fill-current flex-shrink-0" />}
          </button>
          <button
            onClick={resetSimulation}
            className="p-1.5 rounded-[4px] text-text-muted hover:text-primary-text hover:bg-surface-secondary transition-colors"
            title="Reset Simulation State"
            aria-label="Reset Simulation State"
          >
            <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
          </button>
        </div>

        {/* Industrial Date & Clock */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 text-xs text-text-secondary font-mono tabular-nums bg-surface-primary rounded-[6px] border border-border">
          <Calendar className="w-4 h-4 text-text-muted flex-shrink-0" />
          <span>{currentTime || 'Syncing...'}</span>
        </div>
      </div>
      {/* Scenario Activation Feedback Toast */}
      {scenarioFeedback && (
        <div className={`fixed top-16 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-medium shadow-elevated border transition-all ${
          scenarioFeedback.type === 'success'
            ? 'bg-surface-primary text-accent-primary border-accent-primary/40'
            : 'bg-surface-primary text-status-critical border-status-critical/40'
        }`}>
          {scenarioFeedback.type === 'success' ? (
            <Check className="w-4 h-4 text-accent-primary flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-status-critical flex-shrink-0" />
          )}
          <span>{scenarioFeedback.message}</span>
        </div>
      )}
    </header>
  );
};
