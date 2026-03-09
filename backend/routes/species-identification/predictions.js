const express = require("express");
const router = express.Router();
const SeaweedPrediction = require("../../models/SeaweedPrediction");

// Save a prediction result
router.post("/save", async (req, res) => {
  try {
    const record = new SeaweedPrediction(req.body);
    await record.save();
    res.json({ success: true, id: record._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get prediction history for a farmer
router.get("/history/:farmerId", async (req, res) => {
  try {
    const records = await SeaweedPrediction.find({ farmerId: req.params.farmerId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
