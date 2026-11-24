'use client';

import React from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { getDownloadReportUrl } from '@/lib/api';
import { FileText, Download, CheckCircle, Shield, Calendar, ArrowRight } from 'lucide-react';

export default function ReportsPage() {
  const { selectedVehicle } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const reportsList = [
    {
      id: 'REP-2024-05-12',
      title: 'Comprehensive Battery Health & Degradation Audit',
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
      title: 'Quarterly Fast-Charging Thermal Stress Report',
      type: 'FLEET_AUDIT',
      date: 'March 01, 2024',
      size: '5.6 KB',
      status: 'Archived',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#F4F7FB] tracking-tight flex items-center gap-2">
            Engineering Reports & Audit Center
          </h1>
          <p className="text-xs text-[#9BA9BB]">
            Download certified PDF health assessments for warranty, service records and fleet management
          </p>
        </div>
        <a
          href={getDownloadReportUrl(vehicleId)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#55D889] hover:bg-[#32B96F] text-xs font-bold text-[#080D18] transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Generate Live PDF Report</span>
        </a>
      </div>

      {/* Hero Report Card */}
      <div className="glass-card p-6 border border-[#55D889]/40 bg-gradient-to-r from-[#111B2B] to-[#172337]/50 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#55D889]/20 text-[#55D889] border border-[#55D889]/40">
              Latest Live Certified Report
            </span>
            <span className="text-xs text-[#9BA9BB] font-mono">VIN: {vehicleId}</span>
          </div>
          <h2 className="text-xl font-bold text-[#F4F7FB]">
            Automotive Battery Health & Predictive Diagnostic Report
          </h2>
          <p className="text-xs text-[#9BA9BB] max-w-xl leading-relaxed">
            Includes State of Health (SOH: 88.4%), State of Charge (SOC: 67%), 10-cell sub-module voltages, internal impedance distribution, degradation trajectory, and AI predictive maintenance recommendations.
          </p>
        </div>
        <a
          href={getDownloadReportUrl(vehicleId)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 px-6 py-3 rounded-xl bg-[#55D889] hover:bg-[#32B96F] text-[#080D18] text-sm font-bold flex items-center gap-2 shadow-glow-green transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </a>
      </div>

      {/* Historical Report Archive */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="text-sm font-semibold text-[#F4F7FB]">
          Generated Report History
        </h3>
        <div className="space-y-2">
          {reportsList.map((rep) => (
            <div
              key={rep.id}
              className="p-4 rounded-xl bg-[#172337]/40 border border-[#263449] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-[#3b506d] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-[#111B2B] text-[#55D889] border border-[#263449]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#F4F7FB]">{rep.title}</h4>
                  <div className="text-xs text-[#9BA9BB] flex items-center gap-3 mt-0.5">
                    <span>{rep.date}</span>
                    <span>•</span>
                    <span className="font-mono">{rep.id}</span>
                    <span>•</span>
                    <span>{rep.size}</span>
                  </div>
                </div>
              </div>
              <a
                href={getDownloadReportUrl(vehicleId)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111B2B] hover:bg-[#172337] border border-[#263449] text-xs font-semibold text-[#55D889] transition-colors"
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
