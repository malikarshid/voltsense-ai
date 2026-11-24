# VoltSense AI — System Architecture & Data Flow

```mermaid
flowchart TD
    subgraph Edge Hardware & Ingestion
        A[ESP32 BMS Microcontroller] -->|WiFi / MQTT| B(Mosquitto MQTT Broker: 1883)
        SIM[Electrochemical Battery Simulator] -->|Internal Event Loop| C[FastAPI Telemetry Ingest]
        B -->|paho-mqtt Consumer| C
    end

    subgraph Backend Core (FastAPI :8000)
        C --> D[(SQLAlchemy ORM Database)]
        C -->|Broadcast 1Hz| E[WebSocket /ws/monitoring]
        F[ML Inference Engine] -->|Trained Random Forest| G[SOH & RUL Predictions]
        H[ReportLab PDF Engine] -->|Stream Binary| I[Downloadable Audit Reports]
    end

    subgraph Frontend Client (Next.js 14 :3000)
        E -->|Real-Time JSON Stream| J[Live Monitoring & Gauges]
        K[REST API Client] -->|HTTP /api/v1| L[Battery Health Dashboard]
        K --> M[3D WebGL Vehicle Twin]
        K --> N[Cell Matrix Diagnostics]
    end
```

## Architectural Highlights
1. **Decoupled Telemetry Pipeline:** Real-time data streams via WebSocket at 1 Hz, while persistent health aggregates and cycle records are transactionally committed to PostgreSQL / SQLite.
2. **State of Health vs State of Charge Isolation:** Distinct mathematical separation between thermodynamic State of Charge (SOC: 0-100% usable energy) and degradation State of Health (SOH: capacity retention ratio relative to original factory Ah rating).
3. **Pluggable Simulator:** Allows comprehensive testing of critical edge-cases (cell thermal runaway, contactor failure, voltage droop, high-temperature derating) without risking physical hardware.
