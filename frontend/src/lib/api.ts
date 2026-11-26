import {
  Vehicle,
  BatteryHealthOverview,
  Alert,
  PredictionResponse,
  MaintenanceRecord,
  SimulatorStatus,
  BatteryCell,
} from '@/types';

function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return '/api/v1';
  }
  return 'http://127.0.0.1:8000/api/v1';
}

const API_BASE_URL = getApiBaseUrl();

export async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${API_BASE_URL}/vehicles`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
}

export async function fetchVehicle(id: string): Promise<Vehicle> {
  const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch vehicle');
  return res.json();
}

export async function createVehicle(data: any): Promise<Vehicle> {
  const res = await fetch(`${API_BASE_URL}/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create vehicle');
  return res.json();
}

export async function deleteVehicle(id: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete vehicle');
  return res.json();
}

export async function fetchBatteryHealth(vehicleId: string): Promise<BatteryHealthOverview> {
  const res = await fetch(`${API_BASE_URL}/battery/${vehicleId}/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch battery health');
  return res.json();
}

export async function fetchDegradationTrend(vehicleId: string, period = '6months') {
  const res = await fetch(`${API_BASE_URL}/battery/${vehicleId}/degradation?period=${period}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch degradation trend');
  return res.json();
}

export async function fetchTemperatureTrend(vehicleId: string) {
  const res = await fetch(`${API_BASE_URL}/battery/${vehicleId}/temperature-trend`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch temperature trend');
  return res.json();
}

export async function fetchCells(vehicleId: string): Promise<BatteryCell[]> {
  const res = await fetch(`${API_BASE_URL}/battery/${vehicleId}/cells`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch battery cells');
  return res.json();
}

export async function fetchTelemetryLatest(vehicleId: string) {
  const res = await fetch(`${API_BASE_URL}/monitoring/${vehicleId}/latest`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch latest telemetry');
  return res.json();
}

export async function fetchTelemetryHistory(vehicleId: string) {
  const res = await fetch(`${API_BASE_URL}/monitoring/${vehicleId}/history`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch telemetry history');
  return res.json();
}

export interface ScenarioActivationResponse {
  active_scenario: string;
  scenario_id: string;
  vehicle_id: string;
  is_running: boolean;
  status: string;
  timestamp: string;
  metadata: {
    name: string;
    description: string;
    operating_mode: string;
    target_c_rate: number;
    safety_status: string;
  };
  telemetry: any;
}

export async function activateSimulatorScenario(
  scenarioId: string,
  vehicleId = 'KA05ER7777'
): Promise<ScenarioActivationResponse> {
  const res = await fetch(`${API_BASE_URL}/simulator/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenario_id: scenarioId, vehicle_id: vehicleId }),
  });
  if (!res.ok) {
    const fallback = await controlSimulator('scenario', scenarioId);
    return {
      active_scenario: fallback.scenario,
      scenario_id: fallback.scenario,
      vehicle_id: vehicleId,
      is_running: fallback.is_running,
      status: 'ACTIVE',
      timestamp: fallback.last_heartbeat,
      metadata: {
        name: fallback.scenario_name || scenarioId,
        description: 'Operational simulation mode',
        operating_mode: 'ACTIVE',
        target_c_rate: 0.2,
        safety_status: 'NOMINAL',
      },
      telemetry: {},
    };
  }
  return res.json();
}

export async function controlSimulator(action: string, scenario = 'normal', speed_factor = 1.0): Promise<SimulatorStatus> {
  const res = await fetch(`${API_BASE_URL}/monitoring/simulator/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, scenario, speed_factor }),
  });
  if (!res.ok) throw new Error('Failed to update simulator');
  return res.json();
}

export async function fetchSimulatorStatus(): Promise<SimulatorStatus> {
  const res = await fetch(`${API_BASE_URL}/monitoring/simulator/status`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch simulator status');
  return res.json();
}

export async function fetchPrediction(vehicleId: string, cyclesAhead = 50): Promise<PredictionResponse> {
  const res = await fetch(`${API_BASE_URL}/predictions/${vehicleId}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ vehicle_id: vehicleId, cycles_ahead: cyclesAhead }),
  });
  if (!res.ok) throw new Error('Failed to analyze predictions');
  return res.json();
}

export async function fetchModelMetrics() {
  const res = await fetch(`${API_BASE_URL}/predictions/metrics`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch model metrics');
  return res.json();
}

export async function fetchAlerts(severity?: string): Promise<Alert[]> {
  const url = severity ? `${API_BASE_URL}/alerts?severity=${severity}` : `${API_BASE_URL}/alerts`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function acknowledgeAlert(alertId: string): Promise<Alert> {
  const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acknowledged: true }),
  });
  if (!res.ok) throw new Error('Failed to acknowledge alert');
  return res.json();
}

export async function resolveAlert(alertId: string): Promise<Alert> {
  const res = await fetch(`${API_BASE_URL}/alerts/${alertId}/resolve`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to resolve alert');
  return res.json();
}

export async function fetchMaintenance(): Promise<MaintenanceRecord[]> {
  const res = await fetch(`${API_BASE_URL}/maintenance`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch maintenance');
  return res.json();
}

export async function createMaintenance(data: { vehicle_id: string; title: string; priority?: string; technician?: string; notes?: string }) {
  const res = await fetch(`${API_BASE_URL}/maintenance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create maintenance record');
  return res.json();
}

export async function fetchAnalytics(vehicleId: string) {
  const res = await fetch(`${API_BASE_URL}/analytics/${vehicleId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE_URL}/settings`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings: any) {
  const res = await fetch(`${API_BASE_URL}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export function getDownloadReportUrl(vehicleId: string): string {
  return `${API_BASE_URL}/reports/${vehicleId}/pdf`;
}

export function getDownloadCsvReportUrl(vehicleId: string): string {
  return `${API_BASE_URL}/reports/${vehicleId}/csv`;
}

export function getWebSocketMonitoringUrl(vehicleId: string): string {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return `${process.env.NEXT_PUBLIC_WS_URL}/ws/monitoring/${vehicleId}`;
  }
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/monitoring/${vehicleId}`;
  }
  return `ws://127.0.0.1:8000/ws/monitoring/${vehicleId}`;
}

export interface WebSocketTelemetryOptions {
  vehicleId: string;
  onMessage: (telemetry: any) => void;
  onStatusChange?: (status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected') => void;
  maxDelayMs?: number;
  initialDelayMs?: number;
}

export function createTelemetryWebSocket(options: WebSocketTelemetryOptions): () => void {
  let ws: WebSocket | null = null;
  let isDestroyed = false;
  let retryCount = 0;
  let reconnectTimeout: any = null;
  let latestSeqId = 0;
  const initialDelay = options.initialDelayMs || 1000;
  const maxDelay = options.maxDelayMs || 15000;

  async function connect() {
    if (isDestroyed) return;
    options.onStatusChange?.(retryCount === 0 ? 'connecting' : 'reconnecting');

    try {
      const url = getWebSocketMonitoringUrl(options.vehicleId);
      ws = new WebSocket(url);

      ws.onopen = async () => {
        if (isDestroyed) {
          ws?.close();
          return;
        }
        retryCount = 0;
        options.onStatusChange?.('connected');

        try {
          const latest = await fetchTelemetryLatest(options.vehicleId);
          if (latest && !isDestroyed) {
            if (latest.seq_id && latest.seq_id > latestSeqId) {
              latestSeqId = latest.seq_id;
              options.onMessage(latest);
            }
          }
        } catch (e) {
          console.warn('[WS] Telemetry snapshot recovery on connect:', e);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.seq_id) {
            if (data.seq_id <= latestSeqId) return;
            latestSeqId = data.seq_id;
          }
          options.onMessage(data);
        } catch (e) {
          console.error('[WS] Failed to parse message frame:', e);
        }
      };

      ws.onerror = (err) => {
        console.warn('[WS] Telemetry stream error:', err);
      };

      ws.onclose = () => {
        if (isDestroyed) return;
        options.onStatusChange?.('disconnected');
        const delay = Math.min(initialDelay * Math.pow(2, retryCount), maxDelay);
        retryCount++;
        reconnectTimeout = setTimeout(connect, delay);
      };
    } catch (err) {
      console.warn('[WS] Socket instantiation failed:', err);
      const delay = Math.min(initialDelay * Math.pow(2, retryCount), maxDelay);
      retryCount++;
      reconnectTimeout = setTimeout(connect, delay);
    }
  }

  connect();

  return () => {
    isDestroyed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    }
  };
}
