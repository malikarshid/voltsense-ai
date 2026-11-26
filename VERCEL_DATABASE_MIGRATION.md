# VOLTSENSE AI — POSTGRESQL DATABASE MIGRATION GUIDE
## Relational Schema Transition from Local SQLite to Managed PostgreSQL for Vercel

**System:** VoltSense AI Platform
**Engine:** SQLAlchemy 2.0 (Async) + `asyncpg` Driver
**Workspace:** `C:\Projects\voltsense-ai`
**Date:** November 26, 2026

---

## 1. Dual-Engine Architecture

VoltSense AI's database connector in `backend/app/core/database.py` dynamically inspects `DATABASE_URL`:
- **Local Development:** Defaults to SQLite with `aiosqlite` (`sqlite+aiosqlite:///backend/voltsense.db`).
- **Production (Vercel):** Connects to managed PostgreSQL using `asyncpg`.
- **Automatic Driver Normalization:** Automatically converts standard `postgres://` and `postgresql://` URLs from Neon, Supabase, or AWS RDS into `postgresql+asyncpg://`.

---

## 2. Managed PostgreSQL Setup (e.g., Neon / Supabase)

### Step 1: Provision Database
Create a serverless PostgreSQL database on [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com).
- Database Name: `voltsense`
- Region: Closest to your primary Vercel edge deployment region (e.g., `us-east-1` or `iad1`).

### Step 2: Extract Connection String
Obtain the async connection string:
```text
postgresql+asyncpg://voltsense_owner:secret_password@ep-cold-star-12345.us-east-2.aws.neon.tech/voltsense?ssl=require
```

### Step 3: Run Initial Schema Migration
From your local development machine with `DATABASE_URL` set to the PostgreSQL instance:
```bash
# In PowerShell:
$env:DATABASE_URL = "postgresql+asyncpg://voltsense_owner:secret_password@ep-cold-star-12345.us-east-2.aws.neon.tech/voltsense?ssl=require"
$env:PYTHONPATH = "c:\Projects\voltsense-ai\backend"

c:\Projects\voltsense-ai\backend\.venv\Scripts\python.exe -c "
import asyncio
from app.core.database import init_db
from app.services.battery_service import battery_service
from app.core.database import AsyncSessionLocal

async def setup():
    print('[Migration] Creating relational tables in PostgreSQL...')
    await init_db()
    async with AsyncSessionLocal() as session:
        print('[Migration] Seeding initial fleet reference assets...')
        await battery_service.seed_default_vehicles(session)
    print('[Migration] PostgreSQL database successfully initialized!')

asyncio.run(setup())
"
```

---

## 3. Schema Verification & Relationships

The initial migration establishes 7 core relational tables:
1. `users` — Authentication credentials (bcrypt hashed).
2. `vehicles` — Fleet assets (`KA05ER7777` 35V pack, `HWGHLDZ20842872FS` 400V CyberSUV).
3. `battery_packs` — Pack metrics (SOH, SOC, impedance, health score) with `ON DELETE CASCADE`.
4. `battery_cells` — 10S sub-module individual cell voltages and temperatures with `ON DELETE CASCADE`.
5. `sensor_readings` — Time-series telemetry readings indexed on `(vehicle_id, timestamp)`.
6. `alerts` — Threshold breach events indexed on `created_at` and `severity`.
7. `maintenance_records` — Work orders and technician logs.

---

## 4. Rollback to SQLite
If the managed PostgreSQL database is temporarily offline or unreachable:
1. Remove `DATABASE_URL` from Vercel Project Settings or unset it in local environment.
2. The application automatically falls back to local SQLite at `backend/voltsense.db` without crashing.
