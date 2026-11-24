import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    String, Float, Integer, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False, default="VoltSense Operator")
    role: Mapped[str] = mapped_column(String(50), default="operator")  # admin, engineer, operator, viewer
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "VoltSense Model GT"
    vin: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    model_year: Mapped[int] = mapped_column(Integer, default=2024)
    battery_chemistry: Mapped[str] = mapped_column(String(50), default="NMC (Nickel Manganese Cobalt)")  # NMC, LFP, NCA
    pack_capacity_kwh: Mapped[float] = mapped_column(Float, default=75.0)
    original_capacity_ah: Mapped[float] = mapped_column(Float, default=100.0)
    current_capacity_ah: Mapped[float] = mapped_column(Float, default=88.4)
    nominal_voltage: Mapped[float] = mapped_column(Float, default=400.0)
    max_voltage: Mapped[float] = mapped_column(Float, default=450.0)
    min_voltage: Mapped[float] = mapped_column(Float, default=320.0)
    cell_count: Mapped[int] = mapped_column(Integer, default=10)
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, charging, maintenance, offline
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    pack: Mapped[Optional["BatteryPack"]] = relationship("BatteryPack", back_populates="vehicle", uselist=False, cascade="all, delete-orphan")
    cells: Mapped[List["BatteryCell"]] = relationship("BatteryCell", back_populates="vehicle", cascade="all, delete-orphan")
    readings: Mapped[List["SensorReading"]] = relationship("SensorReading", back_populates="vehicle", cascade="all, delete-orphan")
    alerts: Mapped[List["Alert"]] = relationship("Alert", back_populates="vehicle", cascade="all, delete-orphan")
    health_records: Mapped[List["BatteryHealthRecord"]] = relationship("BatteryHealthRecord", back_populates="vehicle", cascade="all, delete-orphan")
    predictions: Mapped[List["PredictionResult"]] = relationship("PredictionResult", back_populates="vehicle", cascade="all, delete-orphan")
    maintenance_records: Mapped[List["MaintenanceRecord"]] = relationship("MaintenanceRecord", back_populates="vehicle", cascade="all, delete-orphan")


class BatteryPack(Base):
    __tablename__ = "battery_packs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), unique=True)
    pack_serial: Mapped[str] = mapped_column(String(100), default="VS-BP-8840-X1")
    total_cycles: Mapped[int] = mapped_column(Integer, default=238)
    design_capacity_ah: Mapped[float] = mapped_column(Float, default=105.0)
    original_capacity_ah: Mapped[float] = mapped_column(Float, default=100.0)
    current_capacity_ah: Mapped[float] = mapped_column(Float, default=88.4)
    current_soh: Mapped[float] = mapped_column(Float, default=88.4)  # 88.4% SOH
    current_soc: Mapped[float] = mapped_column(Float, default=67.0)  # 67% SOC
    health_score: Mapped[int] = mapped_column(Integer, default=86)  # 86 / 100
    estimated_range_km: Mapped[float] = mapped_column(Float, default=48.0)
    avg_temperature: Mapped[float] = mapped_column(Float, default=23.6)  # °C
    total_voltage: Mapped[float] = mapped_column(Float, default=34.9)  # V
    pack_current: Mapped[float] = mapped_column(Float, default=-14.2)  # A (negative = discharging)
    total_impedance: Mapped[float] = mapped_column(Float, default=0.1085)  # Ohm
    cooling_status: Mapped[str] = mapped_column(String(50), default="optimal")
    bms_state: Mapped[str] = mapped_column(String(50), default="operational")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="pack")


class BatteryCell(Base):
    __tablename__ = "battery_cells"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    cell_index: Mapped[int] = mapped_column(Integer, nullable=False)  # 1 to 10
    cell_serial: Mapped[str] = mapped_column(String(50), default="")
    voltage: Mapped[float] = mapped_column(Float, default=3.60)  # V
    temperature: Mapped[float] = mapped_column(Float, default=23.5)  # °C
    internal_resistance: Mapped[float] = mapped_column(Float, default=0.0150)  # Ohm
    status: Mapped[str] = mapped_column(String(20), default="HEALTHY")  # HEALTHY, WARNING, CRITICAL, IDLE
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="cells")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    pack_voltage: Mapped[float] = mapped_column(Float)
    pack_current: Mapped[float] = mapped_column(Float)
    avg_temperature: Mapped[float] = mapped_column(Float)
    min_temperature: Mapped[float] = mapped_column(Float)
    max_temperature: Mapped[float] = mapped_column(Float)
    soc: Mapped[float] = mapped_column(Float)
    power_kw: Mapped[float] = mapped_column(Float)
    total_impedance: Mapped[float] = mapped_column(Float)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="readings")


class BatteryHealthRecord(Base):
    __tablename__ = "battery_health_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    soh_percentage: Mapped[float] = mapped_column(Float)
    measured_capacity_ah: Mapped[float] = mapped_column(Float)
    original_capacity_ah: Mapped[float] = mapped_column(Float)
    cycle_count: Mapped[int] = mapped_column(Integer)
    degradation_percentage: Mapped[float] = mapped_column(Float)
    performance_category: Mapped[str] = mapped_column(String(50), default="Optimal")

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="health_records")


class PredictionResult(Base):
    __tablename__ = "prediction_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    model_name: Mapped[str] = mapped_column(String(100), default="RandomForest_SOH_Regressor_v1")
    model_version: Mapped[str] = mapped_column(String(50), default="1.0.0")
    predicted_soh: Mapped[float] = mapped_column(Float)
    predicted_rul_cycles: Mapped[int] = mapped_column(Integer)
    anomaly_score: Mapped[float] = mapped_column(Float, default=0.0)
    is_anomaly: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[float] = mapped_column(Float, default=0.95)
    features_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="predictions")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    alert_type: Mapped[str] = mapped_column(String(50))  # OVER_TEMP, UNDER_VOLT, OVER_VOLT, CELL_IMBALANCE, HIGH_IMPEDANCE, COMM_FAIL
    severity: Mapped[str] = mapped_column(String(20))  # INFO, WARNING, CRITICAL
    cell_index: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    message: Mapped[str] = mapped_column(String(255))
    recommendation: Mapped[str] = mapped_column(String(500), default="Inspect cell connections and run diagnostic cycle.")
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="alerts")


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    priority: Mapped[str] = mapped_column(String(20), default="Medium")  # Low, Medium, High, Urgent
    status: Mapped[str] = mapped_column(String(50), default="Scheduled")  # Scheduled, In Progress, Completed
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    technician: Mapped[str] = mapped_column(String(100), default="Senior BMS Specialist")
    notes: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    vehicle: Mapped["Vehicle"] = relationship("Vehicle", back_populates="maintenance_records")


class ReportRecord(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    vehicle_id: Mapped[str] = mapped_column(String(36), ForeignKey("vehicles.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255))
    report_type: Mapped[str] = mapped_column(String(50), default="HEALTH_DIAGNOSTIC")  # HEALTH_DIAGNOSTIC, CELL_BALANCE, FLEET_AUDIT
    file_path: Mapped[str] = mapped_column(String(500))
    file_size_bytes: Mapped[int] = mapped_column(Integer, default=0)
    summary_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
