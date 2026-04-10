require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const connectDB = require("./config/db");
const logger    = require("./middleware/logger");  // ← enhanced logger

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use(logger);                                   // ← attach before all routes

app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/logs",     require("./routes/logRoutes"));

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Catch-all 404 (triggers service_down detection in logger)
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler — sets res.locals.errorMessage so logger can capture it
app.use((err, req, res, next) => {
  res.locals.errorMessage = err.message;
  console.error("💥 Unhandled error:", err.message);
  res.status(500).json({ error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Logs → backend/logs/csv/  and  backend/logs/json/`);
});
