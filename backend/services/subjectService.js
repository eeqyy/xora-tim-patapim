// ============================================================
// XORA — Subject Service
// backend/services/subjectService.js
// ============================================================

const pool = require("../db");
const { badRequest, notFound, conflict } = require("../utils/errors");

const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const subjectService = {
  async getAll() {
    const result = await pool.query(
      "SELECT id, name, description, status, created_at, updated_at FROM subjects ORDER BY created_at ASC"
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT id, name, description, status, created_at, updated_at FROM subjects WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  },

  async getByIdWithLevels(id) {
    const subject = await this.getById(id);
    if (!subject) return null;

    const levels = await pool.query(
      "SELECT id, name, difficulty, description, order_index, status, created_at, updated_at FROM levels WHERE subject_id = $1 ORDER BY order_index ASC",
      [id]
    );
    subject.levels = levels.rows;
    return subject;
  },

  // ============================================================
  // Admin CRUD (dilindungi requireAuth + requireAdmin di layer routes)
  // ============================================================

  /**
   * Buat subject baru.
   * `name` wajib diisi; `description` & `status` opsional (status default
   * DRAFT). Nama duplikat ditangkap UNIQUE(subjects.name) -> 409.
   */
  async create(payload = {}) {
    const name = requireText(payload.name, "name");
    const description = optionalText(payload.description, "description");
    const status = optionalEnum(payload.status, CONTENT_STATUSES, "status") || "DRAFT";

    try {
      const result = await pool.query(
        `INSERT INTO subjects (name, description, status)
         VALUES ($1, $2, $3)
         RETURNING id, name, description, status, created_at, updated_at`,
        [name, description, status]
      );
      return toSubject(result.rows[0]);
    } catch (error) {
      throw translatePgError(error);
    }
  },

  /**
   * Ubah subject (partial). Hanya field yang dikirim ikut berubah.
   * Dibungkus transaksi mengikuti pola questionService.
   */
  async update(id, payload = {}) {
    const current = await getRow(id);

    const fields = [];
    const values = [];
    const push = (col, val) => {
      values.push(val);
      fields.push(`${col} = $${values.length}`);
    };

    if (payload.name !== undefined) {
      push("name", requireText(payload.name, "name"));
    }
    if (payload.description !== undefined) {
      push("description", optionalText(payload.description, "description"));
    }
    if (payload.status !== undefined) {
      push("status", requireEnum(payload.status, CONTENT_STATUSES, "status"));
    }

    if (fields.length === 0) return toSubject(current);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `UPDATE subjects
            SET ${fields.join(", ")}, updated_at = NOW()
          WHERE id = $${values.length + 1}
          RETURNING id, name, description, status, created_at, updated_at`,
        [...values, id]
      );
      await client.query("COMMIT");
      if (updated.rows.length === 0) throw notFound("Subject tidak ditemukan");
      return toSubject(updated.rows[0]);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
  },

  /**
   * Hapus subject.
   * FK RESTRICT dari levels/concepts/assessments membuat subject yang masih
   * dipakai tidak boleh dihapus -> 409 berisi daftar pemakainya.
   */
  async remove(id) {
    await getRow(id);

    const dependents = await collectDependents(id);
    if (dependents.length > 0) {
      throw conflict(`Subject masih dipakai: ${dependents.join(", ")}`);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const deleted = await client.query(
        "DELETE FROM subjects WHERE id = $1 RETURNING id",
        [id]
      );
      await client.query("COMMIT");
      if (deleted.rows.length === 0) throw notFound("Subject tidak ditemukan");
      return { deleted: id };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
  },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/** Ambil satu subject mentah; melempar 404 bila tidak ada. */
async function getRow(id) {
  requireUuid(id, "id");
  const res = await pool.query(
    "SELECT id, name, description, status, created_at, updated_at FROM subjects WHERE id = $1",
    [id]
  );
  if (res.rows.length === 0) throw notFound("Subject tidak ditemukan");
  return res.rows[0];
}

/**
 * Hitung pemakai subject di tabel lain (levels, concepts, assessments, dan
 * preferensi learner). Mengembalikan label yang jumlahnya > 0 saja.
 */
async function collectDependents(id) {
  const [levels, concepts, assessments, learners] = await Promise.all([
    countRows("levels", "subject_id", id),
    countRows("concepts", "subject_id", id),
    countRows("assessments", "subject_id", id),
    countRows("learner_profiles", "preferred_subject_id", id),
  ]);

  const parts = [];
  if (levels > 0) parts.push(`${levels} level`);
  if (concepts > 0) parts.push(`${concepts} konsep`);
  if (assessments > 0) parts.push(`${assessments} assessment`);
  if (learners > 0) parts.push(`${learners} learner`);
  return parts;
}

/** COUNT(*) satu kolom FK — hanya tabel/kolom dari daftar putih yang boleh. */
async function countRows(table, column, id) {
  const allowed = {
    levels: "subject_id",
    concepts: "subject_id",
    assessments: "subject_id",
    learner_profiles: "preferred_subject_id",
  };
  if (allowed[table] !== column) throw badRequest("Referensi tidak valid");
  const res = await pool.query(
    `SELECT COUNT(*)::int AS c FROM ${table} WHERE ${column} = $1`,
    [id]
  );
  return res.rows[0].c;
}

/** Bentuk camelCase untuk endpoint admin CRUD. */
function toSubject(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest(`${field} wajib diisi`);
  }
  return value.trim();
}

function optionalText(value, field) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    throw badRequest(`${field} harus berupa teks`);
  }
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function requireEnum(value, allowed, field) {
  const v = optionalEnum(value, allowed, field);
  if (!v) throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  return v;
}

function optionalEnum(value, allowed, field) {
  if (value === undefined || value === null || value === "") return null;
  const v = String(value).toUpperCase();
  if (!allowed.includes(v)) {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  return v;
}

function requireUuid(value, field) {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw badRequest(`${field} harus berupa UUID yang valid`);
  }
  return value;
}

/**
 * Terjemahkan error PostgreSQL menjadi ApiError yang punya HTTP status.
 * 23505 = pelanggaran UNIQUE (nama subject ganda) -> 409.
 * 23503 = pelanggaran FK (subject masih dipakai) -> 409.
 */
function translatePgError(error) {
  if (error && error.name === "ApiError") return error;
  const code = error && error.code;
  if (code === "23505") {
    return conflict("Subject dengan nama tersebut sudah ada");
  }
  if (code === "23503") {
    return conflict("Subject masih dipakai dan tidak bisa dihapus");
  }
  if (code === "23514") {
    return badRequest("Nilai status subject tidak valid");
  }
  return error;
}

module.exports = subjectService;
