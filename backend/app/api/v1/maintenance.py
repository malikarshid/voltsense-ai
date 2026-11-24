from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.entities import MaintenanceRecord, Vehicle
from app.schemas.schemas import MaintenanceRecordResponse, MaintenanceCreate

router = APIRouter(prefix="/maintenance", tags=["Predictive Maintenance"])

@router.get("", response_model=List[MaintenanceRecordResponse])
async def list_maintenance(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MaintenanceRecord).order_by(MaintenanceRecord.created_at.desc()))
    records = result.scalars().all()
    return [MaintenanceRecordResponse.model_validate(r) for r in records]

@router.post("", response_model=MaintenanceRecordResponse)
async def create_maintenance_record(rec_in: MaintenanceCreate, db: AsyncSession = Depends(get_db)):
    rec = MaintenanceRecord(**rec_in.model_dump())
    db.add(rec)
    await db.commit()
    await db.refresh(rec)
    return MaintenanceRecordResponse.model_validate(rec)
