// ============================================================
// XORA — Session token helpers
// backend/utils/session.js
// ============================================================
// Token dikirim ke client sebagai `Authorization: Bearer <token>`.
// Yang disimpan di tabel sessions hanya HASH-nya (token_hash),
// sehingga kebocoran database tidak serta-merta memberi akses sesi aktif.
//
// Alasan pakai Bearer token + localStorage (bukan cookie) di MVP ini:
//   frontend berjalan di origin terpisah (port lain) sehingga cookie
//   memerlukan konfigurasi CORS credentials + SameSite yang lebih rapuh.
//   Token di header lebih sederhana dan sudah sesuai kebutuhan API-only.
// ============================================================

const crypto = require("crypto");

// Masa berlaku sesi default: 7 hari.
const SESSION_TTL_DAYS = 7;

module.exports = {
  SESSION_TTL_DAYS,

  /**
   * Token acak 256-bit, aman dibawa di header (base64url tanpa karakter '+','/','=').
   */
  createToken() {
    return crypto.randomBytes(32).toString("base64url");
  },

  /**
   * Hash SHA-256 dari token — nilai yang disimpan di sessions.token_hash.
   * SHA-256 (bukan bcrypt) dipakai karena token sudah acak 256-bit,
   * tidak perlu di-lambatkan seperti password.
   */
  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  },

  /**
   * Waktu kedaluwarsa sesi (Date object) sesuai SESSION_TTL_DAYS.
   */
  expiresAt(days = SESSION_TTL_DAYS) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  },

  /**
   * Ambil token mentah dari header Authorization, atau null jika tidak ada/bukan Bearer.
   */
  extractBearer(headerValue) {
    if (typeof headerValue !== "string") return null;
    const match = /^Bearer\s+(.+)$/i.exec(headerValue.trim());
    return match ? match[1].trim() : null;
  },
};
