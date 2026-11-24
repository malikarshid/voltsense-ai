from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import SimulatorControl, SimulatorStatus
from app.services.simulator_service import simulator

router = APIRouter(prefix="/monitoring", tags=["Live Monitoring"])

@router.get("/{vehicle_id}/latest")
async def get_latest_telemetry(vehicle_id: str):
    """Returns current real-time telemetry frame matching Reference 3."""
    return await simulator.step()

@router.get("/{vehicle_id}/history")
async def get_telemetry_history(vehicle_id: str):
    """Returns last 50 data points for rolling strip charts."""
    return simulator.rolling_history

@router.post("/simulator/control", response_model=SimulatorStatus)
async def control_simulator(control: SimulatorControl):
    """Controls simulation mode, scenarios (charging, high_temp, cell_imbalance, etc.) and speed."""
    if control.action == "start":
        simulator.is_running = True
    elif control.action == "stop":
        simulator.is_running = False
    elif control.action == "reset":
        simulator.reset()
    elif control.action == "scenario":
        if control.scenario:
            simulator.set_scenario(control.scenario)
            
    if control.speed_factor:
        simulator.speed_factor = control.speed_factor
        
    return SimulatorStatus(
        is_running=simulator.is_running,
        scenario=simulator.scenario,
        speed_factor=simulator.speed_factor,
        tick_count=simulator.tick_count,
        active_vehicle_id=simulator.active_vehicle_id,
        data_server_status="OK" if simulator.scenario != "comm_fail" else "DISCONNECTED",
        message_queue_status="OK" if simulator.scenario != "comm_fail" else "TIMEOUT",
        last_heartbeat=simulator.last_heartbeat
    )

@router.get("/simulator/status", response_model=SimulatorStatus)
async def get_simulator_status():
    return SimulatorStatus(
        is_running=simulator.is_running,
        scenario=simulator.scenario,
        speed_factor=simulator.speed_factor,
        tick_count=simulator.tick_count,
        active_vehicle_id=simulator.active_vehicle_id,
        data_server_status="OK" if simulator.scenario != "comm_fail" else "DISCONNECTED",
        message_queue_status="OK" if simulator.scenario != "comm_fail" else "TIMEOUT",
        last_heartbeat=simulator.last_heartbeat
    )
