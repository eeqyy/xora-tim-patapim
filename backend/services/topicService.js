// ============================================================
// XORA — Topic Service
// backend/services/topicService.js
// ============================================================
// Berisi pembacaan publik (getAll/getById/getByLevelId) dan CRUD admin
// (create/update/remove). Semua endpoint admin dilindungi requireAuth +
// requireAdmin di layer routes.
// ============================================================

const pool = require("../db");
const { badRequest, notFound, conflict } = require("../utils/errors");

const CONTENT_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const topicService = {
  async getAll() {
    const result = await pool.query(`
      SELECT t.id, t.level_id, t.name, t.description,
             t.order_index, t.status, t.created_at, t.updated_at,
             l.name AS level_name,
             l.subject_id AS subject_id,
             s.name AS subject_name
      FROM topics t
      LEFT JOIN levels l ON l.id = t.level_id
      LEFT JOIN subjects s ON s.id = l.subject_id
      ORDER BY l.order_index ASC, t.order_index ASC
    `);
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(`
      SELECT t.id, t.level_id, t.name, t.description,
             t.order_index, t.status, t.created_at, t.updated_at,
             l.name AS level_name
      FROM topics t
      JOIN levels l ON l.id = t.level_id
      WHERE t.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async getByLevelId(levelId) {
    const result = await pool.query(
      "SELECT id, name, description, order_index, status, created_at, updated_at FROM topics WHERE level_id = $1 ORDER BY order_index ASC",
      [levelId]
    );
    return result.rows;
  },

  /**
   * Tambah topik pada sebuah level.
   * `orderIndex` opsional — bila kosong dihitung sebagai urutan terakhir
   * level tersebut (dalam transaksi yang sama).
   */
  async create(payload = {}) {
    const levelId = requireUuid(payload.levelId, "levelId");
    await assertLevelExists(levelId);

    const name = requireText(payload.name, "name");
    const description =
      payload.description == null ? null : String(payload.description);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const order =
        payload.orderIndex != null
          ? requireInteger(payload.orderIndex, "orderIndex")
          : await nextOrderIndex(client, levelId);

      const inserted = await client.query(
        `INSERT INTO topics (level_id, name, description, order_index)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [levelId, name, description, order]
      );

      await client.query("COMMIT");
      return await this.getById(inserted.rows[0].id);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
  },

  /**
   * Ubah topik (partial). Hanya field yang dikirim ikut berubah.
   * Mengubah levelId akan membuat orderIndex lama berpotensi bentrok —
   * pelanggaran UNIQUE diterjemahkan menjadi 409.
   */
  async update(id, payload = {}) {
    await getRow(id);

    const fields = [];
    const values = [];
    const push = (col, val) => {
      values.push(val);
      fields.push(`${col} = $${values.length}`);
    };

    if (payload.levelId !== undefined) {
      const levelId = requireUuid(payload.levelId, "levelId");
      await assertLevelExists(levelId);
      push("level_id", levelId);
    }
    if (payload.name !== undefined) {
      push("name", requireText(payload.name, "name"));
    }
    if (payload.description !== undefined) {
      push("description", payload.description === null ? null : String(payload.description));
    }
    if (payload.orderIndex !== undefined) {
      push("order_index", requireInteger(payload.orderIndex, "orderIndex"));
    }
    if (payload.status !== undefined) {
      push("status", requireEnum(payload.status, CONTENT_STATUS, "status"));
    }

    if (fields.length === 0) return await this.getById(id);

    try {
      const updated = await pool.query(
        `UPDATE topics SET ${fields.join(", ")} WHERE id = $${values.length + 1} RETURNING id`,
        [...values, id]
      );
      if (updated.rows.length === 0) throw notFound("Topic tidak ditemukan");
      return await this.getById(id);
    } catch (error) {
      throw translatePgError(error);
    }
  },

  /**
   * Hapus topik.
   * 409 bila topik masih dipakai materials, assessments, atau topic_concepts
   * (ketiganya FK RESTRICT) — menghapusnya akan memutus data turunan.
   */
  async remove(id) {
    await getRow(id);

    const dependents = await countDependents(id);
    const parts = [];
    if (dependents.materials > 0) parts.push(`${dependents.materials} materi`);
    if (dependents.assessments > 0) parts.push(`${dependents.assessments} asesmen`);
    if (dependents.topicConcepts > 0) parts.push(`${dependents.topicConcepts} konsep topik`);
    if (parts.length > 0) {
      throw conflict(
        `Topik tidak bisa dihapus karena masih dipakai oleh ${parts.join(", ")}`
      );
    }

    try {
      const deleted = await pool.query(
        "DELETE FROM topics WHERE id = $1 RETURNING id",
        [id]
      );
      if (deleted.rows.length === 0) throw notFound("Topic tidak ditemukan");
      return { deleted: id };
    } catch (error) {
      throw translatePgError(error);
    }
  },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function getRow(topicId) {
  requireUuid(topicId, "id");
  const res = await pool.query("SELECT * FROM topics WHERE id = $1", [topicId]);
  if (res.rows.length === 0) throw notFound("Topic tidak ditemukan");
  return res.rows[0];
}

async function assertLevelExists(levelId) {
  const res = await pool.query("SELECT id FROM levels WHERE id = $1", [levelId]);
  if (res.rows.length === 0) throw notFound("Level tidak ditemukan");
}

async function nextOrderIndex(client, levelId) {
  const res = await client.query(
    "SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM topics WHERE level_id = $1",
    [levelId]
  );
  return Number(res.rows[0].next_order);
}

/** Hitung berapa banyak data turunan yang menunjuk topik ini. */
async function countDependents(topicId) {
  const res = await pool.query(
    `SELECT
       (SELECT COUNT(*)::int FROM materials WHERE topic_id = $1) AS materials,
       (SELECT COUNT(*)::int FROM assessments WHERE topic_id = $1) AS assessments,
       (SELECT COUNT(*)::int FROM topic_concepts WHERE topic_id = $1) AS topic_concepts`,
    [topicId]
  );
  const row = res.rows[0];
  return {
    materials: row.materials,
    assessments: row.assessments,
    topicConcepts: row.topic_concepts,
  };
}

function requireUuid(value, field) {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw badRequest(`${field} harus berupa UUID yang valid`);
  }
  return value;
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest(`${field} wajib diisi`);
  }
  return value.trim();
}

function requireInteger(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw badRequest(`${field} harus berupa bilangan bulat >= 1`);
  }
  return n;
}

function requireEnum(value, allowed, field) {
  if (typeof value !== "string" || !allowed.includes(value.toUpperCase())) {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  return value.toUpperCase();
}

/**
 * Terjemahkan error PostgreSQL menjadi ApiError yang punya HTTP status.
 * Pelanggaran UNIQUE (nama/urutan topik ganda) -> 409, FK RESTRICT saat
 * delete -> 409, sisanya dibiarkan apa adanya.
 */
function translatePgError(error) {
  if (error && error.name === "ApiError") return error;
  const code = error && error.code;
  if (code === "23505") {
    return conflict(
      "Data bentrok (nama atau urutan topik sudah dipakai pada level ini)"
    );
  }
  if (code === "23503") {
    return conflict("Topik tidak bisa dihapus karena masih dipakai oleh data lain");
  }
  return error;
}

module.exports = topicService;
