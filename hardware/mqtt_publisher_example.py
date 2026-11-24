"""
VoltSense AI - MQTT Hardware Telemetry Simulator & Test Client
--------------------------------------------------------------
Publishes live simulated CAN-bus & BMS sensor telemetry to an MQTT broker
matching the schema ingested by the VoltSense AI backend.
"""

import time
import json
import random
import paho.mqtt.client as mqtt

BROKER_HOST = "localhost"
BROKER_PORT = 1883
VEHICLE_VIN = "KA05ER7777"
TOPIC = f"voltsense/{VEHICLE_VIN}/telemetry"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[MQTT] Connected successfully to broker at {BROKER_HOST}:{BROKER_PORT}")
    else:
        print(f"[MQTT] Failed to connect, return code: {rc}")

def run_publisher():
    client = mqtt.Client(client_id=f"BMS-Publisher-{VEHICLE_VIN}")
    client.on_connect = on_connect

    try:
        client.connect(BROKER_HOST, BROKER_PORT, 60)
        client.loop_start()
    except Exception as e:
        print(f"[MQTT Gateway] Notice: Local MQTT broker not running on {BROKER_HOST}:{BROKER_PORT} ({e}).")
        print("[MQTT Gateway] To start an MQTT broker locally, run: docker run -p 1883:1883 eclipse-mosquitto")
        return

    print(f"[MQTT Gateway] Streaming telemetry on topic: {TOPIC} (Press Ctrl+C to stop)")
    
    soc = 67.0
    while True:
        payload = {
            "vehicle_id": VEHICLE_VIN,
            "pack_voltage": round(34.9 + random.uniform(-0.05, 0.05), 2),
            "pack_current": round(-14.2 + random.uniform(-0.5, 0.5), 1),
            "avg_temperature": round(23.6 + random.uniform(-0.2, 0.2), 1),
            "total_impedance": round(0.1085 + random.uniform(-0.001, 0.001), 4),
            "soc": round(soc, 1),
            "timestamp": int(time.time()),
            "source": "CAN_ISO1050_HARDWARE_INTERFACE"
        }
        
        client.publish(TOPIC, json.dumps(payload))
        print(f"[Published] {payload}")
        time.sleep(1.0)

if __name__ == "__main__":
    run_publisher()
