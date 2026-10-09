// ============================================================
// XORA — Authentication middleware
// backend/middleware/auth.js
// ============================================================
// Wajib dipakai pada endpoint yang butuh login (PRD TR-41:
// API assessment, mastery, gap, diagnostic, recommendation harus terproteksi).
//
// Setelah middleware ini jalan, request punya:
//   req.user     -> { id, email, name, roles: string[] }
//   req.sessionId-> uuid sesi aktif
//   req.token    -> token mentah (untuk logout)
// ============================================================

const sessionUtils = require("../utils/session");
const sessionService = require("../services/sessionService");
const { unauthorized, sendError } = require("../utils/errors");

async function requireAuth(req, res, next) {
  try {
    const token = sessionUtils.extractBearer(req.headers.authorization);
    if (!token) {
      throw unauthorized(
        "Missing bearer token. Use header: Authorization: Bearer <token>"
      );
    }

    const context = await sessionService.resolve(token);
    if (!context) {
      throw unauthorized("Invalid or expired session");
    }

    req.user = context.user;
    req.sessionId = context.sessionId;
    req.token = token;
    next();
  } catch (error) {
    sendError(res, error);
  }
}

module.exports = { requireAuth };
