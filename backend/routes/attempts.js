// ============================================================
// XORA — Attempt Routes
// backend/routes/attempts.js
// ============================================================

const express = require("express");
const router = express.Router();
const assessmentService = require("../services/assessmentService");
const authMiddleware = require("../middlewares/authMiddleware");

router.use(authMiddleware);

// GET /api/attempts/:id - Mengambil hasil attempt
router.get("/:id", async (req, res) => {
  try {
    const attempt = await assessmentService.getAttemptById(req.user.id, req.params.id);
    res.json({ status: "ok", data: attempt });
  } catch (error) {
    console.error("GET /api/attempts/:id ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// POST /api/attempts/:id/submit - Submit attempt
router.post("/:id/submit", async (req, res) => {
  try {
    const result = await assessmentService.submitAttempt(req.user.id, req.params.id, req.body.answers);
    res.json({ status: "ok", data: result });
  } catch (error) {
    console.error("POST /api/attempts/:id/submit ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
