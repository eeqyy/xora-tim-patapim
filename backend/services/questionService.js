// ============================================================
// XORA — Question Service (admin CRUD)
// backend/services/questionService.js
// ============================================================
// Sumber kebenaran pemetaan soal -> konsep + kesulitan:
//   questions.concept_id dan questions.difficulty
// (dipindahkan dari backend/config/questionMeta.js — migrasi 002).
//
// Beda dengan assessmentService.getQuestionsByAssessmentId (untuk peserta,
// kunci jawaban disembunyikan), service ini mengembalikan KUNCI JAWABAN penuh
// dan dipakai HANYA oleh endpoint admin.
// ============================================================

const pool = require("../db");
const { badRequest, notFound, conflict } = require("../utils/errors");

const QUESTION_TYPES = ["MULTIPLE_CHOICE", "ESSAY", "DRAG_DROP", "CODE"];
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const questionService = {
  /**
   * Daftar soal untuk editor admin: lengkap dengan concept, difficulty,
   * dan correct_answer.
   */
  async getFullByAssessmentId(assessmentId) {
    const result = await pool.query(
      `SELECT q.id, q.assessment_id, q.concept_id, q.difficulty, q.type,
              q.question_text, q.correct_answer, q.points, q.order_index,
              c.name AS concept_name
         FROM questions q
         LEFT JOIN concepts c ON c.id = q.concept_id
        WHERE q.assessment_id = $1
        ORDER BY q.order_index ASC`,
      [assessmentId]
    );
    return result.rows.map(toFullQuestion);
  },

  /**
   * Tambah satu soal. `order_index` opsional — bila kosong dihitung sebagai
   * urutan terakhir di assessment tersebut.
   */
  async create(assessmentId, payload = {}) {
    await assertExists(assessmentId);

    const type = requireEnum(payload.type, QUESTION_TYPES, "type");
    const difficulty = optionalEnum(payload.difficulty, DIFFICULTIES, "difficulty") || "MEDIUM";
    const questionText = requireText(payload.questionText, "questionText");
    const correctAnswer = payload.correctAnswer;
    if (!correctAnswer || typeof correctAnswer !== "object" || Array.isArray(correctAnswer)) {
      throw badRequest("correctAnswer harus berupa object");
    }
    const points = requirePoints(payload.points);
    const conceptId = requireUuid(payload.conceptId, "conceptId");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const order =
        payload.orderIndex != null
          ? requireInteger(payload.orderIndex, "orderIndex")
          : await nextOrderIndex(client, assessmentId);

      const dup = await client.query(
        "SELECT 1 FROM questions WHERE assessment_id = $1 AND order_index = $2",
        [assessmentId, order]
      );
      if (dup.rows.length > 0) {
        throw conflict(`Urutan #${order} sudah dipakai soal lain di assessment ini`);
      }

      const inserted = await client.query(
        `INSERT INTO questions (assessment_id, concept_id, difficulty, type, question_text, correct_answer, points, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [assessmentId, conceptId, difficulty, type, questionText, correctAnswer, points, order]
      );

      await client.query("COMMIT");
      return await getFullRow(inserted.rows[0].id);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
  },

  /**
   * Ubah soal (partial). Hanya field yang dikirim ikut berubah.
   */
  async update(questionId, payload = {}) {
    const current = await getRow(questionId);

    const fields = [];
    const values = [];
    const push = (col, val) => {
      values.push(val);
      fields.push(`${col} = $${values.length}`);
    };

    if (payload.type !== undefined) {
      push("type", requireEnum(payload.type, QUESTION_TYPES, "type"));
    }
    if (payload.difficulty !== undefined) {
      push("difficulty", requireEnum(payload.difficulty, DIFFICULTIES, "difficulty"));
    }
    if (payload.questionText !== undefined) {
      push("question_text", requireText(payload.questionText, "questionText"));
    }
    if (payload.correctAnswer !== undefined) {
      if (
        !payload.correctAnswer ||
        typeof payload.correctAnswer !== "object" ||
        Array.isArray(payload.correctAnswer)
      ) {
        throw badRequest("correctAnswer harus berupa object");
      }
      push("correct_answer", payload.correctAnswer);
    }
    if (payload.points !== undefined) {
      push("points", requirePoints(payload.points));
    }
    if (payload.conceptId !== undefined) {
      push("concept_id", requireUuid(payload.conceptId, "conceptId"));
    }
    if (payload.orderIndex !== undefined) {
      push("order_index", requireInteger(payload.orderIndex, "orderIndex"));
    }

    if (fields.length === 0) return await getFullRow(questionId);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const updated = await client.query(
        `UPDATE questions SET ${fields.join(", ")} WHERE id = $${values.length + 1} RETURNING id`,
        [...values, questionId]
      );
      await client.query("COMMIT");
      if (updated.rows.length === 0) throw notFound("Soal tidak ditemukan");
      return await getFullRow(questionId);
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw translatePgError(error);
    } finally {
      client.release();
    }
  },

  /**
   * Hapus soal.
   * 409 bila soal pernah menjawab (ada evidence) — riwayat mastery tidak boleh
   * hilang dan FK evidence -> questions adalah RESTRICT.
   */
  async remove(questionId) {
    const question = await getRow(questionId);

    const ev = await pool.query(
      "SELECT COUNT(*)::int AS c FROM evidence WHERE question_id = $1",
      [questionId]
    );
    if (ev.rows[0].c > 0) {
      throw conflict(
        `Soal tidak bisa dihapus karena sudah dipakai pada ${ev.rows[0].c} jawaban peserta`
      );
    }

    const deleted = await pool.query(
      "DELETE FROM questions WHERE id = $1 RETURNING id",
      [questionId]
    );
    if (deleted.rows.length === 0) throw notFound("Soal tidak ditemukan");
    return questionId;
  },

  /**
   * Susun ulang urutan soal dalam satu assessment.
   * `orderedIds` harus berisi persis seluruh id soal milik assessment itu.
   * Dua fase di dalam transaksi agar tidak melanggar UNIQUE(assessment_id, order_index).
   */
  async reorder(assessmentId, orderedIds) {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      throw badRequest("orderedIds harus berupa array id soal");
    }
    const unique = new Set(orderedIds.map(String));
    if (unique.size !== orderedIds.length) {
      throw badRequest("orderedIds berisi duplikat");
    }

    const existing = await pool.query(
      "SELECT id FROM questions WHERE assessment_id = $1",
      [assessmentId]
    );
    const existingIds = new Set(existing.rows.map((r) => r.id));
    if (existingIds.size !== unique.size || !orderedIds.every((id) => existingIds.has(id))) {
      throw badRequest(
        "orderedIds harus berisi seluruh soal milik assessment ini (tidak boleh kurang/lebih/duplikat)"
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Fase 1: geser semua ke offset aman agar tidak bentrok saat bertukar posisi.
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query("UPDATE questions SET order_index = $1 WHERE id = $2", [
          1000000 + i,
          orderedIds[i],
        ]);
      }
      // Fase 2: tulis urutan final.
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query("UPDATE questions SET order_index = $1 WHERE id = $2", [
          i + 1,
          orderedIds[i],
        ]);
      }

      await client.query("COMMIT");
      return { reordered: orderedIds.length };
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

async function getRow(questionId) {
  requireUuid(questionId, "questionId");
  const res = await pool.query(
    "SELECT * FROM questions WHERE id = $1",
    [questionId]
  );
  if (res.rows.length === 0) throw notFound("Soal tidak ditemukan");
  return res.rows[0];
}

async function assertExists(id) {
  requireUuid(id, "id");
  const res = await pool.query("SELECT id FROM assessments WHERE id = $1", [id]);
  if (res.rows.length === 0) throw notFound("Assessment tidak ditemukan");
}

async function nextOrderIndex(client, assessmentId) {
  const res = await client.query(
    "SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM questions WHERE assessment_id = $1",
    [assessmentId]
  );
  return Number(res.rows[0].next_order);
}

/** Ambil satu soal lengkap (dengan nama konsep) dalam bentuk camelCase. */
async function getFullRow(questionId) {
  const res = await pool.query(
    `SELECT q.id, q.assessment_id, q.concept_id, q.difficulty, q.type,
            q.question_text, q.correct_answer, q.points, q.order_index,
            c.name AS concept_name
       FROM questions q
       LEFT JOIN concepts c ON c.id = q.concept_id
      WHERE q.id = $1`,
    [questionId]
  );
  return res.rows[0] ? toFullQuestion(res.rows[0]) : null;
}

function toFullQuestion(row) {
  if (!row) return null;
  return {
    id: row.id,
    assessmentId: row.assessment_id,
    conceptId: row.concept_id,
    conceptName: row.concept_name || null,
    difficulty: row.difficulty,
    type: row.type,
    questionText: row.question_text,
    correctAnswer: row.correct_answer,
    points: Number(row.points),
    orderIndex: row.order_index,
  };
}

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest(`${field} wajib diisi`);
  }
  return value.trim();
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

function requirePoints(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw badRequest("points harus berupa angka");
  if (n < 0) throw badRequest("points tidak boleh negatif");
  if (n > 999.99) throw badRequest("points maksimal 999.99");
  return Math.round(n * 100) / 100;
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
 * Terjemahkan error PostgreSQL menjadi ApiError yang punya HTTP status.
 * Pelanggaran UNIQUE (mis. urutan ganda) -> 409, sisanya -> 400.
 */
function translatePgError(error, assessmentId) {
  if (error && error.name === "ApiError") return error;
  const code = error && error.code;
  if (code === "23505") {
    return conflict("Data bentrok (kemungkinan urutan soal ganda)");
  }
  if (code === "23503") {
    return badRequest("Data rujukan tidak valid (assessment/konsep tidak ditemukan)");
  }
  return error;
}

module.exports = questionService;
