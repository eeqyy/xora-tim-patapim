// ============================================================
// XORA — Concept Service
// backend/services/conceptService.js
// ============================================================
// Berisi GET publik (dipakai peserta/admin) + CRUD admin untuk konsep
// beserta pengelolaan prerequisite-nya.
//
// Aturan penting:
//   - Payload dari client memakai camelCase, kolom database snake_case.
//   - Semua penulisan prerequisite divalidasi di dalam SATU transaksi:
//     id harus UUID, ada, dan berasal dari subject yang sama, tanpa self-loop.
// ============================================================

const pool = require("../db");
const { badRequest, notFound, conflict, isValidUuid } = require("../utils/errors");

const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"];

const conceptService = {
  async getAll() {
    const result = await pool.query(`
      SELECT c.id, c.subject_id, c.name, c.description,
             c.status, c.created_at, c.updated_at,
             s.name AS subject_name
      FROM concepts c
      LEFT JOIN subjects s ON s.id = c.subject_id
      ORDER BY c.name ASC
    `);
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(`
      SELECT c.id, c.subject_id, c.name, c.description,
             c.status, c.created_at, c.updated_at,
             s.name AS subject_name
      FROM concepts c
      JOIN subjects s ON s.id = c.subject_id
      WHERE c.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async getBySubjectId(subjectId) {
    const result = await pool.query(
      "SELECT id, name, description, status, created_at, updated_at FROM concepts WHERE subject_id = $1 ORDER BY name ASC",
      [subjectId]
    );
    return result.rows;
  },

  async getPrerequisites(conceptId) {
    const result = await pool.query(`
      SELECT cp.id, cp.prerequisite_concept_id, cp.dependency_weight,
             c.name AS prerequisite_name
      FROM concept_prerequisites cp
      JOIN concepts c ON c.id = cp.prerequisite_concept_id
      WHERE cp.concept_id = $1
      ORDER BY c.name ASC
    `, [conceptId]);
    return result.rows;
  },

  /**
   * Tambah konsep. Bila `prerequisiteIds` dikirim, baris prerequisite ikut
   * dibuat pada transaksi yang sama. Mengembalikan row konsep + `prerequisiteIds`.
   */
  async create(payload = {}) {
    const subjectId = requireUuid(payload.subjectId, "subjectId");
    const name = requireText(payload.name, "name");
    const description = optionalText(payload.description, "description");
    const status = optionalEnum(payload.status, CONTENT_STATUSES, "status") || "DRAFT";
    const prerequisiteIds =
      payload.prerequisiteIds === undefined
        ? []
        : parsePrerequisiteIds(payload.prerequisiteIds);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Subject tujuan harus ada (404 bila tidak).
      await assertSubjectExists(client, subjectId);

      // Semua prerequisite harus ada & berasal dari subject yang sama.
      await assertPrerequisitesValid(client, subjectId, prerequisiteIds);

      const inserted = await client.query(
        `INSERT INTO concepts (subject_id, name, description, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [subjectId, name, description, status]
      );
      const conceptId = inserted.rows[0].id;

      for (const prerequisiteId of prerequisiteIds) {
        await client.query(
          `INSERT INTO concept_prerequisites (concept_id, prerequisite_concept_id)
           VALUES ($1, $2)`,
          [conceptId, prerequisiteId]
        );
      }

      await client.query("COMMIT");
      return await getConceptWithPrerequisites(conceptId);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
  },

  /**
   * Ubah konsep (partial). `subject_id` sengaja TIDAK bisa diubah lewat sini
   * agar prerequisite tetap berada di subject yang sama.
   */
  async update(conceptId, payload = {}) {
    await getRow(conceptId);

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

    if (fields.length === 0) return await getConceptWithPrerequisites(conceptId);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `UPDATE concepts SET ${fields.join(", ")} WHERE id = $${values.length + 1} RETURNING id`,
        [...values, conceptId]
      );
      await client.query("COMMIT");
      if (updated.rows.length === 0) throw notFound("Concept tidak ditemukan");
      return await getConceptWithPrerequisites(conceptId);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
  },

  /**
   * Ganti seluruh himpunan prerequisite. Array kosong berarti menghapus semua.
   * DELETE + INSERT dilakukan dalam satu transaksi.
   */
  async setPrerequisites(conceptId, prerequisiteIds) {
    const concept = await getRow(conceptId);
    const ids = parsePrerequisiteIds(prerequisiteIds);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await assertPrerequisitesValid(client, concept.subject_id, ids, conceptId);

      await client.query(
        "DELETE FROM concept_prerequisites WHERE concept_id = $1",
        [conceptId]
      );
      for (const prerequisiteId of ids) {
        await client.query(
          `INSERT INTO concept_prerequisites (concept_id, prerequisite_concept_id)
           VALUES ($1, $2)`,
          [conceptId, prerequisiteId]
        );
      }

      await client.query("COMMIT");
      return { prerequisiteIds: await getPrerequisiteIds(conceptId) };
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
  },

  /**
   * Hapus konsep. FK RESTRICT pada concept_prerequisites (dua arah),
   * questions, topic_concepts, dan learning_actions memblokir penghapusan
   * sampai dependen tersebut dibersihkan (409 dengan nama dependen).
   *
   * materials.concept_id memakai ON DELETE SET NULL — baris materi TETAP ada,
   * hanya kolom concept_id-nya di-null-kan otomatis, sehingga tidak memblokir.
   */
  async remove(conceptId) {
    await getRow(conceptId);

    const [prereq, questions, topicConcepts, learningActions] = await Promise.all([
      countDependents(
        `SELECT COUNT(*)::int AS c FROM concept_prerequisites
          WHERE concept_id = $1 OR prerequisite_concept_id = $1`,
        conceptId
      ),
      countDependents("SELECT COUNT(*)::int AS c FROM questions WHERE concept_id = $1", conceptId),
      countDependents("SELECT COUNT(*)::int AS c FROM topic_concepts WHERE concept_id = $1", conceptId),
      countDependents("SELECT COUNT(*)::int AS c FROM learning_actions WHERE concept_id = $1", conceptId),
    ]);

    const blockers = [];
    if (prereq > 0) blockers.push(`${prereq} relasi prerequisite`);
    if (questions > 0) blockers.push(`${questions} soal`);
    if (topicConcepts > 0) blockers.push(`${topicConcepts} topik`);
    if (learningActions > 0) blockers.push(`${learningActions} aksi pembelajaran`);

    if (blockers.length > 0) {
      throw conflict(
        `Concept tidak bisa dihapus karena masih dipakai: ${blockers.join(", ")}`
      );
    }

    const deleted = await pool.query(
      "DELETE FROM concepts WHERE id = $1 RETURNING id",
      [conceptId]
    );
    if (deleted.rows.length === 0) throw notFound("Concept tidak ditemukan");
    return { deleted: conceptId };
  },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/** Ambil satu baris konsep mentah; 404 bila tidak ada. */
async function getRow(conceptId) {
  requireUuid(conceptId, "conceptId");
  const res = await pool.query("SELECT * FROM concepts WHERE id = $1", [conceptId]);
  if (res.rows.length === 0) throw notFound("Concept tidak ditemukan");
  return res.rows[0];
}

/** Ambil konsep lengkap (dengan subject_name) + daftar prerequisiteIds. */
async function getConceptWithPrerequisites(conceptId) {
  const res = await pool.query(
    `SELECT c.id, c.subject_id, c.name, c.description,
            c.status, c.created_at, c.updated_at,
            s.name AS subject_name
       FROM concepts c
       LEFT JOIN subjects s ON s.id = c.subject_id
      WHERE c.id = $1`,
    [conceptId]
  );
  if (!res.rows[0]) return null;
  const concept = res.rows[0];
  concept.prerequisiteIds = await getPrerequisiteIds(conceptId);
  return concept;
}

async function getPrerequisiteIds(conceptId) {
  const res = await pool.query(
    "SELECT prerequisite_concept_id FROM concept_prerequisites WHERE concept_id = $1 ORDER BY created_at ASC",
    [conceptId]
  );
  return res.rows.map((row) => row.prerequisite_concept_id);
}

async function assertSubjectExists(client, subjectId) {
  const res = await client.query("SELECT id FROM subjects WHERE id = $1", [subjectId]);
  if (res.rows.length === 0) throw notFound("Subject tidak ditemukan");
}

/**
 * Pastikan setiap id prerequisite ada, berasal dari subject yang sama, dan
 * (bila diberikan) bukan concept itu sendiri. Menyebutkan id yang tidak valid.
 */
async function assertPrerequisitesValid(client, subjectId, ids, selfId = null) {
  if (ids.length === 0) return;

  const res = await client.query(
    "SELECT id, subject_id FROM concepts WHERE id = ANY($1::uuid[])",
    [ids]
  );
  const subjectById = new Map(res.rows.map((row) => [row.id, row.subject_id]));

  const invalid = ids.filter((id) => {
    if (selfId && id === selfId) return true;
    const owner = subjectById.get(id);
    return !owner || owner !== subjectId;
  });

  if (invalid.length > 0) {
    throw badRequest(
      `Prerequisite tidak valid (tidak ada atau bukan dari subject yang sama): ${invalid.join(", ")}`
    );
  }
}

async function countDependents(sql, conceptId) {
  const res = await pool.query(sql, [conceptId]);
  return res.rows[0].c;
}

/** Validasi array UUID prerequisite: format, lalu duplikat. */
function parsePrerequisiteIds(raw, field = "prerequisiteIds") {
  if (!Array.isArray(raw)) {
    throw badRequest(`${field} harus berupa array UUID`);
  }

  const invalid = raw.filter((id) => !isValidUuid(id));
  if (invalid.length > 0) {
    throw badRequest(`${field} berisi UUID tidak valid: ${invalid.map(String).join(", ")}`);
  }

  const unique = new Set(raw);
  if (unique.size !== raw.length) {
    throw badRequest(`${field} berisi duplikat`);
  }

  return raw;
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest(`${field} wajib diisi`);
  }
  return value.trim();
}

function optionalText(value, field) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") throw badRequest(`${field} harus berupa teks`);
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function requireEnum(value, allowed, field) {
  if (value === undefined || value === null || value === "") {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  const normalized = String(value).toUpperCase();
  if (!allowed.includes(normalized)) {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  return normalized;
}

function optionalEnum(value, allowed, field) {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).toUpperCase();
  if (!allowed.includes(normalized)) {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  return normalized;
}

function requireUuid(value, field) {
  if (!isValidUuid(value)) {
    throw badRequest(`${field} harus berupa UUID yang valid`);
  }
  return value;
}

/**
 * Terjemahkan error PostgreSQL menjadi ApiError berstatus HTTP:
 * UNIQUE (subject_id, name) ganda -> 409, FK tidak valid -> 400.
 */
function translatePgError(error) {
  if (error && error.name === "ApiError") return error;
  const code = error && error.code;
  if (code === "23505") {
    return conflict("Nama concept sudah dipakai pada subject ini");
  }
  if (code === "23503") {
    return badRequest("Data rujukan tidak valid (subject/konsep tidak ditemukan)");
  }
  return error;
}

module.exports = conceptService;
