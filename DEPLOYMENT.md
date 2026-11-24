# VoltSense AI — Production Deployment Guide

## 1. Containerized Multi-Service Deployment (Docker Compose)
The recommended deployment method uses Docker Compose to run:
- Frontend (Next.js 14 Standalone container)
- Backend (FastAPI Python container with trained ML models)
- MQTT Broker (Eclipse Mosquitto for edge hardware ingestion)
- PostgreSQL (Production relational database)

```bash
docker-compose up --build -d
```

### Health Verification
```bash
docker-compose ps
curl http://localhost:8000/health
curl http://localhost:3000
```

---

## 2. Environment Variables (.env)

### Backend (.env)
```env
PROJECT_NAME="VoltSense AI"
VERSION="1.0.0"
SECRET_KEY="replace_with_a_secure_random_64_char_string"
DATABASE_URL="postgresql+asyncpg://postgres:secure_password@db:5432/voltsense"
MQTT_BROKER_HOST="mqtt-broker"
MQTT_BROKER_PORT=1883
CORS_ORIGINS=["https://yourdomain.com", "http://localhost:3000"]
```

### Frontend (.env.production)
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1"
NEXT_PUBLIC_WS_URL="wss://api.yourdomain.com"
```

---

## 3. Reverse Proxy Configuration (Nginx)
```nginx
server {
    listen 80;
    server_name voltsense.yourdomain.com;

    # Frontend Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Live Monitoring WebSocket
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_read_timeout 86400;
    }
}
```
