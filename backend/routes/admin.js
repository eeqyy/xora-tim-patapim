// ============================================================
// XOLEARN — Admin Routes (/api/admin)
// backend/routes/admin.js
// ============================================================
// Seluruh endpoint di sini wajib login DAN role ADMIN.
//
// Cakupan:
//   - Kelola akun pengguna (list, detail, status, role, reset password)
//   - Pantau kesehatan sistem & data (health, stats, activity, analytics)
//
// Catatan: CRUD asesmen & bank soal tetap ada di routes/assessments.js
// (prefix /api/assessments/admin/*).
// ============================================================

const express = require("express");
const router = express.Router();

const adminUserService = require("../services/adminUserService");
const systemMonitorService = require("../services/systemMonitorService");
const auditService = require("../services/auditService");
const masteryService = require("../services/masteryService");
const gapService = require("../services/gapService");
const recommendationService = require("../services/recommendationService");
const historyService = require("../services/historyService");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { sendError, badRequest, forbidden, isValidUuid } = require("../utils/errors");

// Semua endpoint admin butuh login + role ADMIN.
router.use(requireAuth, requireAdmin);

// Helper: pastikan parameter adalah UUID yang valid.
function assertUuid(id, label) {
  if (!isValidUuid(id)) throw badRequest(`${label} tidak valid`);
  return id;
}

function clientIp(req) {
  return req.ip || req.headers["x-forwarded-for"] || null;
}

// ============================================================
// Kelola akun pengguna
// ============================================================

// GET /api/admin/users — daftar user (filter: search, role, status, limit, offset)
router.get("/users", async (req, res) => {
  try {
    const { search, role, status, limit, offset } = req.query;
    const data = await adminUserService.listUsers({ search, role, status, limit, offset });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/admin/users ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/admin/users/:id — detail user
router.get("/users/:id", async (req, res) => {
  try {
    const id = assertUuid(req.params.id, "ID pengguna");
    const data = await adminUserService.getUserById(id);
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/admin/users/:id ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/admin/users/:id/analytics — ringkasan analitik seorang learner.
// Read-only: menggabungkan riwayat, mastery, gap, dan rekomendasi dengan
// learnerId yang dipilih admin (tanpa menulis data apa pun).
router.get("/users/:id/analytics", async (req, res) => {
  try {
    const id = assertUuid(req.params.id, "ID pengguna");

    // Validasi keberadaan user sekaligus id.
    await adminUserService.getUserById(id);

    const [history, mastery, gaps, recommendations] = await Promise.all([
      historyService.getLearnerHistory(id, { limit: 20 }),
      masteryService.summary(id),
      gapService.getGapsForLearner(id),
      recommendationService.listForLearner(id),
    ]);

    res.json({
      status: "ok",
      data: {
        learner_id: id,
        overview: (history && history.overview) || null,
        history,
        mastery: Array.isArray(mastery) ? mastery : [],
        gaps: Array.isArray(gaps) ? gaps : [],
        recommendations: Array.isArray(recommendations) ? recommendations : [],
      },
    });
  } catch (error) {
    console.error("GET /api/admin/users/:id/analytics ERROR:", error);
    sendError(res, error);
  }
});

// PATCH /api/admin/users/:id/status — ubah status akun
router.patch("/users/:id/status", async (req, res) => {
  try {
    const id = assertUuid(req.params.id, "ID pengguna");
    const { status } = req.body || {};

    if (id === req.user.id) {
      throw forbidden("Tidak dapat mengubah status akun sendiri");
    }

    const result = await adminUserService.updateStatus(id, status);

    await auditService.log(
      {
        actorId: req.user.id,
        actorType: "ADMIN",
        action: "UPDATE",
        entityType: "user",
        entityId: id,
        oldValue: { status: result.previous_status },
        newValue: { status: result.user.status },
        ipAddress: clientIp(req),
      }
    );

    res.json({ status: "ok", data: result });
  } catch (error) {
    console.error("PATCH /api/admin/users/:id/status ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/admin/users/:id/roles — ganti role user
router.put("/users/:id/roles", async (req, res) => {
  try {
    const id = assertUuid(req.params.id, "ID pengguna");

    if (id === req.user.id) {
      throw forbidden("Tidak dapat mengubah role akun sendiri");
    }

    const result = await adminUserService.updateRoles(id, (req.body || {}).roles);

    await auditService.log({
      actorId: req.user.id,
      actorType: "ADMIN",
      action: "UPDATE",
      entityType: "user_role",
      entityId: id,
      oldValue: { roles: result.previous_roles },
      newValue: { roles: result.roles },
      ipAddress: clientIp(req),
    });

    res.json({ status: "ok", data: result });
  } catch (error) {
    console.error("PUT /api/admin/users/:id/roles ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/admin/users/:id/reset-password — set password baru + cabut sesi
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const id = assertUuid(req.params.id, "ID pengguna");
    const { newPassword } = req.body || {};

    const result = await adminUserService.resetPassword(id, newPassword);

    await auditService.log({
      actorId: req.user.id,
      actorType: "ADMIN",
      action: "UPDATE",
      entityType: "user",
      entityId: id,
      newValue: { password_reset: true },
      ipAddress: clientIp(req),
    });

    res.json({ status: "ok", data: result });
  } catch (error) {
    console.error("POST /api/admin/users/:id/reset-password ERROR:", error);
    sendError(res, error);
  }
});

// ============================================================
// Pantau kesehatan sistem & data
// ============================================================

// GET /api/admin/system/health
router.get("/system/health", async (req, res) => {
  try {
    const data = await systemMonitorService.getHealth();
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/admin/system/health ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/admin/system/stats
router.get("/system/stats", async (req, res) => {
  try {
    const data = await systemMonitorService.getStats();
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/admin/system/stats ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/admin/system/activity — aktivitas terbaru
router.get("/system/activity", async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const data = await systemMonitorService.getActivity({ limit, offset });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/admin/system/activity ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/admin/system/analytics — agregat analytics
router.get("/system/analytics", async (req, res) => {
  try {
    const data = await systemMonitorService.getAnalytics();
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/admin/system/analytics ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
