// ============================================================
// XORA — Authentication Configuration & Helpers
// backend/config/auth.js
// ============================================================

/**
 * Retrieves the JWT Secret from environment variables.
 * Throws a fatal configuration error if JWT_SECRET is missing or empty.
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== "string" || secret.trim().length === 0) {
    const error = new Error("FATAL: JWT_SECRET environment variable is not configured.");
    error.statusCode = 500;
    throw error;
  }
  return secret.trim();
}

/**
 * Retrieves the JWT expiration time from environment variables,
 * with a reasonable default of 7 days if not explicitly provided.
 */
function getJwtExpiresIn() {
  const expiresIn = process.env.JWT_EXPIRES_IN;
  if (expiresIn && typeof expiresIn === "string" && expiresIn.trim().length > 0) {
    return expiresIn.trim();
  }
  return "7d";
}

module.exports = {
  getJwtSecret,
  getJwtExpiresIn,
};
