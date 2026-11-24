from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.entities import Alert, Vehicle
from app.schemas.schemas import AlertResponse, AlertAcknowledge

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
    return [AlertResponse.model_validate(a) for a in alerts]

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
