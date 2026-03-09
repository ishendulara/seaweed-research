import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { Server as SocketIOServer } from "socket.io";
import { connectDb } from "./db.js";
import { createSensorDataRouter } from "./routes/sensorData.js";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const MONGODB_URI = process.env.MONGODB_URI || "";
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

if (!MONGODB_URI) {
  console.error("Missing MONGODB_URI. Copy .env.example to .env and set it.");
  process.exit(1);
}

await connectDb(MONGODB_URI);

const app = express();
app.use(helmet());


app.use(
  cors({
    origin: "*", // Allow all origins for IoT devices
    credentials: true
  })
);

app.use(express.json({ limit: "256kb" }));

const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: { origin: "*", credentials: true }
});

io.on("connection", (socket) => {
  socket.emit("hello", { ok: true });
});

app.get("/health", (_req, res) => res.json({ ok: true }));


app.use("/api", createSensorDataRouter({ io }));

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
  console.log(`Connect ESP32 to: http://172.20.10.3:${PORT}/api/sensor-data`);
});