const express = require("express");
const router = express.Router();
const aiService = require("../services/aiService");
const { requireAuth } = require("../middleware/auth");
const { sendError } = require("../utils/errors");

router.post("/analyze", requireAuth, async (req, res) => {
  try {
    const { concept_id } = req.body || {};
    const result = await aiService.analyzeEvidence(
      req.user.id,
      concept_id ? { conceptId: concept_id } : undefined
    );
    res.json({ status: "ok", data: result });
  } catch (error) {
    console.error("POST /api/ai/analyze ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
