// \backend\models\growth-monitoring\PlantRecord.js
const mongoose = require('mongoose');

const PlantRecordSchema = new mongoose.Schema({
  plantId:      { type: String, required: true, index: true },
  farmerId:     { type: String, required: true },
  species:      { type: String, required: true },
  initialWeight:{ type: Number, required: true },
  startDay:     { type: Number, required: true },
  date:         { type: String, required: true },
  harvestDay:   { type: Number, default: null },
  harvestWeight:{ type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('PlantRecord', PlantRecordSchema);
