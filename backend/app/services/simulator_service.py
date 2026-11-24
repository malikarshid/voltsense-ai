import asyncio
import math
import random
from datetime import datetime, timezone
from typing import Dict, Any, List, Set
from fastapi import WebSocket

class BatterySimulator:
    def __init__(self):
        self.is_running: bool = True
        self.scenario: str = "normal"  # normal, charging, discharging, high_temp, cell_imbalance, voltage_anomaly, comm_fail
        self.speed_factor: float = 1.0
        self.tick_count: int = 0
        self.active_vehicle_id: str = "KA05ER7777"
        self.last_heartbeat: datetime = datetime.now(timezone.utc)
        self.active_websockets: Set[WebSocket] = set()
        
        # State variables for primary vehicle (matching Reference 1 & 3)
        self.soc: float = 67.0
        self.soh: float = 88.4
        self.pack_voltage: float = 34.9
        self.pack_current: float = -14.2
        self.avg_temperature: float = 23.6
        self.total_impedance: float = 0.1085
        self.range_km: float = 48.0
        
        # 10 Cells
        self.cells: List[Dict[str, Any]] = [
            {"cell_index": 1, "voltage": 3.56, "temperature": 25.2, "internal_resistance": 0.0691, "status": "WARNING"},
            {"cell_index": 2, "voltage": 3.62, "temperature": 20.5, "internal_resistance": 0.0247, "status": "HEALTHY"},
            {"cell_index": 3, "voltage": 3.60, "temperature": 25.1, "internal_resistance": 0.0147, "status": "HEALTHY"},
            {"cell_index": 4, "voltage": 3.59, "temperature": 23.4, "internal_resistance": 0.0182, "status": "HEALTHY"},
            {"cell_index": 5, "voltage": 3.61, "temperature": 22.9, "internal_resistance": 0.0165, "status": "HEALTHY"},
            {"cell_index": 6, "voltage": 3.58, "temperature": 23.8, "internal_resistance": 0.0194, "status": "HEALTHY"},
            {"cell_index": 7, "voltage": 3.60, "temperature": 24.1, "internal_resistance": 0.0177, "status": "HEALTHY"},
            {"cell_index": 8, "voltage": 3.57, "temperature": 24.6, "internal_resistance": 0.0210, "status": "HEALTHY"},
            {"cell_index": 9, "voltage": 3.62, "temperature": 23.0, "internal_resistance": 0.0158, "status": "HEALTHY"},
            {"cell_index": 10, "voltage": 3.61, "temperature": 23.2, "internal_resistance": 0.0162, "status": "HEALTHY"},
        ]
        
        # Rolling recent history (last 50 points) for real-time graphs
        self.rolling_history: List[Dict[str, Any]] = []

    def connect_ws(self, ws: WebSocket):
        self.active_websockets.add(ws)

    def disconnect_ws(self, ws: WebSocket):
        self.active_websockets.discard(ws)

    def set_scenario(self, scenario: str):
        self.scenario = scenario
        self.tick_count = 0
        if scenario == "charging":
            self.pack_current = 45.0
        elif scenario == "discharging":
            self.pack_current = -35.0
        elif scenario == "normal":
            self.pack_current = -14.2

    def reset(self):
        self.soc = 67.0
        self.pack_voltage = 34.9
        self.pack_current = -14.2
        self.avg_temperature = 23.6
        self.total_impedance = 0.1085
        self.range_km = 48.0
        self.scenario = "normal"
        self.tick_count = 0

    async def step(self) -> Dict[str, Any]:
        """Calculates one physics simulation tick."""
        self.tick_count += 1
        self.last_heartbeat = datetime.now(timezone.utc)
        dt = 1.0 * self.speed_factor

        noise = random.uniform(-0.02, 0.02)
        
        if self.scenario == "charging":
            # Charging dynamics
            self.pack_current = round(45.0 + random.uniform(-1.5, 1.5), 1)
            self.soc = min(100.0, self.soc + (0.15 * dt))
            self.pack_voltage = round(36.0 + (self.soc / 100.0) * 4.5 + noise, 2)
            self.avg_temperature = round(min(36.0, 23.6 + (self.tick_count * 0.1)), 1)
            self.range_km = round((self.soc / 100.0) * 72.0, 1)
            self.total_impedance = round(0.0950 + random.uniform(-0.002, 0.002), 4)
            # Cells follow charging
            for c in self.cells:
                c["voltage"] = round(self.pack_voltage / 10.0 + random.uniform(-0.015, 0.015), 2)
                c["temperature"] = round(self.avg_temperature + random.uniform(-0.5, 0.5), 1)
                c["status"] = "HEALTHY"

        elif self.scenario == "discharging":
            # Driving / discharge dynamics
            self.pack_current = round(-38.0 + random.uniform(-3.0, 3.0), 1)
            self.soc = max(5.0, self.soc - (0.12 * dt))
            self.pack_voltage = round(32.0 + (self.soc / 100.0) * 4.0 + noise, 2)
            self.avg_temperature = round(min(34.0, 23.6 + (self.tick_count * 0.08)), 1)
            self.range_km = round((self.soc / 100.0) * 72.0, 1)
            self.total_impedance = round(0.1050 + random.uniform(-0.003, 0.003), 4)
            for c in self.cells:
                c["voltage"] = round(self.pack_voltage / 10.0 + random.uniform(-0.02, 0.02), 2)
                c["temperature"] = round(self.avg_temperature + random.uniform(-0.6, 0.6), 1)

        elif self.scenario == "high_temp":
            # Overheating / thermal runaway test scenario
            self.pack_current = round(-42.0 + noise, 1)
            self.avg_temperature = round(min(58.5, 25.0 + (self.tick_count * 0.6)), 1)
            self.total_impedance = round(0.1350 + (self.tick_count * 0.001), 4)
            for c in self.cells:
                c["temperature"] = round(self.avg_temperature + (1.2 if c["cell_index"] == 1 else random.uniform(-0.5, 0.5)), 1)
                c["status"] = "CRITICAL" if c["temperature"] > 50.0 else "WARNING"

        elif self.scenario == "cell_imbalance":
            # Cell 1 voltage drops drastically, resistance spikes
            self.cells[0]["voltage"] = round(max(2.80, 3.56 - (self.tick_count * 0.02)), 2)
            self.cells[0]["internal_resistance"] = round(min(0.0950, 0.0691 + (self.tick_count * 0.001)), 4)
            self.cells[0]["status"] = "CRITICAL" if self.cells[0]["voltage"] < 3.00 else "WARNING"
            self.total_impedance = round(0.1180 + random.uniform(0.001, 0.004), 4)

        elif self.scenario == "voltage_anomaly":
            # Transient spike / sag
            sine_wave = math.sin(self.tick_count * 0.5) * 4.2
            self.pack_voltage = round(34.9 + sine_wave + noise, 2)

        elif self.scenario == "comm_fail":
            # Simulates communication drop
            pass

        else:
            # Normal baseline operation (matching Reference 1 & 3)
            # Voltage ~34.9V, Temp ~23.6°C, Impedance ~0.1085 Ω, SOC ~67%
            self.pack_voltage = round(34.9 + noise, 2)
            self.pack_current = round(-14.2 + random.uniform(-0.8, 0.8), 1)
            self.avg_temperature = round(23.6 + random.uniform(-0.2, 0.2), 1)
            self.total_impedance = round(0.1085 + random.uniform(-0.0015, 0.0015), 4)
            self.range_km = 48.0
            # Jitter cell values slightly
            for c in self.cells:
                base_v = 3.56 if c["cell_index"] == 1 else 3.60
                c["voltage"] = round(base_v + random.uniform(-0.015, 0.015), 2)
                c["temperature"] = round(23.5 + random.uniform(-0.4, 0.4), 1)

        # Power calculation: P = V * I / 1000 (kW)
        power_kw = round((self.pack_voltage * self.pack_current) / 1000.0, 3)

        voltages = [c["voltage"] for c in self.cells]
        min_v = round(min(voltages), 2)
        max_v = round(max(voltages), 2)
        v_diff = round(max_v - min_v, 2)

        payload = {
            "timestamp": self.last_heartbeat.isoformat(),
            "vehicle_id": self.active_vehicle_id,
            "scenario": self.scenario,
            "is_simulated": True,
            "soc": round(self.soc, 1),
            "soh": round(self.soh, 1),
            "range_km": round(self.range_km, 1),
            "pack_voltage": self.pack_voltage,
            "pack_current": self.pack_current,
            "power_kw": power_kw,
            "avg_temperature": self.avg_temperature,
            "total_impedance": self.total_impedance,
            "min_cell_voltage": min_v,
            "max_cell_voltage": max_v,
            "voltage_diff": v_diff,
            "cells": self.cells,
            "data_server_status": "OK" if self.scenario != "comm_fail" else "DISCONNECTED",
            "message_queue_status": "OK" if self.scenario != "comm_fail" else "TIMEOUT",
            "warnings_count": sum(1 for c in self.cells if c["status"] == "WARNING"),
            "alarms_count": sum(1 for c in self.cells if c["status"] == "CRITICAL")
        }

        # Keep last 50 data points in memory
        self.rolling_history.append({
            "time": self.last_heartbeat.strftime("%H:%M:%S"),
            "voltage": self.pack_voltage,
            "temperature": self.avg_temperature,
            "impedance": self.total_impedance,
            "soc": round(self.soc, 1),
            "current": self.pack_current
        })
        if len(self.rolling_history) > 50:
            self.rolling_history.pop(0)

        # Broadcast via WebSocket
        dead_sockets = set()
        for ws in self.active_websockets:
            try:
                await ws.send_json(payload)
            except Exception:
                dead_sockets.add(ws)
        self.active_websockets -= dead_sockets

        return payload

    async def run_loop(self):
        """Asynchronous simulator background task."""
        while True:
            try:
                if self.is_running:
                    await self.step()
                await asyncio.sleep(1.0 / max(0.2, self.speed_factor))
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[Simulator] Error in tick loop: {e}")
                await asyncio.sleep(1.0)

simulator = BatterySimulator()
