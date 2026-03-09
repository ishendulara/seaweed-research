const mongoose = require("mongoose");

const SeaweedPredictionSchema = new mongoose.Schema({
  farmerId:        { type: String, required: true, index: true },
  imageFilename:   { type: String, required: true },
  date:            { type: String, required: true },
  // Type model result
  speciesLabel:    { type: String },
  speciesConf:     { type: Number },
  speciesRejected: { type: Boolean },
  // Health model result
  healthLabel:     { type: String },
  healthStatus:    { type: String },
  healthSpecies:   { type: String },
  healthConf:      { type: Number },
  healthRejected:  { type: Boolean },
}, { timestamps: true });

module.exports = mongoose.model("SeaweedPrediction", SeaweedPredictionSchema);
