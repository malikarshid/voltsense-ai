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
async def test_multi_vehicle_management():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        response = await ac.get("/api/v1/vehicles")
    assert response.status_code == 200
    vehicles = response.json()
    assert len(vehicles) >= 2
    
    vins = [v["vin"] for v in vehicles]
    assert "KA05ER7777" in vins
    assert "HWGHLDZ20842872FS" in vins

    # Check vehicle specs
    v1 = next(v for v in vehicles if v["vin"] == "KA05ER7777")
    assert v1["pack_capacity_kwh"] == 75.0
    assert v1["cell_count"] == 10

    v2 = next(v for v in vehicles if v["vin"] == "HWGHLDZ20842872FS")
    assert v2["pack_capacity_kwh"] == 82.0
    assert v2["nominal_voltage"] == 400.0

@pytest.mark.asyncio
async def test_battery_health_and_soh_soc_distinction():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res1 = await ac.get("/api/v1/battery/KA05ER7777/health")
        res2 = await ac.get("/api/v1/battery/HWGHLDZ20842872FS/health")
        
    assert res1.status_code == 200
    assert res2.status_code == 200
    
    h1 = res1.json()
    h2 = res2.json()

    # Verify SOH mathematical calculation: (current / original) * 100
    expected_soh_1 = (h1["current_capacity_ah"] / h1["original_capacity_ah"]) * 100.0
    assert abs(h1["soh_percentage"] - expected_soh_1) < 0.5
    
    # Verify SOC is thermodynamically distinct from SOH
    assert h1["soc_percentage"] != h1["soh_percentage"]
    assert 0.0 <= h1["soc_percentage"] <= 100.0
    assert 50.0 <= h1["soh_percentage"] <= 100.0

    # Verify Vehicle 2 parameters differ from Vehicle 1
    assert h2["pack_voltage"] > 300.0  # 400V architecture vs 35V pack
    assert len(h1["cells"]) == 10
    assert len(h2["cells"]) == 10

    # Verify Cell Delta-V Imbalance formula
    voltages_1 = [c["voltage"] for c in h1["cells"]]
    expected_diff_1 = round(max(voltages_1) - min(voltages_1), 2)
    assert abs(h1["voltage_diff"] - expected_diff_1) < 0.02

@pytest.mark.asyncio
async def test_ai_prediction_and_anomaly_detection():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {"vehicle_id": "KA05ER7777", "cycles_ahead": 100}
        response = await ac.post("/api/v1/predictions/KA05ER7777/analyze", json=payload)
    assert response.status_code == 200
    pred = response.json()
    
    # Model evaluation metrics
    assert "predicted_soh" in pred
    assert "predicted_rul_cycles" in pred
    assert "anomaly_score" in pred
    assert "is_anomaly" in pred
    assert "evaluation_metrics" in pred
    
    metrics = pred["evaluation_metrics"]
    assert metrics["R2_Score"] >= 0.95
    assert metrics["MAE_percent"] <= 1.0
    assert metrics["RMSE_percent"] <= 1.5
    
    # Feature importance exists and cycle_count is primary
    assert "feature_importance" in pred
    assert pred["feature_importance"]["cycle_count"] > 0.50

@pytest.mark.asyncio
async def test_simulator_scenarios_and_telemetry():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Test charging scenario
        c_res = await ac.post("/api/v1/monitoring/simulator/control", json={"action": "scenario", "scenario": "charging"})
        assert c_res.status_code == 200
        
        # Verify latest telemetry reflects charging (positive current)
        t_res = await ac.get("/api/v1/monitoring/KA05ER7777/latest")
        assert t_res.status_code == 200
        telemetry = t_res.json()
        assert telemetry["scenario"] == "charging"
        assert telemetry["pack_current"] > 0.0

        # 2. Test high temperature anomaly scenario
        h_res = await ac.post("/api/v1/monitoring/simulator/control", json={"action": "scenario", "scenario": "high_temp"})
        assert h_res.status_code == 200
        
        # 3. Reset back to normal
        r_res = await ac.post("/api/v1/monitoring/simulator/control", json={"action": "reset"})
        assert r_res.status_code == 200

@pytest.mark.asyncio
async def test_pdf_report_generation_for_multiple_vehicles():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res1 = await ac.get("/api/v1/reports/KA05ER7777/pdf")
        res2 = await ac.get("/api/v1/reports/HWGHLDZ20842872FS/pdf")
        
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert res1.headers["content-type"] == "application/pdf"
    assert res2.headers["content-type"] == "application/pdf"
    assert len(res1.content) > 1500
    assert len(res2.content) > 1500

@pytest.mark.asyncio
async def test_alerts_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # List alerts
        res = await ac.get("/api/v1/alerts")
        assert res.status_code == 200
        alerts = res.json()
        assert len(alerts) > 0
        alert_id = alerts[0]["id"]

        # Acknowledge
        ack_res = await ac.post(f"/api/v1/alerts/{alert_id}/acknowledge", json={"acknowledged": True})
        assert ack_res.status_code == 200
        assert ack_res.json()["acknowledged"] is True

@pytest.mark.asyncio
async def test_settings_persistence():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Get settings
        get_res = await ac.get("/api/v1/settings")
        assert get_res.status_code == 200
        
        # Update settings
        payload = {
            "refresh_rate_ms": 500,
            "mqtt_broker_url": "mqtt://10.0.0.5:1883",
            "temp_warning_threshold_c": 48.0,
            "voltage_warning_threshold_v": 3.15
        }
        post_res = await ac.post("/api/v1/settings", json=payload)
        assert post_res.status_code == 200
        updated = post_res.json()
        assert updated["refresh_rate_ms"] == 500
        assert updated["mqtt_broker_url"] == "mqtt://10.0.0.5:1883"
