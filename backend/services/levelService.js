// ============================================================
// XORA — Level Service
// backend/services/levelService.js
// ============================================================
// Berisi query baca (dipakai endpoint publik) + CRUD admin.
// Endpoint CRUD dilindungi requireAuth + requireAdmin di layer routes.
// Payload masuk camelCase, kolom database snake_case.
// ============================================================

const pool = require("../db");
const { badRequest, notFound, conflict } = require("../utils/errors");

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const levelService = {
  async getAll() {
    const result = await pool.query(`
      SELECT l.id, l.subject_id, l.name, l.difficulty, l.description,
             l.order_index, l.status, l.created_at, l.updated_at,
             s.name AS subject_name
      FROM levels l
      LEFT JOIN subjects s ON s.id = l.subject_id
      ORDER BY l.order_index ASC
    `);
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(`
      SELECT l.id, l.subject_id, l.name, l.difficulty, l.description,
             l.order_index, l.status, l.created_at, l.updated_at,
             s.name AS subject_name
      FROM levels l
      LEFT JOIN subjects s ON s.id = l.subject_id
      WHERE l.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async getBySubjectId(subjectId) {
    const result = await pool.query(
      "SELECT id, name, difficulty, description, order_index, status, created_at, updated_at FROM levels WHERE subject_id = $1 ORDER BY order_index ASC",
      [subjectId]
    );
    return result.rows;
  },

  /**
   * Tambah level baru.
   * `orderIndex` opsional — bila kosong dihitung sebagai urutan terakhir
   * di subject tersebut (max + 1).
   */
  async create(input = {}) {
    const subjectId = requireUuid(input.subjectId, "subjectId");
    await assertSubjectExists(subjectId);

    const name = requireText(input.name, "name");
    const difficulty = requireEnum(input.difficulty, DIFFICULTIES, "difficulty");
    const description = optionalText(input.description);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const order =
        input.orderIndex != null && input.orderIndex !== ""
          ? requireInteger(input.orderIndex, "orderIndex")
          : await nextOrderIndex(client, subjectId);

      // Pre-check UNIQUE(subject_id, name) & UNIQUE(subject_id, order_index)
      // supaya pesan jelas; translatePgError tetap jadi pengaman balapan.
      const dupName = await client.query(
        "SELECT 1 FROM levels WHERE subject_id = $1 AND name = $2",
        [subjectId, name]
      );
      if (dupName.rows.length > 0) {
        throw conflict(`Level "${name}" sudah ada di subject ini`);
      }

      const dupOrder = await client.query(
        "SELECT 1 FROM levels WHERE subject_id = $1 AND order_index = $2",
        [subjectId, order]
      );
      if (dupOrder.rows.length > 0) {
        throw conflict(`Urutan #${order} sudah dipakai level lain di subject ini`);
      }

      const inserted = await client.query(
        `INSERT INTO levels (subject_id, name, difficulty, description, order_index)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [subjectId, name, difficulty, description, order]
      );

      await client.query("COMMIT");
      return await getJoinedById(inserted.rows[0].id);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
  },

  /**
   * Ubah level (partial). Hanya field yang dikirim ikut berubah.
   */
  async update(id, input = {}) {
    requireUuid(id, "id");
    const current = await getRow(id);

    const subjectId =
      input.subjectId !== undefined
        ? requireUuid(input.subjectId, "subjectId")
        : current.subject_id;
    if (input.subjectId !== undefined) await assertSubjectExists(subjectId);

    const name =
      input.name !== undefined ? requireText(input.name, "name") : current.name;
    const difficulty =
      input.difficulty !== undefined
        ? requireEnum(input.difficulty, DIFFICULTIES, "difficulty")
        : current.difficulty;
    const description =
      input.description !== undefined
        ? optionalText(input.description)
        : current.description;
    const orderIndex =
      input.orderIndex !== undefined
        ? requireInteger(input.orderIndex, "orderIndex")
        : current.order_index;
    const status =
      input.status !== undefined
        ? requireEnum(input.status, STATUSES, "status")
        : current.status;

    const fields = [];
    const values = [];
    const push = (col, val) => {
      values.push(val);
      fields.push(`${col} = $${values.length}`);
    };

    if (subjectId !== current.subject_id) push("subject_id", subjectId);
    if (name !== current.name) push("name", name);
    if (difficulty !== current.difficulty) push("difficulty", difficulty);
    if (description !== (current.description || null)) push("description", description);
    if (orderIndex !== current.order_index) push("order_index", orderIndex);
    if (status !== current.status) push("status", status);

    if (fields.length === 0) return await getJoinedById(id);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // UNIQUE(subject_id, name) — kecuali dirinya sendiri.
      if (name !== current.name || subjectId !== current.subject_id) {
        const dupName = await client.query(
          "SELECT 1 FROM levels WHERE subject_id = $1 AND name = $2 AND id <> $3",
          [subjectId, name, id]
        );
        if (dupName.rows.length > 0) {
          throw conflict(`Level "${name}" sudah ada di subject ini`);
        }
      }

      // UNIQUE(subject_id, order_index) — kecuali dirinya sendiri.
      if (orderIndex !== current.order_index || subjectId !== current.subject_id) {
        const dupOrder = await client.query(
          "SELECT 1 FROM levels WHERE subject_id = $1 AND order_index = $2 AND id <> $3",
          [subjectId, orderIndex, id]
        );
        if (dupOrder.rows.length > 0) {
          throw conflict(`Urutan #${orderIndex} sudah dipakai level lain di subject ini`);
        }
      }

      fields.push("updated_at = NOW()");
      const updated = await client.query(
        `UPDATE levels SET ${fields.join(", ")} WHERE id = $${values.length + 1} RETURNING id`,
        [...values, id]
      );
      await client.query("COMMIT");
      if (updated.rows.length === 0) throw notFound("Level tidak ditemukan");
      return await getJoinedById(id);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
  },

  /**
   * Hapus level.
   * 409 bila masih dipakai topics/assessments — FK keduanya RESTRICT,
   * jadi dependensi diperiksa lebih dulu agar pesannya informatif.
   */
  async remove(id) {
    requireUuid(id, "id");
    await getRow(id);

    const topics = await pool.query(
      "SELECT COUNT(*)::int AS c FROM topics WHERE level_id = $1",
      [id]
    );
    if (topics.rows[0].c > 0) {
      throw conflict(
        `Level tidak bisa dihapus karena masih dipakai oleh ${topics.rows[0].c} topic`
      );
    }

    const assessments = await pool.query(
      "SELECT COUNT(*)::int AS c FROM assessments WHERE level_id = $1",
      [id]
    );
    if (assessments.rows[0].c > 0) {
      throw conflict(
        `Level tidak bisa dihapus karena masih dipakai oleh ${assessments.rows[0].c} assessment`
      );
    }

    const deleted = await pool.query(
      "DELETE FROM levels WHERE id = $1 RETURNING id",
      [id]
    );
    if (deleted.rows.length === 0) throw notFound("Level tidak ditemukan");
    return id;
  },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/** Ambil satu baris level mentah; 404 bila tidak ada. */
