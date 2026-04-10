const express = require("express");
const router = express.Router();

// Allow external modification of health status globally
global.isHealthy = true;

// 1. Crash the application process
router.get("/crash", (req, res) => {
  console.log("🚨 CHAOS: Intentional Crash Triggered - process.exit(1)");
  res.json({ message: "Crashing the pod..." });
  setTimeout(() => {
    process.exit(1);
  }, 500); // Small delay to allow response to send
});

// 2. Trigger an Out of Memory (OOM) leak
let memoryLeakArray = [];
router.get("/oom", (req, res) => {
  console.log("🚨 CHAOS: Memory Leak Triggered");
  res.json({ message: "Triggering memory leak... pod will be OOMKilled" });
  
  // Asynchronously leak memory infinitely until it hits k8s limits
  const leakMemory = () => {
    for (let i = 0; i < 10000; i++) {
        memoryLeakArray.push(new Array(1000).join("CHAOS_MEMORY_LEAK_STRING_DATA_"));
    }
    setTimeout(leakMemory, 50);
  };
  leakMemory();
});

// 3. Trigger CPU Freeze (Blocks event loop)
router.get("/freeze", (req, res) => {
  console.log("🚨 CHAOS: CPU Loop Triggered - Event loop frozen");
  // Cannot send response after freeze, so send it first
  res.json({ message: "Event loop frozen, liveness probe will timeout" });
  
  setTimeout(() => {
    while (true) {
      // Synchronous infinite loop blocking Node's single thread
    }
  }, 100);
});

// 4. Fail Liveness Probe 
router.get("/fail-health", (req, res) => {
  global.isHealthy = false;
  console.log("🚨 CHAOS: Health check set to fail. Liveness probe will timeout.");
  res.json({ message: "Health endpoint will now return 500" });
});

// 5. Simulate 500 Internal Server Error
router.get("/500", (req, res) => {
  console.log("🚨 ERROR 500: Database connection lost. Cannot reach MongoDB Atlas.");
  res.status(500).json({ error: "Internal Server Error" });
});

// 6. Simulate 400 Bad Request Error
router.get("/400", (req, res) => {
  console.log("🚨 ERROR 400: Validation failed. 'price' field must be a number.");
  res.status(400).json({ error: "Bad Request" });
});

// 7. Throw explicit ReferenceError for AI debugging
router.get("/reference-error", (req, res) => {
  try {
    // Intentionally call an undefined variable
    const result = someUndefinedVariable + 1;
  } catch (err) {
    console.error(`🚨 FATAL RUNTIME ERROR: ${err.stack}`);
    res.status(500).json({ error: "App crashed due to ReferenceError" });
  }
});

// 8. Throw explicit TypeError for AI debugging
router.get("/type-error", (req, res) => {
  try {
    // Intentionally read property of null
    const user = null;
    const name = user.firstName;
  } catch (err) {
    console.error(`🚨 FATAL RUNTIME ERROR: ${err.stack}`);
    res.status(500).json({ error: "App crashed due to TypeError" });
  }
});

// 9. Simulate a Massive Traffic Spike (20,000 requests)
router.get("/traffic-spike", (req, res) => {
  console.log("⚠️ WARNING: Sudden traffic spike detected! Incoming requests: 20,000/sec.");
  console.log("📈 CRITICAL: CPU usage threshold exceeded due to heavy concurrent load!");
  
  // Actually burn CPU to make the k8s metrics spike so the AI detects it
  let result = 0;
  for (let i = 0; i < 5000000000; i++) {
    result += Math.sqrt(i);
  }
  
  res.json({ message: "Traffic spike simulation complete." });
});

module.exports = router;
