# VOLTSENSE AI — VERCEL DEPLOYMENT GUIDE
## End-to-End Multi-Service Deployment Runbook for Next.js Frontend & FastAPI Backend

**System:** VoltSense AI Platform
**Target:** Vercel Services Architecture (Single Project, Multi-Service)
**Workspace:** `C:\Projects\voltsense-ai`
**Date:** November 26, 2026
**Status:** **READY FOR PREVIEW DEPLOYMENT**

---

## 1. Overview & Architecture Summary

VoltSense AI is configured to deploy to Vercel as a **multi-service project** using the repository-root `vercel.json` configuration. Under this architecture:
- **`frontend` service:** Next.js 14 App Router, Three.js 3D WebGL Digital Twin canvas, and 13 responsive engineering dashboard routes.
- **`backend` service:** Python FastAPI ASGI server, Scikit-Learn predictive degradation models, ReportLab PDF generation, and CSV telemetry exports.
- **Shared Public Domain:** Both services deploy under a unified domain (e.g., `voltsense-ai.vercel.app`), completely eliminating cross-origin resource sharing (CORS) friction and preflight latency.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   VERCEL MULTI-SERVICE DEPLOYMENT                      │
├────────────────────────────────────────────────────────────────────────┤
│  Client Browser Request (https://voltsense-ai.vercel.app)              │
│       │                                                                │
│       ├─── GET /api/v1/:path* ─────────► [ backend (FastAPI) ]         │
│       ├─── GET /health ────────────────► [ backend (FastAPI) ]         │
│       ├─── WS  /ws/monitoring/:vid ───► [ backend (FastAPI) ]         │
│       └─── GET /:path* ────────────────► [ frontend (Next.js 14) ]     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites

1. **Vercel CLI:** Version 67.0.0 or later installed (`npx --yes vercel --version`).
2. **Vercel Account:** Team or Pro account with Vercel Services (multi-service) entitlement.
3. **Managed PostgreSQL:** A serverless PostgreSQL instance (Neon, Supabase, or AWS RDS).
4. **Local Development:** Node.js v20+ and Python 3.12+ (existing SQLite workflow remains intact).

---

## 3. Step-by-Step Vercel Deployment Procedure

### Step 1: Link Project to Vercel
From the repository root `c:\Projects\voltsense-ai`:
```bash
npx vercel link
```
- Select your Vercel Scope/Team.
- Link to an existing project or create a new project named `voltsense-ai`.

### Step 2: Configure Environment Variables
Set the required production variables in the Vercel Dashboard (**Project Settings > Environment Variables**) or via CLI:

#### Frontend Service Variables (Environment: Production & Preview)
```bash
npx vercel env add NEXT_PUBLIC_API_URL production
# Enter: /api/v1

npx vercel env add NEXT_PUBLIC_WS_URL production
# Enter: (leave empty for automatic dynamic wss:// resolution)
```

#### Backend Service Variables (Environment: Production & Preview)
```bash
npx vercel env add DATABASE_URL production
# Enter: postgresql+asyncpg://<username>:<password>@<neon-host>/voltsense?ssl=require

npx vercel env add SECRET_KEY production
# Enter: <generate 64-character random hex string>

npx vercel env add ENVIRONMENT production
# Enter: production
```

### Step 3: Trigger a Preview Deployment
Run a preview build without modifying production DNS:
```bash
npx vercel
```
Vercel CLI will:
1. Detect root `vercel.json` with multi-service definitions.
2. Build the `frontend` service independently using Next.js 14 App Router.
3. Build the `backend` service independently using Python 3.12 and `backend/requirements.txt`.
4. Deploy both services to a unique preview URL (e.g., `https://voltsense-ai-git-preview-myteam.vercel.app`).

### Step 4: Verify Deployment Integrity
Execute the automated smoke verification against the preview URL:
1. **Health Check:** `curl https://<preview-domain>/health` -> Verify HTTP 200 and `{"status": "healthy"}`.
2. **API Proxy:** `curl https://<preview-domain>/api/v1/vehicles` -> Verify JSON array of vehicles.
3. **UI Dashboard:** Open `https://<preview-domain>` in Chrome -> Verify pure white light mode, metrics cards, and Three.js 3D sapphire-blue car render.

---

## 4. Production Promotion Checklist

- [ ] Preview deployment smoke tests 100% passing.
- [ ] Managed PostgreSQL schema created and verified.
- [ ] No hardcoded localhost or 127.0.0.1 URLs in browser runtime.
- [ ] Zero exposed secrets in `NEXT_PUBLIC_*` variables.
- [ ] Custom domain DNS mapped in Vercel project settings.
- [ ] Execute production deployment:
  ```bash
  npx vercel --prod
  ```
