// ============================================================
// XORA — Password helpers (bcrypt)
// backend/utils/password.js
// ============================================================

const bcrypt = require("bcryptjs");

const ROUNDS = 10;

module.exports = {
  /**
   * Hash password plaintext -> string bcrypt 60 karakter.
   */
  hash(plain) {
    return bcrypt.hash(plain, ROUNDS);
  },

  /**
   * Cocokkan plaintext dengan hash tersimpan.
   * Mengembalikan false (bukan throw) jika hash tidak valid,
   * supaya gagal login tidak pernah membocorkan error internal.
   */
  verify(plain, hash) {
    if (!this.isValidHash(hash)) return false;
    try {
      return bcrypt.compareSync(plain, hash);
    } catch (error) {
      console.error("BCRYPT VERIFY ERROR:", error.message);
      return false;
    }
  },

  /**
   * bcrypt valid selalu 60 karakter dan diawali $2a$/$2b$/$2y$.
   *
   * Dipakai untuk menangani data lama yang hash-nya corrupt.
   * Contoh: seed.js menyimpan hash dummy berukuran 57 karakter sehingga
   * user itu tidak bisa login — bukan bug password, tapi hash yang tidak sah.
   */
  isValidHash(hash) {
    return (
      typeof hash === "string" &&
      hash.length === 60 &&
      /^\$2[aby]\$/.test(hash)
    );
  },
};
