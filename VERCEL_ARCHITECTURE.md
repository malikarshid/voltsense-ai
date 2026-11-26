# VOLTSENSE AI — VERCEL SERVICES ARCHITECTURE
## Multi-Service Topology, Routing Ingress, Service Bindings & Serverless Compatibility

**System:** VoltSense AI Platform
**Architecture Model:** Vercel Services (Monorepo Multi-Service Deployment)
**Workspace:** `C:\Projects\voltsense-ai`
**Date:** November 26, 2026

---

## 1. Architectural Topology

VoltSense AI implements a decoupled two-service micro-frontend/backend architecture packaged into a single Git repository:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      VOLTSENSE AI REPOSITORY LAYOUT                              │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   c:\Projects\voltsense-ai/                                                      │
│   ├── vercel.json                  <── Root Vercel Multi-Service Configuration   │
│   ├── .env.example                 <── Unified Environment Variable Specification │
│   │                                                                              │
│   ├── frontend/                    <── Service "frontend" (Root: frontend)       │
│   │   ├── package.json             <── Next.js 14, React 18, Three.js            │
│   │   ├── next.config.mjs          <── Local Dev Proxy & Standalone Output       │
│   │   ├── src/app/                 <── 13 Dashboard Routes (App Router)          │
│   │   └── src/lib/api.ts           <── Dynamic Relative API & Dynamic WSS Client │
│   │                                                                              │
│   └── backend/                     <── Service "backend" (Root: backend)         │
│       ├── main.py                  <── Vercel Entrypoint Shim (`main:app`)       │
│       ├── .python-version          <── Pinned Python 3.12 Runtime                │
│       ├── requirements.txt         <── FastAPI, Uvicorn, SQLAlchemy, asyncpg     │
│       └── app/                     <── Modular FastAPI Architecture              │
│           ├── main.py              <── Lifespan & Route Registration             │
│           ├── core/database.py     <── Serverless Connection Pool & asyncpg      │
│           ├── services/            <── Physics Simulator & Scikit-Learn ML       │
│           └── worker.py            <── Autonomous Continuous Simulation Worker   │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ingress & Public Routing Engine

Top-level rewrites inside `vercel.json` direct all inbound traffic based on URL prefix:

```json
"rewrites": [
  { "source": "/health", "destination": { "service": "backend" } },
  { "source": "/api/v1/(.*)", "destination": { "service": "backend" } },
  { "source": "/ws/monitoring/(.*)", "destination": { "service": "backend" } },
  { "source": "/(.*)", "destination": { "service": "frontend" } }
]
```

### Ingress Rules:
1. **Rule 1 (`/health`):** Explicitly intercepted and forwarded to FastAPI `GET /health` for automated uptime probes.
2. **Rule 2 (`/api/v1/(.*)`):** Preserves the full path and query string, delivering requests to FastAPI's 10 API routers.
3. **Rule 3 (`/ws/monitoring/(.*)`):** Routes WebSocket upgrade handshakes directly to `@app.websocket("/ws/monitoring/{vehicle_id}")`.
4. **Rule 4 (`/(.*)`):** Catch-all rule directing all static assets (`/_next/*`), 3D GLB model files, and HTML routes to the Next.js frontend.

---

## 3. Service Binding Evaluation & Decision

- **Inspected Codebase:** All 13 page components (`src/app/*/page.tsx`) are marked `'use client'`.
- **Finding:** 100% of REST calls originate in the browser via `fetch('/api/v1/...')` through the shared public origin.
- **Zero Server-to-Server Calls:** There are no Next.js Server Components, Server Actions (`'use server'`), or internal Route Handlers calling FastAPI privately.
- **Architectural Decision:** **No private service binding is declared in `vercel.json`**. Declaring an unused `BACKEND_URL` binding would introduce unnecessary configuration complexity without functional benefit. Shared public rewrites provide zero-CORS communication for browser clients.

---

## 4. Serverless Compatibility Analysis & Mitigations

### 4.1 Serverless Freeze & Background Physics Loop
- **Problem:** Vercel functions freeze when idle; background `asyncio.create_task(simulator.run_loop())` does not tick continuously without requests.
- **Mitigation:** VoltSense AI implements **Dual-Mode Telemetry**:
  1. *On-Demand Stepping:* When `GET /api/v1/monitoring/{vehicle_id}/latest` is requested by an active client, the physics engine steps synchronously based on elapsed delta-time.
  2. *Autonomous Persistent Worker:* For high-frequency continuous 1.0 Hz CAN-BMS broadcasting, run `python -m app.worker` in a lightweight Docker container (AWS ECS / Railway / On-premise).

### 4.2 SQLite vs. Managed PostgreSQL
- **Problem:** SQLite files are lost on serverless function cold starts.
- **Mitigation:** Production connects to managed PostgreSQL via `DATABASE_URL=postgresql+asyncpg://...`. `backend/app/core/database.py` includes serverless connection pooling (`pool_size=5`, `max_overflow=10`, `pool_recycle=300`, `pool_pre_ping=True`).
