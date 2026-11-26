from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.entities import Vehicle, BatteryPack, BatteryCell
from app.schemas.schemas import (
    BatteryHealthOverview, BatteryCellResponse, DegradationSummary
)
from app.services.battery_service import battery_service
from app.services.simulator_service import simulator
from app.core.config import (
    CANONICAL_MODEL_GT_ID, CANONICAL_MODEL_GT_VIN,
    CANONICAL_CYBERSUV_ID, CANONICAL_CYBERSUV_VIN
)

router = APIRouter(prefix="/battery", tags=["Battery Health"])

def _resolve_canonical_vehicle(vehicle_id: str, vehicle: Any = None):
    """Resolves vehicle identity, VIN, and attributes deterministically or returns None."""
    if vehicle:
        return vehicle.id, vehicle.vin, vehicle.original_capacity_ah, (vehicle.pack.design_capacity_ah if vehicle.pack else 105.0)
    if vehicle_id in (CANONICAL_MODEL_GT_ID, CANONICAL_MODEL_GT_VIN):
        return CANONICAL_MODEL_GT_ID, CANONICAL_MODEL_GT_VIN, 100.0, 105.0
    if vehicle_id in (CANONICAL_CYBERSUV_ID, CANONICAL_CYBERSUV_VIN):
        return CANONICAL_CYBERSUV_ID, CANONICAL_CYBERSUV_VIN, 100.0, 105.0
    return None, None, None, None

@router.get("/{vehicle_id}/health", response_model=BatteryHealthOverview)
async def get_battery_health(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    vehicle = None
    try:
        await battery_service.seed_default_vehicles(db)
        result = await db.execute(
            select(Vehicle).options(selectinload(Vehicle.pack), selectinload(Vehicle.cells)).where(
                (Vehicle.id == vehicle_id) | (Vehicle.vin == vehicle_id)
            )
        )
        vehicle = result.scalar_one_or_none()
    except Exception as e:
        print(f"[BatteryHealth] Notice: database lookup notice: {e}")

    canonical_id, target_vin, orig_ah, design_cap = _resolve_canonical_vehicle(vehicle_id, vehicle)
    if not target_vin:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found.")

    sim_state = simulator.get_or_create_vehicle_state(target_vin)
    
    # Sync with authoritative real-time simulator values for this specific vehicle
    soc = sim_state.soc
    soh = sim_state.soh
    volt = sim_state.pack_voltage
    temp = sim_state.avg_temperature
    imp = sim_state.total_impedance
    rng = sim_state.range_km
    health_score = sim_state.health_score
    health_status = sim_state.health_status
    cycle_count = sim_state.cycle_count
    
    curr_ah = round((soh / 100.0) * orig_ah, 1)
    summary = battery_service.compute_degradation_summary(curr_ah, orig_ah)
    
    cell_responses = []
    if sim_state.cells:
        for idx, c in enumerate(sim_state.cells, start=1):
            cell_responses.append(BatteryCellResponse(
                id=f"sim-cell-{target_vin}-{idx}",
                vehicle_id=canonical_id,
                cell_index=c["cell_index"],
                cell_serial=f"CEL-{target_vin[:4]}-{idx:02d}",
                voltage=c["voltage"],
                temperature=c["temperature"],
                internal_resistance=c["internal_resistance"],
                status=c["status"],
                updated_at=sim_state.last_heartbeat
            ))
    elif vehicle and vehicle.cells:
        cell_responses = [BatteryCellResponse.model_validate(c) for c in vehicle.cells]
        
    voltages = [c.voltage for c in cell_responses] or [3.60]
    min_v = round(min(voltages), 2)
    max_v = round(max(voltages), 2)
    v_diff = round(max_v - min_v, 2)

    return BatteryHealthOverview(
        vehicle_id=canonical_id,
        soc_percentage=soc,
        estimated_range_km=rng,
        health_score=health_score,
        health_status=health_status,
        cycle_count=cycle_count,
        design_capacity_ah=design_cap,
        original_capacity_ah=orig_ah,
        current_capacity_ah=curr_ah,
        soh_percentage=soh,
        degradation_summary=summary,
        pack_voltage=volt,
        avg_temperature=temp,
        total_impedance=imp,
        min_cell_voltage=min_v,
        max_cell_voltage=max_v,
        voltage_diff=v_diff,
        cells=cell_responses
    )

@router.get("/{vehicle_id}/degradation")
async def get_degradation_trend(
    vehicle_id: str,
    period: str = Query("6months", description="7days, 30days, 6months, 12months"),
    db: AsyncSession = Depends(get_db)
):
    vehicle = None
    try:
        result = await db.execute(
            select(Vehicle).options(selectinload(Vehicle.pack)).where(
                (Vehicle.id == vehicle_id) | (Vehicle.vin == vehicle_id)
            )
        )
        vehicle = result.scalar_one_or_none()
    except Exception as e:
        print(f"[Degradation] Notice: using simulator state fallback: {e}")

    canonical_id, target_vin, orig_ah, _ = _resolve_canonical_vehicle(vehicle_id, vehicle)
    if not target_vin:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found.")

    sim_state = simulator.get_or_create_vehicle_state(target_vin)
    current_ah = round((sim_state.soh / 100.0) * orig_ah, 1)
    return battery_service.get_degradation_history(period, current_ah=current_ah, original_ah=orig_ah)

@router.get("/{vehicle_id}/temperature-trend")
async def get_temperature_trend(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    vehicle = None
    try:
        result = await db.execute(
            select(Vehicle).options(selectinload(Vehicle.pack)).where(
                (Vehicle.id == vehicle_id) | (Vehicle.vin == vehicle_id)
            )
        )
        vehicle = result.scalar_one_or_none()
    except Exception as e:
        print(f"[TempTrend] Notice: using simulator state fallback: {e}")

    canonical_id, target_vin, _, _ = _resolve_canonical_vehicle(vehicle_id, vehicle)
    if not target_vin:
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found.")

    sim_state = simulator.get_or_create_vehicle_state(target_vin)
    base_temp = sim_state.avg_temperature
    return battery_service.get_temperature_history(base_temp=base_temp)

@router.get("/{vehicle_id}/cells", response_model=List[BatteryCellResponse])
async def get_cells(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    overview = await get_battery_health(vehicle_id, db)
    return overview.cells
