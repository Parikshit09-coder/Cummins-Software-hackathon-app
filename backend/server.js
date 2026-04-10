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

const VERSION = "1.1.0";
app.get("/health", (req, res) => {
  res.json({ status: "OK", version: VERSION });
});

app.listen(5000, () => {
  console.log("🚀 Server running on port 5000");
  // linked by aider
});
// Testing Solution 2
