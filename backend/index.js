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
const recommendationRoutes = require("./routes/recommendations");
const practiceRoutes = require("./routes/practices");
const historyRoutes = require("./routes/history");
const aiRoutes = require("./routes/ai");
const adminRoutes = require("./routes/admin");
const adminAiRoutes = require("./routes/adminAi");
const { notFound, sendError } = require("./utils/errors");
const app = express();
const PORT = process.env.PORT || 5001;

// Origin tegas: daftar bawaan + CLIENT_URL (boleh beberapa, pisahkan dengan koma).
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  ...String(process.env.CLIENT_URL || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
].filter(Boolean);

// Origin lokal apa pun (port berapa saja) — supaya port dev yang bergeser
// (mis. Vite naik otomatis ke 5174/5175) tetap bisa akses backend.
const localOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

app.use(
  cors({
    origin(origin, callback) {
      // Tanpa origin (curl/Postman/same-origin) → izinkan.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || localOriginPattern.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
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
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/practices", practiceRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/ai", aiRoutes);
// Mount AI admin SEBELUM adminRoutes agar /api/admin/ai tidak melewati
// guard admin umum (keduanya aman, ini hanya menghindari kerja ganda).
app.use("/api/admin/ai", adminAiRoutes);
app.use("/api/admin", adminRoutes);

// 404 — endpoint API yang tidak dikenal (bukan HTML default Express).
app.use((req, res) =>
  sendError(res, notFound(`Endpoint tidak ditemukan: ${req.method} ${req.originalUrl}`))
);

// Error handler terpusat — menjaga bentuk respons { status: "error", message }
// dan mencegah stack trace bocor ke client.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => sendError(res, err));

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend Xolearn berjalan di http://localhost:${PORT}`);
});