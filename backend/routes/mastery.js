// ============================================================
// XORA — Mastery Routes
// backend/routes/mastery.js
// ============================================================
// GET /api/mastery                 -> summary seluruh konsep learner login
// GET /api/mastery/concepts/:id     -> detail mastery satu konsep
// ============================================================

const express = require("express");
const router = express.Router();
const masteryService = require("../services/masteryService");
const { requireAuth } = require("../middleware/auth");
const { notFound, sendError } = require("../utils/errors");

router.use(requireAuth);

// GET /api/mastery
router.get("/", async (req, res) => {
  try {
    const data = await masteryService.summary(req.user.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/mastery ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/mastery/concepts/:conceptId
router.get("/concepts/:conceptId", async (req, res) => {
  try {
    const data = await masteryService.getOne(req.user.id, req.params.conceptId);
    if (!data) throw notFound("Concept not found or no mastery data");
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/mastery/concepts/:id ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
