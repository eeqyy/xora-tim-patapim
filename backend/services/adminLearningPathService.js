// ============================================================
// XORA — Admin Learning Path Service
// backend/services/adminLearningPathService.js
// ============================================================
// Oversight admin atas learning path learner: list semua path (dengan
// learner, subjek, level, dan progress), update status (ACTIVE/PAUSED/
// COMPLETED), dan pindahkan current level (tetap dalam subjek yang sama).
// Path sendiri dibuat otomatis saat learner memulai — tidak ada create
// manual di sini.
// ============================================================

const pool = require("../db");
const { badRequest, notFound } = require("../utils/errors");

const PATH_STATUS = ["ACTIVE", "COMPLETED", "PAUSED"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const adminLearningPathService = {
  /**
   * Daftar semua learning path. Filter opsional:
   *   search — nama/email learner (ILIKE)
   *   status — ACTIVE|PAUSED|COMPLETED
   */
  async listAll({ search = "", status = "" } = {}) {
    const where = [];
    const params = [];
    if (String(search).trim()) {
      params.push(`%${String(search).trim()}%`);
      where.push(`(u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
    }
    if (String(status).trim()) {
      params.push(requireEnum(status, PATH_STATUS, "status"));
      where.push(`lp.status = $${params.length}`);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT lp.id, lp.learner_id, lp.subject_id, lp.status,
              lp.started_at, lp.completed_at, lp.updated_at,
              u.name AS learner_name, u.email AS learner_email,
              s.name AS subject_name,
              lp.initial_level_id, il.name AS initial_level_name,
              lp.current_level_id, cl.name AS current_level_name,
              cl.order_index AS current_level_order,
              (SELECT COUNT(*)::int FROM levels l WHERE l.subject_id = lp.subject_id) AS total_levels
         FROM learning_paths lp
         JOIN users u ON u.id = lp.learner_id
         JOIN subjects s ON s.id = lp.subject_id
         JOIN levels il ON il.id = lp.initial_level_id
         JOIN levels cl ON cl.id = lp.current_level_id
         ${clause}
        ORDER BY lp.created_at DESC`,
      params
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      `SELECT lp.id, lp.learner_id, lp.subject_id, lp.status,
              lp.started_at, lp.completed_at, lp.updated_at,
              u.name AS learner_name, u.email AS learner_email,
              s.name AS subject_name,
              lp.initial_level_id, il.name AS initial_level_name,
              lp.current_level_id, cl.name AS current_level_name,
              cl.order_index AS current_level_order,
              (SELECT COUNT(*)::int FROM levels l WHERE l.subject_id = lp.subject_id) AS total_levels
         FROM learning_paths lp
         JOIN users u ON u.id = lp.learner_id
         JOIN subjects s ON s.id = lp.subject_id
         JOIN levels il ON il.id = lp.initial_level_id
         JOIN levels cl ON cl.id = lp.current_level_id
        WHERE lp.id = $1`,
      [id]
    );
    if (result.rows.length === 0) throw notFound("Learning path tidak ditemukan");
    return result.rows[0];
  },

  /** Ubah status path. COMPLETED mencatat completed_at; keluar dari
   *  COMPLETED menghapusnya. */
  async updateStatus(id, status) {
    const next = requireEnum(status, PATH_STATUS, "status");
    await this.getById(id);

    try {
      if (next === "COMPLETED") {
        await pool.query(
          `UPDATE learning_paths
              SET status = 'COMPLETED',
                  completed_at = COALESCE(completed_at, NOW())
            WHERE id = $1`,
          [id]
        );
      } else {
        await pool.query(
          "UPDATE learning_paths SET status = $1, completed_at = NULL WHERE id = $2",
          [next, id]
        );
      }
    } catch (error) {
      throw translatePgError(error);
    }
    return this.getById(id);
  },

  /** Pindahkan current level (harus level yang sama subjeknya dengan path). */
  async updateCurrentLevel(id, levelId) {
    const path = await this.getById(id);
    requireUuid(levelId, "levelId");

    const level = await pool.query(
      "SELECT id, subject_id, name FROM levels WHERE id = $1",
      [levelId]
    );
    if (level.rows.length === 0) throw notFound("Level tidak ditemukan");
    if (String(level.rows[0].subject_id) !== String(path.subject_id)) {
      throw badRequest(
        "Level harus berada pada subjek yang sama dengan learning path"
      );
    }

    await pool.query(
      "UPDATE learning_paths SET current_level_id = $1 WHERE id = $2",
      [levelId, id]
    );
    return this.getById(id);
  },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

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
  if (error && error.name === "ApiError") throw error;
  return error;
}

module.exports = adminLearningPathService;