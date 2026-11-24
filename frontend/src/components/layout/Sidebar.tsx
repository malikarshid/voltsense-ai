'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Wrench,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Live Monitoring', href: '/live-monitoring', icon: Activity },
  { name: 'Battery Health', href: '/battery-health', icon: ShieldCheck },
  { name: '3D Vehicle', href: '/vehicle-3d', icon: Box },
  { name: 'Battery Cells', href: '/cells', icon: Cpu },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'AI Predictions', href: '/predictions', icon: Sparkles },
  { name: 'Alerts & Events', href: '/alerts', icon: AlertTriangle, badge: '1' },
  { name: 'Vehicles', href: '/vehicles', icon: Car },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 h-screen bg-[#0B1220] border-r border-[#263449] z-40 transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Logo & Header */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-[#263449]/60">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#55D889] to-[#32B96F] flex items-center justify-center flex-shrink-0 shadow-glow-green">
              <Zap className="w-5 h-5 text-[#080D18] fill-current" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-lg tracking-wide text-[#F4F7FB] flex items-center gap-1">
                  VoltSense <span className="text-[#55D889] font-black">AI</span>
                </span>
                <span className="text-[10px] text-[#9BA9BB] tracking-wider uppercase -mt-1">
                  Battery Intelligence
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-[#172337] text-[#9BA9BB] hover:text-white transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-220px)]">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-[#172337] text-[#55D889] border-l-4 border-[#55D889] shadow-sm'
                    : 'text-[#9BA9BB] hover:bg-[#111B2B] hover:text-[#F4F7FB]'
                }`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#55D889]' : 'text-[#9BA9BB]'}`} />
                {!collapsed && <span className="truncate">{item.name}</span>}
                {!collapsed && item.badge && (
                  <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#EF6262]/20 text-[#EF6262] border border-[#EF6262]/40">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Promo Card (matching Reference 1) */}
      {!collapsed ? (
        <div className="p-4 m-3 rounded-xl bg-[#111B2B] border border-[#263449] text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-[#55D889]/10 border border-[#55D889]/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#55D889]" />
          </div>
          <p className="text-xs text-[#9BA9BB] leading-relaxed mb-3">
            Battery health tracking helps you optimize range and extend pack lifespan.
          </p>
          <Link
            href="/battery-health"
            className="inline-block w-full py-1.5 px-3 rounded-md bg-[#172337] hover:bg-[#55D889]/20 hover:text-[#55D889] text-xs font-semibold text-[#F4F7FB] border border-[#263449] transition-all"
          >
            Diagnostics
          </Link>
        </div>
      ) : (
        <div className="p-3 text-center border-t border-[#263449]">
          <div className="w-8 h-8 mx-auto rounded-full bg-[#55D889]/10 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-[#55D889]" />
          </div>
        </div>
      )}
    </aside>
  );
};
