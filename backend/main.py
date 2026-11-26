"""
VoltSense AI — Vercel Multi-Service Application Entrypoint
Exposes the FastAPI ASGI application instance for Vercel Python Runtime.
"""
import sys
from pathlib import Path

# Ensure backend root directory is in sys.path
SERVICE_ROOT = Path(__file__).resolve().parent
if str(SERVICE_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVICE_ROOT))

from app.main import app

__all__ = ["app"]
