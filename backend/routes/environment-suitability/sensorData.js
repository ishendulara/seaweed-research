const express = require('express');
const router = express.Router();
const SensorData = require('../../models/SensorData');

// Valid tank IDs
const VALID_TANKS = ['TankA', 'TankB', 'TankC'];

function validateSensorInput(body) {
  const { tankId, temperature, ph, tds, light } = body;
  const errors = [];

  if (!tankId || !VALID_TANKS.includes(tankId)) {
    errors.push('tankId must be one of: TankA, TankB, TankC');
  }
  if (typeof temperature !== 'number' || !Number.isFinite(temperature)) {
    errors.push('temperature must be a finite number');
  }
  if (typeof ph !== 'number' || !Number.isFinite(ph)) {
    errors.push('ph must be a finite number');
  }
  if (typeof tds !== 'number' || !Number.isFinite(tds)) {
    errors.push('tds must be a finite number');
  }
  if (typeof light !== 'number' || !Number.isFinite(light)) {
    errors.push('light must be a finite number');
  }

  return errors;
}

// This function creates the router with io (socket.io) injected
function createSensorDataRouter(io) {
  // POST /api/sensor-data - receive sensor readings
  router.post('/', async (req, res) => {
    try {
      const errors = validateSensorInput(req.body);
      if (errors.length > 0) {
        return res.status(400).json({ error: 'Invalid payload', details: errors });
      }

      const { tankId, temperature, ph, tds, light } = req.body;
      const doc = await SensorData.create({
        tankId,
        temperature,
        ph,
        tds,
        light,
        timestamp: new Date()
      });

      // Emit real-time event to all connected clients
      if (io) {
        io.emit('sensorData', {
          _id: doc._id.toString(),
          tankId: doc.tankId,
          temperature: doc.temperature,
          ph: doc.ph,
          tds: doc.tds,
          light: doc.light,
          timestamp: doc.timestamp.toISOString()
        });
      }

      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error('Sensor data error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/sensor-data/latest/:tankId - get latest reading for a tank
  router.get('/latest/:tankId', async (req, res) => {
    try {
      const { tankId } = req.params;
      const doc = await SensorData.findOne({ tankId }).sort({ timestamp: -1 });
      if (!doc) return res.status(404).json({ error: 'No data' });
      return res.json({
        tankId: doc.tankId,
        temperature: doc.temperature,
        ph: doc.ph,
        tds: doc.tds,
        light: doc.light,
        timestamp: doc.timestamp.toISOString()
      });
    } catch (err) {
      console.error('Latest data error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/sensor-data/history/:tankId - get 24h history for a tank
  router.get('/history/:tankId', async (req, res) => {
    try {
      const { tankId } = req.params;
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const docs = await SensorData.find({ tankId, timestamp: { $gte: since } })
        .sort({ timestamp: 1 })
        .limit(86400);

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
    } catch (err) {
      console.error('History data error:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}

module.exports = createSensorDataRouter;
