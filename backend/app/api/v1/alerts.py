from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.entities import Alert, Vehicle
from app.schemas.schemas import AlertResponse, AlertAcknowledge
from app.services.simulator_service import simulator

router = APIRouter(prefix="/alerts", tags=["Alerts & Events"])

@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    vehicle_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Alert).order_by(Alert.created_at.desc())
    if severity:
        query = query.where(Alert.severity == severity.upper())
    result = await db.execute(query)
    alerts = result.scalars().all()
    responses = [AlertResponse.model_validate(a) for a in alerts]

    # Prepend dynamic simulation scenario alerts when active for requested vehicle
    sim_alerts = []
    target_vid = vehicle_id or "KA05ER7777"
    sim_state = simulator.get_or_create_vehicle_state(target_vid)
    
    if sim_state.scenario == "high_temp":
        sim_alerts.append(AlertResponse(
            id=f"sim-alert-high-temp-{target_vid}",
            vehicle_id=target_vid,
            alert_type="OVER_TEMPERATURE",
            severity="CRITICAL",
            cell_index=1,
            message=f"CRITICAL: Pack thermal threshold breached on {target_vid}. Cell C01 core temperature exceeds safety envelope.",
            recommendation="Throttle discharge current immediately and engage maximum auxiliary chiller loop.",
            acknowledged=False,
            resolved=False,
            created_at=sim_state.last_heartbeat
        ))
    elif sim_state.scenario == "cell_imbalance":
        sim_alerts.append(AlertResponse(
            id=f"sim-alert-imbalance-{target_vid}",
            vehicle_id=target_vid,
            alert_type="VOLTAGE_IMBALANCE",
            severity="CRITICAL",
            cell_index=1,
            message=f"CRITICAL: Severe sub-module cell imbalance on {target_vid}. Delta-V spread exceeds 50 mV limit.",
            recommendation="Initiate passive balancing shunts and schedule module inspection.",
            acknowledged=False,
            resolved=False,
            created_at=sim_state.last_heartbeat
        ))
    elif sim_state.scenario == "aging":
        sim_alerts.append(AlertResponse(
            id=f"sim-alert-aging-{target_vid}",
            vehicle_id=target_vid,
            alert_type="DEGRADATION_WARNING",
            severity="WARNING",
            cell_index=None,
            message=f"WARNING: Accelerated battery degradation on {target_vid}. SOH retention has dropped to {sim_state.soh}% (EOL: 70.0%).",
            recommendation="Limit charging voltage to preserve remaining useful life.",
            acknowledged=False,
            resolved=False,
            created_at=sim_state.last_heartbeat
        ))
    elif sim_state.scenario == "discharging":
        sim_alerts.append(AlertResponse(
            id=f"sim-alert-discharging-{target_vid}",
            vehicle_id=target_vid,
            alert_type="HIGH_DISCHARGE_CURRENT",
            severity="WARNING",
            cell_index=None,
            message=f"WARNING: Elevated dynamic discharge current ({sim_state.pack_current}A) on {target_vid}. Monitor thermal climb.",
            recommendation="Advise operator to moderate acceleration demand during high ambient conditions.",
            acknowledged=False,
            resolved=False,
            created_at=sim_state.last_heartbeat
        ))

    if severity:
        sim_alerts = [a for a in sim_alerts if a.severity.upper() == severity.upper()]

    return sim_alerts + responses

@router.post("/{alert_id}/acknowledge", response_model=AlertResponse)
async def acknowledge_alert(alert_id: str, ack: AlertAcknowledge, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.acknowledged = ack.acknowledged
    await db.commit()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)

@router.post("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(alert_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    alert.resolved = True
    alert.resolved_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(alert)
    return AlertResponse.model_validate(alert)
