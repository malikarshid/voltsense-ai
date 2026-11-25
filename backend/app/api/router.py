from fastapi import APIRouter
from app.api.v1 import (
    auth,
    vehicles,
    battery,
    monitoring,
    predictions,
    alerts,
    maintenance,
    analytics,
    reports,
    settings
)
from app.schemas.schemas import ScenarioRequest, ScenarioResponse
from app.services.simulator_service import simulator
from datetime import datetime, timezone

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(vehicles.router)
api_router.include_router(battery.router)
api_router.include_router(monitoring.router)
api_router.include_router(predictions.router)
api_router.include_router(alerts.router)
api_router.include_router(maintenance.router)
api_router.include_router(analytics.router)
api_router.include_router(reports.router)
api_router.include_router(settings.router)

# Direct simulator alias router at /api/v1/simulator
simulator_direct_router = APIRouter(prefix="/simulator", tags=["Simulator Direct"])

@simulator_direct_router.post("/scenario", response_model=ScenarioResponse)
async def activate_scenario_direct(req: ScenarioRequest):
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

api_router.include_router(simulator_direct_router)
