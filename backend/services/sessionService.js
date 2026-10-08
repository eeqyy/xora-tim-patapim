// ============================================================
// XORA — Session service (create / resolve / revoke)
// backend/services/sessionService.js
// ============================================================
// Tabel sessions menyimpan hanya HASH token, bukan token mentah.
// Token mentah hanya pernah dikirim ke client satu kali saat login/register.
// ============================================================

const pool = require("../db");
const sessionUtils = require("../utils/session");

const sessionService = {
  /**
   * Buat sesi baru.
   *
   * @param {string} userId    uuid learner/admin
   * @param {object} [client]  klien pg opsional — isi saat dipanggil di dalam transaksi
   * @returns {Promise<{token: string, id: string, expiresAt: Date}>}
   */
  async create(userId, client = pool) {
    const token = sessionUtils.createToken();
    const expiresAt = sessionUtils.expiresAt();
    const tokenHash = sessionUtils.hashToken(token);

    const result = await client.query(
      `INSERT INTO sessions (user_id, token_hash, status, expires_at)
       VALUES ($1, $2, 'ACTIVE', $3)
       RETURNING id, expires_at`,
      [userId, tokenHash, expiresAt]
    );

    return {
      token,
      id: result.rows[0].id,
      expiresAt: result.rows[0].expires_at,
    };
  },

  /**
   * Tukar token mentah menjadi konteks user aktif, atau null jika tidak sah.
   * Memvalidasi: sesi ada, status ACTIVE, belum lewat expires_at,
   * dan user-nya sendiri masih ACTIVE.
   *
   * @returns {Promise<{sessionId: string, user: {id, email, name}} | null>}
   */
  async resolve(token) {
    if (!token) return null;

    const result = await pool.query(
      `SELECT s.id AS session_id, s.status AS session_status, s.expires_at,
              u.id AS user_id, u.email, u.name, u.status AS user_status
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token_hash = $1`,
      [sessionUtils.hashToken(token)]
    );

    const row = result.rows[0];
    if (!row) return null;
    if (row.session_status !== "ACTIVE") return null;

    // Sesi lewat masa berlaku -> tandai EXPIRED supaya tidak dipakai lagi.
    if (new Date(row.expires_at) <= new Date()) {
      await pool.query(
        "UPDATE sessions SET status = 'EXPIRED' WHERE id = $1",
        [row.session_id]
      );
      return null;
    }

    // Akun di-suspend/nonaktif -> sesinya tidak lagi berlaku.
    if (row.user_status !== "ACTIVE") return null;

    return {
      sessionId: row.session_id,
      user: { id: row.user_id, email: row.email, name: row.name },
    };
  },

  /** Cabut satu sesi (logout). Idempotent — mengembalikan jumlah baris terubah. */
  async revoke(token) {
    if (!token) return 0;
    const result = await pool.query(
      `UPDATE sessions
          SET status = 'REVOKED', revoked_at = NOW()
        WHERE token_hash = $1 AND status = 'ACTIVE'`,
      [sessionUtils.hashToken(token)]
    );
    return result.rowCount;
  },

  /** Cabut seluruh sesi milik satu user (mis. ganti password / akun disuspend). */
  async revokeAllForUser(userId, client = pool) {
    const result = await client.query(
      `UPDATE sessions
          SET status = 'REVOKED', revoked_at = NOW()
        WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId]
    );
    return result.rowCount;
  },
};

module.exports = sessionService;
