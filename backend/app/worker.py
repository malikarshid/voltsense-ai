"""
VoltSense AI — Persistent Autonomous Simulation Worker
Runs continuous 1.0 Hz CAN-BMS simulation, updates database state,
and broadcasts telemetry for high-concurrency production deployments.
"""
import asyncio
import signal
import sys
from app.core.database import init_db
from app.services.simulator_service import simulator

running = True

def handle_signal(sig, frame):
    global running
    print(f"\n[VoltSense Worker] Received signal {sig}, initiating graceful shutdown...")
    running = False
    simulator.is_running = False

async def main():
    print("=" * 65)
    print("VoltSense AI — Persistent Autonomous Battery Simulation Worker")
    print("=" * 65)
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

    await init_db()
    print("[VoltSense Worker] Database initialized successfully.")
    print("[VoltSense Worker] Starting continuous 1.0 Hz CAN-BMS physics loop...")

    try:
        await simulator.run_loop()
    except asyncio.CancelledError:
        pass
    print("[VoltSense Worker] Simulation loop terminated cleanly.")

if __name__ == "__main__":
    asyncio.run(main())
