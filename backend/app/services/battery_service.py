import random
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.entities import (
    Vehicle, BatteryPack, BatteryCell, SensorReading, BatteryHealthRecord, Alert, MaintenanceRecord
)
from app.schemas.schemas import DegradationSummary

class BatteryService:

    @staticmethod
    async def seed_default_vehicles(session: AsyncSession):
        """Ensures default reference vehicles exist in database."""
        result = await session.execute(select(Vehicle).where(Vehicle.vin == "KA05ER7777"))
        existing = result.scalar_one_or_none()
        if existing:
            return existing

        # Vehicle 1: Reference 1 & 3 Hero Vehicle
        v1 = Vehicle(
            name="VoltSense Model GT",
            vin="KA05ER7777",
            model_year=2024,
            battery_chemistry="NMC (Nickel Manganese Cobalt)",
            pack_capacity_kwh=75.0,
            original_capacity_ah=100.0,
            current_capacity_ah=88.4,
            nominal_voltage=35.0,
            max_voltage=42.0,
            min_voltage=28.0,
            cell_count=10,
            status="active"
        )
        session.add(v1)
        await session.flush()

        pack1 = BatteryPack(
            vehicle_id=v1.id,
            pack_serial="VS-BP-8840-X1",
            total_cycles=238,
            design_capacity_ah=105.0,
            original_capacity_ah=100.0,
            current_capacity_ah=88.4,
            current_soh=88.4,
            current_soc=67.0,
            health_score=86,
            estimated_range_km=48.0,
            avg_temperature=23.6,
            total_voltage=34.9,
            pack_current=-14.2,
            total_impedance=0.1085,
            cooling_status="optimal",
            bms_state="operational"
        )
        session.add(pack1)

        # 10 Cells for Vehicle 1 (matching Reference 1 & Reference 3)
        # Reference 3 shows: Cell 01 WARNING (10.9V / 0.0691 ohm), Cell 02 HEALTHY (12.6V), Cell 03 HEALTHY (11.5V)
        # Scaled to cell level 3.56V - 3.62V nominal
        cell_configs = [
            {"idx": 1, "v": 3.56, "t": 25.2, "r": 0.0691, "status": "WARNING"},
            {"idx": 2, "v": 3.62, "t": 20.5, "r": 0.0247, "status": "HEALTHY"},
            {"idx": 3, "v": 3.60, "t": 25.1, "r": 0.0147, "status": "HEALTHY"},
            {"idx": 4, "v": 3.59, "t": 23.4, "r": 0.0182, "status": "HEALTHY"},
            {"idx": 5, "v": 3.61, "t": 22.9, "r": 0.0165, "status": "HEALTHY"},
            {"idx": 6, "v": 3.58, "t": 23.8, "r": 0.0194, "status": "HEALTHY"},
            {"idx": 7, "v": 3.60, "t": 24.1, "r": 0.0177, "status": "HEALTHY"},
            {"idx": 8, "v": 3.57, "t": 24.6, "r": 0.0210, "status": "HEALTHY"},
            {"idx": 9, "v": 3.62, "t": 23.0, "r": 0.0158, "status": "HEALTHY"},
            {"idx": 10, "v": 3.61, "t": 23.2, "r": 0.0162, "status": "HEALTHY"},
        ]

        for c in cell_configs:
            cell = BatteryCell(
                vehicle_id=v1.id,
                cell_index=c["idx"],
                cell_serial=f"CEL-8840-{c['idx']:02d}",
                voltage=c["v"],
                temperature=c["t"],
                internal_resistance=c["r"],
                status=c["status"]
            )
            session.add(cell)

        # Vehicle 2: Reference 2 Inspired CyberSUV
        v2 = Vehicle(
            name="VoltSense CyberSUV",
            vin="HWGHLDZ20842872FS",
            model_year=2024,
            battery_chemistry="NMC (High-Nickel Li-ion)",
            pack_capacity_kwh=82.0,
            original_capacity_ah=100.0,
            current_capacity_ah=92.0,
            nominal_voltage=400.0,
            max_voltage=450.0,
            min_voltage=320.0,
            cell_count=10,
            status="charging"
        )
        session.add(v2)
        await session.flush()

        pack2 = BatteryPack(
            vehicle_id=v2.id,
            pack_serial="VS-BP-9200-S2",
            total_cycles=142,
            design_capacity_ah=105.0,
            original_capacity_ah=100.0,
            current_capacity_ah=92.0,
            current_soh=92.0,
            current_soc=54.0,
            health_score=91,
            estimated_range_km=180.0,
            avg_temperature=24.5,
            total_voltage=398.2,
            pack_current=45.0,  # Charging
            total_impedance=0.0890,
            cooling_status="optimal",
            bms_state="charging"
        )
        session.add(pack2)

        for i in range(1, 11):
            cell = BatteryCell(
                vehicle_id=v2.id,
                cell_index=i,
                cell_serial=f"CYB-9200-{i:02d}",
                voltage=3.98 + random.uniform(-0.01, 0.01),
                temperature=24.0 + random.uniform(0.1, 0.8),
                internal_resistance=0.014 + random.uniform(0.001, 0.003),
                status="HEALTHY"
            )
            session.add(cell)

        # Default Alert matching Reference 3 (Cell 1 warning)
        a1 = Alert(
            vehicle_id=v1.id,
            alert_type="CELL_IMBALANCE",
            severity="WARNING",
            cell_index=1,
            message="Cell 01 internal impedance elevated (0.0691 Ω) and slight voltage drop detected.",
            recommendation="Perform automated cell equalization cycle and inspect busbar torque."
        )
        session.add(a1)

        # Default Maintenance Record
        m1 = MaintenanceRecord(
            vehicle_id=v1.id,
            title="Periodic BMS Calibration & Thermal Loop Inspection",
            priority="Medium",
            status="Scheduled",
            technician="Senior BMS Specialist",
            notes="Verify coolant glycol concentration and log cell balancing telemetry."
        )
        session.add(m1)

        await session.commit()
        return v1

    @staticmethod
    def get_degradation_history(period: str = "6months") -> List[Dict[str, Any]]:
        """Exact degradation trend matching Reference 1 (Last 6 Months: Nov '23 to May '24)."""
        if period == "7days":
            return [
                {"date": "Day 1", "capacity_ah": 88.45, "soh_pct": 88.45},
                {"date": "Day 2", "capacity_ah": 88.44, "soh_pct": 88.44},
                {"date": "Day 3", "capacity_ah": 88.43, "soh_pct": 88.43},
                {"date": "Day 4", "capacity_ah": 88.42, "soh_pct": 88.42},
                {"date": "Day 5", "capacity_ah": 88.41, "soh_pct": 88.41},
                {"date": "Day 6", "capacity_ah": 88.40, "soh_pct": 88.40},
                {"date": "Day 7", "capacity_ah": 88.40, "soh_pct": 88.40},
            ]
        elif period == "30days":
            return [
                {"date": "Week 1", "capacity_ah": 89.2, "soh_pct": 89.2},
                {"date": "Week 2", "capacity_ah": 88.9, "soh_pct": 88.9},
                {"date": "Week 3", "capacity_ah": 88.6, "soh_pct": 88.6},
                {"date": "Week 4", "capacity_ah": 88.4, "soh_pct": 88.4},
            ]
        elif period == "12months":
            return [
                {"date": "Jun '23", "capacity_ah": 100.0, "soh_pct": 100.0},
                {"date": "Aug '23", "capacity_ah": 99.1, "soh_pct": 99.1},
                {"date": "Oct '23", "capacity_ah": 98.0, "soh_pct": 98.0},
                {"date": "Dec '23", "capacity_ah": 96.5, "soh_pct": 96.5},
                {"date": "Feb '24", "capacity_ah": 94.2, "soh_pct": 94.2},
                {"date": "Apr '24", "capacity_ah": 91.0, "soh_pct": 91.0},
                {"date": "May '24", "capacity_ah": 88.4, "soh_pct": 88.4},
            ]
        else:
            # 6 Months - exact curve from Reference 1
            return [
                {"date": "Nov '23", "capacity_ah": 100.0, "soh_pct": 100.0},
                {"date": "Dec '23", "capacity_ah": 98.7, "soh_pct": 98.7},
                {"date": "Jan '24", "capacity_ah": 97.1, "soh_pct": 97.1},
                {"date": "Feb '24", "capacity_ah": 95.3, "soh_pct": 95.3},
                {"date": "Mar '24", "capacity_ah": 93.4, "soh_pct": 93.4},
                {"date": "Apr '24", "capacity_ah": 91.6, "soh_pct": 91.6},
                {"date": "May '24", "capacity_ah": 88.4, "soh_pct": 88.4},
            ]

    @staticmethod
    def get_temperature_history() -> List[Dict[str, Any]]:
        """Temperature trend matching Reference 1 (Last 7 Days, optimal range 15°C - 45°C)."""
        return [
            {"day": "May 6", "temperature": 23.5, "optimal_min": 15, "optimal_max": 45},
            {"day": "May 7", "temperature": 27.2, "optimal_min": 15, "optimal_max": 45},
            {"day": "May 8", "temperature": 24.8, "optimal_min": 15, "optimal_max": 45},
            {"day": "May 9", "temperature": 32.0, "optimal_min": 15, "optimal_max": 45, "tooltip": "May 9 - 12:30 PM (32°C)"},
            {"day": "May 10", "temperature": 25.1, "optimal_min": 15, "optimal_max": 45},
            {"day": "May 11", "temperature": 26.4, "optimal_min": 15, "optimal_max": 45},
            {"day": "May 12", "temperature": 23.6, "optimal_min": 15, "optimal_max": 45},
        ]

    @staticmethod
    def compute_degradation_summary(current_ah: float, original_ah: float) -> DegradationSummary:
        loss_ah = round(original_ah - current_ah, 1)
        loss_pct = round((loss_ah / original_ah) * 100, 1)
        # Average monthly degradation over 6 months:
        avg_monthly = round(loss_pct / 6.0, 1)
        proj_min = round(current_ah - (avg_monthly * 12 * 0.45), 0)
        proj_max = round(current_ah - (avg_monthly * 12 * 0.35), 0)

        return DegradationSummary(
            total_degradation_ah=loss_ah,
            total_degradation_pct=loss_pct,
            avg_monthly_degradation_pct=avg_monthly,
            projected_capacity_1yr_min_ah=proj_min,
            projected_capacity_1yr_max_ah=proj_max,
            performance_status="Battery is performing within optimal range.",
            soh_formula="SOH (%) = (Current Measured Capacity / Original Capacity) × 100"
        )

battery_service = BatteryService()
