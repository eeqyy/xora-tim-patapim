// ============================================================
// XORA — Material Routes
// backend/routes/materials.js
// ============================================================

const express = require("express");
const router = express.Router();
const materialService = require("../services/materialService");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { sendError } = require("../utils/errors");

// GET /api/materials?topicId=&conceptId= — publik
router.get("/", async (req, res) => {
  try {
    const materials = await materialService.getAll({
      topicId: req.query.topicId,
      conceptId: req.query.conceptId,
    });
    res.json({ status: "ok", data: materials });
  } catch (error) {
    console.error("GET /api/materials ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/materials — buat materi (admin)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await materialService.create(req.body || {});
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/materials ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/materials/:id — ubah materi (admin)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await materialService.update(req.params.id, req.body || {});
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/materials/:id ERROR:", error);
    sendError(res, error);
  }
});

// DELETE /api/materials/:id — hapus materi (admin)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await materialService.remove(req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("DELETE /api/materials/:id ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/materials/:id — publik
router.get("/:id", async (req, res) => {
  try {
    const material = await materialService.getById(req.params.id);
    if (!material) {
      return res.status(404).json({ status: "error", message: "Material not found" });
    }
    res.json({ status: "ok", data: material });
  } catch (error) {
    console.error("GET /api/materials/:id ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
