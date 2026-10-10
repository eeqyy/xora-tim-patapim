// ============================================================
// XORA — Level Routes
// backend/routes/levels.js
// ============================================================
// GET publik (dipakai frontend peserta & editor). CRUD admin di bawah
// dilindungi requireAuth + requireAdmin secara per-endpoint agar GET
// tetap publik.
// ============================================================

const express = require("express");
const router = express.Router();
const levelService = require("../services/levelService");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { sendError } = require("../utils/errors");

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

// ============================================================
// Admin CRUD — wajib login + role ADMIN.
// ============================================================

// POST /api/levels — buat level
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await levelService.create(req.body || {});
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/levels ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/levels/:id — ubah level (partial)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await levelService.update(req.params.id, req.body || {});
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/levels/:id ERROR:", error);
    sendError(res, error);
  }
});

// DELETE /api/levels/:id — hapus level (409 bila masih dipakai topic/assessment)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deleted = await levelService.remove(req.params.id);
    res.json({ status: "ok", data: { deleted } });
  } catch (error) {
    console.error("DELETE /api/levels/:id ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
