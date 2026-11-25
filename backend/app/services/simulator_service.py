import asyncio
import math
import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Set, Optional
from fastapi import WebSocket


class VehicleSimulationState:
    """Authoritative physical simulation state for a single EV asset."""

    def __init__(
        self,
        vehicle_id: str,
        is_high_voltage: bool = False,
        nominal_voltage: float = 35.0,
        original_capacity_ah: float = 100.0,
    ):
        self.vehicle_id: str = vehicle_id
        self.is_high_voltage: bool = is_high_voltage
        self.nominal_voltage: float = nominal_voltage
        self.original_capacity_ah: float = original_capacity_ah
        self.scenario: str = "normal"
        self.tick_count: int = 0
        self.seq_id: int = 0
        self.last_heartbeat: datetime = datetime.now(timezone.utc)
        self.rolling_history: List[Dict[str, Any]] = []

        # Baseline parameters
        if self.is_high_voltage:
            self.soc: float = 54.0
            self.soh: float = 92.0
            self.pack_voltage: float = 398.2
            self.pack_current: float = -22.0
            self.avg_temperature: float = 24.5
            self.total_impedance: float = 0.0890
            self.range_km: float = 280.0
            self.health_score: int = 91
            self.health_status: str = "Good"
            self.cycle_count: int = 142
            self.cells: List[Dict[str, Any]] = [
                {
                    "cell_index": i,
                    "voltage": round(3.98 + random.uniform(-0.01, 0.01), 2),
                    "temperature": round(24.0 + random.uniform(0.1, 0.8), 1),
                    "internal_resistance": round(0.014 + random.uniform(0.001, 0.003), 4),
                    "status": "HEALTHY",
                }
                for i in range(1, 11)
            ]
        else:
            self.soc: float = 67.0
            self.soh: float = 88.4
            self.pack_voltage: float = 35.5
            self.pack_current: float = -14.2
            self.avg_temperature: float = 23.6
            self.total_impedance: float = 0.1085
            self.range_km: float = 48.0
            self.health_score: int = 86
            self.health_status: str = "Good"
            self.cycle_count: int = 238
            self.cells: List[Dict[str, Any]] = [
                {"cell_index": 1, "voltage": 3.58, "temperature": 24.2, "internal_resistance": 0.0210, "status": "HEALTHY"},
                {"cell_index": 2, "voltage": 3.62, "temperature": 23.5, "internal_resistance": 0.0180, "status": "HEALTHY"},
                {"cell_index": 3, "voltage": 3.60, "temperature": 23.8, "internal_resistance": 0.0175, "status": "HEALTHY"},
                {"cell_index": 4, "voltage": 3.59, "temperature": 24.0, "internal_resistance": 0.0182, "status": "HEALTHY"},
                {"cell_index": 5, "voltage": 3.61, "temperature": 23.6, "internal_resistance": 0.0165, "status": "HEALTHY"},
                {"cell_index": 6, "voltage": 3.58, "temperature": 23.8, "internal_resistance": 0.0194, "status": "HEALTHY"},
                {"cell_index": 7, "voltage": 3.60, "temperature": 24.1, "internal_resistance": 0.0177, "status": "HEALTHY"},
                {"cell_index": 8, "voltage": 3.59, "temperature": 24.0, "internal_resistance": 0.0190, "status": "HEALTHY"},
                {"cell_index": 9, "voltage": 3.62, "temperature": 23.5, "internal_resistance": 0.0158, "status": "HEALTHY"},
                {"cell_index": 10, "voltage": 3.61, "temperature": 23.7, "internal_resistance": 0.0162, "status": "HEALTHY"},
            ]

    def set_scenario(self, scenario: str):
        self.scenario = scenario
        self.tick_count = 0
        self.seq_id += 1
        self.last_heartbeat = datetime.now(timezone.utc)

        if self.is_high_voltage:
            # 400V CyberSUV physics
            if scenario == "normal":
                self.pack_current = -22.0
                self.pack_voltage = 392.0
                self.soc = 60.0
                self.soh = 92.0
                self.avg_temperature = 24.5
                self.total_impedance = 0.0890
                self.range_km = 280.0
                self.health_score = 92
                self.health_status = "Good"
                self.cycle_count = 142
                self.cells = [
                    {"cell_index": i, "voltage": round(3.92 + (i * 0.002), 2), "temperature": round(24.2 + (i * 0.1), 1), "internal_resistance": 0.0140, "status": "HEALTHY"}
                    for i in range(1, 11)
                ]
            elif scenario == "charging":
                self.pack_current = 120.0  # CCS2 rapid charging current
                self.pack_voltage = 408.0
                self.avg_temperature = 33.2
                self.total_impedance = 0.0810
                self.health_score = 93
                self.health_status = "Charging"
                self.cells = [
                    {"cell_index": i, "voltage": round(4.08 + (i * 0.003), 2), "temperature": round(32.8 + (i * 0.1), 1), "internal_resistance": 0.0130, "status": "HEALTHY"}
                    for i in range(1, 11)
                ]
            elif scenario == "discharging":
                self.pack_current = -85.0  # High dynamic discharge
                self.pack_voltage = 368.0  # Voltage sag
                self.avg_temperature = 34.0
                self.total_impedance = 0.0960
                self.health_score = 89
                self.health_status = "Good"
                self.cells = [
                    {"cell_index": i, "voltage": round(3.68 + (i * 0.002), 2), "temperature": round(33.5 + (i * 0.12), 1), "internal_resistance": 0.0150, "status": "HEALTHY"}
                    for i in range(1, 11)
                ]
            elif scenario == "high_temp":
                self.pack_current = -60.0
                self.pack_voltage = 378.0
                self.avg_temperature = 55.4  # Critical thermal zone
                self.total_impedance = 0.1250
                self.health_score = 64
                self.health_status = "Thermal Warning"
                self.cells = [
                    {"cell_index": 1, "voltage": 3.76, "temperature": 58.2, "internal_resistance": 0.0380, "status": "CRITICAL"},
                    {"cell_index": 2, "voltage": 3.78, "temperature": 54.6, "internal_resistance": 0.0280, "status": "CRITICAL"},
                    {"cell_index": 3, "voltage": 3.77, "temperature": 53.5, "internal_resistance": 0.0270, "status": "WARNING"},
                    {"cell_index": 4, "voltage": 3.79, "temperature": 56.8, "internal_resistance": 0.0350, "status": "CRITICAL"},
                    {"cell_index": 5, "voltage": 3.78, "temperature": 52.5, "internal_resistance": 0.0250, "status": "WARNING"},
                    {"cell_index": 6, "voltage": 3.76, "temperature": 53.0, "internal_resistance": 0.0260, "status": "WARNING"},
                    {"cell_index": 7, "voltage": 3.79, "temperature": 51.8, "internal_resistance": 0.0240, "status": "WARNING"},
                    {"cell_index": 8, "voltage": 3.77, "temperature": 52.2, "internal_resistance": 0.0250, "status": "WARNING"},
                    {"cell_index": 9, "voltage": 3.80, "temperature": 50.8, "internal_resistance": 0.0230, "status": "WARNING"},
                    {"cell_index": 10, "voltage": 3.78, "temperature": 51.4, "internal_resistance": 0.0240, "status": "WARNING"},
                ]
            elif scenario == "cell_imbalance":
                self.pack_current = -25.0
                self.pack_voltage = 385.0
                self.avg_temperature = 27.0
                self.total_impedance = 0.1150
                self.health_score = 68
                self.health_status = "Imbalanced"
                self.cells = [
                    {"cell_index": 1, "voltage": 3.50, "temperature": 29.5, "internal_resistance": 0.0750, "status": "CRITICAL"},  # 520mV Delta-V
                    {"cell_index": 2, "voltage": 4.02, "temperature": 25.5, "internal_resistance": 0.0140, "status": "HEALTHY"},
                    {"cell_index": 3, "voltage": 4.01, "temperature": 25.2, "internal_resistance": 0.0140, "status": "HEALTHY"},
                    {"cell_index": 4, "voltage": 4.00, "temperature": 25.0, "internal_resistance": 0.0145, "status": "HEALTHY"},
                    {"cell_index": 5, "voltage": 4.02, "temperature": 24.9, "internal_resistance": 0.0135, "status": "HEALTHY"},
                    {"cell_index": 6, "voltage": 3.99, "temperature": 25.1, "internal_resistance": 0.0150, "status": "HEALTHY"},
                    {"cell_index": 7, "voltage": 4.01, "temperature": 25.3, "internal_resistance": 0.0140, "status": "HEALTHY"},
                    {"cell_index": 8, "voltage": 4.00, "temperature": 25.0, "internal_resistance": 0.0145, "status": "HEALTHY"},
                    {"cell_index": 9, "voltage": 4.02, "temperature": 24.8, "internal_resistance": 0.0130, "status": "HEALTHY"},
                    {"cell_index": 10, "voltage": 4.01, "temperature": 25.0, "internal_resistance": 0.0135, "status": "HEALTHY"},
                ]
            elif scenario == "aging":
                self.soc = 55.0
                self.soh = 74.2  # Degraded asset
                self.pack_voltage = 372.0
                self.pack_current = -20.0
                self.avg_temperature = 28.0
                self.total_impedance = 0.1450
                self.range_km = 210.0
                self.health_score = 70
                self.health_status = "Degraded"
                self.cycle_count = 840
                self.cells = [
                    {"cell_index": i, "voltage": round(3.72 + (i * 0.003), 2), "temperature": round(27.5 + (i * 0.1), 1), "internal_resistance": round(0.0280 + (i * 0.0015), 4), "status": "WARNING" if i in (1, 4, 8) else "HEALTHY"}
                    for i in range(1, 11)
                ]
        else:
            # 35V Architecture (KA05ER7777) physics
            if scenario == "normal":
                self.pack_current = -14.2
                self.pack_voltage = 35.5
                self.soc = 67.0
                self.soh = 88.4
                self.avg_temperature = 23.6
                self.total_impedance = 0.1085
                self.range_km = 48.0
                self.health_score = 86
                self.health_status = "Good"
                self.cycle_count = 238
                self.cells = [
                    {"cell_index": 1, "voltage": 3.58, "temperature": 24.2, "internal_resistance": 0.0210, "status": "HEALTHY"},
                    {"cell_index": 2, "voltage": 3.62, "temperature": 23.5, "internal_resistance": 0.0180, "status": "HEALTHY"},
                    {"cell_index": 3, "voltage": 3.60, "temperature": 23.8, "internal_resistance": 0.0175, "status": "HEALTHY"},
                    {"cell_index": 4, "voltage": 3.59, "temperature": 24.0, "internal_resistance": 0.0182, "status": "HEALTHY"},
                    {"cell_index": 5, "voltage": 3.61, "temperature": 23.6, "internal_resistance": 0.0165, "status": "HEALTHY"},
                    {"cell_index": 6, "voltage": 3.58, "temperature": 23.8, "internal_resistance": 0.0194, "status": "HEALTHY"},
                    {"cell_index": 7, "voltage": 3.60, "temperature": 24.1, "internal_resistance": 0.0177, "status": "HEALTHY"},
                    {"cell_index": 8, "voltage": 3.59, "temperature": 24.0, "internal_resistance": 0.0190, "status": "HEALTHY"},
                    {"cell_index": 9, "voltage": 3.62, "temperature": 23.5, "internal_resistance": 0.0158, "status": "HEALTHY"},
                    {"cell_index": 10, "voltage": 3.61, "temperature": 23.7, "internal_resistance": 0.0162, "status": "HEALTHY"},
                ]
            elif scenario == "charging":
                self.pack_current = 75.0  # Positive charging current
                self.pack_voltage = 38.4  # Elevated charge potential
                self.avg_temperature = 32.8
                self.total_impedance = 0.0920
                self.health_score = 88
                self.health_status = "Charging"
                self.cells = [
                    {"cell_index": i, "voltage": round(3.82 + (i * 0.003), 2), "temperature": round(32.0 + (i * 0.15), 1), "internal_resistance": 0.0150, "status": "HEALTHY"}
                    for i in range(1, 11)
                ]
            elif scenario == "discharging":
                self.pack_current = -58.0  # Heavy dynamic discharge
                self.pack_voltage = 32.6   # Voltage sag under load
                self.avg_temperature = 33.5
                self.total_impedance = 0.1140
                self.health_score = 84
                self.health_status = "Good"
                self.cells = [
                    {"cell_index": i, "voltage": round(3.25 + (i * 0.003), 2), "temperature": round(33.0 + (i * 0.12), 1), "internal_resistance": 0.0185, "status": "HEALTHY"}
                    for i in range(1, 11)
                ]
            elif scenario == "high_temp":
                self.pack_current = -42.0
                self.pack_voltage = 34.2
                self.avg_temperature = 54.6  # Critical thermal zone
                self.total_impedance = 0.1380
                self.health_score = 62
                self.health_status = "Thermal Warning"
                self.cells = [
                    {"cell_index": 1, "voltage": 3.42, "temperature": 57.4, "internal_resistance": 0.0450, "status": "CRITICAL"},
                    {"cell_index": 2, "voltage": 3.44, "temperature": 53.8, "internal_resistance": 0.0320, "status": "CRITICAL"},
                    {"cell_index": 3, "voltage": 3.41, "temperature": 52.6, "internal_resistance": 0.0310, "status": "WARNING"},
                    {"cell_index": 4, "voltage": 3.43, "temperature": 56.1, "internal_resistance": 0.0420, "status": "CRITICAL"},
                    {"cell_index": 5, "voltage": 3.42, "temperature": 51.5, "internal_resistance": 0.0290, "status": "WARNING"},
                    {"cell_index": 6, "voltage": 3.40, "temperature": 52.0, "internal_resistance": 0.0300, "status": "WARNING"},
                    {"cell_index": 7, "voltage": 3.43, "temperature": 50.8, "internal_resistance": 0.0280, "status": "WARNING"},
                    {"cell_index": 8, "voltage": 3.41, "temperature": 51.2, "internal_resistance": 0.0290, "status": "WARNING"},
                    {"cell_index": 9, "voltage": 3.44, "temperature": 49.8, "internal_resistance": 0.0270, "status": "WARNING"},
                    {"cell_index": 10, "voltage": 3.42, "temperature": 50.4, "internal_resistance": 0.0275, "status": "WARNING"},
                ]
            elif scenario == "cell_imbalance":
                self.pack_current = -18.5
                self.pack_voltage = 33.8
                self.avg_temperature = 26.2
                self.total_impedance = 0.1280
                self.health_score = 65
                self.health_status = "Imbalanced"
                self.cells = [
                    {"cell_index": 1, "voltage": 3.10, "temperature": 28.5, "internal_resistance": 0.0880, "status": "CRITICAL"},  # 520mV Delta-V outlier
                    {"cell_index": 2, "voltage": 3.62, "temperature": 24.5, "internal_resistance": 0.0180, "status": "HEALTHY"},
                    {"cell_index": 3, "voltage": 3.61, "temperature": 24.2, "internal_resistance": 0.0175, "status": "HEALTHY"},
                    {"cell_index": 4, "voltage": 3.60, "temperature": 24.0, "internal_resistance": 0.0182, "status": "HEALTHY"},
                    {"cell_index": 5, "voltage": 3.62, "temperature": 23.9, "internal_resistance": 0.0165, "status": "HEALTHY"},
                    {"cell_index": 6, "voltage": 3.59, "temperature": 24.1, "internal_resistance": 0.0194, "status": "HEALTHY"},
                    {"cell_index": 7, "voltage": 3.61, "temperature": 24.3, "internal_resistance": 0.0177, "status": "HEALTHY"},
                    {"cell_index": 8, "voltage": 3.60, "temperature": 24.0, "internal_resistance": 0.0190, "status": "HEALTHY"},
                    {"cell_index": 9, "voltage": 3.62, "temperature": 23.8, "internal_resistance": 0.0158, "status": "HEALTHY"},
                    {"cell_index": 10, "voltage": 3.61, "temperature": 24.0, "internal_resistance": 0.0162, "status": "HEALTHY"},
                ]
            elif scenario == "aging":
                self.soc = 58.0
                self.soh = 74.2  # Degraded state
                self.pack_voltage = 33.9
                self.pack_current = -16.0
                self.avg_temperature = 27.4
                self.total_impedance = 0.1650
                self.range_km = 35.6
                self.health_score = 68
                self.health_status = "Degraded"
                self.cycle_count = 840
                self.cells = [
                    {"cell_index": i, "voltage": round(3.38 + (i * 0.004), 2), "temperature": round(26.8 + (i * 0.1), 1), "internal_resistance": round(0.0380 + (i * 0.0018), 4), "status": "WARNING" if i in (1, 4, 8) else "HEALTHY"}
                    for i in range(1, 11)
                ]

        self.append_rolling_history()

    def append_rolling_history(self):
        self.rolling_history.append({
            "time": self.last_heartbeat.strftime("%H:%M:%S"),
            "seq_id": self.seq_id,
            "voltage": self.pack_voltage,
            "temperature": self.avg_temperature,
            "impedance": self.total_impedance,
            "soc": round(self.soc, 1),
            "current": self.pack_current,
            "scenario": self.scenario,
        })
        if len(self.rolling_history) > 50:
            self.rolling_history.pop(0)

    def step(self, speed_factor: float = 1.0):
        self.tick_count += 1
        self.seq_id += 1
        self.last_heartbeat = datetime.now(timezone.utc)
        dt = 1.0 * speed_factor
        noise = random.uniform(-0.02, 0.02)

        if self.is_high_voltage:
            # Step 400V CyberSUV
            if self.scenario == "charging":
                self.pack_current = round(120.0 + random.uniform(-2.5, 2.5), 1)
                self.soc = min(100.0, self.soc + (0.22 * dt))
                self.pack_voltage = round(400.0 + (self.soc / 100.0) * 12.0 + noise, 1)
                self.avg_temperature = round(min(36.5, 33.0 + (self.tick_count * 0.04)), 1)
                self.range_km = round((self.soc / 100.0) * 450.0, 1)
                for c in self.cells:
                    c["voltage"] = round(self.pack_voltage / 100.0 + random.uniform(-0.005, 0.005), 2)
                    c["temperature"] = round(self.avg_temperature + random.uniform(-0.3, 0.3), 1)
            elif self.scenario == "discharging":
                self.pack_current = round(-85.0 + random.uniform(-3.5, 3.5), 1)
                self.soc = max(5.0, self.soc - (0.20 * dt))
                self.pack_voltage = round(360.0 + (self.soc / 100.0) * 15.0 + noise, 1)
                self.avg_temperature = round(min(39.0, 34.0 + (self.tick_count * 0.05)), 1)
                self.range_km = round((self.soc / 100.0) * 450.0, 1)
            elif self.scenario == "high_temp":
                self.pack_current = round(-60.0 + noise, 1)
                self.avg_temperature = round(min(59.5, 55.0 + (self.tick_count * 0.04)), 1)
                self.cells[0]["temperature"] = round(self.avg_temperature + 3.0, 1)
                self.cells[0]["status"] = "CRITICAL"
            elif self.scenario == "cell_imbalance":
                self.cells[0]["voltage"] = round(max(3.20, 3.50 - (self.tick_count * 0.002)), 2)
                self.cells[0]["status"] = "CRITICAL"
            elif self.scenario == "aging":
                self.soh = 74.2
                self.pack_current = round(-20.0 + random.uniform(-0.5, 0.5), 1)
            else:  # normal
                self.pack_voltage = round(392.0 + noise, 1)
                self.pack_current = round(-22.0 + random.uniform(-0.8, 0.8), 1)
                self.avg_temperature = round(24.5 + random.uniform(-0.2, 0.2), 1)
                self.range_km = round((self.soc / 100.0) * 450.0, 1)
        else:
            # Step 35V KA05ER7777
            if self.scenario == "charging":
                self.pack_current = round(75.0 + random.uniform(-1.5, 1.5), 1)
                self.soc = min(100.0, self.soc + (0.20 * dt))
                self.pack_voltage = round(37.5 + (self.soc / 100.0) * 1.5 + noise, 2)
                self.avg_temperature = round(min(36.0, 32.5 + (self.tick_count * 0.05)), 1)
                self.range_km = round((self.soc / 100.0) * 72.0, 1)
                self.total_impedance = round(0.0920 + random.uniform(-0.001, 0.001), 4)
                for c in self.cells:
                    c["voltage"] = round(self.pack_voltage / 10.0 + random.uniform(-0.01, 0.01), 2)
                    c["temperature"] = round(self.avg_temperature + random.uniform(-0.3, 0.3), 1)
                    c["status"] = "HEALTHY"
            elif self.scenario == "discharging":
                self.pack_current = round(-58.0 + random.uniform(-2.5, 2.5), 1)
                self.soc = max(5.0, self.soc - (0.18 * dt))
                self.pack_voltage = round(32.0 + (self.soc / 100.0) * 1.5 + noise, 2)
                self.avg_temperature = round(min(38.0, 33.5 + (self.tick_count * 0.06)), 1)
                self.range_km = round((self.soc / 100.0) * 72.0, 1)
                self.total_impedance = round(0.1140 + random.uniform(-0.002, 0.002), 4)
                for c in self.cells:
                    c["voltage"] = round(self.pack_voltage / 10.0 + random.uniform(-0.015, 0.015), 2)
                    c["temperature"] = round(self.avg_temperature + random.uniform(-0.4, 0.4), 1)
            elif self.scenario == "high_temp":
                self.pack_current = round(-42.0 + noise, 1)
                self.avg_temperature = round(min(58.5, 54.0 + (self.tick_count * 0.05)), 1)
                self.total_impedance = round(0.1380 + (self.tick_count * 0.0002), 4)
                for c in self.cells:
                    c["temperature"] = round(self.avg_temperature + (2.5 if c["cell_index"] == 1 else random.uniform(-0.5, 0.5)), 1)
                    c["status"] = "CRITICAL" if c["temperature"] > 52.0 else "WARNING"
            elif self.scenario == "cell_imbalance":
                self.cells[0]["voltage"] = round(max(2.80, 3.10 - (self.tick_count * 0.002)), 2)
                self.cells[0]["internal_resistance"] = round(min(0.0950, 0.0880 + (self.tick_count * 0.0002)), 4)
                self.cells[0]["status"] = "CRITICAL"
                self.total_impedance = round(0.1280 + random.uniform(0.001, 0.002), 4)
            elif self.scenario == "aging":
                self.soh = 74.2
                self.total_impedance = round(0.1650 + random.uniform(-0.001, 0.001), 4)
                self.pack_current = round(-16.0 + random.uniform(-0.5, 0.5), 1)
                self.avg_temperature = round(27.4 + random.uniform(-0.3, 0.3), 1)
                for c in self.cells:
                    c["voltage"] = round(self.pack_voltage / 10.0 + random.uniform(-0.015, 0.015), 2)
                    c["temperature"] = round(self.avg_temperature + random.uniform(-0.4, 0.4), 1)
            else:  # normal
                self.pack_voltage = round(35.5 + noise, 2)
                self.pack_current = round(-14.2 + random.uniform(-0.6, 0.6), 1)
                self.avg_temperature = round(23.6 + random.uniform(-0.2, 0.2), 1)
                self.total_impedance = round(0.1085 + random.uniform(-0.001, 0.001), 4)
                self.range_km = round((self.soc / 100.0) * 72.0, 1)
                for c in self.cells:
                    c["voltage"] = round(self.pack_voltage / 10.0 + random.uniform(-0.01, 0.01), 2)
                    c["temperature"] = round(self.avg_temperature + random.uniform(-0.3, 0.3), 1)
                    c["status"] = "HEALTHY"

        self.append_rolling_history()

    def get_payload(self, metadata_provider) -> Dict[str, Any]:
        power_kw = round((self.pack_voltage * self.pack_current) / 1000.0, 3)
        voltages = [c["voltage"] for c in self.cells]
        min_v = round(min(voltages), 2) if voltages else 3.56
        max_v = round(max(voltages), 2) if voltages else 3.62
        v_diff = round(max_v - min_v, 2)
        meta = metadata_provider(self.scenario)

        return {
            "timestamp": self.last_heartbeat.isoformat(),
            "seq_id": self.seq_id,
            "vehicle_id": self.vehicle_id,
            "scenario": self.scenario,
            "scenario_name": meta["name"],
            "operating_mode": meta["operating_mode"],
            "safety_status": meta["safety_status"],
            "is_simulated": True,
            "soc": round(self.soc, 1),
            "soh": round(self.soh, 1),
            "range_km": round(self.range_km, 1),
            "pack_voltage": self.pack_voltage,
            "pack_current": self.pack_current,
            "power_kw": power_kw,
            "avg_temperature": self.avg_temperature,
            "total_impedance": self.total_impedance,
            "health_score": self.health_score,
            "health_status": self.health_status,
            "cycle_count": self.cycle_count,
            "min_cell_voltage": min_v,
            "max_cell_voltage": max_v,
            "voltage_diff": v_diff,
            "cells": self.cells,
            "data_server_status": "OK" if self.scenario != "comm_fail" else "DISCONNECTED",
            "message_queue_status": "OK" if self.scenario != "comm_fail" else "TIMEOUT",
            "warnings_count": sum(1 for c in self.cells if c["status"] == "WARNING"),
            "alarms_count": sum(1 for c in self.cells if c["status"] == "CRITICAL"),
        }


