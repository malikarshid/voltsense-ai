from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.entities import Vehicle, BatteryPack, BatteryCell
from app.schemas.schemas import VehicleCreate, VehicleUpdate, VehicleResponse, BatteryPackResponse
from app.services.battery_service import battery_service
from app.core.config import (
    CANONICAL_MODEL_GT_ID, CANONICAL_MODEL_GT_VIN,
    CANONICAL_CYBERSUV_ID, CANONICAL_CYBERSUV_VIN
)

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

def get_canonical_fallback_vehicles() -> List[VehicleResponse]:
    now = datetime.now(timezone.utc)
    return [
        VehicleResponse(
            id=CANONICAL_MODEL_GT_ID,
            name="VoltSense Model GT",
            vin=CANONICAL_MODEL_GT_VIN,
            model_year=2024,
            battery_chemistry="NMC (Nickel Manganese Cobalt)",
            pack_capacity_kwh=75.0,
            original_capacity_ah=100.0,
            current_capacity_ah=88.4,
            nominal_voltage=35.0,
            max_voltage=42.0,
            min_voltage=28.0,
            cell_count=10,
            status="active",
            created_at=now,
            updated_at=now
        ),
        VehicleResponse(
            id=CANONICAL_CYBERSUV_ID,
            name="VoltSense CyberSUV",
            vin=CANONICAL_CYBERSUV_VIN,
            model_year=2024,
            battery_chemistry="NMC (High-Nickel Li-ion)",
            pack_capacity_kwh=82.0,
            original_capacity_ah=100.0,
            current_capacity_ah=92.0,
            nominal_voltage=400.0,
            max_voltage=450.0,
            min_voltage=320.0,
            cell_count=10,
            status="charging",
            created_at=now,
            updated_at=now
        )
    ]

@router.get("", response_model=List[VehicleResponse])
async def list_vehicles(db: AsyncSession = Depends(get_db)):
    try:
        await battery_service.seed_default_vehicles(db)
        result = await db.execute(
            select(Vehicle).options(selectinload(Vehicle.pack)).order_by(Vehicle.created_at)
        )
        vehicles = result.scalars().all()
        if vehicles:
            return [VehicleResponse.model_validate(v) for v in vehicles]
    except Exception as e:
        print(f"[Vehicles] Notice: falling back to in-memory catalog: {e}")
    
    return get_canonical_fallback_vehicles()

@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    vehicle = None
    try:
        result = await db.execute(
            select(Vehicle).options(selectinload(Vehicle.pack)).where(
                (Vehicle.id == vehicle_id) | (Vehicle.vin == vehicle_id)
            )
        )
        vehicle = result.scalar_one_or_none()
    except Exception as e:
        print(f"[Vehicles] Database query notice: {e}")

    if not vehicle:
        for cv in get_canonical_fallback_vehicles():
            if vehicle_id in (cv.id, cv.vin):
                return cv
        raise HTTPException(status_code=404, detail=f"Vehicle '{vehicle_id}' not found.")
    return VehicleResponse.model_validate(vehicle)

@router.post("", response_model=VehicleResponse)
async def create_vehicle(v_in: VehicleCreate, db: AsyncSession = Depends(get_db)):
    vehicle = Vehicle(**v_in.model_dump())
    db.add(vehicle)
    await db.flush()
    
    pack = BatteryPack(
        vehicle_id=vehicle.id,
        pack_serial=f"VS-BP-{vehicle.vin[:6]}",
        total_cycles=50,
        design_capacity_ah=vehicle.original_capacity_ah * 1.05,
        original_capacity_ah=vehicle.original_capacity_ah,
        current_capacity_ah=vehicle.current_capacity_ah,
        current_soh=round((vehicle.current_capacity_ah / vehicle.original_capacity_ah) * 100, 1),
        current_soc=80.0,
        health_score=95,
        estimated_range_km=250.0,
        avg_temperature=24.0,
        total_voltage=vehicle.nominal_voltage,
        pack_current=0.0,
        total_impedance=0.0850
    )
    db.add(pack)
    
    for i in range(1, vehicle.cell_count + 1):
        cell = BatteryCell(
            vehicle_id=vehicle.id,
            cell_index=i,
            cell_serial=f"CEL-{vehicle.vin[:4]}-{i:02d}",
            voltage=round(vehicle.nominal_voltage / vehicle.cell_count, 2),
            temperature=24.0,
            internal_resistance=0.0150,
            status="HEALTHY"
        )
        db.add(cell)
        
    await db.commit()
    result = await db.execute(
        select(Vehicle).options(selectinload(Vehicle.pack)).where(Vehicle.id == vehicle.id)
    )
    vehicle_with_pack = result.scalar_one()
    return VehicleResponse.model_validate(vehicle_with_pack)

@router.delete("/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Vehicle).where((Vehicle.id == vehicle_id) | (Vehicle.vin == vehicle_id))
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
    await db.delete(vehicle)
    await db.commit()
    return {"message": "Vehicle deleted successfully."}
