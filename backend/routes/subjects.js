// ============================================================
// XORA — Subject Routes
// backend/routes/subjects.js
// ============================================================

const express = require("express");
const router = express.Router();
const subjectService = require("../services/subjectService");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { sendError } = require("../utils/errors");

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

// ============================================================
// Admin CRUD — wajib role ADMIN (requireAuth + requireAdmin).
// GET / dan GET /:id di atas tetap publik (tanpa auth).
// ============================================================

// POST /api/subjects — buat subject
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await subjectService.create(req.body || {});
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/subjects ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/subjects/:id — ubah subject (partial)
router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await subjectService.update(req.params.id, req.body || {});
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/subjects/:id ERROR:", error);
    sendError(res, error);
  }
});

// DELETE /api/subjects/:id — hapus subject (409 bila masih dipakai)
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const data = await subjectService.remove(req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("DELETE /api/subjects/:id ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
