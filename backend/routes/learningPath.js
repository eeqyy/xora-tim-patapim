// ============================================================
// XORA — Learning Path Routes
// backend/routes/learningPath.js
// ============================================================

const express = require("express");
const router = express.Router();
const learningPathService = require("../services/learningPathService");
const { requireAuth } = require("../middleware/auth");
const { sendError } = require("../utils/errors");
// All Learning Path endpoints are read-only and require authentication
router.use(requireAuth);

// GET /api/learning-path (Resolves preferred or default subject's path)
router.get("/", async (req, res) => {
  try {
    const subjectId = await learningPathService.getDefaultSubjectId(req.user.id);
    if (!subjectId) {
      return res.json({
        status: "ok",
        data: null,
        message: "Belum ada subject pembelajaran yang tersedia",
      });
    }

    const data = await learningPathService.getLearningPathBySubjectId(subjectId, req.user.id);
    return res.json({
      status: "ok",
      data,
    });
  } catch (error) {
    console.error("GET /api/learning-path ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/learning-path/:subjectId (Get learning path for specific subject)
router.get("/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    const data = await learningPathService.getLearningPathBySubjectId(subjectId, req.user.id);
    return res.json({
      status: "ok",
      data,
    });
  } catch (error) {
    console.error("GET /api/learning-path/:subjectId ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
