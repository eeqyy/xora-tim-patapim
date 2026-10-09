// ============================================================
// XORA — Practice Routes
// backend/routes/practices.js
// ============================================================
// Model "practice" reuse: assessments(type=PRACTICE) + attempts + evidence.
//
// GET  /api/practices                          -> daftar practice (?subjectId,&levelId,&conceptId)
// GET  /api/practices/attempts/:attemptId/result -> hasil + evidence + mastery
// POST /api/practices/attempts/:attemptId/submit -> submit (delegasi assessmentService)
// GET  /api/practices/:id                      -> detail + concept mapping
// POST /api/practices/:id/start                -> mulai/lanjutkan attempt
// ============================================================

const express = require("express");
const router = express.Router();
const practiceService = require("../services/practiceService");
const { requireAuth } = require("../middleware/auth");
const { sendError } = require("../utils/errors");

router.use(requireAuth);

// GET /api/practices
router.get("/", async (req, res) => {
  try {
    const data = await practiceService.listPractices(req.query);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/practices ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/practices/attempts/:attemptId/result
router.get("/attempts/:attemptId/result", async (req, res) => {
  try {
    const data = await practiceService.getResult(req.user.id, req.params.attemptId);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/practices/attempts/:attemptId/result ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/practices/attempts/:attemptId/submit
router.post("/attempts/:attemptId/submit", async (req, res) => {
  try {
    const data = await practiceService.submitPractice(
      req.user.id,
      req.params.attemptId,
      (req.body || {}).answers
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/practices/attempts/:attemptId/submit ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/practices/:id
router.get("/:id", async (req, res) => {
  try {
    const data = await practiceService.getPracticeById(req.params.id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/practices/:id ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/practices/:id/start
router.post("/:id/start", async (req, res) => {
  try {
    const data = await practiceService.startPractice(req.user.id, req.params.id);
    res.status(201).json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/practices/:id/start ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
