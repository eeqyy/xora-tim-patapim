// ============================================================
// XORA — Attempt Routes (assessment execution)
// backend/routes/attempts.js
// ============================================================
// Semua endpoint di sini TERPROTEKSI (PRD TR-41) — learner hanya boleh
// membaca dan mengubah attempt miliknya sendiri.
//
// POST   /api/attempts                  { assessmentId }
//        -> mulai attempt, kembalikan daftar soal TANPA kunci jawaban
// POST   /api/attempts/:id/submit       { answers: [{ questionId, answer, responseTimeSeconds? }] }
//        -> nilai, tutup attempt, tulis evidence
// GET    /api/attempts                  ?assessmentId= (opsional)
// GET    /api/attempts/:id              -> detail + evidence
// DELETE /api/attempts/:id              -> batalkan attempt (status ABANDONED)
// ============================================================

const express = require("express");
const router = express.Router();
const attemptService = require("../services/attemptService");
const { requireAuth } = require("../middleware/auth");
const { badRequest, sendError } = require("../utils/errors");

// Semua rute di file ini butuh login.
router.use(requireAuth);

// POST /api/attempts — mulai attempt
router.post("/", async (req, res) => {
  try {
    const { assessmentId } = req.body || {};
    if (!assessmentId) {
      throw badRequest("assessmentId is required");
    }
    const data = await attemptService.startAttempt(req.user.id, assessmentId);
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/attempts ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/attempts — riwayat attempt milik user
router.get("/", async (req, res) => {
  try {
    const data = await attemptService.listAttempts(
      req.user.id,
      req.query.assessmentId || null
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/attempts ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/attempts/:id — detail satu attempt
router.get("/:id", async (req, res) => {
  try {
    const data = await attemptService.getAttempt(req.user.id, req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/attempts/:id ERROR:", error);
    sendError(res, error);
  }
});

// DELETE /api/attempts/:id — batalkan attempt yang masih berjalan
router.delete("/:id", async (req, res) => {
  try {
    const data = await attemptService.abandonAttempt(req.user.id, req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("DELETE /api/attempts/:id ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/attempts/:id/submit — kumpulkan dan nilai jawaban
router.post("/:id/submit", async (req, res) => {
  try {
    const { answers } = req.body || {};
    const data = await attemptService.submitAttempt(
      req.user.id,
      req.params.id,
      answers
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/attempts/:id/submit ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
