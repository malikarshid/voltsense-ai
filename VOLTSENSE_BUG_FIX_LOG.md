# VOLTSENSE AI — BUG FIX & DEFECT REMEDIATION LOG
## Prioritized Defect Tracking, Root Cause Analysis, Code Changes & Verification Evidence

**Audit Date:** November 26, 2026  
**Auditor:** Principal QA Automation Engineer & Senior Full-Stack Architect  
**Scope:** VoltSense AI All Phases Audit & Hardening

---

## 1. Prioritized Defect Log & Resolutions

### BUG-01: Async Relationship Lazy-Load on Vehicle Creation
- **File:** `backend/app/api/v1/vehicles.py` (Line 72)
- **Severity:** High
- **Description:** Invoking `POST /api/v1/vehicles` to register a new vehicle returned HTTP 500 Internal Server Error due to SQLAlchemy `MissingGreenlet`.
- **Root Cause:** Calling `VehicleResponse.model_validate(vehicle)` after `db.commit()` attempted lazy loading of `vehicle.pack` synchronously outside of an async await.
- **Fix Applied:** Reloaded the vehicle with eager loading:
  ```python
  await db.commit()
  result = await db.execute(
      select(Vehicle).options(selectinload(Vehicle.pack)).where(Vehicle.id == vehicle.id)
  )
  vehicle_with_pack = result.scalar_one()
  return VehicleResponse.model_validate(vehicle_with_pack)
  ```
- **Verification Result:** Verified with `scratch/test_db_persistence_and_security.mjs`; returns HTTP 200 with complete pack entity.

---

### BUG-02: React Hook Missing Dependency in AI Predictions
- **File:** `frontend/src/app/predictions/page.tsx` (Lines 29–48)
- **Severity:** Medium
- **Description:** Next.js lint flagged missing dependency `runInference` in `useEffect` hook.
- **Root Cause:** `runInference` was declared as an unmemoized inline function, causing it to recreate on every render.
- **Fix Applied:** Wrapped `runInference` in `useCallback` with `[vehicleId]`:
  ```typescript
  const runInference = useCallback(async (ahead: number) => { ... }, [vehicleId]);
  useEffect(() => {
    runInference(cyclesAhead);
  }, [runInference, cyclesAhead, activeScenario, scenarioChangeCount]);
  ```
- **Verification Result:** `npm run lint` returns `✔ No ESLint warnings or errors`.

---

### BUG-03: Three.js Canvas Re-mounting and WebGL Blinking
- **File:** `frontend/src/components/3d/ElectricVehicle3D.tsx`
- **Severity:** High
- **Description:** The 3D car blinked or flashed black/white every 1.0 second upon receiving incoming WebSocket telemetry packets.
- **Root Cause:** `useEffect` hook included callback props (`onSelectCell`, `onSelectComponent`) in its dependency array. Telemetry re-rendered the parent page, recreating anonymous function props and tearing down the WebGL renderer every second.
- **Fix Applied:** Moved callbacks into stable mutable refs (`onSelectCellRef.current = onSelectCell`), used an empty dependency array `[]` for WebGL engine mount, and decoupled theme/exploration mode changes into non-destructive lightweight CSS/material updates.
- **Verification Result:** 60-Second automated soak test recorded **0 canvas remounts and 0 flicker events**.

---

### BUG-04: Multi-Vehicle Simulation Telemetry Collision
- **File:** `backend/app/services/simulator_service.py`
- **Severity:** High
- **Description:** Activating a scenario on one vehicle globally changed telemetry across all fleet vehicles.
- **Root Cause:** Simulator state was stored in singleton global variables without per-vehicle dictionary keys.
- **Fix Applied:** Implemented `self.vehicle_states: Dict[str, VehicleSimulationState]` with independent state instances, sequence counters (`seq_id`), and nominal voltage scaling (35V for `KA05ER7777` vs. 400V for `HWGHLDZ20842872FS`).
- **Verification Result:** Verified via Pytest `test_multi_vehicle_scenario_isolation` (Passed in 5.73s).

---

### BUG-05: Missing Explode Slider Continuous Control
- **File:** `frontend/src/components/3d/ElectricVehicle3D.tsx` & `src/app/vehicle-3d/page.tsx`
- **Severity:** Medium
- **Description:** Exploded view only operated as binary (0% or 100%) without fine spatial scrub.
- **Root Cause:** Explode factor was hardcoded as 0 or 1.0 without range slider wiring.
- **Fix Applied:** Added `explodePercentage` state, range input slider (0–100%), animation speed controls (0.5x, 1x, 2x), and delta-time lerping across 10 independent subsystem axes.
- **Verification Result:** Verified via automated CDP test at 0%, 50%, 80%, and 100% expansion.

---

### BUG-06: Database Relative Path Working Directory Ambiguity
- **File:** `backend/app/core/config.py`
- **Severity:** Medium
- **Description:** Running tests or management scripts from the project root caused SQLite to create an empty `voltsense.db` in `c:\Projects\voltsense-ai` rather than opening the existing database in `backend/voltsense.db`.
- **Root Cause:** Default `DATABASE_URL` was configured as `sqlite+aiosqlite:///./voltsense.db`, which resolved relative to the calling shell's working directory.
- **Fix Applied:** Anchored default database path relative to `config.py` module root:
  ```python
  _BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
  _DEFAULT_DB_FILE = (_BACKEND_DIR / "voltsense.db").as_posix()
  DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{_DEFAULT_DB_FILE}")
  ```
- **Verification Result:** Full pytest suite (11/11 tests) and persistence verification scripts execute with 100% success from any working directory.

---

### BUG-07: Test Harness Node-Fetch Missing Dependency
- **File:** `scratch/test_db_persistence_and_security.mjs`
- **Severity:** Low (Test Harness Infrastructure)
- **Description:** Automated database test script exited with code 1 due to `Cannot find package 'node-fetch'`.
- **Root Cause:** Script imported external `node-fetch` module which was not in `package.json`, whereas Node.js v24.2.0 includes native global `fetch`.
- **Fix Applied:** Removed unnecessary `node-fetch` import and utilized native Node.js fetch API.
- **Verification Result:** Clean test execution and automated validation.

---

**Bug Fix Audit Status:** **ALL IDENTIFIED ISSUES REMEDIATED AND VERIFIED**
