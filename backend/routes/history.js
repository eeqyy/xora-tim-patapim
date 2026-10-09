// ============================================================
// XORA — Learning History Routes
// backend/routes/history.js
// ============================================================
// GET /api/history -> ambil riwayat belajar (timeline events & metrics)
// ============================================================

const express = require("express");
const router = express.Router();
const historyService = require("../services/historyService");
const { requireAuth } = require("../middleware/auth");
const { sendError } = require("../utils/errors");

router.use(requireAuth);

// GET /api/history
router.get("/", async (req, res) => {
  try {
    const { limit, offset, eventType } = req.query;
    const data = await historyService.getLearnerHistory(req.user.id, {
      limit,
      offset,
      eventType,
    });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/history ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
