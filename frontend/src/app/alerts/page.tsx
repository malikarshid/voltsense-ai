'use client';

import React, { useEffect, useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { fetchAlerts, acknowledgeAlert, resolveAlert } from '@/lib/api';
import { Alert } from '@/types';
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  ShieldAlert,
  Clock,
  Check,
  RotateCcw,
} from 'lucide-react';

export default function AlertsPage() {
  const { selectedVehicle } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);

  const loadAlerts = async (sev?: string) => {
    try {
      setLoading(true);
      const data = await fetchAlerts(sev === 'ALL' ? undefined : sev);
      setAlerts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts(filterSeverity);
  }, [filterSeverity]);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveAlert(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, resolved: true, acknowledged: true } : a))
      );
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F4F7FB] tracking-tight flex items-center gap-2">
            Alerts & Anomaly Events
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#EF6262]/20 text-[#EF6262] border border-[#EF6262]/40">
              {alerts.filter((a) => !a.resolved).length} Active
            </span>
          </h1>
          <p className="text-xs text-[#9BA9BB]">
            Threshold violations, thermal excursion flags and BMS CAN fault codes
          </p>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-2 bg-[#111B2B] p-1.5 rounded-xl border border-[#263449]">
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filterSeverity === sev
                  ? 'bg-[#172337] text-[#55D889] border border-[#55D889]/30'
                  : 'text-[#9BA9BB] hover:text-[#F4F7FB]'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="glass-card p-12 text-center text-[#9BA9BB]">
            <CheckCircle2 className="w-12 h-12 text-[#55D889] mx-auto mb-3" />
            <div className="text-base font-semibold text-[#F4F7FB]">
              All Battery Subsystems Nominal
            </div>
            <p className="text-xs mt-1">No active diagnostic alerts or cell imbalance triggers found.</p>
          </div>
        ) : (
          alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';
            const borderColor = isCritical
              ? 'border-[#EF6262]/50'
              : isWarning
              ? 'border-[#F4C44E]/50'
              : 'border-[#4C9FFF]/50';

            const badgeBg = isCritical
              ? 'bg-[#EF6262]/20 text-[#EF6262]'
              : isWarning
              ? 'bg-[#F4C44E]/20 text-[#F4C44E]'
              : 'bg-[#4C9FFF]/20 text-[#4C9FFF]';

            return (
              <div
                key={alert.id}
                className={`glass-card p-5 border ${borderColor} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl ${badgeBg} flex-shrink-0 mt-0.5`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${badgeBg}`}>
                        {alert.severity}
                      </span>
                      <span className="text-xs font-bold text-[#F4F7FB]">
                        {alert.alert_type.replace('_', ' ')}
                      </span>
                      {alert.cell_index && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#172337] text-[#9BA9BB] border border-[#263449]">
                          Cell {alert.cell_index}
                        </span>
                      )}
                      {alert.resolved && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#55D889]/20 text-[#55D889] border border-[#55D889]/30">
                          Resolved
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-[#F4F7FB]">
                      {alert.message}
                    </div>
                    <div className="text-xs text-[#9BA9BB]">
                      <b className="text-[#55D889]">Recommendation:</b> {alert.recommendation}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-0 border-[#263449]">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#172337] hover:bg-[#263449] text-xs font-medium text-[#F4F7FB] border border-[#263449] transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#55D889] hover:bg-[#32B96F] text-xs font-bold text-[#080D18] transition-colors"
                    >
                      Resolve Alert
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
