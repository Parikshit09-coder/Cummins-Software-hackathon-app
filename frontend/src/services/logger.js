import API from "./api";

export const logEvent = async ({
  alert_type,
  severity = "info",
  service = "frontend",
  message,
  metadata = {},
}) => {
  const log = {
    timestamp: new Date().toISOString(),
    alert_type,
    severity,
    service,
    message,
    metadata,
  };

  console.log("📊 FRONTEND LOG:", log);

  try {
    await API.post("/logs", log);
  } catch (err) {
    console.error("❌ Failed to send log");
  }
};