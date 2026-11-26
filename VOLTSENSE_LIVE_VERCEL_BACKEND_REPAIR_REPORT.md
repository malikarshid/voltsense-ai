# VOLTSENSE AI — LIVE VERCEL BACKEND REPAIR REPORT

**System:** VoltSense AI Multi-Service Cloud Platform  
**Live Application URL:** `https://voltsense-ai.vercel.app`  
**Commits Deployed:** `22d8358` & `79a7d38`  
**Auditing Authority:** Senior Cloud Deployment Architect & Principal Systems Engineer  
**Status:** FULLY REPAIRED, TESTED & VERIFIED

---

## 1. Executive Summary

When deployed to Vercel, the VoltSense AI dashboard displayed a critical error card:
> `CAN-BMS Bus Connection Disrupted — Failed to fetch battery health`  
> Vehicle selector stuck on: `Select Vehicle`

Both backend and frontend services had built successfully, but backend API requests failed during execution. This report details the underlying serverless root cause, the architectural and code-level fixes implemented, and the live cloud verification results.

---

## 2. Root Cause Analysis

### Serverless Filesystem Immutability
In Vercel's serverless environment (running within an AWS Lambda container), the deployment directory (`/var/task`) is mounted with **strictly read-only permissions**. 

In `backend/app/core/config.py`:
```python
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_DEFAULT_DB_FILE = (_BACKEND_DIR / "voltsense.db").as_posix()
DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{_DEFAULT_DB_FILE}")
```
When no external `DATABASE_URL` is set, SQLite attempts to create and write `voltsense.db` inside `/var/task`. In a serverless container, SQLite throws:
`sqlite3.OperationalError: attempt to write a readonly database`

### Unhandled Lifespan Startup Crash
In `backend/app/main.py`:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()  # Uncaught database exception here
    ...
```
Because `await init_db()` was uncaught, the entire FastAPI ASGI startup aborted, resulting in Vercel returning `FUNCTION_INVOCATION_FAILED (500)` for `/health`, `/api/v1/vehicles`, and all `/api/v1/battery/*` endpoints.

The Next.js frontend, unable to reach the backend, gracefully fell back to displaying the `CAN-BMS Bus Connection Disrupted` alert.

---

## 3. Comprehensive Fixes Implemented

### Fix 1: Ephemeral Writable Storage for Serverless Cold Starts
In `backend/app/core/config.py`:
```python
if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    _DEFAULT_DB_FILE = "/tmp/voltsense.db"
else:
    _DEFAULT_DB_FILE = (_BACKEND_DIR / "voltsense.db").as_posix()
```
The `/tmp` directory is the only designated writable scratch space in AWS Lambda / Vercel serverless environments.

> [!IMPORTANT]
> `/tmp` is temporary, ephemeral container storage. While it enables immediate, crash-free preview functionality without external provisioning, durable cloud production persistence requires a managed PostgreSQL instance (e.g. Neon, Supabase, or AWS RDS).

### Fix 2: Non-Blocking Lifespan Initialization
In `backend/app/main.py`:
Wrapped `await init_db()` and `simulator.run_loop()` in safe `try...except` blocks, ensuring that temporary database initializations or cold-start conditions never terminate the ASGI process.

### Fix 3: Canonical Vehicle Identity Harmonization
In `backend/app/core/config.py`, `backend/app/services/battery_service.py`, `backend/app/api/v1/vehicles.py`, and `backend/app/api/v1/battery.py`:
Harmonized authoritative vehicle IDs:
- **Vehicle 1 (VoltSense Model GT):** ID `7dc8b484-4d3d-474a-935e-07a9fa31492d`, VIN `KA05ER7777`
- **Vehicle 2 (VoltSense CyberSUV):** ID `56992492-fc36-4c5b-ad44-45f035724c65`, VIN `HWGHLDZ20842872FS`

Guaranteed that:
1. `GET /api/v1/vehicles` returns canonical IDs.
2. `GET /api/v1/battery/{id_or_vin}/health` returns the exact matching `vehicle_id`.
3. Unknown vehicle queries (`/vehicles/{unknown}`, `/battery/{unknown}/health`, `/predictions/{unknown}/analyze`) strictly return **HTTP 404 Not Found** rather than silently falling back to vehicle 1.

---

## 4. Live Verification Evidence

Against the production cloud deployment `https://voltsense-ai.vercel.app`:

```
--- VEHICLE IDENTITY CONSISTENCY ---
Vehicles (200): [('7dc8b484-4d3d-474a-935e-07a9fa31492d', 'KA05ER7777'), ('56992492-fc36-4c5b-ad44-45f035724c65', 'HWGHLDZ20842872FS')]
Health KA05ER7777 (200): vehicle_id=7dc8b484-4d3d-474a-935e-07a9fa31492d, SOH=88.4, SOC=67.0
Health HWGHLDZ20842872FS (200): vehicle_id=56992492-fc36-4c5b-ad44-45f035724c65, SOH=92.0, SOC=54.0
=> IDENTITY CONSISTENCY PASSED!

--- 404 UNKNOWN VEHICLE VALIDATION ---
404 checks: vehicles=404, battery_health=404, predictions=404
=> 404 VALIDATION PASSED!

--- SCENARIO SIMULATION CHECKS ---
Scenario normal: status=200, active=normal
Scenario charging: status=200, active=charging
Scenario discharging: status=200, active=discharging
Scenario high_temp: status=200, active=high_temp
Scenario cell_imbalance: status=200, active=cell_imbalance
Scenario aging: status=200, active=aging
=> ALL 6 SCENARIOS VERIFIED SUCCESSFULLY!
```

---

## 5. Architectural Recommendations

1. **Managed PostgreSQL:** Set `DATABASE_URL=postgresql+asyncpg://...` in Vercel Project Settings for permanent data persistence across lambda instances.
2. **Persistent Simulator Worker:** In serverless, lambdas freeze when idle. For continuous sub-second background simulation and MQTT streaming, maintain the standalone worker deployment on persistent compute (e.g. Render, Railway, or AWS ECS/Fargate).
