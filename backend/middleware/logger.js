const fs    = require("fs");
const path  = require("path");
const http  = require("http");
const { v4: uuidv4 } = require("uuid");

// ─── directories (hourly CSV stays — useful for offline/backup) ──────────────
const CSV_DIR = path.join(__dirname, "../logs/csv");
if (!fs.existsSync(CSV_DIR)) fs.mkdirSync(CSV_DIR, { recursive: true });

const CSV_HEADER = [
  "timestamp","alert_type","severity","service",
  "incident_id","action_taken","resolution_status",
  "method","endpoint","status_code","response_time_ms",
  "source","log_owner","error_message","requires_fix","fix_type",
  "environment","host","ip_address","user_agent","request_size_bytes",
  "trace_id","span_id",
].join(",");

function hourlyCSV() {
  const now = new Date();
  const tag = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`
            + `-${String(now.getDate()).padStart(2,"0")}`
            + `-${String(now.getHours()).padStart(2,"0")}`;
  const file = path.join(CSV_DIR, `logs-${tag}.csv`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, CSV_HEADER + "\n", "utf8");
  return file;
}

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return s.includes(",") || s.includes('"') ? `"${s.replace(/"/g,'""')}"` : s;
}

// ─── scenario detection ───────────────────────────────────────────────────────
const _failWindow = {};

function detectScenario(statusCode, responseTimeMs, service) {
  if (statusCode >= 500) {
    const now = Date.now();
    _failWindow[service] = (_failWindow[service] || []).filter(t => now - t < 60_000);
    _failWindow[service].push(now);
    if (_failWindow[service].length >= 3)
      return { alert_type: "repeated_failure", severity: "critical" };
  }
  if (statusCode === 503) return { alert_type: "service_down",  severity: "critical" };
  if (statusCode === 507) return { alert_type: "disk_full",     severity: "critical" };
  if (statusCode >= 500)  return { alert_type: "api_failure",   severity: "critical" };
  if (responseTimeMs > 2000) return { alert_type: "high_cpu",   severity: "warning"  };
  return { alert_type: "none", severity: "info" };
}

function deriveIncident(alert_type) {
  if (alert_type === "none")
    return { incident_id: null, action_taken: null, resolution_status: "none" };
  const actions = {
    high_cpu: "restart_service", disk_full: "cleanup_logs",
    api_failure: "switch_fallback", service_down: "restart_service",
    repeated_failure: "escalate",
  };
  return {
    incident_id:       `INC-${Date.now()}-${uuidv4().slice(0,6).toUpperCase()}`,
    action_taken:      actions[alert_type] || null,
    resolution_status: "pending",
  };
}

// ─── OpenTelemetry OTLP/HTTP export ──────────────────────────────────────────
// Sends one log record to the OTel Collector at localhost:4318.
// The collector forwards it to Loki with the right labels.

const OTEL_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || "http://localhost:4318";

function toOtlpBody(entry) {
  // OTLP Logs data model (JSON encoding)
  // Docs: https://opentelemetry.io/docs/specs/otlp/#logs
  return JSON.stringify({
    resourceLogs: [{
      resource: {
        attributes: [
          { key: "service.name",        value: { stringValue: entry.service } },
          { key: "app",                 value: { stringValue: "ecommerce-backend" } },
          { key: "team",                value: { stringValue: entry.log_owner } },
          { key: "deployment.environment", value: { stringValue: entry.environment } },
        ]
      },
      scopeLogs: [{
        scope: { name: "express-logger", version: "1.0.0" },
        logRecords: [{
          timeUnixNano: String(Date.now() * 1_000_000),
          severityText: entry.severity.toUpperCase(),
          severityNumber: entry.severity === "critical" ? 17
                        : entry.severity === "warning"  ? 13 : 9,
          traceId: entry.trace_id,
          spanId:  entry.span_id,
          // The full log entry goes in the body
          body: { stringValue: JSON.stringify(entry) },
          // Key fields also as structured attributes so Loki can label them
          attributes: [
            { key: "alert_type",        value: { stringValue: entry.alert_type } },
            { key: "severity",          value: { stringValue: entry.severity } },
            { key: "service",           value: { stringValue: entry.service } },
            { key: "log_owner",         value: { stringValue: entry.log_owner } },
            { key: "status_code",       value: { intValue: entry.status_code } },
            { key: "method",            value: { stringValue: entry.method } },
            { key: "endpoint",          value: { stringValue: entry.endpoint } },
            { key: "response_time_ms",  value: { intValue: entry.response_time_ms } },
            { key: "incident_id",       value: { stringValue: entry.incident_id || "" } },
            { key: "action_taken",      value: { stringValue: entry.action_taken || "" } },
            { key: "resolution_status", value: { stringValue: entry.resolution_status } },
            { key: "source",            value: { stringValue: entry.source } },
            { key: "requires_fix",      value: { boolValue: entry.requires_fix } },
            { key: "error_message",     value: { stringValue: entry.error_message || "" } },
            { key: "trace_id",          value: { stringValue: entry.trace_id } },
            { key: "span_id",           value: { stringValue: entry.span_id } },
          ],
        }]
      }]
    }]
  });
}

