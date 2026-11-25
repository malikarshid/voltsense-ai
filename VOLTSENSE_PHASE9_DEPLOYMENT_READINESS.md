# VOLTSENSE AI — PHASE 9 DEPLOYMENT READINESS & DEVOPS RUNBOOK
## Container Orchestration, Environment Variable Matrix, Health Checks & Production Runbook

**Audit Date:** November 26, 2026  
**Auditor:** Principal DevOps Engineer & Cloud Infrastructure Architect  
**Deployment Standards:** Twelve-Factor App, OCI Container Standards, Zero-Downtime Deployment  
**Project Path:** `C:\Projects\voltsense-ai`

---

## 1. Containerization Architecture

VoltSense AI is packaged using multi-stage, production-hardened Docker containers orchestrated via `docker-compose.yml`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                     VOLTSENSE AI DOCKER TOPOLOGY                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│   INBOUND HTTP/WS (Port 80 / 443)                                      │
│               │                                                        │
│               ├───► [voltsense-frontend] (Next.js 14 Standalone, :3000)│
│               │         │                                              │
│               │         └───► [voltsense-backend] (FastAPI, :8000)     │
│               │                     │                                  │
│               │                     ├───► SQLite / PostgreSQL Database │
│               │                     │                                  │
│               │                     └───► [voltsense-mqtt] (Mosquitto) │
│               │                                       ▲                │
│               └───────────────────────────────────────┘                │
│                         (CAN-BMS Hardware / ESP32 Feed, Port 1883)     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Environment Variable Configuration Matrix

Separate configurations must be maintained for Development, Staging, and Production environments:

| Environment Variable | Description | Development Default | Production Recommended | Sensitive? |
| :--- | :--- | :--- | :--- | :-: |
| `SECRET_KEY` | JWT signing secret | `voltsense_ai_super_secret...` | 64-char cryptographically random hex | **YES** |
| `DATABASE_URL` | Async DB connection URI | `sqlite+aiosqlite:///./voltsense.db` | `postgresql+asyncpg://user:pass@host:5432/voltsense` | **YES** |
| `NEXT_PUBLIC_API_URL` | Frontend REST API base | `http://localhost:8000/api/v1` | `https://api.voltsense.ai/api/v1` | NO |
| `NEXT_PUBLIC_WS_URL` | WebSocket telemetry base | `ws://localhost:8000` | `wss://api.voltsense.ai` | NO |
| `CORS_ORIGINS` | Permitted cross-origin hosts | `http://localhost:3000,...` | `https://voltsense.ai,https://app.voltsense.ai` | NO |
| `MQTT_BROKER_HOST` | Telemetry broker hostname | `localhost` | `mqtt-broker` (internal Docker network) | NO |
| `MQTT_BROKER_PORT` | Telemetry broker port | `1883` | `1883` | NO |

---

## 3. Production Deployment Step-by-Step Procedure

### 3.1 Option A: Local Bare-Metal / VM Deployment
1. **Clone repository:**
   ```bash
   git clone https://github.com/your-org/voltsense-ai.git
   cd voltsense-ai
   ```
2. **Start Backend Service:**
   ```bash
   cd backend
   python -m venv .venv
   .\.venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
   ```
3. **Build & Start Frontend Service:**
   ```bash
   cd ../frontend
   npm ci
   npm run build
   Copy-Item -Recurse -Force public .next\standalone\
   Copy-Item -Recurse -Force .next\static .next\standalone\.next\
   node .next\standalone\server.js
   ```

### 3.2 Option B: Containerized Orchestration (Docker Compose)
From the project root:
```bash
docker compose up -d --build
```
Verify container health:
```bash
docker compose ps
docker compose logs -f backend
```

---

## 4. Health Checks & Synthetic Monitoring

The backend exposes automated health check endpoints for load balancers (AWS ALB / Kubernetes Liveness & Readiness Probes):

- **Liveness Probe:** `GET /health`
  - Response (200 OK):
    ```json
    {
      "status": "healthy",
      "service": "VoltSense AI Backend",
      "version": "1.0.0",
      "simulator_running": true
    }
    ```
- **Readiness Probe:** `GET /api/v1/monitoring/simulator/status`
  - Validates active database connectivity and background simulation engine loop.

---

**DevOps Readiness Certification:** **PRODUCTION READY**
