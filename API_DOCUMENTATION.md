# VoltSense AI — REST & WebSocket API Documentation

All API endpoints are prefixed with `/api/v1/`.

## 1. Authentication (`/api/v1/auth`)
- `POST /register`: Register a new user (`email`, `password`, `full_name`, `role`).
- `POST /login`: Authenticate and receive a JWT Bearer access token.
- `GET /me`: Get current logged-in user details.

## 2. Connected Vehicles (`/api/v1/vehicles`)
- `GET /`: List all enrolled fleet vehicles with battery chemistry, pack size, and cell count.
- `GET /{vehicle_id}`: Fetch detailed specs for a single vehicle by ID or VIN.
- `POST /`: Enroll a new EV vehicle with battery pack geometry.
- `DELETE /{vehicle_id}`: Unenroll vehicle and related telemetry.

## 3. Battery Health & Degradation (`/api/v1/battery`)
- `GET /{vehicle_id}/health`: Primary health overview containing SOH, SOC, completed cycles, capacity retention, degradation summary, and 10-cell breakdown.
- `GET /{vehicle_id}/degradation?period={7days|30days|6months|12months}`: Historical capacity retention datapoints.
- `GET /{vehicle_id}/temperature-trend`: 7-day thermal tracking with optimal 15°C - 45°C boundary reference lines.
- `GET /{vehicle_id}/cells`: 10-cell sub-module voltages, temperatures, internal impedances, and warning states.

## 4. Live Telemetry & Simulation (`/api/v1/monitoring`)
- `GET /{vehicle_id}/latest`: Instantaneous frame of pack voltage, current, power, temperature, and impedance.
- `GET /{vehicle_id}/history`: Rolling 50-point strip chart buffer.
- `POST /simulator/control`: Control simulation state (`action`: start, stop, reset, scenario; `scenario`: normal, charging, discharging, high_temp, cell_imbalance, voltage_anomaly, comm_fail).
- `GET /simulator/status`: Current simulation mode status.

## 5. AI Predictions & Diagnostics (`/api/v1/predictions`)
- `POST /{vehicle_id}/analyze`: Run inference through trained Random Forest regressor & Isolation Forest anomaly detector.
- `GET /metrics`: Return model evaluation metrics ($R^2$, MAE, RMSE) and Gini feature importances.

## 6. Alerts & Events (`/api/v1/alerts`)
- `GET /`: Retrieve diagnostic alerts filtered by severity (`CRITICAL`, `WARNING`, `INFO`).
- `POST /{alert_id}/acknowledge`: Mark alert acknowledged by technician.
- `POST /{alert_id}/resolve`: Mark alert resolved.

## 7. Reports (`/api/v1/reports`)
- `GET /{vehicle_id}/pdf`: Generate and stream downloadable PDF battery diagnostic health audit report.

## 8. Real-Time WebSockets
- `WS /ws/monitoring/{vehicle_id}`: Real-time 1 Hz continuous telemetry streaming channel.
