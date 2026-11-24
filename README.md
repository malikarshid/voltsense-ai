# VoltSense AI — Intelligent EV Battery Management, Monitoring & Predictive Health Analytics Platform

<div align="center">
  <h3>Intelligent Battery Insights. Smarter Electric Mobility.</h3>
  <p><b>Production-grade EV battery diagnostics, electrochemical health prediction, 3D powertrain digital twin, and IoT CAN/MQTT edge ingestion.</b></p>
</div>

---

## ⚡ Overview
**VoltSense AI** is an enterprise-grade electric vehicle (EV) battery monitoring and predictive health management platform designed for battery engineers, fleet operators, automotive technicians, and researchers.

Combining electrochemical state modeling, real-time CAN-bus telemetry, Scikit-learn machine learning regressions, and WebGL 3D powertrain visualization, VoltSense AI delivers real-time visibility into pack degradation, cell voltage balance, thermal stress, and Remaining Useful Life (RUL).

---

## 📸 Reference-Inspired UI Design System
Built from the ground up matching three reference architectures:
1. **Battery Health Dashboard (Reference 1):** Dark navy (`#080D18`), animated State of Charge (SOC) circular gauge ring, shield-style battery health score (`86/100 Good`), completed cycle counter (`238 Cycles`), capacity retention card, 6-month capacity fade line chart, optimal thermal tracking (15°C - 45°C), 10-cell voltage bar matrix with $\Delta V$ imbalance indicator, and downloadable PDF diagnostic reports.
2. **3D Powertrain Digital Twin (Reference 2):** Transparent automotive chassis, underslung modular battery pack with visible cells, front and rear electric motor assemblies, dynamic energy flow particles, and diagnostic fault overlays.
3. **Battery Box Monitoring System (Reference 3):** Three large analog radial gauges (Total Voltage, Average Temperature, Total Impedance), 10 individual battery cell cards with active warning badges, rolling strip charts, and communication queue health monitors.

---

## 🏗️ Architecture & Technology Stack
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts, Three.js WebGL.
- **Backend:** Python FastAPI, Pydantic v2, SQLAlchemy 2.0 Async, aiosqlite / asyncpg (PostgreSQL).
- **ML / AI Engine:** Scikit-learn (Random Forest SOH Regressor: $R^2 = 0.979$, $\text{MAE} = 0.503\%$, Isolation Forest Anomaly Detection).
- **Simulation Engine:** Real-time multi-scenario electrochemical simulator (Normal, Fast Charging, Heavy Acceleration, Thermal Runaway, Cell Imbalance, Comm Drop).
- **Edge Hardware Ingestion:** ESP32 C++ firmware with WiFi/MQTT, ADC voltage divider calibration, Hall-effect current sensing, and NTC Steinhart-Hart thermistor calculations.
- **Reporting Engine:** Automated ReportLab PDF generation for battery health certificates and warranty validation.

---

## 🚀 Quick Start (Local Development)

### 1. Prerequisites
- **Node.js:** v18+ (v20+ recommended)
- **Python:** 3.10+
- **Git**

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
python ml/train_model.py
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
Backend API will be available at: `http://127.0.0.1:8000`  
Swagger OpenAPI Documentation: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🐳 Docker Deployment
To launch the complete platform including Backend, Frontend, and Mosquitto MQTT Broker:
```bash
docker-compose up --build -d
```

---

## 🧪 Machine Learning Evaluation
| Model Component | Algorithm | Metric | Value |
|---|---|---|---|
| State of Health (SOH) Regressor | Random Forest (120 trees, depth 12) | Mean Absolute Error (MAE) | **0.503%** |
| State of Health (SOH) Regressor | Random Forest | Root Mean Square Error (RMSE) | **0.626%** |
| State of Health (SOH) Regressor | Random Forest | Coefficient of Determination ($R^2$) | **0.979** |
| Anomaly Detection | Isolation Forest | Contamination Factor | 0.04 (4% Anomalies) |

---

## 📜 Automotive Safety & Engineering Notice
> [!IMPORTANT]
> The thresholds, telemetry frames, and predictive outputs in this platform are designed for simulation, diagnostic research, and educational demonstration. Never connect unisolated test hardware to live high-voltage automotive battery packs without isolated CAN transceivers and certified high-voltage safety precautions.
