# VOLTSENSE AI — VERCEL ENVIRONMENT VARIABLES
## Comprehensive Environment Configuration Specification by Service & Target Stage

**System:** VoltSense AI Platform
**Workspace:** `C:\Projects\voltsense-ai`
**Date:** November 26, 2026

---

## 1. Environment Variable Matrix

```
┌──────────────────────────────┬──────────────┬──────────────┬────────────────────────────────────────────────────────┐
│ VARIABLE NAME                │ SERVICE      │ TARGET SCOPE │ PURPOSE & VALUE SPECIFICATION                          │
├──────────────────────────────┼──────────────┼──────────────┼────────────────────────────────────────────────────────┤
│ NEXT_PUBLIC_API_URL          │ frontend     │ Prod/Preview │ Relative REST base path (Set to: /api/v1)              │
│ NEXT_PUBLIC_WS_URL           │ frontend     │ Prod/Preview │ WebSocket origin override (Leave empty for dynamic)    │
│ PROJECT_NAME                 │ backend      │ All          │ Application title (Default: "VoltSense AI")            │
│ VERSION                      │ backend      │ All          │ Platform version (Default: "1.0.0")                    │
│ API_V1_STR                   │ backend      │ All          │ API prefix router (Default: "/api/v1")                 │
│ ENVIRONMENT                  │ backend      │ Prod/Preview │ Runtime mode: "production" or "development"            │
│ SECRET_KEY                   │ backend      │ Prod/Preview │ Cryptographic secret for signing HS256 JWT tokens      │
│ ALGORITHM                    │ backend      │ All          │ Token encryption algorithm (Default: "HS256")          │
│ ACCESS_TOKEN_EXPIRE_MINUTES  │ backend      │ All          │ Token session lifetime (Default: 10080 = 7 days)       │
│ DATABASE_URL                 │ backend      │ Prod/Preview │ PostgreSQL connection string (postgresql+asyncpg://...)│
│ DB_POOL_SIZE                 │ backend      │ Prod/Preview │ Serverless connection pool size (Default: 5)           │
│ DB_MAX_OVERFLOW              │ backend      │ Prod/Preview │ Max connection overflow (Default: 10)                  │
│ DB_POOL_TIMEOUT              │ backend      │ Prod/Preview │ Connection acquisition timeout (Default: 30s)          │
│ DB_POOL_RECYCLE              │ backend      │ Prod/Preview │ Connection recycle interval (Default: 300s)            │
│ CORS_ORIGINS                 │ backend      │ Prod/Preview │ Whitelisted domains for CORS headers                   │
│ MQTT_BROKER_HOST             │ backend      │ Worker Only  │ Internal MQTT broker hostname                          │
│ MQTT_BROKER_PORT             │ backend      │ Worker Only  │ Internal MQTT broker port (Default: 1883)              │
│ MQTT_TOPIC_PREFIX            │ backend      │ Worker Only  │ Ingestion topic prefix (Default: "voltsense")          │
└──────────────────────────────┴──────────────┴──────────────┴────────────────────────────────────────────────────────┘
```

---

## 2. Setting Variables in Vercel Dashboard

Navigate to **Project Settings > Environment Variables** in the Vercel Dashboard:

### Production Settings
1. `NEXT_PUBLIC_API_URL` = `/api/v1` (Environment: Production, Preview)
2. `NEXT_PUBLIC_WS_URL` = (leave empty for automatic dynamic wss:// resolution)
3. `DATABASE_URL` = `postgresql+asyncpg://user:password@ep-db.region.neon.tech/voltsense?ssl=require`
4. `SECRET_KEY` = `64_char_hex_secret_generated_via_openssl`
5. `ENVIRONMENT` = `production`
6. `CORS_ORIGINS` = `["https://*.vercel.app"]`

### Local Development (`.env` in repository root or services)
- `DATABASE_URL` is omitted locally to default to SQLite at `backend/voltsense.db`.
- `NEXT_PUBLIC_API_URL` defaults to `/api/v1` (proxied by Next.js `next.config.mjs` to `http://127.0.0.1:8000`).
