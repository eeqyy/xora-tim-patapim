// ============================================================
// XORA — Level Routes
// backend/routes/levels.js
// ============================================================

const express = require("express");
const router = express.Router();
const levelService = require("../services/levelService");

// GET /api/levels
router.get("/", async (req, res) => {
  try {
    const levels = await levelService.getAll();
    res.json({ status: "ok", data: levels });
  } catch (error) {
    console.error("GET /api/levels ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/levels/:id
router.get("/:id", async (req, res) => {
  try {
    const level = await levelService.getById(req.params.id);
    if (!level) {
      return res.status(404).json({ status: "error", message: "Level not found" });
    }
    res.json({ status: "ok", data: level });
  } catch (error) {
    console.error("GET /api/levels/:id ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
