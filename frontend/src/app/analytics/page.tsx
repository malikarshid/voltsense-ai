'use client';

import React, { useEffect, useState } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { fetchAnalytics } from '@/lib/api';
import {
  BarChart3,
  TrendingUp,
  Zap,
  Thermometer,
  Battery,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AnalyticsPage() {
  const { selectedVehicle } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchAnalytics(vehicleId);
        setAnalytics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vehicleId]);

  const stateData = [
    { name: 'Driving / Discharge', value: 22.4, color: '#4C9FFF' },
    { name: 'DC/AC Charging', value: 14.8, color: '#55D889' },
    { name: 'Parked / Standby', value: 62.8, color: '#172337' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F4F7FB] tracking-tight flex items-center gap-2">
          Fleet Analytics & Historical Performance
        </h1>
        <p className="text-xs text-[#9BA9BB]">
          Energy throughput, thermal exposure histograms, and charge cycle distribution
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 space-y-2">
          <span className="text-xs text-[#9BA9BB]">Total Energy Throughput</span>
          <div className="text-2xl font-extrabold text-[#F4F7FB] font-mono">
            14,280 <span className="text-sm font-normal text-[#9BA9BB]">kWh</span>
          </div>
          <span className="text-[11px] text-[#55D889]">Equivalent to 91,500 km</span>
        </div>

        <div className="glass-card p-5 space-y-2">
          <span className="text-xs text-[#9BA9BB]">Average Consumption</span>
          <div className="text-2xl font-extrabold text-[#4C9FFF] font-mono">
            15.6 <span className="text-sm font-normal text-[#9BA9BB]">kWh/100km</span>
          </div>
          <span className="text-[11px] text-[#4C9FFF]">Top 10% efficiency tier</span>
        </div>

        <div className="glass-card p-5 space-y-2">
          <span className="text-xs text-[#9BA9BB]">Regenerative Braking</span>
          <div className="text-2xl font-extrabold text-[#55D889] font-mono">
            18.4%
          </div>
          <span className="text-[11px] text-[#55D889]">Energy recovered to pack</span>
        </div>

        <div className="glass-card p-5 space-y-2">
          <span className="text-xs text-[#9BA9BB]">Cell Balancing Efficiency</span>
          <div className="text-2xl font-extrabold text-[#F4C44E] font-mono">
            94.2 / 100
          </div>
          <span className="text-[11px] text-[#F4C44E]">Active BMS Equalization</span>
        </div>
      </div>

      {/* Charts: Thermal Exposure Histogram & Operational State Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Thermal Histogram */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#F4F7FB]">
            Lifetime Thermal Exposure Distribution
          </h3>
          <p className="text-xs text-[#9BA9BB]">Cumulative percentage of operation across temperature brackets</p>
          <div className="w-full h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.temperature_distribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#263449" vertical={false} />
                <XAxis dataKey="range" stroke="#9BA9BB" fontSize={11} />
                <YAxis stroke="#9BA9BB" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111B2B', borderColor: '#263449', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="percentage" fill="#55D889" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operating State Pie Chart */}
        <div className="glass-card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#F4F7FB]">
            Vehicle Operating State Distribution
          </h3>
          <p className="text-xs text-[#9BA9BB]">Time proportion spent driving, charging, or in standby</p>
          <div className="w-full h-60 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0B1220" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111B2B', borderColor: '#263449', borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs text-[#9BA9BB]">
            {stateData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.name} ({s.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
