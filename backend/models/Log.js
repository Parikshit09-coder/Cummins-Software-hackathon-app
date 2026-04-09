const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  timestamp: String,
  alert_type: String,
  severity: String,
  service: String,
  message: String,
  metadata: Object,
});

module.exports = mongoose.model("Log", logSchema);