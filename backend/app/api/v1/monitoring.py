from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from app.schemas.schemas import (
    SimulatorControl,
    SimulatorStatus,
    ScenarioRequest,
    ScenarioResponse
)
from app.services.simulator_service import simulator

router = APIRouter(prefix="/monitoring", tags=["Live Monitoring"])

@router.get("/{vehicle_id}/latest")
async def get_latest_telemetry(vehicle_id: str):
    """Returns current real-time telemetry frame matching Reference 3."""
    return await simulator.step(vehicle_id)

@router.get("/{vehicle_id}/history")
async def get_telemetry_history(vehicle_id: str):
    """Returns last 50 data points for rolling strip charts."""
    return simulator.rolling_history

@router.post("/simulator/control", response_model=SimulatorStatus)
async def control_simulator(control: SimulatorControl):
    """Controls simulation mode, scenarios (charging, high_temp, cell_imbalance, etc.) and speed."""
    target_vehicle = control.vehicle_id or "KA05ER7777"
    raw_scenario = control.scenario_id or control.scenario or "normal"

    if control.action == "start":
        simulator.is_running = True
    elif control.action == "stop":
        simulator.is_running = False
    elif control.action == "reset":
        simulator.reset()
    elif control.action == "scenario":
        await simulator.activate_scenario(raw_scenario, target_vehicle)
            
    if control.speed_factor:
        simulator.speed_factor = control.speed_factor
        
    meta = simulator.get_scenario_metadata()
    return SimulatorStatus(
        is_running=simulator.is_running,
        scenario=simulator.scenario,
        scenario_name=meta["name"],
        speed_factor=simulator.speed_factor,
        tick_count=simulator.tick_count,
        active_vehicle_id=simulator.active_vehicle_id,
        data_server_status="OK" if simulator.scenario != "comm_fail" else "DISCONNECTED",
        message_queue_status="OK" if simulator.scenario != "comm_fail" else "TIMEOUT",
        last_heartbeat=simulator.last_heartbeat
    )

@router.post("/simulator/scenario", response_model=ScenarioResponse)
async def activate_scenario_monitoring(req: ScenarioRequest):
    """Activates an operational scenario, updates simulation physics, and broadcasts immediately."""
    vehicle_id = req.vehicle_id or "KA05ER7777"
    raw_sc = req.scenario_id or req.scenario or "normal"
    telemetry = await simulator.activate_scenario(raw_sc, vehicle_id)
    state = simulator.get_or_create_vehicle_state(vehicle_id)
    meta = simulator.get_scenario_metadata(state.scenario)

    return ScenarioResponse(
        active_scenario=state.scenario,
        scenario_id=state.scenario,
        vehicle_id=vehicle_id,
        is_running=simulator.is_running,
        status="ACTIVE",
        timestamp=datetime.now(timezone.utc).isoformat(),
        metadata=meta,
        telemetry=telemetry
    )

@router.get("/simulator/status", response_model=SimulatorStatus)
async def get_simulator_status():
    meta = simulator.get_scenario_metadata()
    return SimulatorStatus(
        is_running=simulator.is_running,
        scenario=simulator.scenario,
        scenario_name=meta["name"],
        speed_factor=simulator.speed_factor,
        tick_count=simulator.tick_count,
        active_vehicle_id=simulator.active_vehicle_id,
        data_server_status="OK" if simulator.scenario != "comm_fail" else "DISCONNECTED",
        message_queue_status="OK" if simulator.scenario != "comm_fail" else "TIMEOUT",
        last_heartbeat=simulator.last_heartbeat
    )
