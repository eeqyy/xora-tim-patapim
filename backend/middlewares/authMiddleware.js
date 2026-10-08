// ============================================================
// XORA — Authentication Middleware
// backend/middlewares/authMiddleware.js
// ============================================================

const jwt = require("jsonwebtoken");
const authService = require("../services/authService");
const { getJwtSecret } = require("../config/auth");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Akses ditolak: Token autentikasi tidak ditemukan",
      });
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, getJwtSecret());
    } catch (err) {
      return res.status(401).json({
        status: "error",
        message: "Token tidak valid atau telah kedaluwarsa",
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        status: "error",
        message: "Token payload tidak valid",
      });
    }

    // Verify user exists and status is ACTIVE in database
    const user = await authService.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Pengguna tidak ditemukan atau telah dihapus",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        status: "error",
        message: "Akun sedang tidak aktif atau dinonaktifkan",
      });
    }

    // Attach user information to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      status: user.status,
    };

    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan pada verifikasi autentikasi",
    });
  }
}

module.exports = authMiddleware;
