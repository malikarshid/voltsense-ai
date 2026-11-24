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

router = APIRouter(prefix="/battery", tags=["Battery Health"])

@router.get("/{vehicle_id}/health", response_model=BatteryHealthOverview)
async def get_battery_health(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    await battery_service.seed_default_vehicles(db)
    
    result = await db.execute(
        select(Vehicle).options(selectinload(Vehicle.pack), selectinload(Vehicle.cells)).where(
            (Vehicle.id == vehicle_id) | (Vehicle.vin == vehicle_id)
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        # Fallback to first vehicle
        res = await db.execute(select(Vehicle).options(selectinload(Vehicle.pack), selectinload(Vehicle.cells)))
        vehicle = res.scalars().first()

    pack = vehicle.pack if vehicle else None
    
    # Sync with real-time simulator values if KA05ER7777
    soc = simulator.soc if (vehicle and vehicle.vin == "KA05ER7777") else (pack.current_soc if pack else 67.0)
    soh = simulator.soh if (vehicle and vehicle.vin == "KA05ER7777") else (pack.current_soh if pack else 88.4)
    volt = simulator.pack_voltage if (vehicle and vehicle.vin == "KA05ER7777") else (pack.total_voltage if pack else 34.9)
    temp = simulator.avg_temperature if (vehicle and vehicle.vin == "KA05ER7777") else (pack.avg_temperature if pack else 23.6)
    imp = simulator.total_impedance if (vehicle and vehicle.vin == "KA05ER7777") else (pack.total_impedance if pack else 0.1085)
    rng = simulator.range_km if (vehicle and vehicle.vin == "KA05ER7777") else (pack.estimated_range_km if pack else 48.0)
    
    orig_ah = vehicle.original_capacity_ah if vehicle else 100.0
    curr_ah = round((soh / 100.0) * orig_ah, 1)
    
    summary = battery_service.compute_degradation_summary(curr_ah, orig_ah)
    
    cell_responses = []
    if vehicle and vehicle.vin == "KA05ER7777" and simulator.cells:
        for idx, c in enumerate(simulator.cells, start=1):
            cell_responses.append(BatteryCellResponse(
                id=f"sim-cell-{idx}",
                vehicle_id=vehicle.id,
                cell_index=c["cell_index"],
                cell_serial=f"CEL-8840-{idx:02d}",
                voltage=c["voltage"],
                temperature=c["temperature"],
                internal_resistance=c["internal_resistance"],
                status=c["status"],
                updated_at=simulator.last_heartbeat
            ))
    elif vehicle and vehicle.cells:
        cell_responses = [BatteryCellResponse.model_validate(c) for c in vehicle.cells]
        
    voltages = [c.voltage for c in cell_responses] or [3.60]
    min_v = round(min(voltages), 2)
    max_v = round(max(voltages), 2)
    v_diff = round(max_v - min_v, 2)

    return BatteryHealthOverview(
        vehicle_id=vehicle.id if vehicle else vehicle_id,
        soc_percentage=soc,
        estimated_range_km=rng,
        health_score=pack.health_score if pack else 86,
        health_status="Good" if soh >= 80 else ("Fair" if soh >= 70 else "Degraded"),
        cycle_count=pack.total_cycles if pack else 238,
        design_capacity_ah=pack.design_capacity_ah if pack else 105.0,
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
    period: str = Query("6months", description="7days, 30days, 6months, 12months")
):
    return battery_service.get_degradation_history(period)

@router.get("/{vehicle_id}/temperature-trend")
async def get_temperature_trend(vehicle_id: str):
    return battery_service.get_temperature_history()

@router.get("/{vehicle_id}/cells", response_model=List[BatteryCellResponse])
async def get_cells(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    overview = await get_battery_health(vehicle_id, db)
    return overview.cells
