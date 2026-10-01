// ============================================================
// XORA — Subject Routes
// backend/routes/subjects.js
// ============================================================

const express = require("express");
const router = express.Router();
const subjectService = require("../services/subjectService");

// GET /api/subjects
router.get("/", async (req, res) => {
  try {
    const subjects = await subjectService.getAll();
    res.json({ status: "ok", data: subjects });
  } catch (error) {
    console.error("GET /api/subjects ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/subjects/:id
router.get("/:id", async (req, res) => {
  try {
    const subject = await subjectService.getByIdWithLevels(req.params.id);
    if (!subject) {
      return res.status(404).json({ status: "error", message: "Subject not found" });
    }
    res.json({ status: "ok", data: subject });
  } catch (error) {
    console.error("GET /api/subjects/:id ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
