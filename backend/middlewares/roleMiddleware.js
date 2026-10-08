// ============================================================
// XORA — Role Authorization Middleware
// backend/middlewares/roleMiddleware.js
// ============================================================

/**
 * Reusable role-based access control middleware.
 * Usage:
 *   requireRole('ADMIN')
 *   requireRole('ADMIN', 'INSTRUCTOR')
 *   requireRole(['ADMIN', 'INSTRUCTOR'])
 */
function requireRole(...allowedRoles) {
  // Support both array argument requireRole(['ADMIN']) and rest params requireRole('ADMIN', 'SUPER')
  const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;

  return (req, res, next) => {
    // 1. Ensure user is authenticated by authMiddleware first
    if (!req.user || !Array.isArray(req.user.roles)) {
      return res.status(401).json({
        status: "error",
        message: "Akses ditolak: Autentikasi diperlukan sebelum pemeriksaan hak akses",
      });
    }

    // 2. Check if user has at least one of the required roles
    const hasPermission = req.user.roles.some((role) => roles.includes(role));

    if (!hasPermission) {
      return res.status(403).json({
        status: "error",
        message: "Akses ditolak: Anda tidak memiliki izin untuk mengakses resource ini",
      });
    }

    next();
  };
}

module.exports = {
  requireRole,
};
