<div align="center">

# ⚡ VoltSense AI

### **Intelligent EV Battery Management, Real-Time Monitoring & Predictive Battery Health Analytics Platform**

[![Live Demo](https://img.shields.io/badge/Demo-voltsense--ai.vercel.app-10B981?style=for-the-badge&logo=vercel&logoColor=white)](https://voltsense-ai.vercel.app)
[![GitHub Repository](https://img.shields.io/badge/GitHub-malikarshid%2Fvoltsense--ai-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/malikarshid/voltsense-ai)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12%20%7C%203.14-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-2.0%20Async-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)](https://www.sqlalchemy.org/)
[![Scikit-Learn](https://img.shields.io/badge/scikit--learn-1.4-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)

<br />

**VoltSense AI** is an enterprise-grade electric vehicle (EV) battery monitoring, diagnostics, and predictive health intelligence platform. Engineered for battery research engineers, fleet operators, automotive technicians, and EV powertrain teams, VoltSense AI provides sub-second physical sensor telemetry streaming, cell-level electrochemical diagnostics, machine learning-driven Remaining Useful Life (RUL) regression, 6 physical simulation scenarios, and an interactive hardware-accelerated 3D digital twin rendered in metallic sapphire blue.

[🌐 Explore Live Cloud Application](https://voltsense-ai.vercel.app) • [📖 API Documentation](#11-api-documentation) • [🏗️ System Architecture](#8-system-architecture) • [🚀 Quick Start](#10-installation-and-local-development)

---

![VoltSense AI Hero Dashboard](docs/images/01_desktop_overview_model_gt.png)

</div>

---

## 📑 Table of Contents

- [1. Executive Summary](#1-executive-summary)
- [2. System Architecture](#2-system-architecture)
- [3. Core Platform Capabilities](#3-core-platform-capabilities)
  - [A. Intelligent Overview Dashboard](#a-intelligent-overview-dashboard)
  - [B. Real-Time CAN-BMS 500k Telemetry](#b-real-time-can-bms-500k-telemetry)
  - [C. Cell-Level Electrochemical Diagnostics](#c-cell-level-electrochemical-diagnostics)
  - [D. Six Physics-Based Simulation Scenarios](#d-six-physics-based-simulation-scenarios)
  - [E. Interactive 3D Vehicle Studio (5 Modes)](#e-interactive-3d-vehicle-studio-5-modes)
  - [F. Machine Learning Health & Anomaly Analytics](#f-machine-learning-health--anomaly-analytics)
  - [G. Dynamic BMS Alert Management & Maintenance](#g-dynamic-bms-alert-management--maintenance)
  - [H. Automated PDF & CSV Diagnostic Export](#h-automated-pdf--csv-diagnostic-export)
  - [I. Adaptive Multi-Theme System](#i-adaptive-multi-theme-system)
- [4. Visual Demonstration Gallery](#4-visual-demonstration-gallery)
- [5. Technology Stack](#5-technology-stack)
- [6. Directory Structure](#6-directory-structure)
- [7. Installation & Local Development](#7-installation--local-development)
- [8. Configuration & Environment Management](#8-configuration--environment-management)
- [9. API Documentation & Schema Contracts](#9-api-documentation--schema-contracts)
- [10. Simulation & Edge Telemetry Ingestion](#10-simulation--edge-telemetry-ingestion)
- [11. Cloud Deployment & Infrastructure Disclosures](#11-cloud-deployment--infrastructure-disclosures)
- [12. Testing, QA & Verification Gates](#12-testing-qa--verification-gates)
- [13. Security Boundaries](#13-security-boundaries)
- [14. Engineering Roadmap](#14-engineering-roadmap)
- [15. Contributing Guidelines](#15-contributing-guidelines)
- [16. Author & Acknowledgments](#16-author--acknowledgments)

---

## 1. Executive Summary

Electric vehicle battery systems are complex, safety-critical assemblies that undergo progressive degradation under thermal stress, dynamic charge-discharge cycles, and internal impedance drift. Subtle variances between individual series cells can lead to pack imbalance, accelerated capacity fade, or hazardous thermal runaway events if unmitigated.

**VoltSense AI** bridges the gap between low-level CAN bus sensor frames and high-level fleet intelligence:

- **Multi-Tenant Fleet Management:** Seamlessly isolates telemetry between disparate EV architectures, including the **VoltSense Model GT** (35.0V nominal, 10S NMC pack, 75 kWh) and the high-voltage **VoltSense CyberSUV** (400.0V nominal, 82 kWh).
- **Physical Sensor Ingestion:** Ingests pack current, cell voltages, temperature gradients, and internal impedance ($\Omega$) at 1.0 Hz with sub-5ms processing latencies.
- **Electrochemical Accuracy:** Strictly decouples State of Charge (SOC, instantaneous thermodynamic energy level) from State of Health (SOH, permanent irreversible capacity retention).
- **Automotive Safety Standards:** Integrates cell delta-V ($\Delta V$) imbalance alerts, thermal warning thresholds, and automated service ticket scheduling.

---

## 2. System Architecture

VoltSense AI is deployed as a decoupled, asynchronous multi-service platform. The Next.js frontend client handles high-frequency WebGL rendering and interactive dashboard hydration, communicating over REST and WebSocket channels with an asynchronous FastAPI backend engine.

### High-Level Service Topology

```mermaid
flowchart TB
    subgraph ClientLayer ["Frontend Client Layer (Next.js 14 App Router)"]
        UI["Overview Dashboard & Nav"]
        ThreeCanvas["Three.js 3D WebGL Digital Twin"]
        Charts["Recharts Telemetry Analytics"]
        Context["Vehicle & Simulation State Context"]
    end

    subgraph Gateway ["Edge & API Gateway (Vercel Multi-Service / Local Proxy)"]
        Rewrite["HTTP Reverse Proxy & Rewrites"]
        WSRoute["WebSocket Dynamic Protocol Negotiation"]
    end

    subgraph BackendLayer ["FastAPI Asynchronous Backend Engine"]
        API["FastAPI REST Routers (/api/v1/*)"]
        WSHandler["WebSocket Broadcast Hub (/ws/monitoring/*)"]
        Sim["Physics Simulation Engine (6 Scenarios)"]
        ML["ML Intelligence Engine (Random Forest + Isolation Forest)"]
        Reports["ReportLab PDF & CSV Generator"]
    end

    subgraph PersistenceLayer ["Storage & Database Tier"]
        DB[("SQLAlchemy 2.0 Async (SQLite / Managed PostgreSQL)")]
        DiskCache[("Trained Models (.joblib) & Static Assets")]
    end

    UI --> Context
    Context --> ThreeCanvas
    Context --> Charts
    Context --> Rewrite
    Context --> WSRoute

    Rewrite --> API
    WSRoute --> WSHandler

    API --> Sim
    API --> ML
    API --> Reports
    API --> DB

    WSHandler --> Sim
    Sim --> DB
    ML --> DiskCache
```

### Telemetry & Scenario Flow

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Fleet Operator
    participant FE as Next.js Dashboard
    participant API as FastAPI Gateway
    participant Sim as Simulation Engine
    participant ML as ML Analytics
    participant DB as Database Tier

    Operator->>FE: Select Scenario (e.g. "Thermal Stress")
    FE->>API: POST /api/v1/monitoring/simulator/scenario
    API->>Sim: activate_scenario("high_temp", target_vin)
    Sim->>Sim: Inject thermal surge (55.4°C), sag voltage (378V)
    Sim->>DB: Record abnormal sensor telemetry frame
    Sim->>API: Return updated telemetry packet
    API-->>FE: HTTP 200 OK (telemetry payload)
    FE->>FE: Re-render Gauges, Delta-V chart, and 3D Thermal Shaders
    FE->>API: POST /api/v1/predictions/{vin}/analyze
    API->>ML: Evaluate Random Forest Regressor & Isolation Forest
    ML-->>API: Return SOH degradation (74.2%) & Anomaly flag
    API-->>FE: Display Critical Thermal Warning alert
```

---

## 3. Core Platform Capabilities

### A. Intelligent Overview Dashboard
The command center provides at-a-glance visibility across key battery vital signs:
- **Vehicle Selector:** Quick switching between canonical fleet assets.
- **Key Vital Metric Cards:** State of Charge (SOC %), State of Health (SOH %), Battery Pack Voltage (V), Instantaneous Current (A), Average Temperature (°C), Internal Impedance ($\Omega$), and Estimated Range (km).
- **Status Indicators:** Instant CAN-BMS 500k bus state, pipeline latency (14ms avg), and active operational envelopes.

![Overview Dashboard](docs/images/01_desktop_overview_model_gt.png)

### B. Real-Time CAN-BMS 500k Telemetry
Dedicated instrumentation mimicking automotive battery diagnostic benches:
- **Radial Dial Gauges:** Total pack voltage, thermal sensors, and aggregate impedance with dynamic threshold coloring.
- **Historical Strip Charts:** Real-time rolling voltage sag and thermal dissipation curves.
- **Dual Connection Mode:** Live WebSocket streaming with seamless fallback to REST telemetry polling.

![Live Monitoring](docs/images/05_route_live_monitoring.png)

### C. Cell-Level Electrochemical Diagnostics
Deep cell-by-cell visibility into series pack construction:
- **10-Cell Voltage Matrix:** Individual cell voltage tracking with individual status badges (`HEALTHY`, `WARNING`, `CRITICAL`).
- **$\Delta V$ Imbalance Calculation:** Automated computation of cell voltage dispersion:
  $$\Delta V = V_{\max} - V_{\min}$$
  Elevated $\Delta V$ immediately flags cell balancing requirement.
- **Per-Cell Internal Resistance:** Pinpoints developing dendrite formation or busbar contact resistance issues.

![Battery Cells Grid](docs/images/08_route_battery_cells.png)

### D. Six Physics-Based Simulation Scenarios
VoltSense AI incorporates a deterministic electrochemical simulation engine supporting 6 distinct operational scenarios:

| Scenario | Mode Code | Physical Response | BMS Alert Triggered |
|---|:---:|---|---|
| **Normal Driving** | `normal` | Balanced cell voltages (3.56V–3.62V), 23.6°C ambient, -14.2A cruising draw | None (Nominal Operation) |
| **CCS2 Fast Charging** | `charging` | +45.0A to +120.0A rapid charge current, cell voltage rise to 4.08V, moderate heat | Charging Event Logged |
| **High Dynamic Discharge** | `discharging` | -85.0A heavy acceleration load, voltage sag to 368V, thermal rise to 34.0°C | High Dynamic Draw Event |
| **Thermal Runaway Stress** | `high_temp` | Critical thermal spike to 55.4°C–58.2°C, elevated internal cell resistance | **CRITICAL: Thermal Runaway Warning** |
| **Cell Imbalance Fault** | `cell_imbalance` | Cell 01 internal impedance spike (0.0691 $\Omega$) and depressed voltage (3.32V) | **WARNING: Cell Imbalance Detected** |
| **Accelerated Pack Aging** | `aging` | Irreversible capacity fade (SOH drops to 74.2%), cycle count elevated to 1,200+ | **NOTICE: SOH Degradation Advisory** |

### E. Interactive 3D Vehicle Studio (5 Modes)
Built on Three.js WebGL, the 3D Vehicle Studio renders a metallic sapphire blue electric vehicle chassis with interactive orbital controls, lighting physics, and 5 specialized engineering visualization modes:

1. **Normal View:** Photorealistic exterior view showcasing aerodynamic styling and metallic PBR materials.
2. **X-Ray View:** Semi-transparent body panels exposing the structural subframe and internal powertrain layout.
3. **Battery Focus:** Isolates the underfloor modular battery pack enclosure, highlighting structural crash rails.
4. **Cell Inspection:** Reveals internal 10-cell series strings with dynamic status shaders indicating voltage balance.
5. **Exploded View:** Multi-axis continuous disassembly animation separating body, chassis, cooling plates, and battery modules.

| Mode 1: Normal View | Mode 2: X-Ray View |
|:---:|:---:|
| ![Normal](docs/images/16_3d_mode1_normal.png) | ![X-Ray](docs/images/17_3d_mode2_xray.png) |
| **Mode 3: Battery Focus** | **Mode 4: Cell Inspection** |
| ![Battery Focus](docs/images/18_3d_mode3_battery_focus.png) | ![Cell Inspection](docs/images/19_3d_mode4_cell_inspection.png) |
| **Mode 5: Exploded View** | **400V CyberSUV Architecture** |
| ![Exploded View](docs/images/20_3d_mode5_exploded_view.png) | ![CyberSUV](docs/images/02_desktop_overview_cybersuv.png) |

### F. Machine Learning Health & Anomaly Analytics
- **Supervised SOH Regression:** Trained Scikit-learn Random Forest model predicting State of Health based on cycle count, C-rate, thermal history, and voltage dispersion ($R^2 = 0.979$, $\text{MAE} = 0.503\%$).
- **Unsupervised Anomaly Detection:** Isolation Forest algorithm identifying multi-dimensional electrochemical outliers with a 4% contamination threshold.
- **RUL Remaining Useful Life:** Forecasts remaining charge-discharge cycles before the pack reaches its 80% automotive end-of-life retirement threshold.

![AI Predictions](docs/images/10_route_ai_predictions.png)

### G. Dynamic BMS Alert Management & Maintenance
- **Automated Alert Generation:** Triggered automatically upon threshold breach (e.g. $\Delta V > 0.05\text{V}$, $T > 50^\circ\text{C}$, $\text{Impedance} > 0.12\,\Omega$).
- **Lifecycle Tracking:** Active alerts can be acknowledged, mitigated, or resolved.
- **Maintenance Ticketing:** Integrated service records with scheduled inspections, coolant flush logging, and technician sign-offs.

### H. Automated PDF & CSV Diagnostic Export
- **Formal PDF Health Certificate:** Generates downloadable, multi-page diagnostic reports with warranty validation, cell variance tables, and SOH certifications.
- **Raw CSV Telemetry Export:** Instant tabular export for external analysis in Python, MATLAB, or Excel.

### I. Adaptive Multi-Theme System
- **Day Theme:** High-contrast, clean enterprise styling optimized for daylight shop-floor conditions.
- **Dark Theme:** Low-glare cyberpunk aesthetic designed for dim operations centers and engineering stations.
- **Eye Care Theme:** Warm amber palette reducing blue-light fatigue during extended diagnostic shifts.

| Day Theme | Dark Theme | Eye Care Theme |
|:---:|:---:|:---:|
| ![Day](docs/images/01_desktop_overview_model_gt.png) | ![Dark](docs/images/03_desktop_theme_dark.png) | ![Eye Care](docs/images/04_desktop_theme_eye_care.png) |

---

## 4. Visual Demonstration Gallery

| Mobile Responsive Layout (390×844) | Electrochemical Degradation Analytics |
|:---:|:---:|
| ![Mobile](docs/images/21_mobile_390x844_overview.png) | ![Degradation](docs/images/06_route_battery_health.png) |

---

## 5. Technology Stack

| Layer | Technology | Version | Purpose in VoltSense AI |
|:---|:---|:---:|:---|
| **Frontend Framework** | **Next.js** | `14.2.18` | App Router, standalone server build, API rewrites |
| **UI Library** | **React** | `18.2.0` | Declarative component hierarchy and hydration |
| **Language (Client)** | **TypeScript** | `5.4.5` | Strict static typing across schemas and API contracts |
| **Styling Engine** | **Tailwind CSS** | `3.4.1` | Responsive utility-first design with CSS custom variables |
| **3D Graphics Engine**| **Three.js** | `0.187.0` | WebGL canvas, PBR shaders, orbit controls, exploded view |
| **Data Visualization**| **Recharts** | `3.11.1` | Dynamic SVG charts for capacity fade and thermal curves |
| **Icons & UI Assets** | **Lucide React** | `1.79.0` | Automotive-grade icon collection |
| **Backend Framework** | **FastAPI** | `0.110.0` | Asynchronous REST API and WebSocket routes |
| **ASGI Web Server** | **Uvicorn** | `0.28.0` | Asynchronous ASGI server for high-throughput I/O |
| **Language (Server)** | **Python** | `3.12 / 3.14` | High-performance backend execution environment |
| **Validation Engine** | **Pydantic** | `2.6.4` | Strict bidirectional schema validation |
| **ORM / Database** | **SQLAlchemy** | `2.0.28` | Async ORM supporting SQLite and PostgreSQL |
| **Database Drivers** | **aiosqlite / asyncpg** | Latest | Native async drivers for local SQLite and cloud PostgreSQL |
| **Machine Learning** | **Scikit-Learn** | `1.4.1.post1` | Random Forest SOH regressor & Isolation Forest detector |
| **Math & Numerics** | **NumPy** | `1.26.4` | Matrix computations for cell voltage dispersion |
| **Report Generation** | **ReportLab** | `4.1.0` | High-resolution PDF generation engine |
| **Edge IoT Protocols**| **MQTT / RFC 6455** | Latest | Hardware CAN-BMS ingestion and real-time WebSockets |

---

## 6. Directory Structure

```text
voltsense-ai/
├── frontend/                              # Next.js 14 Web Application
│   ├── public/                            # Static assets, 3D GLB vehicle models
│   │   └── models/                        # Optimized GLB models (car_chassis.glb)
│   ├── src/
│   │   ├── app/                           # App Router routes
│   │   │   ├── alerts/                    # BMS alerts & event log
│   │   │   ├── analytics/                 # Predictive degradation analytics
│   │   │   ├── battery-health/            # SOH/SOC and capacity retention
│   │   │   ├── cells/                     # Cell matrix diagnostics
│   │   │   ├── charging-stations/         # Fleet charging station management
│   │   │   ├── live-monitoring/           # Real-time CAN-BMS telemetry
│   │   │   ├── maintenance/               # Maintenance tickets & service logs
│   │   │   ├── predictions/               # AI Remaining Useful Life (RUL)
│   │   │   ├── reports/                   # PDF & CSV diagnostic reports
│   │   │   ├── settings/                  # System & alert threshold settings
│   │   │   ├── vehicle-3d/                # 3D Vehicle Studio (5 modes)
│   │   │   ├── vehicles/                  # Multi-tenant fleet management
│   │   │   ├── globals.css                # Tailwind styling & theme variables
│   │   │   ├── layout.tsx                 # Root layout with sidebar & topnav
│   │   │   └── page.tsx                   # Overview command center
│   │   ├── components/                    # Reusable React components
│   │   │   ├── 3d/                        # Three.js canvas & inspection modes
│   │   │   ├── dashboard/                 # Metric cards, gauges, charts
│   │   │   └── navigation/                # Sidebar, TopNav, vehicle selector
│   │   ├── context/                       # VehicleContext & telemetry state
│   │   ├── lib/                           # API fetch utilities & WebSocket client
│   │   └── types/                         # TypeScript interfaces & DTOs
│   ├── next.config.mjs                    # Next.js standalone & proxy configuration
│   ├── package.json                       # Frontend dependencies & scripts
│   └── tailwind.config.ts                 # Theme color palettes & extended tokens
│
├── backend/                               # FastAPI Asynchronous Service
│   ├── app/
│   │   ├── api/v1/                        # Modular REST & WebSocket routers
│   │   │   ├── alerts.py                  # Alert lifecycle & trigger endpoints
│   │   │   ├── battery.py                 # Battery health & cell diagnostics
│   │   │   ├── monitoring.py              # WebSocket & simulator control
│   │   │   ├── predictions.py             # ML prediction & anomaly detection
│   │   │   ├── reports.py                 # PDF & CSV export endpoints
│   │   │   └── vehicles.py                # Multi-vehicle catalog & CRUD
│   │   ├── core/                          # Core application settings
│   │   │   ├── config.py                  # Canonical constants & env parsing
│   │   │   ├── database.py                # Async engine & connection pools
│   │   │   └── security.py                # JWT tokens & bcrypt password hashing
│   │   ├── models/                        # SQLAlchemy database models
│   │   │   └── entities.py                # Vehicle, BatteryPack, BatteryCell
│   │   ├── schemas/                       # Pydantic v2 validation schemas
│   │   │   └── schemas.py                 # DTOs & API request/response contracts
│   │   ├── services/                      # Business logic & algorithms
│   │   │   ├── battery_service.py         # Degradation calculation & seed logic
│   │   │   ├── ml_service.py              # Pre-trained ML inference
│   │   │   └── simulator_service.py       # Deterministic physics loop (6 scenarios)
│   │   ├── worker.py                      # Standalone background worker process
│   │   └── main.py                        # FastAPI application entrypoint
│   ├── ml/                                # Machine learning training pipeline
│   │   ├── train_model.py                 # Scikit-learn training script
│   │   └── models/                        # Serialized .joblib model binaries
│   ├── tests/                             # Pytest automated test suite
│   │   └── test_api.py                    # End-to-end integration tests
│   ├── requirements.txt                   # Python dependencies manifest
│   └── .python-version                    # Pinned Python version (3.12)
│
├── docs/                                  # Documentation assets
│   └── images/                            # Genuine live application screenshots
├── scratch/                               # Test scripts & acceptance automation
├── docker-compose.yml                     # Full-stack containerization manifest
├── vercel.json                            # Vercel multi-service cloud specification
├── .gitignore                             # Secret & build artifact isolation
└── README.md                              # Master engineering presentation
```

---

## 7. Installation & Local Development

### Prerequisites
- **Node.js:** v18.17+ or v20+
- **Python:** 3.10, 3.11, 3.12, or 3.14
- **Git**

### Step 1 — Clone the Repository
```powershell
git clone https://github.com/malikarshid/voltsense-ai.git
cd voltsense-ai
```

### Step 2 — Backend Environment Setup
```powershell
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install required dependencies
pip install -r requirements.txt

# (Optional) Retrain or verify ML models
python ml/train_model.py

# Return to repository root
cd ..
```

### Step 3 — Frontend Environment Setup
```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Return to repository root
cd ..
```

### Step 4 — Launch Local Development Services

Open two PowerShell terminals:

**Terminal 1 — FastAPI Backend Engine:**
```powershell
cd C:\Projects\voltsense-ai\backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 — Next.js Frontend Application:**
```powershell
cd C:\Projects\voltsense-ai\frontend
npm run dev
```

### Step 5 — Access the Local Application
- **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
- **FastAPI Core Engine:** [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive Swagger Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Backend Health Check:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

---

## 8. Configuration & Environment Management

VoltSense AI separates configuration templates from actual local secrets using three tracked `.env.example` files:
- `.env.example` — Root workspace template
- `backend/.env.example` — Backend API and database template
- `frontend/.env.example` — Frontend public URL template

### Safe Environment Template Sample (`.env.example`)
```env
# Application Settings
ENVIRONMENT=development
PROJECT_NAME="VoltSense AI"

# Security (Never commit real production keys)
SECRET_KEY=replace_with_a_cryptographically_secure_random_key_min_32_chars
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Database Configuration
# Local SQLite default:
DATABASE_URL=sqlite+aiosqlite:///voltsense.db
# Cloud PostgreSQL example:
# DATABASE_URL=postgresql+asyncpg://user:password@host:5432/voltsense

# Server Host & Ports
HOST=0.0.0.0
PORT=8000

# Edge Telemetry (MQTT)
MQTT_BROKER_HOST=localhost
MQTT_BROKER_PORT=1883
```

> [!CAUTION]
> Real `.env` files contain private credentials and must **NEVER** be committed to version control. They are strictly excluded by the project's `.gitignore` policy.

---

## 9. API Documentation & Schema Contracts

The backend exposes 26+ RESTful endpoints and a WebSocket streaming channel.

### Key API Endpoints Overview

| Category | Method | Path | Description |
|---|:---:|---|---|
| **System** | `GET` | `/health` | Core ASGI health check & simulator heartbeat |
| **Fleet** | `GET` | `/api/v1/vehicles` | List all canonical fleet vehicles |
| **Fleet** | `GET` | `/api/v1/vehicles/{id}` | Retrieve specific vehicle by ID or VIN |
| **Fleet** | `POST` | `/api/v1/vehicles` | Register a new EV asset into the fleet |
| **Battery** | `GET` | `/api/v1/battery/{vin}/health` | Retrieve instantaneous SOH, SOC, impedance & cells |
| **Battery** | `GET` | `/api/v1/battery/{vin}/degradation` | 6-month historical capacity fade trend data |
| **Battery** | `GET` | `/api/v1/battery/{vin}/temperature-trend` | 24-hour diurnal thermal cycling readings |
| **Battery** | `GET` | `/api/v1/battery/{vin}/cells` | 10-cell voltage, temperature & resistance array |
| **Simulation**| `POST`| `/api/v1/monitoring/simulator/scenario` | Dynamically activate one of the 6 simulation scenarios |
| **Simulation**| `GET` | `/api/v1/monitoring/simulator/status` | Current physics simulation status & active scenario |
| **Streaming** | `WS`  | `/ws/monitoring/{vin}` | High-frequency binary/JSON telemetry broadcast |
| **Predictive**| `POST`| `/api/v1/predictions/{vin}/analyze` | ML Random Forest SOH & Isolation Forest anomaly run |
| **Alerts** | `GET` | `/api/v1/alerts` | Query active BMS alerts with severity filtering |
| **Reports** | `GET` | `/api/v1/reports/{vin}/pdf` | Stream binary diagnostic battery health certificate PDF |
| **Reports** | `GET` | `/api/v1/reports/{vin}/csv` | Stream raw comma-separated telemetry records |

### Sample Request & Response: Battery Health

**Request:**
```http
GET /api/v1/battery/KA05ER7777/health HTTP/1.1
Host: voltsense-ai.vercel.app
Accept: application/json
```

**Response (HTTP 200 OK):**
```json
{
  "vehicle_id": "7dc8b484-4d3d-474a-935e-07a9fa31492d",
  "soc_percentage": 67.0,
  "estimated_range_km": 48.2,
  "health_score": 86,
  "health_status": "Good",
  "cycle_count": 238,
  "design_capacity_ah": 105.0,
  "original_capacity_ah": 100.0,
  "current_capacity_ah": 88.4,
  "soh_percentage": 88.4,
  "pack_voltage": 35.5,
  "avg_temperature": 23.6,
  "total_impedance": 0.1085,
  "min_cell_voltage": 3.56,
  "max_cell_voltage": 3.62,
  "voltage_diff": 0.06,
  "cells": [
    {
      "cell_index": 1,
      "cell_serial": "CEL-KA05-01",
      "voltage": 3.56,
      "temperature": 25.2,
      "internal_resistance": 0.0691,
      "status": "WARNING"
    }
  ]
}
```

---

## 10. Simulation & Edge Telemetry Ingestion

VoltSense AI features dual simulation and hardware-ingestion modes:

1. **Local Development (Continuous 1.0 Hz Loop):**
   When running locally via `uvicorn` or `python app/worker.py`, an autonomous `asyncio` task continuously ticks electrochemical state forward, drifting temperature and applying small load fluctuations.
2. **Edge Hardware Ingestion (CAN & MQTT):**
   The platform includes an ESP32 hardware bridge architecture capable of reading ADS1115 ADCs and current shunts, packaging frames into standard CAN-BMS 500k messages, and publishing to `voltsense/telemetry/{vin}` via MQTT.

---

## 11. Cloud Deployment & Infrastructure Disclosures

VoltSense AI is deployed on Vercel as a multi-service project:
- **Frontend Service:** Next.js 14 App Router, standalone server output.
- **Backend Service:** FastAPI Python 3.12 ASGI running as Vercel Serverless Functions.
- **Rewrites:** Root `vercel.json` routes `/health`, `/api/v1/*`, and `/ws/monitoring/*` directly to the backend service.

### Infrastructure Transparency & Cloud Persistence Disclosure

> [!IMPORTANT]
> **Ephemeral SQLite Storage (`/tmp`):**
> Because Vercel Serverless Functions operate inside immutable read-only AWS Lambda containers, the default SQLite storage runs in `/tmp/voltsense.db`. While this provides instant, crash-free preview functionality, **storage in `/tmp` is temporary and ephemeral**. It does not persist across container cold starts or regional instance recycling.
>
> **Enterprise Production Requirement:**
> For permanent, multi-user cloud durability, provision a managed PostgreSQL database (e.g., Neon, Supabase, AWS RDS) and supply the connection string via `DATABASE_URL=postgresql+asyncpg://...` in Vercel Project Settings.
>
> **Persistent Simulation Worker:**
> Because serverless functions suspend execution during idle intervals, continuous 1.0 Hz background simulation requires running the standalone worker process (`backend/app/worker.py`) on a persistent container service (e.g. AWS ECS, Render, Railway).

---

## 12. Testing, QA & Verification Gates

VoltSense AI enforces strict testing gates across backend, frontend, and browser automation:

```powershell
# 1. Backend Pytest Suite (11/11 Passed)
cd backend
python -m pytest tests -v

# 2. Frontend TypeScript Strict Check (0 Errors)
cd ../frontend
npx tsc --noEmit

# 3. Next.js Production Build Verification
npm run build
```

### Verified Acceptance Results
- **Pytest Suite:** 11/11 tests passing (100% pass rate) covering health checks, multi-vehicle isolation, SOH/SOC distinction, AI predictions, scenario switching, PDF/CSV generation, and 404 validation.
- **TypeScript:** Clean compilation with 0 type errors.
- **Live Browser Acceptance:** Automated CDP testing verified all 11 routes, 5 3D modes, vehicle switching, and theme transitions with **zero network failures**.

---

## 13. Security Boundaries

- **No Secrets in Version Control:** Real `.env` files are strictly git-ignored.
- **Password Hashing:** Passwords hashed using standard `bcrypt` via Passlib.
- **Token Security:** Stateless JWT authentication (HS256) with configurable expiration.
- **Injection Prevention:** All database operations utilize SQLAlchemy 2.0 parameterized queries.
- **Input Validation:** All incoming payloads are strictly validated by Pydantic v2 models.

---

## 14. Engineering Roadmap

- [x] Next.js 14 App Router dashboard with Day, Dark, and Eye Care themes
- [x] Three.js metallic sapphire blue 3D EV digital twin with 5 inspection modes
- [x] FastAPI async backend with 6 physics simulation scenarios
- [x] Scikit-learn Random Forest SOH regression & Isolation Forest anomaly detection
- [x] Automated ReportLab PDF certificates and raw CSV telemetry export
- [x] Vercel multi-service deployment with serverless SQLite `/tmp` resilience
- [x] Canonical fleet identity synchronization and 404 error validation
- [ ] Managed PostgreSQL integration (Neon / Supabase) for durable cloud persistence
- [ ] Dedicated persistent background simulation worker deployment on AWS ECS / Render
- [ ] Extended battery chemistry models (LFP lithium-iron-phosphate, Sodium-ion)
- [ ] Real hardware test bench validation with physical CAN bus transceivers

---

## 15. Contributing Guidelines

Contributions are welcome! Please follow these steps:

1. **Fork the Repository** on GitHub.
2. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Commit Your Changes:**
   ```bash
   git commit -m "feat: add support for LFP battery chemistry curves"
   ```
4. **Run Verification Gates:** Ensure `pytest tests -v` and `npx tsc --noEmit` pass with zero errors.
5. **Never Commit Secrets:** Do not stage `.env` or credential files.
6. **Open a Pull Request** with a detailed explanation of your changes.

---

## 16. Author & Acknowledgments

- **Lead Engineer & Architect:** [Arshid Malik](https://github.com/malikarshid)
- **Repository:** [https://github.com/malikarshid/voltsense-ai](https://github.com/malikarshid/voltsense-ai)
- **Live Application:** [https://voltsense-ai.vercel.app](https://voltsense-ai.vercel.app)

*Built with passion for electric mobility, battery electrochemistry, and clean software engineering.*
