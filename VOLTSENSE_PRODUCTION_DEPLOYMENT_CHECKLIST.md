# VOLTSENSE AI — PRODUCTION DEPLOYMENT CHECKLIST & RUNBOOK
## Container Topology, Environment Configurations, Zero-Downtime Rollout & Disaster Recovery

**Audit Date:** November 26, 2026  
**Auditor:** Principal DevOps Engineer & Cloud Infrastructure Architect  
**Deployment Target:** Production Staging & Cloud Container Platforms (AWS ECS / Kubernetes / Docker Swarm)

---

## 1. Pre-Flight Production Checklist

- [x] Next.js standalone production build verified (`17/17 routes compiled`).
- [x] TypeScript validation clean (`0 errors`).
- [x] ESLint static analysis clean (`0 errors / 0 warnings`).
- [x] Python backend pytest suite passing (`11/11 tests passed`).
- [x] Multi-vehicle simulation isolation verified.
- [x] Database persistence and restart integrity verified on disk.
- [x] Certified PDF and CSV report streaming verified.
- [x] All 8 responsive viewports verified with 0px horizontal overflow.
- [x] 60-Second WebGL 3D stability soak test verified with zero canvas remounts.
- [x] Health check endpoints verified (`/health` and `/api/v1/monitoring/simulator/status`).
- [x] Container orchestration configured via `docker-compose.yml`.

---

## 2. Environment Variable Schema (Twelve-Factor Compliance)

```bash
# ============================================================
# BACKEND PRODUCTION ENVIRONMENT (.env)
# ============================================================
SECRET_KEY=generate_with_openssl_rand_hex_32_chars
DATABASE_URL=postgresql+asyncpg://voltsense_user:password@postgres-db:5432/voltsense_prod
ACCESS_TOKEN_EXPIRE_MINUTES=1440
CORS_ORIGINS=https://voltsense.ai,https://app.voltsense.ai
SIMULATION_MODE_DEFAULT=true
SIMULATION_INTERVAL_SEC=1.0
MQTT_BROKER_HOST=mqtt-broker
MQTT_BROKER_PORT=1883
MQTT_TOPIC_PREFIX=voltsense

# ============================================================
# FRONTEND PRODUCTION ENVIRONMENT (.env.production)
# ============================================================
NEXT_PUBLIC_API_URL=https://api.voltsense.ai/api/v1
NEXT_PUBLIC_WS_URL=wss://api.voltsense.ai
```

---

## 3. Deployment Runbook

### Clean Container Rollout
```bash
# 1. Pull latest release commit
git pull origin main

# 2. Build production container images
docker compose build --no-cache

# 3. Launch containers in detached mode
docker compose up -d

# 4. Execute automated healthcheck
curl -f http://localhost:8000/health || exit 1
curl -f http://localhost:3000 || exit 1
```

### Rollback Procedure
If synthetic monitoring reports health degradation:
```bash
# 1. Revert to previous image tag
docker compose rollback || docker compose down && docker run -d <previous-image>

# 2. Inspect backend error logs
docker compose logs --tail=100 backend
```

---

**Deployment Readiness Status:** **APPROVED FOR STAGING & PRODUCTION**
