'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { fetchAlerts, acknowledgeAlert, resolveAlert } from '@/lib/api';
import { Alert } from '@/types';
import {
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  Check,
} from 'lucide-react';

export default function AlertsPage() {
  const { selectedVehicle, activeScenario, scenarioChangeCount } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
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
  }, [filterSeverity, activeScenario, scenarioChangeCount]);

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

  const processedAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (searchQuery.trim() === '') return true;
      const q = searchQuery.toLowerCase();
      return (
        a.message.toLowerCase().includes(q) ||
        a.alert_type.toLowerCase().includes(q) ||
        a.recommendation.toLowerCase().includes(q) ||
        (a.cell_index && `cell ${a.cell_index}`.includes(q))
      );
    });
  }, [alerts, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            Alerts & Anomaly Events
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-[4px] bg-status-warning/10 text-status-warning border border-status-warning/30 font-semibold">
              {alerts.filter((a) => !a.resolved).length} Active
            </span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Threshold violations, thermal excursion flags, and CAN-BMS diagnostic trouble codes
          </p>
        </div>

        {/* Severity Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search alerts or cells..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-standard pl-9 pr-3 text-xs w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-primary p-1 rounded-[6px] border border-border">
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-[4px] text-xs font-medium transition-colors ${
                  filterSeverity === sev
                    ? 'bg-surface-secondary text-accent-primary border border-border font-semibold'
                    : 'text-text-muted hover:text-primary-text'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3.5">
        {processedAlerts.length === 0 ? (
          <div className="surface-card p-12 text-center text-text-muted">
            <CheckCircle2 className="w-12 h-12 text-accent-primary mx-auto mb-3" />
            <div className="text-base font-semibold text-primary-text">
              All Battery Subsystems Nominal
            </div>
            <p className="text-xs mt-1">No active diagnostic alerts or cell imbalance triggers match your filters.</p>
          </div>
        ) : (
          processedAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';
            const borderColor = isCritical
              ? 'border-status-critical/60'
              : isWarning
              ? 'border-status-warning/60'
              : 'border-border';

            const badgeColor = isCritical
              ? 'text-status-critical border-status-critical/30 bg-status-critical/10'
              : isWarning
              ? 'text-status-warning border-status-warning/30 bg-status-warning/10'
              : 'text-accent-secondary border-accent-secondary/30 bg-accent-secondary/10';

            return (
              <div
                key={alert.id}
                className={`surface-card p-5 sm:p-6 border ${borderColor} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-subtle`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`p-2.5 rounded-[8px] bg-surface-secondary ${isCritical ? 'text-status-critical' : isWarning ? 'text-status-warning' : 'text-accent-secondary'} flex-shrink-0 mt-0.5 border border-border`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] border uppercase ${badgeColor}`}>
                        {alert.severity}
                      </span>
                      <span className="text-sm font-semibold text-primary-text">
                        {alert.alert_type.replace(/_/g, ' ')}
                      </span>
                      {alert.cell_index && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-surface-secondary text-primary-text border border-border font-medium">
                          Cell Module C{String(alert.cell_index).padStart(2, '0')}
                        </span>
                      )}
                      {alert.resolved && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-accent-primary/10 text-accent-primary border border-accent-primary/30 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Resolved
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-medium text-primary-text leading-relaxed">
                      {alert.message}
                    </div>
                    <div className="text-xs text-text-secondary">
                      <span className="text-accent-primary font-semibold">Recommended Remediation:</span> {alert.recommendation}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-0 border-border">
                  {!alert.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="btn-standard bg-surface-secondary hover:bg-surface-elevated text-xs font-medium text-primary-text border border-border"
                    >
                      Acknowledge
                    </button>
                  )}
                  {!alert.resolved && (
                    <button
                      onClick={() => handleResolve(alert.id)}
                      className="btn-standard bg-accent-primary hover:opacity-90 text-white text-xs font-semibold shadow-subtle"
                    >
                      Resolve Fault
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
