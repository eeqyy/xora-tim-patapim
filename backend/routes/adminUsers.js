// ============================================================
// XORA — Admin User Routes
// backend/routes/adminUsers.js
// ============================================================
// Semua endpoint di router ini butuh requireAuth + requireAdmin
// (diterapkan sekali untuk seluruh router).

const express = require("express");
const router = express.Router();
const adminUserService = require("../services/adminUserService");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { sendError } = require("../utils/errors");

router.use(requireAuth, requireAdmin);

// GET /api/admin/users?search= — daftar user + role + profil
router.get("/", async (req, res) => {
  try {
    const data = await adminUserService.listAll({ search: req.query.search });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/admin/users ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/admin/users/:id/roles — set role (replace)
router.put("/:id/roles", async (req, res) => {
  try {
    const data = await adminUserService.setRoles(
      req.params.id,
      (req.body || {}).roles,
      req.user.id
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PUT /api/admin/users/:id/roles ERROR:", error);
    sendError(res, error);
  }
});

// PATCH /api/admin/users/:id/status — ubah status user
router.patch("/:id/status", async (req, res) => {
  try {
    const data = await adminUserService.setStatus(
      req.params.id,
      (req.body || {}).status,
      req.user.id
    );
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("PATCH /api/admin/users/:id/status ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;