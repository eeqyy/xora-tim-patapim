// ============================================================
// XORA — Admin Learning Path Routes
// backend/routes/adminLearningPaths.js
// ============================================================
// Semua endpoint butuh requireAuth + requireAdmin (satu kali untuk router).

const express = require("express");
const router = express.Router();
const adminLearningPathService = require("../services/adminLearningPathService");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { sendError } = require("../utils/errors");

router.use(requireAuth, requireAdmin);

// GET /api/admin/learning-paths?search=&status=
router.get("/", async (req, res) => {
  try {
    const data = await adminLearningPathService.listAll({
      search: req.query.search,
      status: req.query.status,
    });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/admin/learning-paths ERROR:", error);
    sendError(res, error);
  }
});

// PATCH /api/admin/learning-paths/:id/status
router.patch("/:id/status", async (req, res) => {
  try {
    const data = await adminLearningPathService.updateStatus(
      req.params.id,
      (req.body || {}).status
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PATCH /api/admin/learning-paths/:id/status ERROR:", error);
    sendError(res, error);
  }
});

// PATCH /api/admin/learning-paths/:id/current-level
router.patch("/:id/current-level", async (req, res) => {
  try {
    const data = await adminLearningPathService.updateCurrentLevel(
      req.params.id,
      (req.body || {}).levelId
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PATCH /api/admin/learning-paths/:id/current-level ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;