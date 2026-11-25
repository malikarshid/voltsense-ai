'use client';

import React, { useState, useEffect } from 'react';
import { fetchSettings, updateSettings } from '@/lib/api';
import { Radio, Shield, Check } from 'lucide-react';

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
    <div className="space-y-4 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
          System Configuration & Sensor Thresholds
        </h1>
        <p className="text-xs text-text-muted">
          Configure CAN-BMS sampling frequencies, MQTT telemetry brokers, and automotive threshold limits
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Monitoring & Telemetry Settings */}
        <div className="surface-card p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-primary-text flex items-center gap-2 border-b border-border pb-3">
            <Radio className="w-4 h-4 text-accent-primary" />
            <span>Telemetry & Ingestion Configuration</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-text-secondary font-medium block mb-1.5">Telemetry Refresh Rate</label>
              <select
                value={refreshRate}
                onChange={(e) => setRefreshRate(Number(e.target.value))}
                className="input-standard w-full"
              >
                <option value={500}>500 ms (High Frequency)</option>
                <option value={1000}>1000 ms (Standard CAN 1Hz)</option>
                <option value={2000}>2000 ms (Low Bandwidth)</option>
              </select>
            </div>

            <div>
              <label className="text-text-secondary font-medium block mb-1.5">MQTT Telemetry Broker Endpoint</label>
              <input
                type="text"
                value={mqttBroker}
                onChange={(e) => setMqttBroker(e.target.value)}
                className="input-standard w-full font-mono"
              />
            </div>
          </div>
        </div>

        {/* Safety & Threshold Limits */}
        <div className="surface-card p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-semibold text-primary-text flex items-center gap-2 border-b border-border pb-3">
            <Shield className="w-4 h-4 text-accent-secondary" />
            <span>Cell Safety & Diagnostic Thresholds</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="text-text-secondary font-medium block mb-1.5">Cell Low-Voltage Warning Threshold (V)</label>
              <input
                type="number"
                step="0.05"
                value={voltWarning}
                onChange={(e) => setVoltWarning(Number(e.target.value))}
                className="input-standard w-full font-mono"
              />
              <span className="text-[11px] text-text-muted mt-1 block">Standard: 3.20 V under load</span>
            </div>

            <div>
              <label className="text-text-secondary font-medium block mb-1.5">Cell Over-Temperature Warning Threshold (°C)</label>
              <input
                type="number"
                step="1.0"
                value={tempWarning}
                onChange={(e) => setTempWarning(Number(e.target.value))}
                className="input-standard w-full font-mono"
              />
              <span className="text-[11px] text-text-muted mt-1 block">Standard: 45.0 °C upper limit</span>
            </div>
          </div>
        </div>

        {/* System Information Card */}
        <div className="surface-card p-5 sm:p-6 space-y-3 text-xs">
          <h2 className="text-sm font-semibold text-primary-text border-b border-border pb-3">
            VoltSense AI Platform Metadata
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-text-secondary font-mono text-[12px]">
            <div>Software Version: <span className="text-primary-text font-semibold">v1.0.0 Enterprise</span></div>
            <div>Database Engine: <span className="text-accent-primary font-semibold">SQLite Async / PostgreSQL</span></div>
            <div>ML Regressor: <span className="text-accent-secondary font-semibold">RandomForest (MAE: 0.503%)</span></div>
            <div>Hardware Protocols: <span className="text-primary-text font-semibold">CAN-Bus 2.0B / MQTT / WebSocket</span></div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs text-accent-primary font-mono">
              <Check className="w-4 h-4" />
              Settings updated successfully
            </span>
          )}
          <button
            type="submit"
            className="btn-standard bg-accent-primary hover:opacity-90 text-white font-semibold shadow-subtle"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}
