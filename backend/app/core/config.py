from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from pathlib import Path
from typing import List

_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent

# In Vercel Serverless / AWS Lambda, the deployment directory is strictly read-only.
# Default SQLite database must be placed in writable /tmp directory if no external DATABASE_URL is provided.
if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
    _DEFAULT_DB_FILE = "/tmp/voltsense.db"
else:
    _DEFAULT_DB_FILE = (_BACKEND_DIR / "voltsense.db").as_posix()

class Settings(BaseSettings):
    PROJECT_NAME: str = "VoltSense AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "voltsense_ai_super_secret_jwt_key_2026_production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ALGORITHM: str = "HS256"
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{_DEFAULT_DB_FILE}")
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "300"))
    
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    SIMULATION_INTERVAL_SEC: float = 1.0
    SIMULATION_MODE_DEFAULT: bool = True
    
    MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "localhost")
    MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    MQTT_TOPIC_PREFIX: str = "voltsense"
    
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True, extra="ignore")

settings = Settings()
