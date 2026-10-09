// ============================================================
// XORA — Admin authorization middleware
// backend/middleware/requireAdmin.js
// ============================================================
// Dipakai setelah requireAuth. Menolak bila user tidak punya role ADMIN.
// Daftar role berasal dari sessionService.resolve -> req.user.roles.
//
// Catatan: dir `middlewares/` (plural) berisi sisa merge branch — jangan
// diimitasi. Middleware yang dipakai sistem ada di `middleware/` (singular).
// ============================================================

const { forbidden, sendError } = require("../utils/errors");

function requireAdmin(req, res, next) {
  const roles = (req.user && req.user.roles) || [];
  if (!roles.includes("ADMIN")) {
    return sendError(res, forbidden("Akses hanya untuk admin"));
  }
  next();
}

module.exports = { requireAdmin };
