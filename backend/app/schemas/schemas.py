from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str = "operator"

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    is_active: bool
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Vehicle Schemas
class VehicleBase(BaseModel):
    name: str
    vin: str
    model_year: int = 2024
    battery_chemistry: str = "NMC"
    pack_capacity_kwh: float = 75.0
    original_capacity_ah: float = 100.0
    current_capacity_ah: float = 88.4
    nominal_voltage: float = 400.0
    max_voltage: float = 450.0
    min_voltage: float = 320.0
    cell_count: int = 10
    status: str = "active"

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    current_capacity_ah: Optional[float] = None

class BatteryCellResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    vehicle_id: str
    cell_index: int
    cell_serial: str
    voltage: float
    temperature: float
    internal_resistance: float
    status: str
    updated_at: datetime

class BatteryPackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    vehicle_id: str
    pack_serial: str
    total_cycles: int
    design_capacity_ah: float
    original_capacity_ah: float
    current_capacity_ah: float
    current_soh: float
    current_soc: float
    health_score: int
    estimated_range_km: float
    avg_temperature: float
    total_voltage: float
    pack_current: float
    total_impedance: float
    cooling_status: str
    bms_state: str
    updated_at: datetime

class VehicleResponse(VehicleBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
    pack: Optional[BatteryPackResponse] = None

# Battery Health Summary Schema (Matching Reference 1 & 2)
class DegradationSummary(BaseModel):
    total_degradation_ah: float
    total_degradation_pct: float
    avg_monthly_degradation_pct: float
    projected_capacity_1yr_min_ah: float
    projected_capacity_1yr_max_ah: float
    performance_status: str
    soh_formula: str

class BatteryHealthOverview(BaseModel):
    vehicle_id: str
    soc_percentage: float
    estimated_range_km: float
    health_score: int
    health_status: str
    cycle_count: int
    design_capacity_ah: float
    original_capacity_ah: float
    current_capacity_ah: float
    soh_percentage: float
    degradation_summary: DegradationSummary
    pack_voltage: float
    avg_temperature: float
    total_impedance: float
    min_cell_voltage: float
    max_cell_voltage: float
    voltage_diff: float
    cells: List[BatteryCellResponse]

# Sensor Reading Schemas
class SensorReadingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    vehicle_id: str
    timestamp: datetime
    pack_voltage: float
    pack_current: float
    avg_temperature: float
    min_temperature: float
    max_temperature: float
    soc: float
    power_kw: float
    total_impedance: float
    is_simulated: bool

# Alert Schemas
class AlertResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    vehicle_id: str
    alert_type: str
    severity: str
    cell_index: Optional[int] = None
    message: str
    recommendation: str
    acknowledged: bool
    resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None

class AlertAcknowledge(BaseModel):
    acknowledged: bool = True

# Prediction Schemas
class PredictionRequest(BaseModel):
    vehicle_id: str
    cycles_ahead: int = 50

class PredictionResponse(BaseModel):
    vehicle_id: str
    predicted_soh: float
    current_soh: float
    predicted_rul_cycles: int
    current_cycles: int
    degradation_rate_per_100_cycles: float
    anomaly_score: float
    is_anomaly: bool
    confidence_level: float
    model_name: str
    model_version: str
    evaluation_metrics: Dict[str, float]
    feature_importance: Dict[str, float]
    recommendations: List[str]
    disclaimer: str

# Maintenance Schemas
class MaintenanceRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    vehicle_id: str
    title: str
    priority: str
    status: str
    due_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    technician: str
    notes: str
    created_at: datetime

class MaintenanceCreate(BaseModel):
    vehicle_id: str
    title: str
    priority: str = "Medium"
    due_date: Optional[datetime] = None
    technician: str = "Senior BMS Specialist"
    notes: str = ""

# Simulator Schemas
class SimulatorControl(BaseModel):
    action: str = Field(..., description="start, stop, reset, scenario")
    scenario: Optional[str] = Field("normal", description="normal, charging, discharging, high_temp, cell_imbalance, aging")
    scenario_id: Optional[str] = None
    vehicle_id: Optional[str] = "KA05ER7777"
    speed_factor: Optional[float] = 1.0

class ScenarioRequest(BaseModel):
    vehicle_id: Optional[str] = "KA05ER7777"
    scenario_id: Optional[str] = None
    scenario: Optional[str] = None
    speed_factor: Optional[float] = 1.0

class ScenarioResponse(BaseModel):
    active_scenario: str
    scenario_id: str
    vehicle_id: str
    is_running: bool
    status: str
    timestamp: str
    metadata: Dict[str, Any]
    telemetry: Dict[str, Any]

class SimulatorStatus(BaseModel):
    is_running: bool
    scenario: str
    scenario_name: Optional[str] = "Standard Driving Profile"
    speed_factor: float
    tick_count: int
    active_vehicle_id: Optional[str]
    data_server_status: str = "OK"
    message_queue_status: str = "OK"
    last_heartbeat: datetime
