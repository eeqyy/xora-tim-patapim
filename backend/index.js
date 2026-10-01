require("dotenv").config();

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(503).json({
      status: "degraded",
      database: "disconnected",
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend Xora berjalan di http://localhost:${PORT}`);
});