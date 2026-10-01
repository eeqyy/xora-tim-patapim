// ============================================================
// XORA — Assessment Routes
// backend/routes/assessments.js
// ============================================================

const express = require("express");
const router = express.Router();
const assessmentService = require("../services/assessmentService");

// GET /api/assessments
router.get("/", async (req, res) => {
  try {
    const assessments = await assessmentService.getAll();
    res.json({ status: "ok", data: assessments });
  } catch (error) {
    console.error("GET /api/assessments ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
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
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/assessments/:id/questions
router.get("/:id/questions", async (req, res) => {
  try {
    const questions = await assessmentService.getQuestionsByAssessmentId(req.params.id);
    res.json({ status: "ok", data: questions });
  } catch (error) {
    console.error("GET /api/assessments/:id/questions ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
