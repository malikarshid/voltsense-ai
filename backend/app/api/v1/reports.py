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
    target_vin = vehicle.vin if vehicle else vehicle_id
    sim_state = simulator.get_or_create_vehicle_state(target_vin)
    
    soh = sim_state.soh
    soc = sim_state.soc
    health_score = sim_state.health_score
    cycle_count = sim_state.cycle_count
    design_capacity = pack.design_capacity_ah if pack else 105.0
    original_capacity = vehicle.original_capacity_ah if vehicle else 100.0
    current_capacity = round((soh / 100.0) * original_capacity, 1)
    total_voltage = sim_state.pack_voltage
    avg_temperature = sim_state.avg_temperature
    total_impedance = sim_state.total_impedance
    
    # Calculate RUL
    deg_per_cycle = (100.0 - soh) / max(1, cycle_count)
    predicted_rul = int((soh - 70.0) / deg_per_cycle) if (deg_per_cycle > 0 and soh > 70.0) else 450

    cells_data = sim_state.cells if sim_state.cells else []
    if not cells_data and vehicle and vehicle.cells:
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

@router.get("/{vehicle_id}/csv")
async def download_csv_report(vehicle_id: str, db: AsyncSession = Depends(get_db)):
    """Generates and streams an authoritative CSV dataset report for the requested vehicle."""
    result = await db.execute(
        select(Vehicle).options(selectinload(Vehicle.pack), selectinload(Vehicle.cells)).where(
            (Vehicle.id == vehicle_id) | (Vehicle.vin == vehicle_id)
        )
    )
    vehicle = result.scalar_one_or_none()
    if not vehicle:
        res = await db.execute(select(Vehicle).options(selectinload(Vehicle.pack), selectinload(Vehicle.cells)))
        vehicle = res.scalars().first()

    pack = vehicle.pack if vehicle else None
    target_vin = vehicle.vin if vehicle else vehicle_id
    sim_state = simulator.get_or_create_vehicle_state(target_vin)

    soh = sim_state.soh
    soc = sim_state.soc
    health_score = sim_state.health_score
    cycle_count = sim_state.cycle_count
    total_voltage = sim_state.pack_voltage
    avg_temperature = sim_state.avg_temperature
    total_impedance = sim_state.total_impedance
    pack_current = sim_state.pack_current
    scenario = sim_state.scenario

    cells_data = sim_state.cells if sim_state.cells else []
    if not cells_data and vehicle and vehicle.cells:
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

    lines = [
        "Parameter,Value,Unit",
        f"Asset VIN,{vehicle.vin if vehicle else target_vin},",
        f"Vehicle Name,{vehicle.name if vehicle else 'VoltSense EV'},",
        f"Simulation Scenario,{scenario},",
        f"State of Health (SOH),{soh:.1f},%",
        f"State of Charge (SOC),{soc:.1f},%",
        f"Pack Total Voltage,{total_voltage:.2f},V",
        f"Pack Current,{pack_current:.1f},A",
        f"Average Cell Temperature,{avg_temperature:.1f},°C",
        f"Total Pack Impedance,{total_impedance:.4f},Ω",
        f"Battery Health Score,{health_score},/100",
        f"Cycle Count,{cycle_count},Cycles",
        "",
        "Cell Index,Serial,Voltage (V),Temperature (°C),Internal Resistance (Ω),Status"
    ]

    for idx, c in enumerate(cells_data, start=1):
        c_idx = c.get("cell_index", idx)
        serial = f"CEL-{target_vin[:4]}-{c_idx:02d}"
        v = c.get("voltage", 3.60)
        t = c.get("temperature", 24.0)
        r = c.get("internal_resistance", 0.0180)
        s = c.get("status", "HEALTHY")
        lines.append(f"C{c_idx:02d},{serial},{v:.3f},{t:.1f},{r:.4f},{s}")

    csv_data = "\n".join(lines)
    filename = f"VoltSense_Report_{vehicle.vin if vehicle else target_vin}.csv"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
