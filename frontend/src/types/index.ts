export interface BatteryCell {
  id: string;
  vehicle_id: string;
  cell_index: number;
  cell_serial: string;
  voltage: number;
  temperature: number;
  internal_resistance: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'IDLE';
  updated_at: string;
}

export interface BatteryPack {
  id: string;
  vehicle_id: string;
  pack_serial: string;
  total_cycles: number;
  design_capacity_ah: number;
  original_capacity_ah: number;
  current_capacity_ah: number;
  current_soh: number;
  current_soc: number;
  health_score: number;
  estimated_range_km: number;
  avg_temperature: number;
  total_voltage: number;
  pack_current: number;
  total_impedance: number;
  cooling_status: string;
  bms_state: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  name: string;
  vin: string;
  model_year: number;
  battery_chemistry: string;
  pack_capacity_kwh: number;
  original_capacity_ah: number;
  current_capacity_ah: number;
  nominal_voltage: number;
  max_voltage: number;
  min_voltage: number;
  cell_count: number;
  status: string;
  created_at: string;
  updated_at: string;
  pack?: BatteryPack;
}

export interface DegradationSummary {
  total_degradation_ah: number;
  total_degradation_pct: number;
  avg_monthly_degradation_pct: number;
  projected_capacity_1yr_min_ah: number;
  projected_capacity_1yr_max_ah: number;
  performance_status: string;
  soh_formula: string;
}

export interface BatteryHealthOverview {
  vehicle_id: string;
  soc_percentage: number;
  estimated_range_km: number;
  health_score: number;
  health_status: string;
  cycle_count: number;
  design_capacity_ah: number;
  original_capacity_ah: number;
  current_capacity_ah: number;
  soh_percentage: number;
  degradation_summary: DegradationSummary;
  pack_voltage: number;
  pack_current?: number;
  power_kw?: number;
  avg_temperature: number;
  total_impedance: number;
  min_cell_voltage: number;
  max_cell_voltage: number;
  voltage_diff: number;
  cells: BatteryCell[];
}

export interface Alert {
  id: string;
  vehicle_id: string;
  alert_type: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  cell_index?: number;
  message: string;
  recommendation: string;
  acknowledged: boolean;
  resolved: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface PredictionResponse {
  vehicle_id: string;
  predicted_soh: number;
  current_soh: number;
  predicted_rul_cycles: number;
  current_cycles: number;
  degradation_rate_per_100_cycles: number;
  anomaly_score: number;
  is_anomaly: boolean;
  confidence_level: number;
  model_name: string;
  model_version: string;
  evaluation_metrics: {
    MAE_percent: number;
    RMSE_percent: number;
    R2_Score: number;
  };
  feature_importance: Record<string, number>;
  recommendations: string[];
  disclaimer: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  title: string;
  priority: string;
  status: string;
  due_date?: string;
  completed_date?: string;
  technician: string;
  notes: string;
  created_at: string;
}

export interface SimulatorStatus {
  is_running: boolean;
  scenario: string;
  scenario_name?: string;
  speed_factor: number;
  tick_count: number;
  active_vehicle_id: string;
  data_server_status: string;
  message_queue_status: string;
  last_heartbeat: string;
}
