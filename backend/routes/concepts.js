// ============================================================
// XORA — Concept Routes
// backend/routes/concepts.js
// ============================================================

const express = require("express");
const router = express.Router();
const conceptService = require("../services/conceptService");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { sendError } = require("../utils/errors");

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

// ============================================================
// Admin CRUD — wajib login + role ADMIN.
// ============================================================

// POST /api/concepts — buat concept (+ prerequisite opsional)
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await conceptService.create(req.body || {});
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/concepts ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/concepts/:id — ubah concept (partial)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await conceptService.update(req.params.id, req.body || {});
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/concepts/:id ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/concepts/:id/prerequisites — ganti seluruh himpunan prerequisite
router.put("/:id/prerequisites", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await conceptService.setPrerequisites(
      req.params.id,
      (req.body || {}).prerequisiteIds
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/concepts/:id/prerequisites ERROR:", error);
    sendError(res, error);
  }
});

// DELETE /api/concepts/:id — hapus concept (409 bila masih ada dependen RESTRICT)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await conceptService.remove(req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("DELETE /api/concepts/:id ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
