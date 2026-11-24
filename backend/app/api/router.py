from fastapi import APIRouter
from app.api.v1 import (
    auth,
    vehicles,
    battery,
    monitoring,
    predictions,
    alerts,
    maintenance,
    analytics,
    reports,
    settings
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(vehicles.router)
api_router.include_router(battery.router)
api_router.include_router(monitoring.router)
api_router.include_router(predictions.router)
api_router.include_router(alerts.router)
api_router.include_router(maintenance.router)
api_router.include_router(analytics.router)
api_router.include_router(reports.router)
api_router.include_router(settings.router)