function sendToOtel(entry) {
  const body    = toOtlpBody(entry);
  const url     = new URL("/v1/logs", OTEL_ENDPOINT);
  const options = {
    hostname: url.hostname,
    port:     url.port || 4318,
    path:     url.pathname,
    method:   "POST",
    headers: {
      "Content-Type":   "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
  };

  const req = http.request(options, (res) => {
    if (res.statusCode !== 200) {
      res.resume();
      // silent — don't crash the app if collector is down
    }
  });
  req.on("error", () => {}); // collector might not be running locally yet
  req.write(body);
  req.end();
}

// ─── main middleware ──────────────────────────────────────────────────────────
const logger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const responseTimeMs = Date.now() - start;
    const statusCode     = res.statusCode;
    const service        = (req.originalUrl.split("/")[2]) || "gateway";

    const { alert_type, severity }                       = detectScenario(statusCode, responseTimeMs, service);
    const { incident_id, action_taken, resolution_status } = deriveIncident(alert_type);

    const entry = {
      // ── problem statement fields ──
      timestamp:          new Date().toISOString(),
      alert_type,
      severity,
      service,
      // ── incident fields ──
      incident_id,
      action_taken,
      resolution_status,
      // ── HTTP context ──
      method:             req.method,
      endpoint:           req.originalUrl,
      status_code:        statusCode,
      response_time_ms:   responseTimeMs,
      // ── AI classification ──
      source:             "backend",
      log_owner:          "team_a",
      error_message:      statusCode >= 400 ? (res.locals.errorMessage || null) : null,
      requires_fix:       false,
      fix_type:           null,
      // ── environment ──
      environment:        process.env.NODE_ENV || "development",
      host:               req.hostname,
      ip_address:         req.ip || null,
      user_agent:         req.headers["user-agent"] || null,
      request_size_bytes: parseInt(req.headers["content-length"] || "0", 10),
      // ── OpenTelemetry ──
      trace_id:           req.headers["traceparent"]?.split("-")[1] || uuidv4().replace(/-/g,""),
      span_id:            uuidv4().replace(/-/g,"").slice(0,16),
    };

    // 1. Send to OTel Collector → Loki (primary)
    sendToOtel(entry);

    // 2. Write to hourly CSV (backup / offline use)
    const csvRow = Object.values(entry).map(csvEscape).join(",") + "\n";
    fs.appendFileSync(hourlyCSV(), csvRow, "utf8");

    // 3. Console
    const icon = statusCode >= 500 ? "🔴" : statusCode >= 400 ? "🟡" : "🟢";
    console.log(`${icon} ${req.method} ${req.originalUrl} → ${statusCode} (${responseTimeMs}ms) | ${alert_type} | ${service}`);
    if (alert_type !== "none")
      console.warn(`⚠️  INCIDENT ${incident_id} | action: ${action_taken}`);
  });

  next();
};

module.exports = logger;
