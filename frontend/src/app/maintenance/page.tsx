'use client';

import React, { useEffect, useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { fetchMaintenance, createMaintenance } from '@/lib/api';
import { MaintenanceRecord } from '@/types';
import { Wrench, Plus, CheckCircle } from 'lucide-react';

export default function MaintenancePage() {
  const { selectedVehicle, vehicles } = useVehicle();
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
    const targetVehicleId = selectedVehicle?.id || (vehicles.length > 0 ? vehicles[0].id : '');
    if (!targetVehicleId) return;
    try {
      await createMaintenance({
        vehicle_id: targetVehicleId,
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
    <div className="space-y-4 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            Predictive Maintenance Management
          </h1>
          <p className="text-xs text-text-muted">
            Maintenance task logs triggered by AI degradation predictions and CAN-BMS diagnostics
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-surface-secondary hover:bg-surface-elevated text-xs font-semibold text-accent-primary border border-border hover:border-accent-primary transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Schedule Service Action</span>
        </button>
      </div>

      {/* Maintenance Records List */}
      <div className="space-y-3.5">
        {records.length === 0 ? (
          <div className="surface-card p-12 text-center text-text-muted">
            <CheckCircle className="w-12 h-12 text-accent-primary mx-auto mb-3" />
            <div className="text-base font-semibold text-primary-text">
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
                className="surface-card p-5 sm:p-6 border border-border hover:border-accent-primary/50 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-subtle"
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-[8px] bg-surface-secondary ${isUrgent ? 'text-status-critical' : 'text-accent-primary'} border border-border flex-shrink-0 mt-0.5`}>
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] border uppercase ${
                        isUrgent ? 'text-status-critical border-status-critical/30 bg-status-critical/10' : 'text-text-muted border-border bg-surface-secondary'
                      }`}>
                        {rec.priority} Priority
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-accent-primary/10 text-accent-primary border border-accent-primary/30 font-semibold">
                        {rec.status}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-primary-text">
                      {rec.title}
                    </div>
                    {rec.notes && (
                      <div className="text-xs text-text-secondary max-w-2xl leading-relaxed">
                        {rec.notes}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-xs text-text-muted border-t md:border-0 border-border pt-3 md:pt-0 w-full md:w-auto text-right font-mono space-y-1">
                  <div>Assigned: <span className="text-primary-text font-semibold">{rec.technician}</span></div>
                  <div className="text-[11px] text-text-muted">Logged: {new Date(rec.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="surface-card p-6 rounded-[12px] max-w-lg w-full space-y-4 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-primary-text border-b border-border pb-2.5">
              Schedule Service Action
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-text-secondary font-medium block mb-1">Service Action Title</label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Inspect Coolant Loop Pressure"
                  className="input-standard w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-text-secondary font-medium block mb-1">Priority Level</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input-standard w-full"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-text-secondary font-medium block mb-1">Assigned Lead</label>
                  <input
                    type="text"
                    value={technician}
                    onChange={(e) => setTechnician(e.target.value)}
                    className="input-standard w-full font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-text-secondary font-medium block mb-1">Diagnostic Notes & Scope</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Triggered by cell 01 passive balance thermal delta..."
                  className="w-full bg-surface-secondary border border-border rounded-[6px] p-2.5 text-xs text-primary-text outline-none resize-none focus:border-accent-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn-standard w-1/2 bg-surface-secondary text-text-secondary hover:bg-surface-elevated hover:text-primary-text border border-border"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-standard w-1/2 bg-accent-primary hover:opacity-90 text-white font-semibold shadow-subtle"
              >
                Commit Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
