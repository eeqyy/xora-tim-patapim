// ============================================================
// XORA — Learning Path Routes
// backend/routes/learningPath.js
// ============================================================

const express = require("express");
const router = express.Router();
const learningPathService = require("../services/learningPathService");
const { requireAuth } = require("../middleware/auth");

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

    const data = await learningPathService.getLearningPathBySubjectId(subjectId);
    return res.json({
      status: "ok",
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }

    console.error("GET /api/learning-path ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal pada server saat memuat alur belajar",
    });
  }
});

// GET /api/learning-path/:subjectId (Get learning path for specific subject)
router.get("/:subjectId", async (req, res) => {
  try {
    const { subjectId } = req.params;
    const data = await learningPathService.getLearningPathBySubjectId(subjectId);
    return res.json({
      status: "ok",
      data,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }

    console.error("GET /api/learning-path/:subjectId ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal pada server saat memuat alur belajar",
    });
  }
});

module.exports = router;
