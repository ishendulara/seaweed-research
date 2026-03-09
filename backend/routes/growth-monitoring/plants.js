// backend\routes\growth-monitoring\plants.js
const express = require('express');
const router  = express.Router();
const PlantRecord = require('../../models/growth-monitoring/PlantRecord');

// GET all plant IDs for a farmer
router.get('/ids/:farmerId', async (req, res) => {
  try {
    const ids = await PlantRecord.distinct('plantId',
      { farmerId: req.params.farmerId });
    res.json(ids);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET history for a specific plant ID
router.get('/history/:plantId', async (req, res) => {
  try {
    const records = await PlantRecord
      .find({ plantId: req.params.plantId })
      .sort({ createdAt: -1 });
    res.json(records);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST save a new growth record
router.post('/save', async (req, res) => {
  try {
    const record = new PlantRecord(req.body);
    await record.save();
    res.json({ success: true, record });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
