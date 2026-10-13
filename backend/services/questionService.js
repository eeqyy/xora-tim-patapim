// ============================================================
// XOLEARN — Question Service (admin CRUD)
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
const MATERIALS = ["HTML", "CSS", "JAVASCRIPT"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const questionService = {
  /**
   * Daftar soal untuk editor admin: lengkap dengan concept, difficulty,
   * dan correct_answer.
   */
  async getFullByAssessmentId(assessmentId) {
    const result = await pool.query(
      `SELECT q.id, q.assessment_id, q.concept_id, q.difficulty, q.material, q.type,
              q.question_text, q.correct_answer, q.points, q.order_index, q.is_active, q.explanation,
              c.name AS concept_name
         FROM questions q
         LEFT JOIN concepts c ON c.id = q.concept_id
        WHERE q.assessment_id = $1
          AND q.deleted_at IS NULL
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
    const material = optionalEnum(payload.material, MATERIALS, "material") || "HTML";
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
        `INSERT INTO questions (assessment_id, concept_id, difficulty, material, type, question_text, correct_answer, points, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [assessmentId, conceptId, difficulty, material, type, questionText, correctAnswer, points, order]
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
    if (payload.material !== undefined) {
      push("material", requireEnum(payload.material, MATERIALS, "material"));
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

  // ============================================================
  // Question Bank (Bank Soal Admin)
  // ============================================================

  /**
   * Mengambil daftar soal dari Bank Soal dengan filter materi, difficulty, tipe, topik, status aktif, pencarian teks.
   */
  async listBankQuestions(filters = {}) {
    let query = `
      SELECT q.id, q.assessment_id, q.concept_id, q.difficulty, q.type,
             q.question_text, q.correct_answer, q.points, q.order_index,
             q.material, q.is_active, q.explanation, q.deleted_at,
             c.name AS concept_name,
             t.id AS topic_id, t.name AS topic_name
        FROM questions q
        LEFT JOIN concepts c ON c.id = q.concept_id
        LEFT JOIN topic_concepts tc ON tc.concept_id = c.id
        LEFT JOIN topics t ON t.id = tc.topic_id
       WHERE q.deleted_at IS NULL
    `;
    const values = [];

    if (filters.material) {
      values.push(filters.material.toUpperCase());
      query += ` AND q.material = $${values.length}`;
    }
    if (filters.difficulty) {
      values.push(filters.difficulty.toUpperCase());
      query += ` AND q.difficulty = $${values.length}`;
    }
    if (filters.type) {
      values.push(filters.type.toUpperCase());
      query += ` AND q.type = $${values.length}`;
    }
    if (filters.conceptId) {
      requireUuid(filters.conceptId, "conceptId");
      values.push(filters.conceptId);
      query += ` AND q.concept_id = $${values.length}`;
    }
    if (filters.topicId) {
      requireUuid(filters.topicId, "topicId");
      values.push(filters.topicId);
      query += ` AND t.id = $${values.length}`;
    }
    if (filters.isActive !== undefined && filters.isActive !== null && filters.isActive !== "") {
      values.push(filters.isActive === "true" || filters.isActive === true);
      query += ` AND q.is_active = $${values.length}`;
    }
    if (filters.search) {
      values.push(`%${filters.search.trim()}%`);
      query += ` AND (q.question_text ILIKE $${values.length} OR q.explanation ILIKE $${values.length})`;
    }

    query += ` ORDER BY q.material ASC, q.difficulty ASC, q.order_index ASC NULLS LAST, q.id ASC`;

    const result = await pool.query(query, values);
    return result.rows.map(toFullQuestion);
  },

  /**
   * Membuat soal baru di Bank Soal.
   */
  async createBankQuestion(payload = {}) {
    const type = requireEnum(payload.type, QUESTION_TYPES, "type");
    const difficulty = optionalEnum(payload.difficulty, DIFFICULTIES, "difficulty") || "EASY";
    const material = optionalEnum(payload.material, MATERIALS, "material");
    const questionText = requireText(payload.questionText, "questionText");
    const points = requirePoints(payload.points ?? 10);
    const conceptId = requireUuid(payload.conceptId, "conceptId");
    const explanation = payload.explanation ? String(payload.explanation).trim() : null;
    const isActive = payload.isActive !== false;
    const assessmentId = payload.assessmentId ? requireUuid(payload.assessmentId, "assessmentId") : null;

    validateCorrectAnswerStructure(type, payload.correctAnswer);

    const inserted = await pool.query(
      `INSERT INTO questions (
         assessment_id, concept_id, material, difficulty, type,
         question_text, correct_answer, points, is_active, explanation
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        assessmentId,
        conceptId,
        material,
        difficulty,
        type,
        questionText,
        payload.correctAnswer,
        points,
        isActive,
        explanation,
      ]
    );

    return await getFullRow(inserted.rows[0].id);
  },

  /**
   * Ambil satu soal spesifik dari Bank Soal berdasarkan ID.
   */
  async getBankQuestionById(questionId) {
    requireUuid(questionId, "questionId");
    const q = await getFullRow(questionId);
    if (!q || q.deletedAt) throw notFound("Soal tidak ditemukan di bank soal");
    return q;
  },

  /**
   * Ubah soal di Bank Soal (partial update).
   */
  async updateBankQuestion(questionId, payload = {}) {
    requireUuid(questionId, "questionId");
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
    if (payload.material !== undefined) {
      push("material", optionalEnum(payload.material, MATERIALS, "material"));
    }
    if (payload.questionText !== undefined) {
      push("question_text", requireText(payload.questionText, "questionText"));
    }
    if (payload.correctAnswer !== undefined) {
      const typeToCheck = payload.type || current.type;
      validateCorrectAnswerStructure(typeToCheck, payload.correctAnswer);
      push("correct_answer", payload.correctAnswer);
    }
    if (payload.points !== undefined) {
      push("points", requirePoints(payload.points));
    }
    if (payload.conceptId !== undefined) {
      push("concept_id", requireUuid(payload.conceptId, "conceptId"));
    }
    if (payload.isActive !== undefined) {
      push("is_active", Boolean(payload.isActive));
    }
    if (payload.explanation !== undefined) {
      push("explanation", payload.explanation ? String(payload.explanation).trim() : null);
    }

    if (fields.length === 0) return await getFullRow(questionId);

    values.push(questionId);
    await pool.query(
      `UPDATE questions SET ${fields.join(", ")} WHERE id = $${values.length}`,
      values
    );

    return await getFullRow(questionId);
  },

  /**
   * Hapus soal dari Bank Soal dengan proteksi integritas data historis:
   * Jika soal pernah digunakan dalam attempt atau evidence, gunakan SOFT DELETE (deleted_at).
   * Jika belum pernah digunakan, lakukan HARD DELETE aman.
   */
  async deleteBankQuestion(questionId) {
    requireUuid(questionId, "questionId");
    await getRow(questionId);

    const refCheck = await pool.query(
      `SELECT
         (SELECT COUNT(*)::int FROM evidence WHERE question_id = $1) AS ev_count,
         (SELECT COUNT(*)::int FROM attempt_questions WHERE question_id = $1) AS att_count`,
      [questionId]
    );

    const isReferenced = (refCheck.rows[0].ev_count > 0) || (refCheck.rows[0].att_count > 0);

    if (isReferenced) {
      await pool.query(
        "UPDATE questions SET deleted_at = NOW(), is_active = false WHERE id = $1",
        [questionId]
      );
      return { id: questionId, softDeleted: true, message: "Soal dinonaktifkan (soft delete) karena memiliki riwayat pengerjaan" };
    } else {
      await pool.query("DELETE FROM questions WHERE id = $1", [questionId]);
      return { id: questionId, deleted: true, message: "Soal berhasil dihapus permanen" };
    }
  },

  /**
   * Toggle status aktif soal di Bank Soal.
   */
  async toggleBankQuestionActive(questionId) {
    requireUuid(questionId, "questionId");
    const res = await pool.query(
      "UPDATE questions SET is_active = NOT is_active WHERE id = $1 AND deleted_at IS NULL RETURNING is_active",
      [questionId]
    );
    if (res.rows.length === 0) throw notFound("Soal tidak ditemukan");
    return { id: questionId, isActive: res.rows[0].is_active };
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

/** Ambil satu soal lengkap (dengan nama konsep dan topik) dalam bentuk camelCase. */
async function getFullRow(questionId) {
  const res = await pool.query(
    `SELECT q.id, q.assessment_id, q.concept_id, q.difficulty, q.type,
            q.question_text, q.correct_answer, q.points, q.order_index,
            q.material, q.is_active, q.explanation, q.deleted_at,
            c.name AS concept_name,
            t.id AS topic_id, t.name AS topic_name
       FROM questions q
       LEFT JOIN concepts c ON c.id = q.concept_id
       LEFT JOIN topic_concepts tc ON tc.concept_id = c.id
       LEFT JOIN topics t ON t.id = tc.topic_id
      WHERE q.id = $1`,
    [questionId]
  );
  return res.rows[0] ? toFullQuestion(res.rows[0]) : null;
}

function toFullQuestion(row) {
  if (!row) return null;
  return {
    id: row.id,
    assessmentId: row.assessment_id || null,
    conceptId: row.concept_id,
    conceptName: row.concept_name || null,
    topicId: row.topic_id || null,
    topicName: row.topic_name || null,
    material: row.material || null,
    difficulty: row.difficulty,
    type: row.type,
    questionText: row.question_text,
    correctAnswer: row.correct_answer,
    points: Number(row.points),
    orderIndex: row.order_index != null ? Number(row.order_index) : null,
    isActive: row.is_active !== false,
    explanation: row.explanation || null,
    deletedAt: row.deleted_at || null,
  };
}

function validateCorrectAnswerStructure(type, correctAnswer) {
  if (!correctAnswer || typeof correctAnswer !== "object" || Array.isArray(correctAnswer)) {
    throw badRequest("correctAnswer harus berupa object");
  }
  if (type === "MULTIPLE_CHOICE") {
    if (!Array.isArray(correctAnswer.options) || correctAnswer.options.length < 2) {
      throw badRequest("Soal pilihan ganda wajib memiliki minimal 2 opsi jawaban");
    }
    if (!correctAnswer.correct || typeof correctAnswer.correct !== "string") {
      throw badRequest("Soal pilihan ganda wajib memiliki kunci jawaban yang valid (huruf A, B, C, dst.)");
    }
    const correctLetter = correctAnswer.correct.trim().toUpperCase();
    const maxLetter = String.fromCharCode(64 + correctAnswer.options.length);
    if (correctLetter < "A" || correctLetter > maxLetter) {
      throw badRequest(`Kunci jawaban (${correctLetter}) di luar rentang opsi A-${maxLetter}`);
    }
  } else if (type === "DRAG_DROP") {
    if (!Array.isArray(correctAnswer.items) || correctAnswer.items.length === 0) {
      throw badRequest("Soal drag-and-drop wajib memiliki daftar items");
    }
    if (!Array.isArray(correctAnswer.targets) || correctAnswer.targets.length === 0) {
      throw badRequest("Soal drag-and-drop wajib memiliki daftar targets");
    }
    if (!correctAnswer.correct || typeof correctAnswer.correct !== "object") {
      throw badRequest("Soal drag-and-drop wajib memiliki mapping pasangan jawaban yang benar");
    }
  }
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
