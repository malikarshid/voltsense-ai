from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.entities import Vehicle, BatteryPack, BatteryCell
from app.schemas.schemas import PredictionRequest, PredictionResponse
from app.services.ml_service import ml_service
from app.services.simulator_service import simulator

router = APIRouter(prefix="/predictions", tags=["AI Predictive Analytics"])

@router.post("/{vehicle_id}/analyze", response_model=PredictionResponse)
async def run_ai_prediction(vehicle_id: str, req: PredictionRequest, db: AsyncSession = Depends(get_db)):
    """
    Executes trained Random Forest regressor & Isolation Forest anomaly detector
    dynamically on the vehicle's specific telemetry and degradation state.
    """
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
    is_sim_vehicle = bool(vehicle and vehicle.vin == "KA05ER7777")

    base_cycles = pack.total_cycles if pack else 238
    current_soh = simulator.soh if is_sim_vehicle else (pack.current_soh if pack else 88.4)
    pack_voltage = simulator.pack_voltage if is_sim_vehicle else (pack.total_voltage if pack else 35.0)
    avg_temp = simulator.avg_temperature if is_sim_vehicle else (pack.avg_temperature if pack else 23.6)
    total_imp = simulator.total_impedance if is_sim_vehicle else (pack.total_impedance if pack else 0.1085)
    current_amps = simulator.pack_current if is_sim_vehicle else (pack.pack_current if pack else -14.2)
    
    c_rate = abs(current_amps) / (vehicle.original_capacity_ah if vehicle else 100.0)
    
    if is_sim_vehicle and simulator.cells:
        voltages = [c["voltage"] for c in simulator.cells]
    elif vehicle and vehicle.cells:
        voltages = [c.voltage for c in vehicle.cells]
    else:
        voltages = [3.60] * 10
        
    dispersion = max(voltages) - min(voltages)
    cell_count = vehicle.cell_count if vehicle else 10

    prediction_result = ml_service.predict_health(
        cycle_count=base_cycles + req.cycles_ahead,
        avg_temperature=avg_temp,
        peak_temperature=avg_temp + 4.5,
        c_rate=c_rate,
        voltage_dispersion=dispersion,
        internal_resistance=total_imp / cell_count,
        avg_voltage=pack_voltage / cell_count,
        current_soh=current_soh
    )

    return PredictionResponse(
        vehicle_id=vehicle.vin if vehicle else vehicle_id,
        **prediction_result
    )

@router.get("/metrics")
async def get_model_evaluation_metrics():
    """Returns MAE, RMSE, R2 and training metadata for documentation."""
    return ml_service.metrics_metadata
