// ============================================================
// XORA — Auth Routes
// backend/routes/auth.js
// ============================================================
// POST /api/auth/register  -> daftar + langsung dapat token
// POST /api/auth/login     -> login + token
// POST /api/auth/logout    -> cabut sesi berjalan (butuh token)
// GET  /api/auth/me        -> profil user yang sedang login
// ============================================================

const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const { requireAuth } = require("../middleware/auth");
const { sendError } = require("../utils/errors");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    const result = await authService.register({ name, email, password });
    res.status(201).json({ status: "ok", data: result });
  } catch (error) {
    console.error("POST /api/auth/register ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const result = await authService.login({ email, password });
    res.json({ status: "ok", data: result });
  } catch (error) {
    console.error("POST /api/auth/login ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/auth/logout
router.post("/logout", requireAuth, async (req, res) => {
  try {
    const result = await authService.logout(req.token, req.user.id);
    res.json({ status: "ok", data: result });
  } catch (error) {
    console.error("POST /api/auth/logout ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const profile = await authService.me(req.user.id);
    // Frontend (AuthContext) membaca response.data.user untuk restore sesi.
    res.json({ status: "ok", data: { user: profile } });
  } catch (error) {
    console.error("GET /api/auth/me ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
