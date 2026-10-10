// ============================================================
// XORA — Material Service
// backend/services/materialService.js
// ============================================================
// Berisi pembacaan publik (getAll/getById) dan CRUD admin
// (create/update/remove). Semua endpoint admin dilindungi requireAuth +
// requireAdmin di layer routes.
//
// Skema materials:
//   topic_id   UUID NOT NULL (FK topics, RESTRICT)
//   concept_id UUID NULL     (FK concepts, SET NULL)
//   title      TEXT NOT NULL
//   type       material_type NOT NULL (ARTICLE|VIDEO|CODE_EXAMPLE|REFERENCE)
//   content    JSONB NOT NULL
//   order_index INTEGER NOT NULL
//   status     content_status NOT NULL DEFAULT 'DRAFT'
// ============================================================

const pool = require("../db");
const { badRequest, notFound, conflict } = require("../utils/errors");

const MATERIAL_TYPE = ["ARTICLE", "VIDEO", "CODE_EXAMPLE", "REFERENCE"];
const CONTENT_STATUS = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const materialService = {
  async getAll(filters = {}) {
    const where = [];
    const values = [];
    if (filters.topicId) {
      values.push(requireUuid(filters.topicId, "topicId"));
      where.push(`m.topic_id = $${values.length}`);
    }
    if (filters.conceptId) {
      values.push(requireUuid(filters.conceptId, "conceptId"));
      where.push(`m.concept_id = $${values.length}`);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT m.id, m.topic_id, m.concept_id, m.title, m.type,
              m.order_index, m.status, m.created_at, m.updated_at,
              t.name AS topic_name,
              l.id AS level_id, l.name AS level_name,
              l.subject_id AS subject_id, s.name AS subject_name,
              c.name AS concept_name
         FROM materials m
         JOIN topics t ON t.id = m.topic_id
         JOIN levels l ON l.id = t.level_id
         JOIN subjects s ON s.id = l.subject_id
         LEFT JOIN concepts c ON c.id = m.concept_id
         ${clause}
        ORDER BY l.order_index ASC, t.order_index ASC, m.order_index ASC, m.title ASC`,
      values
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      `SELECT m.id, m.topic_id, m.concept_id, m.title, m.type, m.content,
              m.order_index, m.status, m.created_at, m.updated_at,
              t.name AS topic_name,
              l.id AS level_id, l.name AS level_name,
              l.subject_id AS subject_id, s.name AS subject_name,
              c.name AS concept_name
         FROM materials m
         JOIN topics t ON t.id = m.topic_id
         JOIN levels l ON l.id = t.level_id
         JOIN subjects s ON s.id = l.subject_id
         LEFT JOIN concepts c ON c.id = m.concept_id
        WHERE m.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  },

  /**
   * Tambah materi pada sebuah topik.
   * `orderIndex` opsional — bila kosong dihitung sebagai urutan terakhir
   * topik tersebut (dalam transaksi yang sama).
   * `content` wajib berupa objek/array JSON (kolom NOT NULL).
   */
  async create(payload = {}) {
    const topicId = requireUuid(payload.topicId, "topicId");
    const subjectId = await getTopicSubjectId(topicId);

    const conceptId =
      payload.conceptId == null || payload.conceptId === ""
        ? null
        : requireUuid(payload.conceptId, "conceptId");
    if (conceptId) await assertConceptInSubject(conceptId, subjectId);

    const title = requireText(payload.title, "title");
    const type = requireEnum(payload.type, MATERIAL_TYPE, "type");
    const content = requireJson(payload.content, "content");
    const status =
      payload.status == null
        ? "DRAFT"
        : requireEnum(payload.status, CONTENT_STATUS, "status");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const order =
        payload.orderIndex != null
          ? requireInteger(payload.orderIndex, "orderIndex")
          : await nextOrderIndex(client, topicId);

      const inserted = await client.query(
        `INSERT INTO materials (topic_id, concept_id, title, type, content, order_index, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [topicId, conceptId, title, type, content, order, status]
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
   * Ubah materi (partial). Hanya field yang dikirim ikut berubah.
   */
  async update(id, payload = {}) {
    const current = await getRow(id);
    let subjectId = await getTopicSubjectId(current.topic_id);

    const fields = [];
    const values = [];
    const push = (col, val) => {
      values.push(val);
      fields.push(`${col} = $${values.length}`);
    };

    if (payload.topicId !== undefined) {
      const topicId = requireUuid(payload.topicId, "topicId");
      subjectId = await getTopicSubjectId(topicId);
      push("topic_id", topicId);
    }
    if (payload.conceptId !== undefined) {
      const conceptId =
        payload.conceptId == null || payload.conceptId === ""
          ? null
          : requireUuid(payload.conceptId, "conceptId");
      if (conceptId) await assertConceptInSubject(conceptId, subjectId);
      push("concept_id", conceptId);
    }
    if (payload.title !== undefined) {
      push("title", requireText(payload.title, "title"));
    }
    if (payload.type !== undefined) {
      push("type", requireEnum(payload.type, MATERIAL_TYPE, "type"));
    }
    if (payload.content !== undefined) {
      push("content", requireJson(payload.content, "content"));
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
        `UPDATE materials SET ${fields.join(", ")} WHERE id = $${values.length + 1} RETURNING id`,
        [...values, id]
      );
      if (updated.rows.length === 0) throw notFound("Materi tidak ditemukan");
      return await this.getById(id);
    } catch (error) {
      throw translatePgError(error);
    }
  },

  /**
   * Hapus materi. Tidak ada tabel yang FK ke materials, jadi selalu bisa
   * dihapus (tidak ada dependents).
   */
  async remove(id) {
    await getRow(id);
    const deleted = await pool.query(
      "DELETE FROM materials WHERE id = $1 RETURNING id",
      [id]
    );
    if (deleted.rows.length === 0) throw notFound("Materi tidak ditemukan");
    return { deleted: id };
  },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

async function getRow(materialId) {
  requireUuid(materialId, "id");
  const res = await pool.query("SELECT * FROM materials WHERE id = $1", [materialId]);
  if (res.rows.length === 0) throw notFound("Materi tidak ditemukan");
  return res.rows[0];
}

/** Ambil subject_id dari topik (via level) atau 404 bila topik tidak ada. */
async function getTopicSubjectId(topicId) {
  const res = await pool.query(
    `SELECT l.subject_id
       FROM topics t
       JOIN levels l ON l.id = t.level_id
      WHERE t.id = $1`,
    [topicId]
  );
  if (res.rows.length === 0) throw notFound("Topik tidak ditemukan");
  return res.rows[0].subject_id;
}

async function assertConceptInSubject(conceptId, subjectId) {
  const res = await pool.query(
    "SELECT subject_id FROM concepts WHERE id = $1",
    [conceptId]
  );
  if (res.rows.length === 0) throw notFound("Konsep tidak ditemukan");
  if (String(res.rows[0].subject_id) !== String(subjectId)) {
    throw badRequest("Konsep harus berada pada subjek yang sama dengan topik materi");
  }
}

async function nextOrderIndex(client, topicId) {
  const res = await client.query(
    "SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM materials WHERE topic_id = $1",
    [topicId]
  );
  return Number(res.rows[0].next_order);
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
  if (!Number.isInteger(n) || n < 0) {
    throw badRequest(`${field} harus berupa bilangan bulat >= 0`);
  }
  return n;
}

function requireEnum(value, allowed, field) {
  if (typeof value !== "string" || !allowed.includes(value.toUpperCase())) {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  return value.toUpperCase();
}

/** content wajib JSON object/array (kolom NOT NULL, driver pg men-serialize). */
function requireJson(value, field) {
  if (value === null || typeof value !== "object") {
    throw badRequest(`${field} wajib berupa objek atau array JSON`);
  }
  return value;
}

/**
 * Terjemahkan error PostgreSQL menjadi ApiError yang punya HTTP status.
 * Pelanggaran FK (topik/konsep hilang) -> 409; sisanya dibiarkan apa adanya.
 */
function translatePgError(error) {
  if (error && error.name === "ApiError") return error;
  const code = error && error.code;
  if (code === "23503") {
    return conflict("Materi mengacu pada data yang tidak ada");
  }
  return error;
}

module.exports = materialService;
