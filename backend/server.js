require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/logs", require("./routes/logRoutes"));
app.use("/api/chaos", require("./routes/chaosRoutes"));

app.get("/health", (req, res) => {
  if (global.isHealthy === false) {
    return res.status(500).json({ status: "FAIL", message: "Simulated health failure" });
  }
  res.json({ status: "OK" });
});

app.listen(process.env.PORT, () => {
  console.log("🚀 Server running on port 5000");
});