class BatterySimulator:
    """Multi-vehicle battery telemetry simulator and real-time WebSocket dispatcher."""

    def __init__(self):
        self.is_running: bool = True
        self.speed_factor: float = 1.0
        self.active_vehicle_id: str = "KA05ER7777"
        self.active_websockets: Dict[WebSocket, str] = {}
        self.vehicle_states: Dict[str, VehicleSimulationState] = {}

        # Pre-seed canonical vehicles
        self.vehicle_states["KA05ER7777"] = VehicleSimulationState(
            vehicle_id="KA05ER7777",
            is_high_voltage=False,
            nominal_voltage=35.0,
            original_capacity_ah=100.0,
        )
        self.vehicle_states["HWGHLDZ20842872FS"] = VehicleSimulationState(
            vehicle_id="HWGHLDZ20842872FS",
            is_high_voltage=True,
            nominal_voltage=400.0,
            original_capacity_ah=100.0,
        )

    def get_or_create_vehicle_state(self, vehicle_id: str) -> VehicleSimulationState:
        vid = vehicle_id.strip() if vehicle_id else "KA05ER7777"
        if vid in self.vehicle_states:
            return self.vehicle_states[vid]

        # Check by substring or VIN heuristics
        is_hv = ("Cyber" in vid or "HWGHL" in vid or "FS" in vid)
        nom_v = 400.0 if is_hv else 35.0
        new_state = VehicleSimulationState(
            vehicle_id=vid,
            is_high_voltage=is_hv,
            nominal_voltage=nom_v,
            original_capacity_ah=100.0,
        )
        self.vehicle_states[vid] = new_state
        return new_state

    # Backwards-compatibility properties delegating to active vehicle state
    @property
    def primary_state(self) -> VehicleSimulationState:
        return self.get_or_create_vehicle_state(self.active_vehicle_id or "KA05ER7777")

    @property
    def scenario(self) -> str:
        return self.primary_state.scenario

    @scenario.setter
    def scenario(self, val: str):
        self.primary_state.scenario = val

    @property
    def tick_count(self) -> int:
        return self.primary_state.tick_count

    @property
    def last_heartbeat(self) -> datetime:
        return self.primary_state.last_heartbeat

    @property
    def soc(self) -> float:
        return self.primary_state.soc

    @soc.setter
    def soc(self, val: float):
        self.primary_state.soc = val

    @property
    def soh(self) -> float:
        return self.primary_state.soh

    @soh.setter
    def soh(self, val: float):
        self.primary_state.soh = val

    @property
    def pack_voltage(self) -> float:
        return self.primary_state.pack_voltage

    @pack_voltage.setter
    def pack_voltage(self, val: float):
        self.primary_state.pack_voltage = val

    @property
    def pack_current(self) -> float:
        return self.primary_state.pack_current

    @pack_current.setter
    def pack_current(self, val: float):
        self.primary_state.pack_current = val

    @property
    def avg_temperature(self) -> float:
        return self.primary_state.avg_temperature

    @avg_temperature.setter
    def avg_temperature(self, val: float):
        self.primary_state.avg_temperature = val

    @property
    def total_impedance(self) -> float:
        return self.primary_state.total_impedance

    @total_impedance.setter
    def total_impedance(self, val: float):
        self.primary_state.total_impedance = val

    @property
    def range_km(self) -> float:
        return self.primary_state.range_km

    @range_km.setter
    def range_km(self, val: float):
        self.primary_state.range_km = val

    @property
    def health_score(self) -> int:
        return self.primary_state.health_score

    @health_score.setter
    def health_score(self, val: int):
        self.primary_state.health_score = val

    @property
    def health_status(self) -> str:
        return self.primary_state.health_status

    @health_status.setter
    def health_status(self, val: str):
        self.primary_state.health_status = val

    @property
    def cycle_count(self) -> int:
        return self.primary_state.cycle_count

    @cycle_count.setter
    def cycle_count(self, val: int):
        self.primary_state.cycle_count = val

    @property
    def cells(self) -> List[Dict[str, Any]]:
        return self.primary_state.cells

    @cells.setter
    def cells(self, val: List[Dict[str, Any]]):
        self.primary_state.cells = val

    @property
    def rolling_history(self) -> List[Dict[str, Any]]:
        return self.primary_state.rolling_history

    def connect_ws(self, ws: WebSocket, vehicle_id: str = "KA05ER7777"):
        self.active_websockets[ws] = vehicle_id

    def disconnect_ws(self, ws: WebSocket):
        self.active_websockets.pop(ws, None)

    @staticmethod
    def normalize_scenario_id(raw_id: str) -> str:
        s = raw_id.lower().strip()
        if s in ("normal", "standard", "driving", "standard_driving"):
            return "normal"
        if s in ("charging", "fast_charging", "ccs2", "dc_fast_charging"):
            return "charging"
        if s in ("discharging", "dynamic_load", "high_load", "high_dynamic_load"):
            return "discharging"
        if s in ("high_temp", "thermal", "thermal_stress", "thermal_stress_zone"):
            return "high_temp"
        if s in ("cell_imbalance", "imbalance", "cell_imbalance_injected"):
            return "cell_imbalance"
        if s in ("aging", "high_degradation", "degradation", "high_degradation_run"):
            return "aging"
        return "normal"

    def get_scenario_metadata(self, scenario_id: Optional[str] = None) -> Dict[str, Any]:
        sc = scenario_id or self.scenario
        meta = {
            "normal": {
                "name": "Standard Driving Profile",
                "description": "Nominal suburban discharge profile under standard thermal envelope (20°C–25°C).",
                "operating_mode": "DISCHARGING_NOMINAL",
                "target_c_rate": 0.15,
                "safety_status": "NOMINAL",
            },
            "charging": {
                "name": "DC Fast Charging (CCS2)",
                "description": "High-voltage 150kW CCS2 rapid charging profile with cell thermal preconditioning.",
                "operating_mode": "CHARGING_FAST",
                "target_c_rate": 0.75,
                "safety_status": "ACTIVE_CHARGING",
            },
            "discharging": {
                "name": "High Dynamic Load",
                "description": "Heavy acceleration and regenerative braking cycle with elevated dynamic power draw.",
                "operating_mode": "DISCHARGING_HIGH_LOAD",
                "target_c_rate": 0.60,
                "safety_status": "LOAD_WARNING",
            },
            "high_temp": {
                "name": "Thermal Stress Zone",
                "description": "Elevated thermal stress profile with localized thermal gradients exceeding 50°C.",
                "operating_mode": "THERMAL_MANAGEMENT",
                "target_c_rate": 0.40,
                "safety_status": "CRITICAL_TEMPERATURE",
            },
            "cell_imbalance": {
                "name": "Cell Imbalance Injected",
                "description": "Controlled sub-module voltage divergence with Cell C01 depressed beyond 500mV Delta-V.",
                "operating_mode": "FAULT_DIAGNOSTICS",
                "target_c_rate": 0.20,
                "safety_status": "CRITICAL_IMBALANCE",
            },
            "aging": {
                "name": "High Degradation Run",
                "description": "Simulated end-of-warranty asset with 840 cycles, 74.2% SOH retention, and elevated impedance.",
                "operating_mode": "AGED_CYCLE_SIMULATION",
                "target_c_rate": 0.20,
                "safety_status": "DEGRADED_STATE",
            },
        }
        return meta.get(sc, meta["normal"])

    def set_scenario(self, raw_scenario: str, vehicle_id: str = "KA05ER7777"):
        scenario = self.normalize_scenario_id(raw_scenario)
        self.active_vehicle_id = vehicle_id
        state = self.get_or_create_vehicle_state(vehicle_id)
        state.set_scenario(scenario)

    async def activate_scenario(self, raw_scenario: str, vehicle_id: str = "KA05ER7777") -> Dict[str, Any]:
        """Activates scenario on target vehicle and immediately broadcasts updated telemetry frame via WebSockets."""
        self.set_scenario(raw_scenario, vehicle_id)
        payload = self.get_vehicle_payload(vehicle_id)
        await self.broadcast_telemetry()
        return payload

    async def broadcast_telemetry(self):
        """Dispatches latest telemetry snapshot to all connected WebSocket clients for their subscribed vehicles."""
        dead_sockets = set()
        for ws, sub_veh_id in list(self.active_websockets.items()):
            try:
                ws_payload = self.get_vehicle_payload(sub_veh_id)
                await ws.send_json(ws_payload)
            except Exception:
                dead_sockets.add(ws)
        for dead in dead_sockets:
            self.active_websockets.pop(dead, None)

    def reset(self, vehicle_id: str = "KA05ER7777"):
        self.set_scenario("normal", vehicle_id)

    def get_vehicle_payload(self, vehicle_id: str) -> Dict[str, Any]:
        """Generates real-time telemetry frame tailored to the specific vehicle."""
        state = self.get_or_create_vehicle_state(vehicle_id)
        return state.get_payload(self.get_scenario_metadata)

    async def step(self, vehicle_id: str = "KA05ER7777") -> Dict[str, Any]:
        """Calculates one continuous physics simulation tick for target vehicle."""
        state = self.get_or_create_vehicle_state(vehicle_id)
        state.step(self.speed_factor)
        await self.broadcast_telemetry()
        return state.get_payload(self.get_scenario_metadata)

    async def run_loop(self):
        while True:
            try:
                if self.is_running:
                    # Step all active vehicle simulation states
                    for state in list(self.vehicle_states.values()):
                        state.step(self.speed_factor)
                    await self.broadcast_telemetry()
                await asyncio.sleep(1.0 / max(0.2, self.speed_factor))
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[Simulator] Error in tick loop: {e}")
                await asyncio.sleep(1.0)


simulator = BatterySimulator()
