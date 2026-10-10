// ============================================================
// XORA — Admin User Service
// backend/services/adminUserService.js
// ============================================================
// Oversight admin atas akun pengguna: list (dengan role & profil),
// set global roles (LEARNER/ADMIN), dan set status user.
// Tidak ada create/delete — registrasi via auth, delete dicegah FK RESTRICT.
// Pengaman: admin tidak boleh mencabut role ADMIN dari diri sendiri, dan
// role ADMIN aktif terakhir tidak bisa dicabut / dinonaktifkan.
// ============================================================

const pool = require("../db");
const { badRequest, notFound, conflict } = require("../utils/errors");

const ROLE_NAMES = ["LEARNER", "ADMIN"];
const USER_STATUS = ["ACTIVE", "INACTIVE", "SUSPENDED"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const adminUserService = {
  /** Daftar user + role + profil (learner/admin), opsional filter pencarian. */
  async listAll({ search = "" } = {}) {
    const params = [];
    let where = "";
    if (String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      where = "WHERE u.name ILIKE $1 OR u.email ILIKE $1";
    }

    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.status, u.created_at, u.updated_at,
              COALESCE(roles.role_names, '{}') AS roles,
              lp.learning_goal, lp.experience_level, lp.onboarding_completed,
              s.name AS preferred_subject_name,
              ap.employee_code
         FROM users u
         LEFT JOIN LATERAL (
           SELECT array_agg(r.name::text ORDER BY r.name) AS role_names
             FROM user_roles ur JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id
         ) roles ON TRUE
         LEFT JOIN learner_profiles lp ON lp.user_id = u.id
         LEFT JOIN subjects s ON s.id = lp.preferred_subject_id
         LEFT JOIN admin_profiles ap ON ap.user_id = u.id
         ${where}
        ORDER BY u.created_at DESC`,
      params
    );
    return result.rows;
  },

  async getById(id) {
    requireUuid(id, "id");
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.status, u.created_at, u.updated_at,
              COALESCE(roles.role_names, '{}') AS roles,
              lp.learning_goal, lp.experience_level, lp.onboarding_completed,
              s.name AS preferred_subject_name,
              ap.employee_code
         FROM users u
         LEFT JOIN LATERAL (
           SELECT array_agg(r.name::text ORDER BY r.name) AS role_names
             FROM user_roles ur JOIN roles r ON r.id = ur.role_id
            WHERE ur.user_id = u.id
         ) roles ON TRUE
         LEFT JOIN learner_profiles lp ON lp.user_id = u.id
         LEFT JOIN subjects s ON s.id = lp.preferred_subject_id
         LEFT JOIN admin_profiles ap ON ap.user_id = u.id
        WHERE u.id = $1`,
      [id]
    );
    if (result.rows.length === 0) throw notFound("User tidak ditemukan");
    return result.rows[0];
  },

  /**
   * Set role user secara penuh (replace). Minimal satu role harus tetap
   * dimiliki user (registrasi selalu membuat LEARNER/ADMIN).
   */
  async setRoles(userId, roleNames, actorId) {
    const target = await this.getById(userId);
    const names = requireRolesList(roleNames);

    const wasAdmin = target.roles.includes("ADMIN");
    const willBeAdmin = names.includes("ADMIN");

    if (String(userId) === String(actorId)) {
      if (wasAdmin && !willBeAdmin) {
        throw conflict("Tidak bisa mencabut role ADMIN dari akun sendiri");
      }
    }

    if (wasAdmin && !willBeAdmin && target.status === "ACTIVE") {
      const admins = await countActiveAdmins();
      if (admins <= 1) {
        throw conflict(
          "Tidak bisa mencabut role ADMIN terakhir yang masih aktif"
        );
      }
    }

    const roleRows = await pool.query(
      "SELECT id FROM roles WHERE name = ANY($1)",
      [names]
    );
    if (roleRows.rows.length !== names.length) {
      throw notFound("Terdapat role yang tidak dikenal");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM user_roles WHERE user_id = $1", [userId]);
      for (const row of roleRows.rows) {
        await client.query(
          "INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)",
          [userId, row.id]
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
    return this.getById(userId);
  },

  /** Ubah status user (ACTIVE/INACTIVE/SUSPENDED). */
  async setStatus(userId, status, actorId) {
    const target = await this.getById(userId);
    const next = requireEnum(status, USER_STATUS, "status");

    if (next !== "ACTIVE") {
      if (String(userId) === String(actorId)) {
        throw conflict("Tidak bisa menonaktifkan akun sendiri");
      }
      if (target.roles.includes("ADMIN") && target.status === "ACTIVE") {
        const admins = await countActiveAdmins();
        if (admins <= 1) {
          throw conflict(
            "Tidak bisa menonaktifkan role ADMIN terakhir yang masih aktif"
          );
        }
      }
    }

    try {
      await pool.query("UPDATE users SET status = $1 WHERE id = $2", [next, userId]);
    } catch (error) {
      throw translatePgError(error);
    }
    return this.getById(userId);
  },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function countActiveAdmins() {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS n
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       JOIN users u ON u.id = ur.user_id
      WHERE r.name = 'ADMIN' AND u.status = 'ACTIVE'`
  );
  return Number(res.rows[0].n);
}

function requireRolesList(value) {
  if (!Array.isArray(value) || value.length === 0) {
    throw badRequest("roles wajib berupa array berisi minimal satu role");
  }
  const names = [...new Set(value.map((r) => String(r).toUpperCase()))];
  for (const name of names) {
    if (!ROLE_NAMES.includes(name)) {
      throw badRequest(`role harus salah satu dari: ${ROLE_NAMES.join(", ")}`);
    }
  }
  return names;
}

function requireEnum(value, allowed, field) {
  if (typeof value !== "string" || !allowed.includes(value.toUpperCase())) {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  return value.toUpperCase();
}

function requireUuid(value, field) {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw badRequest(`${field} harus berupa UUID yang valid`);
  }
  return value;
}

function translatePgError(error) {
  if (error && error.name === "ApiError") return error;
  return error;
}

module.exports = adminUserService;