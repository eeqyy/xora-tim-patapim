const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const express = require("express");
const cors = require("cors");
const pool = require("./db");

// Import routes
const subjectRoutes = require("./routes/subjects");
const levelRoutes = require("./routes/levels");
const topicRoutes = require("./routes/topics");
const conceptRoutes = require("./routes/concepts");
const assessmentRoutes = require("./routes/assessments");
const authRoutes = require("./routes/auth");
const attemptRoutes = require("./routes/attempts");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("DATABASE ERROR:", error);

    res.status(503).json({
      status: "degraded",
      database: "disconnected",
      message: error.message || String(error),
    });
  }
});

// API routes
app.use("/api/subjects", subjectRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/concepts", conceptRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attempts", attemptRoutes);

app.listen(PORT, () => {
  console.log(`Backend Xora berjalan di http://localhost:${PORT}`);
});