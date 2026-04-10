const express = require("express");
const router = express.Router();
const Log = require("../models/Log");

// STORE LOG
router.post("/", async (req, res) => {
  try {
    const log = await Log.create(req.body);

    // Log a clean string with just the important bits
    console.log(`📊 STORED LOG: [${log.alert_type}] ${log.message}`);

    // SIMPLE INCIDENT DETECTION
    if (log.alert_type === "api_failure") {
      console.log("🚨 INCIDENT DETECTED: API FAILURE");
    }

    res.json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET LOGS
router.get("/", async (req, res) => {
  const logs = await Log.find().sort({ timestamp: -1 });
  res.json(logs);
});

module.exports = router;