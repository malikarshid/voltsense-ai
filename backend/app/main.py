import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db
from app.api.router import api_router
from app.services.simulator_service import simulator

sim_task = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database tables safely (non-blocking in serverless)
    try:
        await init_db()
        print("[VoltSense Backend] Database initialized.")
    except Exception as e:
        print(f"[VoltSense Backend] Warning during DB init: {e}")
    
    # Start background physics simulator loop
    global sim_task
    try:
        sim_task = asyncio.create_task(simulator.run_loop())
        print("[VoltSense Backend] Battery Simulator background task started.")
    except Exception as e:
        print(f"[VoltSense Backend] Warning starting simulator loop: {e}")
    
    yield
    
    # Shutdown
    if sim_task:
        sim_task.cancel()
        try:
            await sim_task
        except Exception:
            pass
    print("[VoltSense Backend] Shutdown completed.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent EV Battery Management, Monitoring & Predictive Health Analytics Platform",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST API
app.include_router(api_router, prefix=settings.API_V1_STR)

# Real-Time WebSocket for Live Telemetry
@app.websocket("/ws/monitoring/{vehicle_id}")
async def websocket_monitoring_endpoint(websocket: WebSocket, vehicle_id: str):
    await websocket.accept()
    simulator.connect_ws(websocket, vehicle_id)
    try:
        # Send immediate initial frame for requested vehicle
        latest = await simulator.step(vehicle_id)
        await websocket.send_json(latest)
        while True:
            # Keep socket open and accept incoming command messages if any
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        simulator.disconnect_ws(websocket)
    except Exception as e:
        simulator.disconnect_ws(websocket)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "VoltSense AI Backend",
        "version": settings.VERSION,
        "simulator_running": simulator.is_running
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
