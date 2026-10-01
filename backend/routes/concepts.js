// ============================================================
// XORA — Concept Routes
// backend/routes/concepts.js
// ============================================================

const express = require("express");
const router = express.Router();
const conceptService = require("../services/conceptService");

// GET /api/concepts
router.get("/", async (req, res) => {
  try {
    const concepts = await conceptService.getAll();
    res.json({ status: "ok", data: concepts });
  } catch (error) {
    console.error("GET /api/concepts ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/concepts/:id
router.get("/:id", async (req, res) => {
  try {
    const concept = await conceptService.getById(req.params.id);
    if (!concept) {
      return res.status(404).json({ status: "error", message: "Concept not found" });
    }
    res.json({ status: "ok", data: concept });
  } catch (error) {
    console.error("GET /api/concepts/:id ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/concepts/:id/prerequisites
router.get("/:id/prerequisites", async (req, res) => {
  try {
    const prerequisites = await conceptService.getPrerequisites(req.params.id);
    res.json({ status: "ok", data: prerequisites });
  } catch (error) {
    console.error("GET /api/concepts/:id/prerequisites ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
