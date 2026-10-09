// ============================================================
// XORA — Diagnostic Routes
// backend/routes/diagnostics.js
// ============================================================
// GET  /api/diagnostics/:id              -> status diagnostic + verifikasi + action
// POST /api/diagnostics/:id/verify/start -> mulai/ lanjutkan attempt verifikasi
// ============================================================

const express = require("express");
const router = express.Router();
const gapService = require("../services/gapService");
const { requireAuth } = require("../middleware/auth");
const { sendError } = require("../utils/errors");

router.use(requireAuth);

// GET /api/diagnostics/:id
router.get("/:id", async (req, res) => {
  try {
    const data = await gapService.getDiagnostic(req.user.id, req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/diagnostics/:id ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/diagnostics/:id/verify/start
router.post("/:id/verify/start", async (req, res) => {
  try {
    const data = await gapService.startVerification(req.user.id, req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/diagnostics/:id/verify/start ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
