from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.entities import Vehicle, BatteryPack, BatteryCell
from app.schemas.schemas import VehicleCreate, VehicleUpdate, VehicleResponse, BatteryPackResponse
from app.services.battery_service import battery_service

router = APIRouter(prefix="/vehicles", tags=["Vehicles"])

@router.get("", response_model=List[VehicleResponse])
async def list_vehicles(db: AsyncSession = Depends(get_db)):
    # Ensure seed vehicles exist
    await battery_service.seed_default_vehicles(db)
    
    result = await db.execute(
        select(Vehicle).options(selectinload(Vehicle.pack)).order_by(Vehicle.created_at)
    )
    vehicles = result.scalars().all()
    return [VehicleResponse.model_validate(v) for v in vehicles]

@router.get("/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Vehicle).options(selectinload(Vehicle.pack)).where(
            (Vehicle.id == vehicle_id) | (Vehicle.vin == vehicle_id)
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found.")
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
    await db.refresh(vehicle)
    return VehicleResponse.model_validate(vehicle)

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
