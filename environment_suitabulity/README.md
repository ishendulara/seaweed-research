# SEAWEED SMART FARMING PLATFORM

Full-stack IoT web platform for monitoring seaweed farming tanks (Temperature, pH, TDS, Light) with real-time dashboard updates and environmental suitability recommendations.

## Project structure

```
seaweed-platform/
  client/   # React (Vite) + Tailwind + Chart.js + Gauges + Socket.io client
  server/   # Node.js + Express + MongoDB + Socket.io
  esp32/    # ESP32 Arduino sketch (HTTP POST every 5 seconds)
```

## Backend API

- **POST** `/api/sensor-data`  
  Receives ESP32 sensor readings, saves to MongoDB, and broadcasts realtime updates via Socket.io.

- **GET** `/api/latest/:tankId`  
  Returns latest readings for a tank.

- **GET** `/api/history/:tankId`  
  Returns the last 24 hours of readings for a tank.

MongoDB collection: **`sensor_data`**

Fields: `tankId`, `temperature`, `ph`, `tds`, `light`, `timestamp`

## Realtime flow

Sensors (Temp, pH, TDS, Light) → ESP32 → **HTTP POST** → Node/Express → MongoDB → Socket.io → React dashboard

## Installation guide

### 1) Install Node.js

- Install **Node.js LTS** (includes npm) from the official website.
- Verify:

```bash
node -v
npm -v
```

### 2) Start MongoDB

Use either:
- **Local MongoDB** (install MongoDB Community Server), or
- **MongoDB Atlas** (cloud)

You will need a MongoDB connection string for the server.

### 3) Run backend (`server`)

```bash
cd seaweed-platform/server
npm install
cp .env.example .env
npm run dev
```

Server defaults:
- API: `http://localhost:4000`
- Socket.io: `ws://localhost:4000`

Required `.env` values:
- **`MONGODB_URI`**: Mongo connection string
- **`CLIENT_ORIGIN`**: should match your frontend URL (`http://localhost:5173`)

### 4) Run frontend (`client`)

```bash
cd seaweed-platform/client
npm install
cp .env.example .env
npm run dev
```

Frontend defaults:
- `http://localhost:5173`

### 5) ESP32 setup (`esp32`)

1. Open `esp32/seaweed_esp32/seaweed_esp32.ino` in Arduino IDE.
2. Install the ESP32 board support in Arduino IDE.
3. Update in the sketch:
   - WiFi SSID + password
   - Backend URL (use your **PC LAN IP** + server port, not `localhost`)
   - Tank ID (`TankA`, `TankB`, `TankC`)
4. Flash to ESP32.

### 6) Test end-to-end

1. Start MongoDB
2. Start server
3. Start client
4. Power ESP32
5. Open the dashboard and confirm gauges update every 5 seconds

Tip: you can also test with curl:

```bash
curl -X POST http://localhost:4000/api/sensor-data ^
  -H "Content-Type: application/json" ^
  -d "{\"tankId\":\"TankA\",\"temperature\":28,\"ph\":7.8,\"tds\":350,\"light\":5500}"
```

## Notes

- **Realtime updates**: the React dashboard listens for Socket.io event `sensorData` and updates the selected tank instantly.
- **Gauge hover tooltips**: each gauge shows 24h min/max from `/api/history/:tankId`.