async function getRow(levelId) {
  requireUuid(levelId, "id");
  const res = await pool.query("SELECT * FROM levels WHERE id = $1", [levelId]);
  if (res.rows.length === 0) throw notFound("Level tidak ditemukan");
  return res.rows[0];
}

/** Ambil satu level lengkap dengan nama subject (untuk respons CRUD). */
async function getJoinedById(levelId) {
  const res = await pool.query(
    `SELECT l.id, l.subject_id, l.name, l.difficulty, l.description,
            l.order_index, l.status, l.created_at, l.updated_at,
            s.name AS subject_name
       FROM levels l
       LEFT JOIN subjects s ON s.id = l.subject_id
      WHERE l.id = $1`,
    [levelId]
  );
  return res.rows[0] || null;
}

async function assertSubjectExists(subjectId) {
  const res = await pool.query("SELECT id FROM subjects WHERE id = $1", [subjectId]);
  if (res.rows.length === 0) throw notFound("Subject tidak ditemukan");
}

async function nextOrderIndex(client, subjectId) {
  const res = await client.query(
    "SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM levels WHERE subject_id = $1",
    [subjectId]
  );
  return Number(res.rows[0].next_order);
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest(`${field} wajib diisi`);
  }
  return value.trim();
}

/** Teks opsional: undefined/null/"" -> null. */
function optionalText(value) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw badRequest("description harus berupa teks");
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function requireEnum(value, allowed, field) {
  if (typeof value !== "string") {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  const v = value.toUpperCase();
  if (!allowed.includes(v)) {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  return v;
}

function requireInteger(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw badRequest(`${field} harus berupa bilangan bulat >= 1`);
  }
  return n;
}

function requireUuid(value, field) {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw badRequest(`${field} harus berupa UUID yang valid`);
  }
  return value;
}

/**
 * Terjemahkan error PostgreSQL menjadi ApiError berstatus HTTP.
 * UNIQUE (23505) -> 409, FK (23503) -> 400.
 */
function translatePgError(error) {
  if (error && error.name === "ApiError") return error;
  const code = error && error.code;
  if (code === "23505") {
    return conflict("Data bentrok (kemungkinan nama atau urutan level ganda)");
  }
  if (code === "23503") {
    return badRequest("Data rujukan tidak valid (subject/level tidak ditemukan)");
  }
  return error;
}

module.exports = levelService;
