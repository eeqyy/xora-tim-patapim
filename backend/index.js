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
const masteryRoutes = require("./routes/mastery");
const profileRoutes = require("./routes/profile");
const learningPathRoutes = require("./routes/learningPath");
const gapRoutes = require("./routes/gaps");
const diagnosticRoutes = require("./routes/diagnostics");

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
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
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/learning-path", learningPathRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/levels", levelRoutes);
app.use("/api/topics", topicRoutes);
app.use("/api/concepts", conceptRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/mastery", masteryRoutes);
app.use("/api/gaps", gapRoutes);
app.use("/api/diagnostics", diagnosticRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend Xora berjalan di http://localhost:${PORT}`);
});