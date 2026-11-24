from typing import Dict, Any
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["Settings"])

class SystemSettings(BaseModel):
    refresh_rate_ms: int = 1000
    theme: str = "dark"
    temp_unit: str = "celsius"
    alert_notifications_enabled: bool = True
    mqtt_broker_url: str = "mqtt://localhost:1883"
    mqtt_topic_prefix: str = "voltsense/KA05ER7777"
    voltage_warning_threshold_v: float = 3.20
    voltage_critical_threshold_v: float = 3.00
    temp_warning_threshold_c: float = 45.0
    temp_critical_threshold_c: float = 55.0
    impedance_warning_threshold_ohm: float = 0.0500

current_settings = SystemSettings()

@router.get("", response_model=SystemSettings)
async def get_settings():
    return current_settings

@router.post("", response_model=SystemSettings)
async def update_settings(new_settings: SystemSettings):
    global current_settings
    current_settings = new_settings
    return current_settings
