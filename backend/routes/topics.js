// ============================================================
// XORA — Topic Routes
// backend/routes/topics.js
// ============================================================

const express = require("express");
const router = express.Router();
const topicService = require("../services/topicService");

// GET /api/topics
router.get("/", async (req, res) => {
  try {
    const topics = await topicService.getAll();
    res.json({ status: "ok", data: topics });
  } catch (error) {
    console.error("GET /api/topics ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/topics/:id
router.get("/:id", async (req, res) => {
  try {
    const topic = await topicService.getById(req.params.id);
    if (!topic) {
      return res.status(404).json({ status: "error", message: "Topic not found" });
    }
    res.json({ status: "ok", data: topic });
  } catch (error) {
    console.error("GET /api/topics/:id ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

module.exports = router;
