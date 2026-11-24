import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "simulator_running" in data

@pytest.mark.asyncio
async def test_list_vehicles():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/vehicles")
    assert response.status_code == 200
    vehicles = response.json()
    assert len(vehicles) >= 2
    vins = [v["vin"] for v in vehicles]
    assert "KA05ER7777" in vins

@pytest.mark.asyncio
async def test_battery_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/battery/KA05ER7777/health")
    assert response.status_code == 200
    health = response.json()
    assert health["soh_percentage"] > 70.0
    assert health["cycle_count"] == 238
    assert len(health["cells"]) == 10
    assert "degradation_summary" in health

@pytest.mark.asyncio
async def test_ai_prediction():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"vehicle_id": "KA05ER7777", "cycles_ahead": 50}
        response = await ac.post("/api/v1/predictions/KA05ER7777/analyze", json=payload)
    assert response.status_code == 200
    pred = response.json()
    assert "predicted_soh" in pred
    assert "predicted_rul_cycles" in pred
    assert "evaluation_metrics" in pred
    assert pred["evaluation_metrics"]["R2_Score"] > 0.90

@pytest.mark.asyncio
async def test_simulator_scenarios():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"action": "scenario", "scenario": "charging", "speed_factor": 1.5}
        response = await ac.post("/api/v1/monitoring/simulator/control", json=payload)
    assert response.status_code == 200
    status = response.json()
    assert status["scenario"] == "charging"
    assert status["speed_factor"] == 1.5

@pytest.mark.asyncio
async def test_pdf_report_generation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/reports/KA05ER7777/pdf")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert len(response.content) > 1000
