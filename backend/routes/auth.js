// ============================================================
// XORA — Authentication Routes
// backend/routes/auth.js
// ============================================================

const express = require("express");
const router = express.Router();
const authService = require("../services/authService");
const authMiddleware = require("../middlewares/authMiddleware");

// Simple email regex validator
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Nama wajib diisi",
      });
    }

    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Email wajib diisi",
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        status: "error",
        message: "Format email tidak valid",
      });
    }

    if (!password || typeof password !== "string" || password.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Password wajib diisi",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password minimal 6 karakter",
      });
    }

    // 2. Register user
    const result = await authService.register({ name, email, password });

    return res.status(201).json({
      status: "ok",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }

    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal pada server saat registrasi",
    });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || typeof email !== "string" || email.trim().length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Email wajib diisi",
      });
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        status: "error",
        message: "Format email tidak valid",
      });
    }

    if (!password || typeof password !== "string" || password.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Password wajib diisi",
      });
    }

    // 2. Login user
    const result = await authService.login({ email, password });

    return res.json({
      status: "ok",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }

    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal pada server saat login",
    });
  }
});

// GET /api/auth/me (Protected Route)
router.get("/me", authMiddleware, async (req, res) => {
  try {
    return res.json({
      status: "ok",
      data: req.user,
    });
  } catch (error) {
    console.error("GET /api/auth/me ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal pada server",
    });
  }
});

module.exports = router;
