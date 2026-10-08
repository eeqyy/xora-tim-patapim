// ============================================================
// XORA — Assessment Routes
// backend/routes/assessments.js
// ============================================================

const express = require("express");
const router = express.Router();
const assessmentService = require("../services/assessmentService");
const authMiddleware = require("../middlewares/authMiddleware");

// Semua route assessment mewajibkan autentikasi learner
router.use(authMiddleware);

// GET /api/assessments
router.get("/", async (req, res) => {
  try {
    const assessments = await assessmentService.getAll(req.query);
    res.json({ status: "ok", data: assessments });
  } catch (error) {
    console.error("GET /api/assessments ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// GET /api/assessments/attempts/:attemptId - Ambil data / hasil attempt
router.get("/attempts/:attemptId", async (req, res) => {
  try {
    const attempt = await assessmentService.getAttemptById(req.user.id, req.params.attemptId);
    res.json({ status: "ok", data: attempt });
  } catch (error) {
    console.error("GET /api/assessments/attempts/:attemptId ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// POST /api/assessments/attempts/:attemptId/submit - Submit attempt
router.post("/attempts/:attemptId/submit", async (req, res) => {
  try {
    const result = await assessmentService.submitAttempt(req.user.id, req.params.attemptId, req.body.answers);
    res.json({ status: "ok", data: result });
  } catch (error) {
    console.error("POST /api/assessments/attempts/:attemptId/submit ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// GET /api/assessments/:id
router.get("/:id", async (req, res) => {
  try {
    const assessment = await assessmentService.getById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ status: "error", message: "Assessment not found" });
    }
    res.json({ status: "ok", data: assessment });
  } catch (error) {
    console.error("GET /api/assessments/:id ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// GET /api/assessments/:id/questions - Pertanyaan yang aman (tanpa bocoran kunci jawaban)
router.get("/:id/questions", async (req, res) => {
  try {
    const assessment = await assessmentService.getById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ status: "error", message: "Assessment not found" });
    }
    const questions = await assessmentService.getQuestionsByAssessmentId(req.params.id);
    res.json({ status: "ok", data: questions });
  } catch (error) {
    console.error("GET /api/assessments/:id/questions ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// POST /api/assessments/:id/attempts - Memulai attempt baru
router.post("/:id/attempts", async (req, res) => {
  try {
    const attempt = await assessmentService.createAttempt(req.user.id, req.params.id);
    res.status(201).json({ status: "ok", data: attempt });
  } catch (error) {
    console.error("POST /api/assessments/:id/attempts ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
