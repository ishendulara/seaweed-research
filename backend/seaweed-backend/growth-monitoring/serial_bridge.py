# backend\seaweed-backend\growth-monitoring\serial_bridge.py

import serial
import requests
import json
import time

# ── CONFIG ──────────────────────────────────────────
SERIAL_PORT = "COM3"          # Windows: "COM3", Mac/Linux: "/dev/ttyUSB0"
BAUD_RATE   = 9600
FLASK_URL = "http://127.0.0.1:8000/iot-weight"
# ────────────────────────────────────────────────────

print(f"Connecting to Arduino on {SERIAL_PORT}...")

try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
    time.sleep(2)  # Wait for Arduino to reset after serial connect
    print("Connected!")
except Exception as e:
    print(f"Could not open serial port: {e}")
    exit(1)

while True:
    try:
        line = ser.readline().decode("utf-8").strip()

        if not line or not line.startswith("{"):
            continue

        data = json.loads(line)

        if "weight" in data:
            weight = data["weight"]
            print(f"Weight read: {weight}g")

            # Push to Flask
            requests.post(FLASK_URL, json={"weight": weight})

    except json.JSONDecodeError:
        pass  # Skip malformed lines
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(1)