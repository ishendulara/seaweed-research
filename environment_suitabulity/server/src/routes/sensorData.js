import express from "express";
import { SensorData } from "../models/SensorData.js";
import { SensorDataInput } from "../validation.js";

export function createSensorDataRouter({ io }) {
  const router = express.Router();

  router.post("/sensor-data", async (req, res) => {
    try {
      const parsed = SensorDataInput.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid payload",
          details: parsed.error.flatten()
        });
      }

      const doc = await SensorData.create({
        ...parsed.data,
        timestamp: new Date()
      });

      io.emit("sensorData", {
        _id: doc._id.toString(),
        tankId: doc.tankId,
        temperature: doc.temperature,
        ph: doc.ph,
        tds: doc.tds,
        light: doc.light,
        timestamp: doc.timestamp.toISOString()
      });

      return res.status(201).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: "Server error" });
    }
  });

  router.get("/latest/:tankId", async (req, res) => {
    const { tankId } = req.params;
    const doc = await SensorData.findOne({ tankId }).sort({ timestamp: -1 });
    if (!doc) return res.status(404).json({ error: "No data" });
    return res.json({
      tankId: doc.tankId,
      temperature: doc.temperature,
      ph: doc.ph,
      tds: doc.tds,
      light: doc.light,
      timestamp: doc.timestamp.toISOString()
    });
  });

  router.get("/history/:tankId", async (req, res) => {
    const { tankId } = req.params;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const docs = await SensorData.find({ tankId, timestamp: { $gte: since } })
      .sort({ timestamp: 1 })
      .limit(24 * 60 * 60); // defensive upper bound

    return res.json(
      docs.map((d) => ({
        tankId: d.tankId,
        temperature: d.temperature,
        ph: d.ph,
        tds: d.tds,
        light: d.light,
        timestamp: d.timestamp.toISOString()
      }))
    );
  });

  return router;
}

