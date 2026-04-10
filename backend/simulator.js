/**
 * simulator.js
 * Run with:  node simulator.js
 *
 * Fires fake HTTP requests to the backend every few seconds so the logger
 * generates realistic log entries for all 5 problem-statement scenarios.
 *
 * Keep this running in a separate terminal while demoing.
 */

const http = require("http");

const BASE = "localhost";
const PORT = process.env.PORT || 5000;

// ─── request helper ───────────────────────────────────────────────────────────
function request(method, path, body = null, extraHeaders = {}) {
  return new Promise((resolve) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: BASE,
      port:     PORT,
      path,
      method,
      headers: {
        "Content-Type":   "application/json",
        "User-Agent":     "AIOps-Simulator/1.0",
        "x-trace-id":     Math.random().toString(16).slice(2, 34),
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
        ...extraHeaders,
      },
    };

    const req = http.request(options, (res) => {
      res.resume(); // drain
      resolve({ status: res.statusCode, path });
    });

    req.on("error", () => resolve({ status: 0, path }));
    req.setTimeout(8000, () => { req.destroy(); resolve({ status: 0, path }); });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

// ─── scenario definitions ─────────────────────────────────────────────────────
// Each scenario is a function that fires one or more requests.
// The backend logger will detect the pattern and tag it automatically.

const scenarios = {

  // Scenario 0 — Normal traffic (200)
  normal_browse: async () => {
    await request("GET", "/api/products");
    await request("GET", "/health");
  },

  // Scenario 0b — Normal POST
  normal_order: async () => {
    await request("POST", "/api/products", {
      name:  "Test Product",
      price: Math.round(Math.random() * 1000),
    });
  },

  // Scenario 1 — High CPU (slow response)
  // We can't really slow the server from here, so we fire a heavy payload
  // that causes the logger to see a long response time if the route delays.
  high_cpu: async () => {
    const bigBody = { name: "x".repeat(50_000), price: 1 };
    await request("POST", "/api/products", bigBody);
  },

  // Scenario 2 — Disk full (trigger 507 via special header; backend can check this)
  disk_full: async () => {
    await request("POST", "/api/products",
      { name: "disk-full-test", price: 0 },
      { "x-simulate": "disk_full" }
    );
  },

  // Scenario 3 — API failure (trigger 500 via bad data)
  api_failure: async () => {
    // Sending null price to trigger a validation / cast error
    await request("POST", "/api/products", { name: null, price: "not-a-number" });
  },

  // Scenario 4 — Service down (hit a non-existent route → 404/503)
  service_down: async () => {
    await request("GET", "/api/nonexistent-service/health",
      null,
      { "x-simulate": "service_down" }
    );
  },

  // Scenario 5 — Repeated failure (fire 3 bad requests quickly to same service)
  repeated_failure: async () => {
    for (let i = 0; i < 3; i++) {
      await request("DELETE", `/api/products/000000000000000000000000`); // invalid id
    }
  },
};

// ─── weighted probability table ────────────────────────────────────────────────
// Normal traffic is most common; failures happen occasionally.
const WEIGHTS = [
  { name: "normal_browse",   weight: 35 },
  { name: "normal_order",    weight: 25 },
  { name: "high_cpu",        weight: 10 },
  { name: "api_failure",     weight: 10 },
  { name: "disk_full",       weight:  7 },
  { name: "service_down",    weight:  8 },
  { name: "repeated_failure",weight:  5 },
];

function pickScenario() {
  const total = WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let rand = Math.random() * total;
  for (const w of WEIGHTS) {
    rand -= w.weight;
    if (rand <= 0) return w.name;
  }
  return "normal_browse";
}

// ─── loop ─────────────────────────────────────────────────────────────────────
const INTERVAL_MS = 2500; // fire a scenario every 2.5 seconds

console.log(`🚀 Simulator started — hitting http://${BASE}:${PORT} every ${INTERVAL_MS}ms`);
console.log("   Press Ctrl+C to stop.\n");

let count = 0;

setInterval(async () => {
  const name = pickScenario();
  count++;
  try {
    const results = await scenarios[name]();
    const statuses = [].concat(results).filter(Boolean).map((r) => r?.status).join(", ");
    console.log(`[${count}] scenario: ${name.padEnd(18)} → HTTP ${statuses || "fired"}`);
  } catch (err) {
    console.error(`[${count}] scenario: ${name} → ERROR:`, err.message);
  }
}, INTERVAL_MS);
