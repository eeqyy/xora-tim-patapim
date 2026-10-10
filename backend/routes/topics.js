// ============================================================
// XORA — Topic Routes
// backend/routes/topics.js
// ============================================================

const express = require("express");
const router = express.Router();
const topicService = require("../services/topicService");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { sendError } = require("../utils/errors");

// GET /api/topics — publik
router.get("/", async (req, res) => {
  try {
    const topics = await topicService.getAll();
    res.json({ status: "ok", data: topics });
  } catch (error) {
    console.error("GET /api/topics ERROR:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
});

// POST /api/topics — buat topik (admin)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await topicService.create(req.body || {});
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/topics ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/topics/:id — ubah topik (admin)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await topicService.update(req.params.id, req.body || {});
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/topics/:id ERROR:", error);
    sendError(res, error);
  }
});

// DELETE /api/topics/:id — hapus topik (admin, 409 bila masih dipakai)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await topicService.remove(req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("DELETE /api/topics/:id ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/topics/:id — publik
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
