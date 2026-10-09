// ============================================================
// XORA — Gap Routes
// backend/routes/gaps.js
// ============================================================
// GET  /api/gaps                     -> daftar gap aktif learner login
// GET  /api/gaps/:conceptId          -> detail gap satu konsep
// POST /api/gaps/:conceptId/diagnose -> paksa jalankan deteksi/diagnosis
// ============================================================

const express = require("express");
const router = express.Router();
const gapService = require("../services/gapService");
const { requireAuth } = require("../middleware/auth");
const { sendError } = require("../utils/errors");

router.use(requireAuth);

// GET /api/gaps
router.get("/", async (req, res) => {
  try {
    const data = await gapService.getGapsForLearner(req.user.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/gaps ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/gaps/:conceptId
router.get("/:conceptId", async (req, res) => {
  try {
    const data = await gapService.getGapDetail(req.user.id, req.params.conceptId);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/gaps/:conceptId ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/gaps/:conceptId/diagnose
router.post("/:conceptId/diagnose", async (req, res) => {
  try {
    const data = await gapService.onPossibleGapDetected(
      req.user.id,
      req.params.conceptId
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/gaps/:conceptId/diagnose ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
