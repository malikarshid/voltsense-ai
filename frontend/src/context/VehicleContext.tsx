'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Vehicle } from '@/types';
import { fetchVehicles, controlSimulator, fetchSimulatorStatus, activateSimulatorScenario } from '@/lib/api';

export interface ScenarioFeedback {
  type: 'success' | 'error';
  message: string;
}

interface VehicleContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle) => void;
  activeScenario: string;
  isSimulating: boolean;
  isScenarioActivating: boolean;
  scenarioChangeCount: number;
  latestTelemetry: any | null;
  scenarioFeedback: ScenarioFeedback | null;
  setScenario: (scenario: string) => Promise<void>;
  toggleSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  loading: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeScenario, setActiveScenarioState] = useState<string>('normal');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [isScenarioActivating, setIsScenarioActivating] = useState<boolean>(false);
  const [scenarioChangeCount, setScenarioChangeCount] = useState<number>(0);
  const [latestTelemetry, setLatestTelemetry] = useState<any | null>(null);
  const [scenarioFeedback, setScenarioFeedback] = useState<ScenarioFeedback | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('voltsense_sidebar_collapsed');
      if (saved !== null) {
        setIsSidebarCollapsedState(saved === 'true');
      }
    } catch (e) {}
  }, []);

  const setIsSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    try {
      localStorage.setItem('voltsense_sidebar_collapsed', String(collapsed));
    } catch (e) {}
  };

  const refreshVehicles = useCallback(async () => {
    try {
      const data = await fetchVehicles();
      setVehicles(data);
      if (!selectedVehicle && data.length > 0) {
        setSelectedVehicle(data[0]);
      }
    } catch (e) {
      console.error('Failed to load vehicles:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedVehicle]);

  useEffect(() => {
    refreshVehicles();
    fetchSimulatorStatus()
      .then((status) => {
        setIsSimulating(status.is_running);
        setActiveScenarioState(status.scenario);
      })
      .catch((e) => console.error('Failed to fetch initial simulator status', e));
  }, [refreshVehicles]);

  const setScenario = async (scenario: string) => {
    if (isScenarioActivating) return;
    setIsScenarioActivating(true);
    const targetVin = selectedVehicle?.vin || 'KA05ER7777';
    try {
      const response = await activateSimulatorScenario(scenario, targetVin);
      setActiveScenarioState(response.active_scenario);
      if (response.telemetry && Object.keys(response.telemetry).length > 0) {
        setLatestTelemetry(response.telemetry);
      }
      setScenarioChangeCount((c) => c + 1);
      setScenarioFeedback({
        type: 'success',
        message: `Scenario Activated: ${response.metadata?.name || scenario}`,
      });
      setTimeout(() => setScenarioFeedback(null), 4000);
    } catch (e: any) {
      console.error('Error changing scenario:', e);
      setScenarioFeedback({
        type: 'error',
        message: `Failed to activate scenario: ${e?.message || 'Network error'}`,
      });
      setTimeout(() => setScenarioFeedback(null), 4000);
    } finally {
      setIsScenarioActivating(false);
    }
  };

  const toggleSimulation = async () => {
    try {
      const nextAction = isSimulating ? 'stop' : 'start';
      const updated = await controlSimulator(nextAction, activeScenario);
      setIsSimulating(updated.is_running);
    } catch (e) {
      console.error('Error toggling simulation:', e);
    }
  };

  const resetSimulation = async () => {
    try {
      const updated = await controlSimulator('reset', 'normal');
      setIsSimulating(updated.is_running);
      setActiveScenarioState(updated.scenario);
      setScenarioChangeCount((c) => c + 1);
      setScenarioFeedback({
        type: 'success',
        message: 'Simulation reset to Standard Driving Profile',
      });
      setTimeout(() => setScenarioFeedback(null), 3000);
    } catch (e) {
      console.error('Error resetting simulation:', e);
    }
  };

  return (
    <VehicleContext.Provider
      value={{
        vehicles,
        selectedVehicle,
        setSelectedVehicle,
        activeScenario,
        isSimulating,
        isScenarioActivating,
        scenarioChangeCount,
        latestTelemetry,
        scenarioFeedback,
        setScenario,
        toggleSimulation,
        resetSimulation,
        refreshVehicles,
        loading,
        isMobileMenuOpen,
        setIsMobileMenuOpen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
      }}
    >
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicle = () => {
  const context = useContext(VehicleContext);
  if (!context) {
    throw new Error('useVehicle must be used within a VehicleProvider');
  }
  return context;
};
