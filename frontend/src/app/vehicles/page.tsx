'use client';

import React, { useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { Car, BatteryCharging, Zap, Plus, Check, Trash2 } from 'lucide-react';

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
      const res = await fetch('http://127.0.0.1:8000/api/v1/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVehicle),
      });
      if (res.ok) {
        setShowAddModal(false);
        refreshVehicles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F4F7FB] tracking-tight flex items-center gap-2">
            Connected Vehicle Fleet Management
          </h1>
          <p className="text-xs text-[#9BA9BB]">
            Manage EV battery pack configurations, chemistry profiles and telemetry channels
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#55D889] hover:bg-[#32B96F] text-xs font-bold text-[#080D18] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vehicle</span>
        </button>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vehicles.map((v) => {
          const isSelected = selectedVehicle?.id === v.id;
          return (
            <div
              key={v.id}
              className={`glass-card p-6 flex flex-col justify-between border ${
                isSelected ? 'border-[#55D889] shadow-glow-green' : 'border-[#263449]'
              } rounded-2xl transition-all duration-200`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#172337] text-[#55D889]">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#F4F7FB]">{v.name}</h3>
                      <span className="text-[10px] text-[#9BA9BB] font-mono">{v.vin}</span>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#55D889]/20 text-[#55D889] border border-[#55D889]/40">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-2 py-3 border-y border-[#263449]/50 text-xs">
                  <div className="flex justify-between text-[#9BA9BB]">
                    <span>Battery Chemistry:</span>
                    <span className="text-[#F4F7FB] font-medium">{v.battery_chemistry}</span>
                  </div>
                  <div className="flex justify-between text-[#9BA9BB]">
                    <span>Pack Energy Capacity:</span>
                    <span className="text-[#55D889] font-bold">{v.pack_capacity_kwh} kWh</span>
                  </div>
                  <div className="flex justify-between text-[#9BA9BB]">
                    <span>Nominal Voltage:</span>
                    <span className="text-[#F4F7FB] font-mono">{v.nominal_voltage} V</span>
                  </div>
                  <div className="flex justify-between text-[#9BA9BB]">
                    <span>Cell Configuration:</span>
                    <span className="text-[#F4F7FB] font-mono">{v.cell_count} Cells (10S Pack)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  onClick={() => setSelectedVehicle(v)}
                  disabled={isSelected}
                  className={`w-full py-2 rounded-lg text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-[#172337] text-[#9BA9BB] cursor-default'
                      : 'bg-[#55D889] text-[#080D18] hover:bg-[#32B96F]'
                  }`}
                >
                  {isSelected ? 'Currently Monitored' : 'Switch Active Telemetry'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-[#111B2B] border border-[#263449] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-[#F4F7FB]">Enroll New EV in Fleet</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#9BA9BB] block mb-1">Vehicle Model Name</label>
                <input
                  required
                  type="text"
                  value={newVehicle.name}
                  onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                  placeholder="e.g. VoltSense Model Alpha"
                  className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] outline-none"
                />
              </div>
              <div>
                <label className="text-[#9BA9BB] block mb-1">VIN (Vehicle Identification Number)</label>
                <input
                  required
                  type="text"
                  value={newVehicle.vin}
                  onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                  placeholder="e.g. VS99X004588Z"
                  className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] font-mono outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#9BA9BB] block mb-1">Pack Capacity (kWh)</label>
                  <input
                    type="number"
                    value={newVehicle.pack_capacity_kwh}
                    onChange={(e) => setNewVehicle({ ...newVehicle, pack_capacity_kwh: Number(e.target.value) })}
                    className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] outline-none"
                  />
                </div>
                <div>
                  <label className="text-[#9BA9BB] block mb-1">Nominal Voltage (V)</label>
                  <input
                    type="number"
                    value={newVehicle.nominal_voltage}
                    onChange={(e) => setNewVehicle({ ...newVehicle, nominal_voltage: Number(e.target.value) })}
                    className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-1/2 py-2.5 rounded-lg bg-[#172337] text-[#9BA9BB] font-semibold text-xs hover:bg-[#263449]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-lg bg-[#55D889] text-[#080D18] font-bold text-xs hover:bg-[#32B96F]"
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
