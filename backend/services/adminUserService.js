// ============================================================
// XORA — Admin User Service (kelola akun pengguna)
// backend/services/adminUserService.js
// ============================================================
// Dipakai HANYA oleh routes/admin.js (role ADMIN).
//
// Aturan:
//   - Tidak pernah mengembalikan password_hash ke pemanggil.
//   - Mengubah status menjadi non-ACTIVE atau reset password akan
//     mencabut seluruh sesi aktif user tersebut.
// ============================================================

const pool = require("../db");
const passwordUtils = require("../utils/password");
const sessionService = require("./sessionService");
const { badRequest, notFound } = require("../utils/errors");

const ROLES = ["LEARNER", "ADMIN"];
const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

// Batas bcrypt: maksimal 72 byte input (konsisten dengan authService).
const MAX_PASSWORD_BYTES = 72;

// Kolom user yang aman dikirim ke client + daftar role sebagai array.
const USER_COLUMNS = `
  u.id, u.email, u.name, u.status, u.created_at, u.updated_at,
  COALESCE(
    (SELECT array_agg(r.name::text ORDER BY r.name)
       FROM user_roles ur JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = u.id),
    '{}'
  )::text[] AS roles
`;

const adminUserService = {
  /**
   * Daftar user dengan filter opsional (search/role/status) dan paginasi.
   */
  async listUsers({ search, role, status, limit, offset } = {}) {
    const conditions = [];
    const params = [];

    if (search && String(search).trim()) {
      params.push(`%${String(search).trim().toLowerCase()}%`);
      conditions.push(
        `(LOWER(u.name) LIKE $${params.length} OR LOWER(u.email) LIKE $${params.length})`
      );
    }

    if (role) {
      if (!ROLES.includes(role)) throw badRequest(`Role tidak dikenal: ${role}`);
      params.push(role);
      conditions.push(
        `EXISTS (
           SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id AND r.name::text = $${params.length}
         )`
      );
    }

    if (status) {
      if (!STATUSES.includes(status)) throw badRequest(`Status tidak dikenal: ${status}`);
      params.push(status);
      conditions.push(`u.status::text = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const countRes = await pool.query(
      `SELECT COUNT(*)::int AS total FROM users u ${where}`,
      params
    );

    const dataRes = await pool.query(
      `SELECT ${USER_COLUMNS}
         FROM users u
         ${where}
        ORDER BY u.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, safeLimit, safeOffset]
    );

    return {
      items: dataRes.rows,
      total: countRes.rows[0]?.total || 0,
      limit: safeLimit,
      offset: safeOffset,
    };
  },

  /**
   * Detail satu user + profil learner/admin + jumlah sesi aktif.
   */
  async getUserById(id) {
    const userRes = await pool.query(
      `SELECT ${USER_COLUMNS} FROM users u WHERE u.id = $1`,
      [id]
    );
    const user = userRes.rows[0];
    if (!user) throw notFound("Pengguna tidak ditemukan");

    const [learnerRes, adminRes, sessionRes] = await Promise.all([
      pool.query(
        `SELECT lp.learning_goal, lp.experience_level, lp.onboarding_completed,
                lp.preferred_subject_id, s.name AS preferred_subject_name
           FROM learner_profiles lp
           LEFT JOIN subjects s ON s.id = lp.preferred_subject_id
          WHERE lp.user_id = $1`,
        [id]
      ),
      pool.query(`SELECT employee_code FROM admin_profiles WHERE user_id = $1`, [id]),
      pool.query(
        `SELECT COUNT(*)::int AS active_sessions
           FROM sessions
          WHERE user_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()`,
        [id]
      ),
    ]);

    return {
      ...user,
      learner_profile: learnerRes.rows[0] || null,
      admin_profile: adminRes.rows[0] || null,
      active_sessions: sessionRes.rows[0]?.active_sessions || 0,
    };
  },

  /**
   * Ubah status akun. Bila bukan ACTIVE, semua sesi dicabut.
   */
  async updateStatus(id, status) {
    if (!STATUSES.includes(status)) throw badRequest(`Status tidak dikenal: ${status}`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const beforeRes = await client.query(
        `SELECT id, status FROM users WHERE id = $1`,
        [id]
      );
      const before = beforeRes.rows[0];
      if (!before) throw notFound("Pengguna tidak ditemukan");

      const updated = await client.query(
        `UPDATE users SET status = $1, updated_at = NOW()
          WHERE id = $2
          RETURNING id, email, name, status, updated_at`,
        [status, id]
      );

      let revokedSessions = 0;
      if (status !== "ACTIVE") {
        revoked = await sessionService.revokeAllForUser(id, client);
      }

      await client.query("COMMIT");

      return {
        user: updated.rows[0],
        previous_status: before.status,
        revoked_sessions: revoked,
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Ganti seluruh role user (menggantikan daftar role lama).
   */
  async updateRoles(id, roles) {
    if (!Array.isArray(roles) || roles.length === 0) {
      throw badRequest("roles harus berisi minimal satu role");
    }
    const unique = [...new Set(roles)];
    for (const r of unique) {
      if (!ROLES.includes(r)) throw badRequest(`Role tidak dikenal: ${r}`);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userRes = await client.query(`SELECT id FROM users WHERE id = $1`, [id]);
      if (!userRes.rows[0]) throw notFound("Pengguna tidak ditemukan");

      const beforeRes = await client.query(
        `SELECT COALESCE(array_agg(r.name::text ORDER BY r.name), '{}') AS roles
           FROM user_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = $1`,
        [id]
      );

      await client.query(`DELETE FROM user_roles WHERE user_id = $1`, [id]);
      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT $1, r.id FROM roles r WHERE r.name::text = ANY($2::text[])`,
        [id, unique]
      );

      const afterRes = await client.query(
        `SELECT COALESCE(array_agg(r.name::text ORDER BY r.name), '{}') AS roles
           FROM user_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = $1`,
        [id]
      );

      await client.query("COMMIT");

      return {
        user_id: id,
        previous_roles: beforeRes.rows[0]?.roles || [],
        roles: afterRes.rows[0]?.roles || [],
      };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Set password baru untuk user + cabut seluruh sesinya.
   */
  async resetPassword(id, newPassword) {
    const pass = String(newPassword ?? "");
    if (pass.length < 8) throw badRequest("Password minimal 8 karakter");
    if (Buffer.byteLength(pass, "utf8") > MAX_PASSWORD_BYTES) {
      throw badRequest("Password terlalu panjang (maksimal 72 byte)");
    }

    const userRes = await pool.query(
      `SELECT id, email, name FROM users WHERE id = $1`,
      [id]
    );
    const user = userRes.rows[0];
    if (!user) throw notFound("Pengguna tidak ditemukan");

    const passwordHash = await passwordUtils.hash(pass);
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, id]
    );
    const revoked = await sessionService.revokeAllForUser(id);

    return { user_id: id, email: user.email, revoked_sessions: revoked };
  },
};

module.exports = adminUserService;
