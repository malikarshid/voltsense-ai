'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useVehicle } from '@/context/VehicleContext';
import {
  Calendar,
  RefreshCw,
  Bell,
  User,
  SlidersHorizontal,
  ChevronDown,
  Car,
  Play,
  Square,
  AlertCircle,
  Menu,
} from 'lucide-react';

export const TopNav: React.FC = () => {
  const pathname = usePathname();
  const {
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    activeScenario,
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
          })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard';
    const clean = pathname.replace('/', '').replace('-', ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#080D18]/90 backdrop-blur-md border-b border-[#263449] px-4 md:px-6 flex items-center justify-between">
      {/* Left: Hamburger (Mobile) + Breadcrumb & Vehicle ID */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-lg bg-[#111B2B] border border-[#263449] text-[#9BA9BB] hover:text-white"
          title="Open Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="hidden sm:flex items-center text-xs text-[#9BA9BB]">
          <span>Vehicles</span>
          <span className="mx-2 text-[#263449]">&gt;</span>
          <span className="text-[#55D889] font-medium">
            {selectedVehicle ? selectedVehicle.vin : 'KA05ER7777'}
          </span>
          <span className="mx-2 text-[#263449]">&gt;</span>
          <span className="text-[#F4F7FB] font-medium">{getPageTitle()}</span>
        </div>

        {/* Simulation Mode Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4C44E]/10 border border-[#F4C44E]/30 text-[#F4C44E] text-[11px] font-semibold">
          <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
          <span>SIMULATION MODE (CAN-BMS Synthetic)</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Vehicle Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowVehicleMenu(!showVehicleMenu)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#111B2B] hover:bg-[#172337] border border-[#263449] text-xs font-medium text-[#F4F7FB] transition-colors"
          >
            <Car className="w-3.5 h-3.5 text-[#55D889]" />
            <span className="hidden sm:inline">{selectedVehicle ? selectedVehicle.name : 'Select Vehicle'}</span>
            <span className="sm:hidden">{selectedVehicle ? selectedVehicle.vin.slice(0, 6) : 'Fleet'}</span>
            <ChevronDown className="w-3 h-3 text-[#9BA9BB]" />
          </button>
          {showVehicleMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#111B2B] border border-[#263449] shadow-xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-[#9BA9BB] border-b border-[#263449]/50">
                Connected EV Fleet
              </div>
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVehicle(v);
                    setShowVehicleMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-[#172337] transition-colors ${
                    selectedVehicle?.id === v.id ? 'bg-[#172337]/70 text-[#55D889]' : 'text-[#F4F7FB]'
                  }`}
                >
                  <span className="font-semibold">{v.name}</span>
                  <span className="text-[10px] text-[#9BA9BB]">{v.vin} • {v.battery_chemistry}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Operating Scenario Selector */}
        <div className="relative">
          <button
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#111B2B] hover:bg-[#172337] border border-[#263449] text-xs font-medium text-[#F4F7FB]"
            title="Inject real-time operational simulation scenario"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#4C9FFF]" />
            <span className="hidden md:inline capitalize">Scenario: {activeScenario.replace('_', ' ')}</span>
            <span className="md:hidden capitalize">{activeScenario.slice(0, 4)}</span>
            <ChevronDown className="w-3 h-3 text-[#9BA9BB]" />
          </button>
          {showScenarioMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#111B2B] border border-[#263449] shadow-xl py-1 z-50 text-xs">
              {[
                { id: 'normal', label: '1. Normal Driving' },
                { id: 'charging', label: '2. DC Fast Charging' },
                { id: 'discharging', label: '3. Heavy Acceleration' },
                { id: 'high_temp', label: '4. Thermal Stress' },
                { id: 'cell_imbalance', label: '5. Cell 1 Imbalance' },
                { id: 'voltage_anomaly', label: '6. Voltage Anomaly' },
                { id: 'comm_fail', label: '7. BMS Comm Drop' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setScenario(s.id);
                    setShowScenarioMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-[#172337] transition-colors ${
                    activeScenario === s.id ? 'text-[#55D889] font-bold' : 'text-[#F4F7FB]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Simulator Play/Pause & Reset */}
        <div className="flex items-center gap-1 bg-[#111B2B] p-1 rounded-lg border border-[#263449]">
          <button
            onClick={toggleSimulation}
            className={`p-1.5 rounded text-xs transition-colors ${
              isSimulating ? 'text-[#EF6262] hover:bg-[#172337]' : 'text-[#55D889] hover:bg-[#172337]'
            }`}
            title={isSimulating ? 'Pause Simulator' : 'Start Simulator'}
          >
            {isSimulating ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <button
            onClick={resetSimulation}
            className="p-1.5 rounded text-xs text-[#9BA9BB] hover:text-white hover:bg-[#172337] transition-colors"
            title="Reset Simulation State"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Date/Time Badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111B2B] border border-[#263449] text-xs text-[#9BA9BB]">
          <Calendar className="w-3.5 h-3.5 text-[#55D889]" />
          <span>{currentTime || 'Syncing clock...'}</span>
        </div>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg bg-[#111B2B] hover:bg-[#172337] border border-[#263449] text-[#9BA9BB] hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF6262]" />
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#263449]">
          <div className="w-8 h-8 rounded-full bg-[#172337] border border-[#55D889]/40 flex items-center justify-center text-[#55D889]">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden lg:flex flex-col">
            <span className="text-xs font-semibold text-[#F4F7FB]">Lead BMS Operator</span>
            <span className="text-[10px] text-[#55D889]">Online • CAN Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
