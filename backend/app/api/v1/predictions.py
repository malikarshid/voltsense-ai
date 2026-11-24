from fastapi import APIRouter, HTTPException
from app.schemas.schemas import PredictionRequest, PredictionResponse
from app.services.ml_service import ml_service
from app.services.simulator_service import simulator

router = APIRouter(prefix="/predictions", tags=["AI Predictive Analytics"])

@router.post("/{vehicle_id}/analyze", response_model=PredictionResponse)
async def run_ai_prediction(vehicle_id: str, req: PredictionRequest):
    """
    Executes trained Random Forest regressor & Isolation Forest anomaly detector
    on current live battery telemetry.
    """
    c_rate = abs(simulator.pack_current) / 100.0
    voltages = [c["voltage"] for c in simulator.cells]
    dispersion = max(voltages) - min(voltages)
    
    result = ml_service.predict_health(
        cycle_count=238 + req.cycles_ahead,
        avg_temperature=simulator.avg_temperature,
        peak_temperature=simulator.avg_temperature + 4.5,
        c_rate=c_rate,
        voltage_dispersion=dispersion,
        internal_resistance=simulator.total_impedance / 10.0,
        avg_voltage=simulator.pack_voltage / 10.0,
        current_soh=simulator.soh
    )
    
    return PredictionResponse(
        vehicle_id=vehicle_id,
        **result
    )

@router.get("/metrics")
async def get_model_evaluation_metrics():
    """Returns MAE, RMSE, R2 and training metadata for documentation."""
    return ml_service.metrics_metadata
