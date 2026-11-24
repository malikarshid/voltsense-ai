'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vehicle } from '@/types';
import { fetchVehicles, controlSimulator, fetchSimulatorStatus } from '@/lib/api';

interface VehicleContextType {
  vehicles: Vehicle[];
  selectedVehicle: Vehicle | null;
  setSelectedVehicle: (vehicle: Vehicle) => void;
  activeScenario: string;
  isSimulating: boolean;
  setScenario: (scenario: string) => Promise<void>;
  toggleSimulation: () => Promise<void>;
  resetSimulation: () => Promise<void>;
  refreshVehicles: () => Promise<void>;
  loading: boolean;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

export const VehicleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeScenario, setActiveScenarioState] = useState<string>('normal');
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshVehicles = async () => {
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
  };

  useEffect(() => {
    refreshVehicles();
    fetchSimulatorStatus()
      .then((status) => {
        setIsSimulating(status.is_running);
        setActiveScenarioState(status.scenario);
      })
      .catch((e) => console.error('Failed to fetch initial simulator status', e));
  }, []);

  const setScenario = async (scenario: string) => {
    try {
      const updated = await controlSimulator('scenario', scenario);
      setActiveScenarioState(updated.scenario);
    } catch (e) {
      console.error('Error changing scenario:', e);
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
        setScenario,
        toggleSimulation,
        resetSimulation,
        refreshVehicles,
        loading,
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
