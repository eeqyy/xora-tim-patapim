// ============================================================
// XORA — Assessment Routes
// backend/routes/assessments.js
// ============================================================

const express = require("express");
const router = express.Router();
const assessmentService = require("../services/assessmentService");
const questionService = require("../services/questionService");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { sendError } = require("../utils/errors");

// Semua route assessment mewajibkan autentikasi learner
router.use(requireAuth);

// ============================================================
// Admin CRUD — wajib role ADMIN. Ditulis sebelum route `/:id`
// supaya literal "admin" tidak tertangkap sebagai uuid.
// ============================================================
// Level Status & Progress (Learner)
// ============================================================

// GET /api/assessments/levels/status — status progres level Easy -> Medium -> Hard
router.get("/levels/status", async (req, res) => {
  try {
    const data = await assessmentService.getLevelProgressionStatus(req.user.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/assessments/levels/status ERROR:", error);
    sendError(res, error);
  }
});

// ============================================================
// Question Bank Admin CRUD — wajib role ADMIN
// ============================================================

// GET /api/assessments/admin/questions/bank — daftar soal bank
router.get("/admin/questions/bank", requireAdmin, async (req, res) => {
  try {
    const data = await questionService.listBankQuestions(req.query);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/assessments/admin/questions/bank ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/assessments/admin/questions/bank — buat soal baru di bank
router.post("/admin/questions/bank", requireAdmin, async (req, res) => {
  try {
    const data = await questionService.createBankQuestion(req.body || {});
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/assessments/admin/questions/bank ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/assessments/admin/questions/bank/:questionId — detail soal bank
router.get("/admin/questions/bank/:questionId", requireAdmin, async (req, res) => {
  try {
    const data = await questionService.getBankQuestionById(req.params.questionId);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/assessments/admin/questions/bank/:questionId ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/assessments/admin/questions/bank/:questionId — ubah soal bank
router.put("/admin/questions/bank/:questionId", requireAdmin, async (req, res) => {
  try {
    const data = await questionService.updateBankQuestion(req.params.questionId, req.body || {});
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/assessments/admin/questions/bank/:questionId ERROR:", error);
    sendError(res, error);
  }
});

// DELETE /api/assessments/admin/questions/bank/:questionId — hapus/soft delete soal bank
router.delete("/admin/questions/bank/:questionId", requireAdmin, async (req, res) => {
  try {
    const data = await questionService.deleteBankQuestion(req.params.questionId);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("DELETE /api/assessments/admin/questions/bank/:questionId ERROR:", error);
    sendError(res, error);
  }
});

// PATCH /api/assessments/admin/questions/bank/:questionId/toggle-active — toggle status aktif
router.patch("/admin/questions/bank/:questionId/toggle-active", requireAdmin, async (req, res) => {
  try {
    const data = await questionService.toggleBankQuestionActive(req.params.questionId);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PATCH /api/assessments/admin/questions/bank/:questionId/toggle-active ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/assessments/admin/full/:id — detail + soal lengkap (ada kunci)
router.get("/admin/full/:id", requireAdmin, async (req, res) => {
  try {
    const data = await assessmentService.getFullById(req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/assessments/admin/full/:id ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/assessments — buat assessment
router.post("/", requireAdmin, async (req, res) => {
  try {
    const data = await assessmentService.create(req.body || {});
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/assessments ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/assessments/:id — ubah assessment
router.put("/:id", requireAdmin, async (req, res) => {
  try {
    const data = await assessmentService.update(req.params.id, req.body || {});
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/assessments/:id ERROR:", error);
    sendError(res, error);
  }
});

// DELETE /api/assessments/:id — hapus assessment (409 bila sudah ada pengerjaan)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const data = await assessmentService.remove(req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("DELETE /api/assessments/:id ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/assessments/:id/questions — tambah soal
router.post("/:id/questions", requireAdmin, async (req, res) => {
  try {
    const data = await questionService.create(req.params.id, req.body || {});
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/assessments/:id/questions ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/assessments/:id/questions/reorder — susun ulang urutan soal
// (harus terdaftar SEBELUM /:id/questions/:questionId)
router.put("/:id/questions/reorder", requireAdmin, async (req, res) => {
  try {
    const data = await questionService.reorder(req.params.id, (req.body || {}).orderedIds);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/assessments/:id/questions/reorder ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/assessments/:id/questions/:questionId — ubah soal
router.put("/:id/questions/:questionId", requireAdmin, async (req, res) => {
  try {
    const data = await questionService.update(req.params.questionId, req.body || {});
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/assessments/:id/questions/:questionId ERROR:", error);
    sendError(res, error);
  }
});

// DELETE /api/assessments/:id/questions/:questionId — hapus soal (409 bila ada jawaban)
router.delete("/:id/questions/:questionId", requireAdmin, async (req, res) => {
  try {
    const data = await questionService.remove(req.params.questionId);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("DELETE /api/assessments/:id/questions/:questionId ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/assessments
router.get("/", async (req, res) => {
  try {
    const assessments = await assessmentService.getAll(req.query, req.user?.id);
    res.json({ status: "ok", data: assessments });
  } catch (error) {
    console.error("GET /api/assessments ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// GET /api/assessments/attempts/:attemptId - Ambil data / hasil attempt
router.get("/attempts/:attemptId", async (req, res) => {
  try {
    const attempt = await assessmentService.getAttemptById(req.user.id, req.params.attemptId);
    res.json({ status: "ok", data: attempt });
  } catch (error) {
    console.error("GET /api/assessments/attempts/:attemptId ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// POST /api/assessments/attempts/:attemptId/submit - Submit attempt
router.post("/attempts/:attemptId/submit", async (req, res) => {
  try {
    const result = await assessmentService.submitAttempt(req.user.id, req.params.attemptId, req.body.answers);
    res.json({ status: "ok", data: result });
  } catch (error) {
    console.error("POST /api/assessments/attempts/:attemptId/submit ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// POST /api/assessments/attempts/:attemptId/analyze-gap - Trigger / retry AI Gap Analysis
router.post("/attempts/:attemptId/analyze-gap", async (req, res) => {
  try {
    const result = await assessmentService.retryAiGapAnalysis(req.user.id, req.params.attemptId);
    res.json({ status: "ok", data: result });
  } catch (error) {
    console.error("POST /api/assessments/attempts/:attemptId/analyze-gap ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// GET /api/assessments/:id
router.get("/:id", async (req, res) => {
  try {
    const assessment = await assessmentService.getById(req.params.id, req.user?.id);
    if (!assessment) {
      return res.status(404).json({ status: "error", message: "Assessment not found" });
    }
    res.json({ status: "ok", data: assessment });
  } catch (error) {
    console.error("GET /api/assessments/:id ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// GET /api/assessments/:id/questions - Pertanyaan yang aman (tanpa bocoran kunci jawaban)
router.get("/:id/questions", async (req, res) => {
  try {
    const assessment = await assessmentService.getById(req.params.id);
    if (!assessment) {
      return res.status(404).json({ status: "error", message: "Assessment not found" });
    }
    const attemptId = req.query.attemptId || null;
    const questions = await assessmentService.getQuestionsByAssessmentId(req.params.id, false, attemptId);
    res.json({ status: "ok", data: questions });
  } catch (error) {
    console.error("GET /api/assessments/:id/questions ERROR:", error);
    res.status(error.statusCode || 500).json({ status: "error", message: error.message });
  }
});

// POST /api/assessments/:id/attempts - Memulai attempt baru
router.post("/:id/attempts", async (req, res) => {
  try {
    const attempt = await assessmentService.createAttempt(req.user.id, req.params.id);
    res.status(201).json({ status: "ok", data: attempt });
  } catch (error) {
    console.error("POST /api/assessments/:id/attempts ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/assessments/:id/reassess - Memulai Re-assessment (Remedial / uji ulang)
router.post("/:id/reassess", async (req, res) => {
  try {
    const data = await assessmentService.reassess(req.user.id, req.params.id);
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/assessments/:id/reassess ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
