from fastapi import APIRouter, Response, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.entities import Vehicle, BatteryPack, BatteryCell
from app.services.report_service import report_service
from app.services.simulator_service import simulator

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{vehicle_id}/pdf")
async def download_pdf_report(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    """Generates and streams a professional battery health diagnostic PDF dynamically for the requested vehicle."""
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
    
    # If vehicle is KA05ER7777 (active simulator vehicle), use live simulator values
    is_sim_vehicle = bool(vehicle and vehicle.vin == "KA05ER7777")
    soh = simulator.soh if is_sim_vehicle else (pack.current_soh if pack else 88.4)
    soc = simulator.soc if is_sim_vehicle else (pack.current_soc if pack else 67.0)
    health_score = pack.health_score if pack else 86
    cycle_count = pack.total_cycles if pack else 238
    design_capacity = pack.design_capacity_ah if pack else 105.0
    original_capacity = vehicle.original_capacity_ah if vehicle else 100.0
    current_capacity = round((soh / 100.0) * original_capacity, 1)
    total_voltage = simulator.pack_voltage if is_sim_vehicle else (pack.total_voltage if pack else vehicle.nominal_voltage)
    avg_temperature = simulator.avg_temperature if is_sim_vehicle else (pack.avg_temperature if pack else 23.6)
    total_impedance = simulator.total_impedance if is_sim_vehicle else (pack.total_impedance if pack else 0.1085)
    
    # Calculate RUL
    deg_per_cycle = (100.0 - soh) / max(1, cycle_count)
    predicted_rul = int((soh - 70.0) / deg_per_cycle) if (deg_per_cycle > 0 and soh > 70.0) else 450

    cells_data = []
    if is_sim_vehicle and simulator.cells:
        cells_data = simulator.cells
    elif vehicle and vehicle.cells:
        cells_data = [
            {
                "cell_index": c.cell_index,
                "voltage": c.voltage,
                "temperature": c.temperature,
                "internal_resistance": c.internal_resistance,
                "status": c.status,
            }
            for c in vehicle.cells
        ]

    pdf_bytes = report_service.generate_battery_health_pdf(
        vehicle_name=vehicle.name if vehicle else "VoltSense Model GT",
        vin=vehicle.vin if vehicle else vehicle_id,
        soh=soh,
        soc=soc,
        health_score=health_score,
        cycle_count=cycle_count,
        design_capacity=design_capacity,
        original_capacity=original_capacity,
        current_capacity=current_capacity,
        total_voltage=total_voltage,
        avg_temperature=avg_temperature,
        total_impedance=total_impedance,
        predicted_rul=predicted_rul,
        cells_data=cells_data
    )
    
    filename = f"VoltSense_Report_{vehicle.vin if vehicle else vehicle_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
