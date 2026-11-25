'use client';

import React, { useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { createVehicle } from '@/lib/api';
import { Car, Plus } from 'lucide-react';

export default function VehiclesPage() {
  const { vehicles, selectedVehicle, setSelectedVehicle, refreshVehicles } = useVehicle();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    name: '',
    vin: '',
    model_year: 2024,
    battery_chemistry: 'NMC',
    pack_capacity_kwh: 75.0,
    original_capacity_ah: 100.0,
    current_capacity_ah: 95.0,
    nominal_voltage: 400.0,
    max_voltage: 450.0,
    min_voltage: 320.0,
    cell_count: 10,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createVehicle(newVehicle);
      setShowAddModal(false);
      refreshVehicles();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            Connected Vehicle Fleet Configuration
          </h1>
          <p className="text-xs text-text-muted">
            Configure EV battery pack parameters, chemistry specifications, and telemetry channels
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-surface-secondary hover:bg-surface-elevated text-xs font-semibold text-accent-primary border border-border hover:border-accent-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vehicles.map((v) => {
          const isSelected = selectedVehicle?.id === v.id;
          return (
            <div
              key={v.id}
              className={`surface-card p-5 flex flex-col justify-between border ${
                isSelected ? 'border-accent-primary' : 'border-border'
              } transition-all duration-150`}
            >
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-[6px] bg-surface-secondary text-accent-primary border border-border">
                      <Car className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-primary-text">{v.name}</h3>
                      <span className="text-[10px] text-text-muted font-mono">{v.vin}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium bg-surface-secondary text-accent-primary border border-accent-primary/40">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 py-1 text-xs">
                  <div className="flex justify-between text-text-muted">
                    <span>Battery Chemistry</span>
                    <span className="text-primary-text font-medium">{v.battery_chemistry}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Pack Energy Capacity</span>
                    <span className="text-accent-primary font-semibold font-mono">{v.pack_capacity_kwh} kWh</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Nominal Voltage</span>
                    <span className="text-primary-text font-mono">{v.nominal_voltage} V</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>Cell Configuration</span>
                    <span className="text-primary-text font-mono">{v.cell_count} Cells (10S Pack)</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60">
                <button
                  onClick={() => setSelectedVehicle(v)}
                  disabled={isSelected}
                  className={`w-full py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-surface-secondary text-text-muted border border-border cursor-default'
                      : 'bg-surface-secondary hover:bg-surface-elevated text-primary-text border border-border hover:border-accent-primary hover:text-accent-primary'
                  }`}
                >
                  {isSelected ? 'Currently Monitored' : 'Select Active Asset'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="surface-card p-6 rounded-[12px] max-w-lg w-full space-y-4 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-primary-text border-b border-border pb-2">Enroll New Vehicle Asset</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-text-secondary font-medium block mb-1">Vehicle Model Name</label>
                <input
                  required
                  type="text"
                  value={newVehicle.name}
                  onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                  placeholder="e.g. VoltSense Model Alpha"
                  className="input-standard w-full"
                />
              </div>
              <div>
                <label className="text-text-secondary font-medium block mb-1">VIN (Vehicle Identification Number)</label>
                <input
                  required
                  type="text"
                  value={newVehicle.vin}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                  placeholder="e.g. VS99X004588Z"
                  className="input-standard w-full font-mono uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text-secondary font-medium block mb-1">Pack Capacity (kWh)</label>
                  <input
                    type="number"
                    value={newVehicle.pack_capacity_kwh}
                    onChange={(e) => setNewVehicle({ ...newVehicle, pack_capacity_kwh: Number(e.target.value) })}
                    className="input-standard w-full font-mono"
                  />
                </div>
                <div>
                  <label className="text-text-secondary font-medium block mb-1">Nominal Voltage (V)</label>
                  <input
                    type="number"
                    value={newVehicle.nominal_voltage}
                    onChange={(e) => setNewVehicle({ ...newVehicle, nominal_voltage: Number(e.target.value) })}
                    className="input-standard w-full font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-standard w-1/2 bg-surface-secondary text-text-secondary hover:bg-surface-elevated hover:text-primary-text border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-standard w-1/2 bg-accent-primary hover:opacity-90 text-white font-semibold"
              >
                Enroll Vehicle
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
