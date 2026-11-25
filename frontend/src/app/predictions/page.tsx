'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useVehicle } from '@/context/VehicleContext';
import { fetchPrediction, fetchModelMetrics } from '@/lib/api';
import { PredictionResponse } from '@/types';
import {
  Sparkles,
  Sliders,
  AlertTriangle,
  CheckCircle,
  BarChart2,
  Cpu,
  RefreshCw,
  Info,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';

export default function PredictionsPage() {
  const { selectedVehicle, isSimulating, activeScenario, scenarioChangeCount } = useVehicle();
  const vehicleId = selectedVehicle?.vin || 'KA05ER7777';

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [modelMetrics, setModelMetrics] = useState<any>(null);
  const [cyclesAhead, setCyclesAhead] = useState<number>(50);
  const [loading, setLoading] = useState<boolean>(true);

  const runInference = useCallback(async (ahead: number) => {
    try {
      setLoading(true);
      const [pred, metrics] = await Promise.all([
        fetchPrediction(vehicleId, ahead),
        fetchModelMetrics(),
      ]);
      setPrediction(pred);
      setModelMetrics(metrics);
    } catch (e) {
      console.error('Error running AI inference:', e);
    } finally {
      setLoading(false);
    }
  }, [vehicleId]);

  useEffect(() => {
    runInference(cyclesAhead);
  }, [runInference, cyclesAhead, activeScenario, scenarioChangeCount]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-xl font-bold text-primary-text tracking-tight flex items-center gap-2">
            AI Battery Degradation & RUL Engine
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-accent-primary/10 text-accent-primary border border-accent-primary/30 font-semibold">
              Random Forest ML v1.0
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-surface-secondary text-text-muted border border-border">
              {isSimulating ? 'Calibrated CAN Telemetry' : 'Live Asset Ingestion'}
            </span>
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Nonlinear multi-feature degradation trajectory regressor and Isolation Forest anomaly detector
          </p>
        </div>
        <button
          onClick={() => runInference(cyclesAhead)}
          disabled={loading}
          className="btn-standard bg-surface-primary hover:bg-surface-secondary text-primary-text border border-border hover:border-accent-primary shadow-subtle disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-accent-primary flex-shrink-0 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Computing Inference...' : 'Re-run Inference'}</span>
        </button>
      </div>

      {/* Interactive Simulation Controls Slider */}
      <div className="surface-card p-5 sm:p-6 border border-border flex flex-col md:flex-row items-center justify-between gap-5 shadow-subtle">
        <div className="space-y-1">
          <div className="text-xs font-semibold text-accent-secondary uppercase tracking-wider flex items-center gap-1.5 font-mono">
            <Sliders className="w-4 h-4 text-accent-primary flex-shrink-0" />
            <span>Aging Trajectory Simulator</span>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed max-w-xl">
            Project future capacity retention and RUL by simulating additional full equivalent charge cycles:
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {[10, 50, 100, 200, 300].map((preset) => (
            <button
              key={preset}
              onClick={() => setCyclesAhead(preset)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-mono transition-colors ${
                cyclesAhead === preset
                  ? 'bg-accent-primary text-white font-bold shadow-xs'
                  : 'bg-surface-secondary text-text-secondary border border-border hover:text-primary-text'
              }`}
            >
              +{preset}
            </button>
          ))}
          <div className="flex items-center gap-3 ml-1">
            <input
              type="range"
              min="0"
              max="300"
              step="10"
              value={cyclesAhead}
              onChange={(e) => setCyclesAhead(Number(e.target.value))}
              className="w-36 accent-accent-primary cursor-pointer"
            />
            <span className="font-mono font-semibold text-xs text-primary-text whitespace-nowrap bg-surface-secondary px-3 py-1.5 rounded-[6px] border border-border">
              +{cyclesAhead} Cycles
            </span>
          </div>
        </div>
      </div>

      {/* Main Predictions Output Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="text-xs text-text-secondary font-medium flex items-center justify-between">
            <span>Predicted SOH</span>
            <Sparkles className="w-4 h-4 text-accent-primary flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-accent-primary font-mono tabular-nums">
            {prediction?.predicted_soh ?? 88.4}%
          </div>
          <div className="text-[11px] text-text-muted">
            Baseline SOH: {prediction?.current_soh ?? 88.4}%
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="text-xs text-text-secondary font-medium flex items-center justify-between">
            <span>Remaining Useful Life (RUL)</span>
            <Cpu className="w-4 h-4 text-accent-secondary flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-accent-secondary font-mono tabular-nums">
            {prediction?.predicted_rul_cycles ?? 1650}
          </div>
          <div className="text-[11px] text-text-muted">
            Cycles to 70.0% EOL threshold
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="text-xs text-text-secondary font-medium flex items-center justify-between">
            <span>Degradation Rate</span>
            <BarChart2 className="w-4 h-4 text-status-warning flex-shrink-0" />
          </div>
          <div className="text-2xl font-bold text-status-warning font-mono tabular-nums">
            {prediction?.degradation_rate_per_100_cycles ?? 1.54}%
          </div>
          <div className="text-[11px] text-text-muted">
            Per 100 Equivalent Cycles
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-1.5 shadow-subtle">
          <div className="text-xs text-text-secondary font-medium flex items-center justify-between">
            <span>Anomaly Risk Score</span>
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${prediction?.is_anomaly ? 'text-status-critical' : 'text-accent-primary'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${prediction?.is_anomaly ? 'text-status-critical' : 'text-accent-primary'}`}>
            {prediction?.anomaly_score ?? 0.05}
          </div>
          <div className="text-[11px] text-text-muted">
            {prediction?.is_anomaly ? 'Out-of-envelope reading flagged' : 'Nominal operation envelope'}
          </div>
        </div>
      </div>

      {/* Historical vs Predicted Trajectory Comparison */}
      <div className="surface-card p-4 border border-border space-y-2.5">
        <div className="flex items-center justify-between border-b border-border/60 pb-2">
          <div>
            <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-accent-primary flex-shrink-0" />
              <span>Electrochemical Degradation Trajectory Comparison</span>
            </h3>
            <p className="text-xs text-text-muted">
              Current calibrated state vs simulated trajectory across {cyclesAhead} future cycles
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-surface-secondary text-primary-text border border-border">
            Δ Fade: -{((prediction?.current_soh ?? 88.4) - (prediction?.predicted_soh ?? 88.4)).toFixed(2)}% SOH
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 rounded-[6px] bg-surface-secondary border border-border">
            <span className="text-text-muted block text-[10px]">Current Asset Baseline</span>
            <div className="text-base font-bold text-primary-text mt-0.5">
              {prediction?.current_soh ?? 88.4}% SOH
            </div>
            <span className="text-[10px] text-text-muted mt-0.5 block">Cycle: 238 Completed</span>
          </div>

          <div className="p-3 rounded-[6px] bg-surface-secondary border border-border">
            <span className="text-text-muted block text-[10px]">Simulated Horizon (+{cyclesAhead} Cycles)</span>
            <div className="text-base font-bold text-accent-primary mt-0.5">
              {prediction?.predicted_soh ?? 88.4}% SOH
            </div>
            <span className="text-[10px] text-text-muted mt-0.5 block">Cycle: {238 + cyclesAhead} Target</span>
          </div>

          <div className="p-3 rounded-[6px] bg-surface-secondary border border-border">
            <span className="text-text-muted block text-[10px]">End of Life (EOL) Projection</span>
            <div className="text-base font-bold text-status-warning mt-0.5">
              {prediction?.predicted_rul_cycles ?? 1650} Cycles Remaining
            </div>
            <span className="text-[10px] text-text-muted mt-0.5 block">Target: 70.0% Warranty Floor</span>
          </div>
        </div>
      </div>

      {/* Model Evaluation & Feature Importances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Model Evaluation Card */}
        <div className="surface-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <div>
              <h3 className="text-sm font-semibold text-primary-text">
                Model Evaluation & Benchmark
              </h3>
              <p className="text-xs text-text-muted">
                Independent validation set benchmark metrics
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-surface-secondary text-accent-primary border border-border">
              Verified
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[10px] text-text-muted">MAE</span>
              <div className="text-base font-bold text-accent-primary mt-0.5 font-mono">
                {modelMetrics?.evaluation_metrics?.MAE_percent ?? 0.503}%
              </div>
            </div>
            <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[10px] text-text-muted">RMSE</span>
              <div className="text-base font-bold text-accent-secondary mt-0.5 font-mono">
                {modelMetrics?.evaluation_metrics?.RMSE_percent ?? 0.626}%
              </div>
            </div>
            <div className="p-2.5 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-[10px] text-text-muted">R² Score</span>
              <div className="text-base font-bold text-status-warning mt-0.5 font-mono">
                {modelMetrics?.evaluation_metrics?.R2_Score ?? 0.979}
              </div>
            </div>
          </div>

          <div className="text-xs text-text-muted space-y-1 pt-1 font-mono">
            <div><span className="text-text-secondary">Model:</span> {modelMetrics?.algorithm || 'Random Forest Regressor (n_estimators=120)'}</div>
            <div><span className="text-text-secondary">Dataset:</span> {modelMetrics?.dataset_info?.source || 'Calibrated Li-ion NMC Degradation Profile'}</div>
          </div>
        </div>

        {/* Feature Importance Breakdown */}
        <div className="surface-card p-4 space-y-3">
          <div className="border-b border-border/60 pb-2">
            <h3 className="text-sm font-semibold text-primary-text">
              Electrochemical Feature Importance
            </h3>
            <p className="text-xs text-text-muted">
              Gini-impurity contribution across tree estimators
            </p>
          </div>

          <div className="space-y-2.5">
            {prediction?.feature_importance &&
              Object.entries(prediction.feature_importance).map(([name, weight]) => {
                const pct = Math.round(weight * 100);
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary capitalize">{name.replace('_', ' ')}</span>
                      <span className="font-mono font-semibold text-primary-text">{pct}%</span>
                    </div>
                    <div className="w-full bg-surface-secondary h-1.5 rounded-[2px] overflow-hidden">
                      <div
                        className="bg-accent-primary h-full rounded-[2px] transition-all duration-300"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="surface-card p-4 space-y-2.5">
        <h3 className="text-sm font-semibold text-primary-text flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-accent-primary flex-shrink-0" />
          <span>Predictive Battery Optimization Actions</span>
        </h3>
        <ul className="space-y-1.5 text-xs text-text-secondary">
          {prediction?.recommendations.map((rec, i) => (
            <li key={i} className="flex items-start gap-2 p-2 rounded-[6px] bg-surface-secondary border border-border">
              <span className="text-accent-primary font-bold mt-0.5">•</span>
              <span className="text-primary-text">{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
