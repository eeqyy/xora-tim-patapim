// ============================================================
// XORA — Recommendation Routes
// backend/routes/recommendations.js
// ============================================================
// GET  /api/recommendations            -> daftar action aktif learner login
// GET  /api/recommendations/next       -> action berikutnya (paling prioritas)
// POST /api/recommendations/:id/start  -> mulai action (diagnostic / practice)
// GET  /api/recommendations/:id/materials -> materi relevan untuk action
// POST /api/recommendations/:id/complete -> tandai selesai
// POST /api/recommendations/:id/skip   -> lewati
// ============================================================

const express = require("express");
const router = express.Router();
const recommendationService = require("../services/recommendationService");
const { requireAuth } = require("../middleware/auth");
const { sendError } = require("../utils/errors");

router.use(requireAuth);

// GET /api/recommendations
router.get("/", async (req, res) => {
  try {
    const data = await recommendationService.listForLearner(req.user.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/recommendations ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/recommendations/next
router.get("/next", async (req, res) => {
  try {
    const data = await recommendationService.getNextStep(req.user.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/recommendations/next ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/recommendations/:id/start
router.post("/:id/start", async (req, res) => {
  try {
    const data = await recommendationService.startAction(req.user.id, req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/recommendations/:id/start ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/recommendations/:id/materials
router.get("/:id/materials", async (req, res) => {
  try {
    const data = await recommendationService.getMaterialsForAction(
      req.user.id,
      req.params.id
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/recommendations/:id/materials ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/recommendations/:id/complete
router.post("/:id/complete", async (req, res) => {
  try {
    const data = await recommendationService.completeAction(req.user.id, req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/recommendations/:id/complete ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/recommendations/:id/skip
router.post("/:id/skip", async (req, res) => {
  try {
    const data = await recommendationService.skipAction(req.user.id, req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/recommendations/:id/skip ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
