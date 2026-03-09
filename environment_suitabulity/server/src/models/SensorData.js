import mongoose from "mongoose";

const SensorDataSchema = new mongoose.Schema(
  {
    tankId: { type: String, required: true, index: true },
    temperature: { type: Number, required: true },
    ph: { type: Number, required: true },
    tds: { type: Number, required: true },
    light: { type: Number, required: true },
    timestamp: { type: Date, required: true, index: true, default: Date.now }
  },
  { collection: "sensor_data" }
);

SensorDataSchema.index({ tankId: 1, timestamp: -1 });

export const SensorData =
  mongoose.models.SensorData || mongoose.model("SensorData", SensorDataSchema);

