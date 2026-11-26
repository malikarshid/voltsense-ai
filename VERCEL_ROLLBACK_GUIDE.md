# VOLTSENSE AI — VERCEL ROLLBACK GUIDE
## Fast Reversal & Contingency Procedures for Multi-Service Vercel Deployment

**System:** VoltSense AI Platform
**Workspace:** `C:\Projects\voltsense-ai`
**Date:** November 26, 2026

---

## 1. Instant Vercel Dashboard Rollback (Zero Downtime)

If a new production deployment encounters anomalies:
1. Navigate to **Project > Deployments** in the Vercel Dashboard.
2. Locate the previous stable deployment.
3. Click the three-dots menu `...` and select **Instant Rollback**.
4. Traffic is routed immediately to the previous build artifact within seconds.

---

## 2. CLI Re-Deployment Rollback
To roll back via CLI to a known good deployment ID:
```bash
npx vercel rollback <deployment-id-or-url>
```

---

## 3. Local Repository Reversal

All configuration files modified for Vercel deployment were safely backed up prior to modification in `scratch/backups/`:

| Target File | Backup Location | Restore Command |
|---|---|---|
| `frontend/src/lib/api.ts` | `scratch/backups/api.ts.bak` | `Copy-Item scratch/backups/api.ts.bak frontend/src/lib/api.ts -Force` |
| `frontend/next.config.mjs` | `scratch/backups/next.config.mjs.bak` | `Copy-Item scratch/backups/next.config.mjs.bak frontend/next.config.mjs -Force` |
| `backend/app/core/config.py` | `scratch/backups/config.py.bak` | `Copy-Item scratch/backups/config.py.bak backend/app/core/config.py -Force` |
| `backend/app/core/database.py`| `scratch/backups/database.py.bak` | `Copy-Item scratch/backups/database.py.bak backend/app/core/database.py -Force` |

### To Completely Remove Vercel Configuration:
```bash
Remove-Item vercel.json -Force
Remove-Item backend/main.py -Force
Remove-Item backend/.python-version -Force
```
*Note: Existing SQLite database `backend/voltsense.db` and Docker configuration are never modified or deleted.*
