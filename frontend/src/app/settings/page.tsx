'use client';

import React, { useState, useEffect } from 'react';
import { fetchSettings, updateSettings } from '@/lib/api';
import { Radio, Shield, Check, Server, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [refreshRate, setRefreshRate] = useState(1000);
  const [mqttBroker, setMqttBroker] = useState('mqtt://localhost:1883');
  const [tempWarning, setTempWarning] = useState(45.0);
  const [voltWarning, setVoltWarning] = useState(3.20);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchSettings();
        if (data) {
          setRefreshRate(data.refresh_rate_ms || 1000);
          setMqttBroker(data.mqtt_broker_url || 'mqtt://localhost:1883');
          setTempWarning(data.temp_warning_threshold_c || 45.0);
          setVoltWarning(data.voltage_warning_threshold_v || 3.20);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings({
        refresh_rate_ms: refreshRate,
        mqtt_broker_url: mqttBroker,
        temp_warning_threshold_c: tempWarning,
        voltage_warning_threshold_v: voltWarning,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#F4F7FB] tracking-tight flex items-center gap-2">
          System Configuration & Sensor Thresholds
        </h1>
        <p className="text-xs text-[#9BA9BB]">
          Configure CAN-BMS sampling rate, MQTT telemetry brokers, and automotive threshold limits
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Monitoring & Telemetry Settings */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#F4F7FB] flex items-center gap-2 border-b border-[#263449] pb-2">
            <Radio className="w-4 h-4 text-[#55D889]" />
            <span>Telemetry & Ingestion Configuration</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[#9BA9BB] block mb-1">Telemetry Refresh Rate (ms)</label>
              <select
                value={refreshRate}
                onChange={(e) => setRefreshRate(Number(e.target.value))}
                className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] outline-none"
              >
                <option value={500}>500 ms (High Frequency)</option>
                <option value={1000}>1000 ms (Standard CAN 1Hz)</option>
                <option value={2000}>2000 ms (Low Bandwidth)</option>
              </select>
            </div>

            <div>
              <label className="text-[#9BA9BB] block mb-1">MQTT Telemetry Broker Endpoint</label>
              <input
                type="text"
                value={mqttBroker}
                onChange={(e) => setMqttBroker(e.target.value)}
                className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] font-mono outline-none"
              />
            </div>
          </div>
        </div>

        {/* Safety & Threshold Limits */}
        <div className="glass-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-[#F4F7FB] flex items-center gap-2 border-b border-[#263449] pb-2">
            <Shield className="w-4 h-4 text-[#4C9FFF]" />
            <span>Cell Safety & Diagnostic Thresholds</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-[#9BA9BB] block mb-1">Cell Low-Voltage Warning Threshold (V)</label>
              <input
                type="number"
                step="0.05"
                value={voltWarning}
                onChange={(e) => setVoltWarning(Number(e.target.value))}
                className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] font-mono outline-none"
              />
              <span className="text-[10px] text-[#9BA9BB] mt-1 block">Default: 3.20 V under load</span>
            </div>

            <div>
              <label className="text-[#9BA9BB] block mb-1">Cell Over-Temperature Warning Threshold (°C)</label>
              <input
                type="number"
                step="1.0"
                value={tempWarning}
                onChange={(e) => setTempWarning(Number(e.target.value))}
                className="w-full bg-[#172337] border border-[#263449] rounded-lg p-2.5 text-[#F4F7FB] font-mono outline-none"
              />
              <span className="text-[10px] text-[#9BA9BB] mt-1 block">Default: 45.0 °C optimal upper limit</span>
            </div>
          </div>
        </div>

        {/* System Information Card */}
        <div className="glass-card p-6 space-y-3 text-xs">
          <h2 className="text-sm font-bold text-[#F4F7FB] border-b border-[#263449] pb-2">
            VoltSense AI Platform Metadata
          </h2>
          <div className="grid grid-cols-2 gap-3 text-[#9BA9BB]">
            <div>Software Version: <b className="text-[#F4F7FB]">v1.0.0 Enterprise</b></div>
            <div>Database Engine: <b className="text-[#55D889]">PostgreSQL / SQLite Async</b></div>
            <div>ML Regressor: <b className="text-[#4C9FFF]">RandomForest (MAE: 0.503%)</b></div>
            <div>Hardware Protocols: <b className="text-[#F4F7FB]">CAN-Bus 2.0B / MQTT / WebSocket</b></div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="text-xs text-[#55D889] flex items-center gap-1 font-semibold">
              <Check className="w-4 h-4" />
              Settings successfully saved to backend!
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-[#55D889] hover:bg-[#32B96F] text-xs font-bold text-[#080D18] transition-colors"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
