'use client';

import React, { useEffect, useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { fetchMaintenance, createMaintenance } from '@/lib/api';
import { MaintenanceRecord } from '@/types';
import { Wrench, Plus, CheckCircle, Clock, AlertTriangle, UserCheck } from 'lucide-react';

export default function MaintenancePage() {
  const { selectedVehicle } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [technician, setTechnician] = useState('Lead BMS Engineer');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const data = await fetchMaintenance();
      setRecords(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, [vehicleId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMaintenance({
        vehicle_id: selectedVehicle?.id || '61544df9-c754-4c49-bac3-6097e6a3a43d',
        title,
        priority,
        technician,
        notes,
      });
      setShowModal(false);
      setTitle('');
      setNotes('');
      loadData();
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
            Predictive Maintenance Management
          </h1>
          <p className="text-xs text-[#9BA9BB]">
            Automated maintenance scheduling triggered by AI anomaly detection and BMS diagnostics
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#55D889] hover:bg-[#32B96F] text-xs font-bold text-[#080D18] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Service Action</span>
        </button>
      </div>

      {/* Maintenance Records List */}
      <div className="space-y-3">
        {records.length === 0 ? (
          <div className="glass-card p-12 text-center text-[#9BA9BB]">
            <CheckCircle className="w-12 h-12 text-[#55D889] mx-auto mb-3" />
            <div className="text-base font-semibold text-[#F4F7FB]">
              No Pending Maintenance Tasks
            </div>
            <p className="text-xs mt-1">Pack cooling systems, contactors, and balancing shunts operating nominally.</p>
          </div>
        ) : (
          records.map((rec) => {
            const isUrgent = rec.priority === 'Urgent' || rec.priority === 'High';
            return (
              <div
                key={rec.id}
                className="glass-card p-5 border border-[#263449] hover:border-[#3b506d] transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-xl ${isUrgent ? 'bg-[#EF6262]/20 text-[#EF6262]' : 'bg-[#55D889]/20 text-[#55D889]'}`}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        isUrgent ? 'bg-[#EF6262]/20 text-[#EF6262]' : 'bg-[#172337] text-[#9BA9BB]'
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#172337] text-[#55D889] border border-[#263449]">
                        {rec.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-[#F4F7FB]">
                      {rec.title}
                    </div>
                    {rec.notes && (
                      <div className="text-xs text-[#9BA9BB] max-w-2xl">
                        {rec.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-[#9BA9BB] border-t md:border-0 border-[#263449] pt-2 md:pt-0 w-full md:w-auto text-right space-y-1">
                  <div>Assigned: <b className="text-[#F4F7FB]">{rec.technician}</b></div>
                  <div className="text-[10px] text-[#64748B]">Created: {new Date(rec.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-[#111B2B] border border-[#263449] rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-[#F4F7FB]">Schedule Maintenance Record</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#9BA9BB] block mb-1">Service Action Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cell 01 Passive Balancing & Contactor Inspection"
                  className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#9BA9BB] block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#9BA9BB] block mb-1">Assigned Specialist</label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#9BA9BB] block mb-1">Engineering Notes</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specific BMS parameters, torque values, or cooling glycol test criteria..."
                  className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-1/2 py-2.5 rounded-lg bg-[#172337] text-[#9BA9BB] font-semibold text-xs hover:bg-[#263449]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 py-2.5 rounded-lg bg-[#55D889] text-[#080D18] font-bold text-xs hover:bg-[#32B96F]"
              >
                Schedule Service
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
