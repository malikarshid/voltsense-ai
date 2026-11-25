'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useVehicle } from '@/context/VehicleContext';
import {
  LayoutDashboard,
  Activity,
  ShieldCheck,
  Box,
  Cpu,
  BarChart3,
  Sparkles,
  AlertTriangle,
  Car,
  Zap,
  Wrench,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Live Monitoring', href: '/live-monitoring', icon: Activity },
  { name: 'Battery Health', href: '/battery-health', icon: ShieldCheck },
  { name: '3D Vehicle Studio', href: '/vehicle-3d', icon: Box },
  { name: 'Battery Cells', href: '/cells', icon: Cpu },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'AI Predictions', href: '/predictions', icon: Sparkles },
  { name: 'Alerts & Events', href: '/alerts', icon: AlertTriangle, badge: '1' },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
  { name: 'Charging Stations', href: '/charging-stations', icon: Zap },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Trips & Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    isSidebarCollapsed: collapsed,
    setIsSidebarCollapsed: setCollapsed,
    isSimulating,
  } = useVehicle();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen bg-sidebar border-r border-border z-50 transition-all duration-200 flex flex-col justify-between select-none ${
          collapsed ? 'md:w-[76px]' : 'md:w-[250px]'
        } ${
          isMobileMenuOpen ? 'translate-x-0 w-[250px]' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Logo & Branding Header */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 overflow-hidden"
            >
              <div className="w-9 h-9 rounded-[8px] bg-surface-secondary border border-border flex items-center justify-center flex-shrink-0 text-accent-primary">
                <Zap className="w-5 h-5 fill-current flex-shrink-0" strokeWidth={2} />
              </div>
              {(!collapsed || isMobileMenuOpen) && (
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-tight text-primary-text flex items-center gap-1">
                    VoltSense <span className="text-accent-primary">AI</span>
                  </span>
                  <span className="text-[10px] text-text-muted tracking-wider uppercase font-medium">
                    Battery Intelligence
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Toggle / Mobile Close */}
            <div className="flex items-center">
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="hidden md:flex items-center justify-center w-7 h-7 rounded-[6px] hover:bg-surface-secondary text-text-secondary hover:text-primary-text transition-colors border border-transparent hover:border-border"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? (
                  <ChevronRight className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                )}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="md:hidden p-1.5 rounded-[6px] hover:bg-surface-secondary text-text-secondary hover:text-primary-text transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4 flex-shrink-0" />
              </button>
            </div>
          </div>

          {/* Navigation Links (13 items) */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1 min-h-0" aria-label="Main Navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] font-medium transition-all duration-150 relative ${
                    collapsed && !isMobileMenuOpen ? 'justify-center px-0' : ''
                  } ${
                    isActive
                      ? 'bg-surface-secondary text-primary-text font-semibold border border-border'
                      : 'text-text-secondary hover:bg-surface-secondary hover:text-primary-text border border-transparent'
                  }`}
                  title={collapsed ? item.name : undefined}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-2 bottom-2 w-[3px] bg-accent-primary rounded-r" />
                  )}
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-accent-primary' : 'text-text-secondary group-hover:text-primary-text'
                    }`}
                    strokeWidth={1.9}
                  />
                  {(!collapsed || isMobileMenuOpen) && (
                    <span className="truncate">{item.name}</span>
                  )}
                  {(!collapsed || isMobileMenuOpen) && item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-semibold rounded-[4px] bg-status-critical/10 text-status-critical border border-status-critical/30 tabular-nums">
                      {item.badge}
                    </span>
                  )}
                  {/* Floating Tooltip when Sidebar is Collapsed */}
                  {collapsed && !isMobileMenuOpen && (
                    <div className="absolute left-full ml-2.5 px-2.5 py-1 rounded-[6px] bg-surface-elevated border border-border shadow-elevated text-xs font-medium text-primary-text whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-50 flex items-center gap-1.5">
                      <span>{item.name}</span>
                      {item.badge && (
                        <span className="px-1.5 py-0.2 rounded-[4px] bg-status-critical/15 text-status-critical text-[10px] font-bold">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Minimal Industrial Status Footer */}
        {(!collapsed || isMobileMenuOpen) ? (
          <div className="p-3.5 border-t border-border bg-sidebar">
            <div className="p-3 rounded-[8px] bg-surface-secondary border border-border flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-text-secondary flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isSimulating ? 'bg-accent-primary' : 'bg-status-warning'}`} />
                  System Core
                </span>
                <span className="text-[10px] text-accent-primary font-semibold uppercase tracking-wider">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
                <span>Telemetry Bus</span>
                <span className="text-primary-text font-medium">CAN-BMS 500k</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-text-muted font-mono">
                <span>Pipeline Latency</span>
                <span className="text-accent-primary font-medium">14 ms</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 border-t border-border flex justify-center">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isSimulating ? 'bg-accent-primary' : 'bg-status-warning'}`}
              title="System Operational"
            />
          </div>
        )}
      </aside>
    </>
  );
};
