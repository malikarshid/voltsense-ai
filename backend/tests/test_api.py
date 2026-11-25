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
async def test_all_six_scenarios_comprehensive():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Scenario 1: Standard Driving Profile
        res1 = await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "normal", "vehicle_id": "KA05ER7777"})
        assert res1.status_code == 200
        d1 = res1.json()
        assert d1["active_scenario"] == "normal"
        assert d1["telemetry"]["pack_current"] < 0  # Nominal discharge (-14.2A)
        assert d1["telemetry"]["avg_temperature"] <= 26.0
        assert d1["telemetry"]["voltage_diff"] <= 0.05
        assert d1["telemetry"]["soh"] >= 88.0

        # Scenario 2: DC Fast Charging (CCS2)
        res2 = await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "charging", "vehicle_id": "KA05ER7777"})
        assert res2.status_code == 200
        d2 = res2.json()
        assert d2["active_scenario"] == "charging"
        assert d2["telemetry"]["pack_current"] > 0  # Positive charging current (+75A)
        assert d2["telemetry"]["pack_voltage"] > 37.0
        assert d2["metadata"]["operating_mode"] == "CHARGING_FAST"

        # Scenario 3: High Dynamic Load
        res3 = await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "discharging", "vehicle_id": "KA05ER7777"})
        assert res3.status_code == 200
        d3 = res3.json()
        assert d3["active_scenario"] == "discharging"
        assert d3["telemetry"]["pack_current"] <= -45.0  # High discharge current (-58A)
        assert d3["telemetry"]["pack_voltage"] < 33.5  # Voltage sag under load

        # Scenario 4: Thermal Stress Zone
        res4 = await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "high_temp", "vehicle_id": "KA05ER7777"})
        assert res4.status_code == 200
        d4 = res4.json()
        assert d4["active_scenario"] == "high_temp"
        assert d4["telemetry"]["avg_temperature"] > 50.0  # Critical thermal zone (>54°C)
        assert d4["telemetry"]["alarms_count"] >= 1 or d4["telemetry"]["warnings_count"] >= 1
        # Check alerts endpoint returns over-temperature alert
        alerts_res = await ac.get("/api/v1/alerts")
        assert any(a["alert_type"] == "OVER_TEMPERATURE" for a in alerts_res.json())

        # Scenario 5: Cell Imbalance Injected
        res5 = await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "cell_imbalance", "vehicle_id": "KA05ER7777"})
        assert res5.status_code == 200
        d5 = res5.json()
        assert d5["active_scenario"] == "cell_imbalance"
        assert d5["telemetry"]["voltage_diff"] >= 0.40  # Massive 520mV Delta-V
        assert d5["telemetry"]["cells"][0]["status"] == "CRITICAL"
        # Check alerts endpoint returns cell imbalance alert
        alerts_res5 = await ac.get("/api/v1/alerts")
        assert any(a["alert_type"] == "VOLTAGE_IMBALANCE" for a in alerts_res5.json())

        # Scenario 6: High Degradation Run
        res6 = await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "aging", "vehicle_id": "KA05ER7777"})
        assert res6.status_code == 200
        d6 = res6.json()
        assert d6["active_scenario"] == "aging"
        assert d6["telemetry"]["soh"] <= 75.0  # 74.2% SOH
        assert d6["telemetry"]["health_score"] <= 70
        assert d6["telemetry"]["total_impedance"] >= 0.1500  # Elevated 0.165Ω impedance
        # Check battery health endpoint also returns degraded values
        health_res = await ac.get("/api/v1/battery/KA05ER7777/health")
        assert health_res.json()["soh_percentage"] <= 75.0

        # Rapid switching test: restore normal
        reset_res = await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "normal"})
        assert reset_res.status_code == 200
        assert reset_res.json()["active_scenario"] == "normal"

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
async def test_csv_report_generation_for_multiple_vehicles():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res1 = await ac.get("/api/v1/reports/KA05ER7777/csv")
        res2 = await ac.get("/api/v1/reports/HWGHLDZ20842872FS/csv")
        
    assert res1.status_code == 200
    assert res2.status_code == 200
    assert "text/csv" in res1.headers["content-type"]
    assert "text/csv" in res2.headers["content-type"]
    text1 = res1.text
    text2 = res2.text
    assert "Asset VIN,KA05ER7777" in text1
    assert "Asset VIN,HWGHLDZ20842872FS" in text2
    assert "State of Health (SOH)" in text1
    assert "C01" in text1
    assert "C10" in text1

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

@pytest.mark.asyncio
async def test_multi_vehicle_scenario_isolation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Reset both vehicles to normal
        await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "normal", "vehicle_id": "KA05ER7777"})
        await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "normal", "vehicle_id": "HWGHLDZ20842872FS"})

        # 1. Activate 'charging' on KA05ER7777 ONLY
        res_v1 = await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "charging", "vehicle_id": "KA05ER7777"})
        assert res_v1.status_code == 200
        d_v1 = res_v1.json()
        assert d_v1["active_scenario"] == "charging"
        assert d_v1["telemetry"]["pack_current"] > 0

        # Verify HWGHLDZ20842872FS is completely isolated and STILL in 'normal'
        t_v2 = await ac.get("/api/v1/monitoring/HWGHLDZ20842872FS/latest")
        assert t_v2.status_code == 200
        d_v2 = t_v2.json()
        assert d_v2["scenario"] == "normal"
        assert d_v2["pack_current"] < 0  # Still discharging nominal

        # 2. Activate 'high_temp' on HWGHLDZ20842872FS ONLY
        res_v2_act = await ac.post("/api/v1/simulator/scenario", json={"scenario_id": "high_temp", "vehicle_id": "HWGHLDZ20842872FS"})
        assert res_v2_act.status_code == 200
        assert res_v2_act.json()["active_scenario"] == "high_temp"

        # Verify KA05ER7777 is still in 'charging'
        t_v1_check = await ac.get("/api/v1/monitoring/KA05ER7777/latest")
        assert t_v1_check.json()["scenario"] == "charging"

        # 3. Check alerts isolation: HWGHLDZ20842872FS has high_temp alert, KA05ER7777 does not
        alerts_v2 = await ac.get("/api/v1/alerts?vehicle_id=HWGHLDZ20842872FS")
        assert any("OVER_TEMPERATURE" in a["alert_type"] for a in alerts_v2.json())

        alerts_v1 = await ac.get("/api/v1/alerts?vehicle_id=KA05ER7777")
        assert not any("OVER_TEMPERATURE" in a["alert_type"] for a in alerts_v1.json())
