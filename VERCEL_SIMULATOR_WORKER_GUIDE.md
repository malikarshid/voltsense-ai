# VOLTSENSE AI — SIMULATOR & WORKER GUIDE
## Autonomous 1.0 Hz CAN-BMS Physics Engine in Serverless and Container Deployments

**System:** VoltSense AI Platform
**Component:** CAN-BMS 500k Physics Simulator & Telemetry Engine
**Workspace:** `C:\Projects\voltsense-ai`
**Date:** November 26, 2026

---

## 1. Dual-Mode Simulator Architecture

VoltSense AI's physics simulator supports two complementary execution models:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SIMULATOR EXECUTION MODES                       │
├────────────────────────────────────────────────────────────────────────┤
│  MODE A: SERVERLESS ON-DEMAND STEPPING (Default on Vercel)             │
│  - Executes on HTTP GET /api/v1/monitoring/{vehicle_id}/latest         │
│  - Synchronously computes physics delta-time since last heartbeat     │
│  - Zero idle infrastructure costs                                      │
│  - Fully supported across all 6 simulation scenarios                   │
│                                                                        │
│  MODE B: AUTONOMOUS PERSISTENT WORKER (High-Concurrency Fleet / IoT)   │
│  - Dedicated background worker process (backend/app/worker.py)         │
│  - Runs continuous 1.0 Hz CAN-BMS loop independently of web requests   │
│  - Publishes continuous telemetry over MQTT and updates PostgreSQL    │
│  - Deployed in Docker container (AWS ECS, Fly.io, Railway, or On-Prem) │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Running the Persistent Worker

For production deployments requiring continuous background ticking even when no browser tabs are open, launch `backend/app/worker.py`:

### Local / Virtual Environment
```bash
$env:PYTHONPATH = "c:\Projects\voltsense-ai\backend"
c:\Projects\voltsense-ai\backend\.venv\Scripts\python.exe -m app.worker
```

### Docker Container
```bash
docker run -d \
  --name voltsense-sim-worker \
  -e DATABASE_URL="postgresql+asyncpg://user:pass@ep-db.region.neon.tech/voltsense?ssl=require" \
  -e MQTT_BROKER_HOST="mqtt.internal" \
  voltsense-backend:latest python -m app.worker
```

---

## 3. Supported Simulation Scenarios

Both execution modes support all six deterministic operational scenarios:
1. `normal`: Standard driving profile (balanced thermal and voltage behavior).
2. `charging`: High-voltage CCS2 DC Rapid Charging (voltage climb to ~408V, +45A to +120A current).
3. `discharging`: Aggressive dynamic load profile (voltage sag to ~368V, -85A current).
4. `high_temp`: Thermal stress test (ambient heat climb >45°C triggering automated chiller alarms).
5. `cell_imbalance`: Cell 01 internal resistance spike (>0.0691 Ω, delta-V > 50 mV).
6. `aging`: Accelerated cyclic degradation profile (capacity fade curve).
