'use client';

import React from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { getDownloadReportUrl, getDownloadCsvReportUrl } from '@/lib/api';
import { FileText, Download, FileSpreadsheet, ShieldCheck } from 'lucide-react';

export default function ReportsPage() {
  const { selectedVehicle } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const handleExportCsv = () => {
    window.open(getDownloadCsvReportUrl(vehicleId), '_blank');
  };

  const reportsList = [
    {
      id: 'REP-2024-05-12',
      title: 'Certified Battery Health & Degradation Audit',
      type: 'HEALTH_DIAGNOSTIC',
      date: 'May 12, 2024',
      size: '5.4 KB',
      status: 'Ready',
    },
    {
      id: 'REP-2024-04-15',
      title: 'Monthly Cell Imbalance & Impedance Sweep',
      type: 'CELL_BALANCE',
      date: 'April 15, 2024',
      size: '5.2 KB',
      status: 'Archived',
    },
    {
      id: 'REP-2024-03-01',
      title: 'Fast-Charging Thermal Dissipation Audit',
      type: 'FLEET_AUDIT',
      date: 'March 01, 2024',
      size: '5.6 KB',
      status: 'Archived',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            Engineering Reports & Audit Center
          </h1>
          <p className="text-xs text-text-muted">
            Download certified PDF health assessments for warranty verification, service records, and fleet compliance
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="btn-standard bg-surface-primary hover:bg-surface-secondary text-primary-text border border-border hover:border-accent-primary shadow-subtle"
          >
            <FileSpreadsheet className="w-4 h-4 text-accent-secondary" />
            <span>Export CSV Dataset</span>
          </button>
          <a
            href={getDownloadReportUrl(vehicleId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-standard bg-surface-primary hover:bg-surface-secondary text-primary-text border border-border hover:border-accent-primary shadow-subtle"
          >
            <Download className="w-4 h-4 text-accent-primary" />
            <span>Generate Live PDF</span>
          </a>
        </div>
      </div>

      {/* Hero Report Card */}
      <div className="surface-card p-6 border border-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-subtle">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-[4px] text-[11px] font-mono font-medium bg-surface-secondary text-accent-primary border border-border">
              Certified Telemetry Snapshot
            </span>
            <span className="text-xs text-text-muted font-mono">Asset VIN: {vehicleId}</span>
          </div>
          <h2 className="text-lg font-bold text-primary-text">
            Automotive Battery Health & Predictive Diagnostic Report
          </h2>
          <p className="text-xs text-text-secondary max-w-xl leading-relaxed">
            Includes State of Health (SOH: 88.4%), State of Charge (SOC: 67%), 10-cell sub-module voltages, internal impedance distribution, degradation trajectory, and AI predictive maintenance actions.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleExportCsv}
            className="btn-standard bg-surface-secondary hover:bg-surface-elevated text-primary-text border border-border font-medium shadow-subtle"
          >
            <FileSpreadsheet className="w-4 h-4 text-accent-secondary" />
            <span>CSV Dataset</span>
          </button>
          <a
            href={getDownloadReportUrl(vehicleId)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-standard bg-accent-primary hover:opacity-90 text-white font-semibold shadow-subtle"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* Historical Report Archive */}
      <div className="surface-card p-4 space-y-3">
        <div className="border-b border-border/60 pb-2">
          <h3 className="text-sm font-semibold text-primary-text">
            Generated Report Archive
          </h3>
          <p className="text-xs text-text-muted">Historical audits generated for this asset</p>
        </div>
        <div className="space-y-2">
          {reportsList.map((rep) => (
            <div
              key={rep.id}
              className="p-3 rounded-[6px] bg-surface-secondary border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:border-accent-secondary transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-[4px] bg-surface-primary text-accent-primary border border-border">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-primary-text">{rep.title}</h4>
                  <div className="text-[11px] text-text-muted flex items-center gap-2.5 mt-0.5 font-mono">
                    <span>{rep.date}</span>
                    <span>•</span>
                    <span>{rep.id}</span>
                    <span>•</span>
                    <span>{rep.size}</span>
                  </div>
                </div>
              </div>
              <a
                href={getDownloadReportUrl(vehicleId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-surface-primary hover:bg-surface-elevated border border-border text-xs font-medium text-accent-primary transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
