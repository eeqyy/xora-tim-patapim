// ============================================================
// XORA — Attempt / evidence service
// backend/services/attemptService.js
// ============================================================
// Menjawab inti loop pembelajaran (PRD):
//   learner mulai assessment -> submit jawaban
//     -> evidence tersimpan per soal (dengan concept + difficulty)
//     -> mastery dihitung dari evidence (Commit berikutnya)
//
// Dua endpoint di sini:
//   startAttempt  -> membuat attempts berstatus IN_PROGRESS + daftar soal aman
//   submitAttempt -> menilai, menutup attempts, menulis evidence
//
// KONTRAK MASUKAN SUBMIT:
//   answers: [{ questionId, answer, responseTimeSeconds? }]
//   bentuk `answer` per tipe soal (lihat utils/grading.js):
//     MULTIPLE_CHOICE -> { selected: "B" }
//     CODE            -> { code: "..." }
//     ESSAY           -> { text: "..." }
// ============================================================

const pool = require("../db");
const { grade } = require("../utils/grading");
const assessmentService = require("./assessmentService");
const masteryService = require("./masteryService");
const {
  badRequest,
  notFound,
  forbidden,
  conflict,
} = require("../utils/errors");

const MAX_RESPONSE_SECONDS = 24 * 60 * 60;

const attemptService = {
  /**
   * Mulai (atau lanjutkan) attempt untuk satu assessment.
   * Idempotent: jika masih ada attempt IN_PROGRESS yang sama, dipakai ulang.
   */
  async startAttempt(learnerId, assessmentId) {
    const assessmentResult = await pool.query(
      `SELECT id, subject_id, level_id, topic_id, type, title,
              duration_minutes, passing_score
         FROM assessments
        WHERE id = $1`,
      [assessmentId]
    );

    const assessment = assessmentResult.rows[0];
    if (!assessment) throw notFound("Assessment not found");

    const openResult = await pool.query(
      `SELECT id, started_at
         FROM attempts
        WHERE learner_id = $1
          AND assessment_id = $2
          AND status = 'IN_PROGRESS'
        ORDER BY started_at DESC
        LIMIT 1`,
      [learnerId, assessmentId]
    );

    let attemptId;
    let startedAt;

    if (openResult.rows[0]) {
      attemptId = openResult.rows[0].id;
      startedAt = openResult.rows[0].started_at;
    } else {
      const inserted = await pool.query(
        `INSERT INTO attempts (learner_id, assessment_id, status)
         VALUES ($1, $2, 'IN_PROGRESS')
         RETURNING id, started_at`,
        [learnerId, assessmentId]
      );
      attemptId = inserted.rows[0].id;
      startedAt = inserted.rows[0].started_at;

      await pool.query(
        `INSERT INTO learning_events
            (learner_id, event_type, entity_type, entity_id, metadata)
         VALUES ($1, 'ASSESSMENT_STARTED', 'attempt', $2, $3)`,
        [
          learnerId,
          attemptId,
          JSON.stringify({
            assessmentId,
            title: assessment.title,
            type: assessment.type,
          }),
        ]
      );
    }

    const questionResult = await pool.query(
      `SELECT id, type, question_text, correct_answer, points, order_index
         FROM questions
        WHERE assessment_id = $1
        ORDER BY order_index ASC`,
      [assessmentId]
    );

    return {
      attemptId,
      startedAt,
      assessment: {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        durationMinutes: assessment.duration_minutes,
        passingScore: assessment.passing_score,
      },
      // correct_answer sengaja TIDAK ikut dikirim (lihat toPublicQuestion).
      questions: questionResult.rows.map(assessmentService.toPublicQuestion),
    };
  },

  /**
   * Tutup attempt: nilai semua jawaban, tulis evidence, tandai COMPLETED.
   *
   * Transaksial — jika satu langkah gagal, tidak ada data yang setengah jadi.
   */
  async submitAttempt(learnerId, attemptId, answers) {
    if (!Array.isArray(answers) || answers.length === 0) {
      throw badRequest("answers must be a non-empty array");
    }

    const attemptResult = await pool.query(
      `SELECT id, learner_id, assessment_id, status
         FROM attempts
        WHERE id = $1`,
      [attemptId]
    );

    const attempt = attemptResult.rows[0];
    if (!attempt) throw notFound("Attempt not found");
    if (attempt.learner_id !== learnerId) {
      throw forbidden("This attempt belongs to another learner");
    }
    if (attempt.status !== "IN_PROGRESS") {
      throw conflict(`Attempt is already ${attempt.status}`);
    }

    const assessmentResult = await pool.query(
      `SELECT id, subject_id, topic_id, type, title, passing_score
         FROM assessments
        WHERE id = $1`,
      [attempt.assessment_id]
    );
    const assessment = assessmentResult.rows[0];
    if (!assessment) throw notFound("Assessment no longer exists");

    const questionResult = await pool.query(
      `SELECT q.id, q.type, q.question_text, q.correct_answer, q.points,
              q.order_index, q.concept_id, q.difficulty,
              c.name AS concept_name
         FROM questions q
         LEFT JOIN concepts c ON c.id = q.concept_id
        WHERE q.assessment_id = $1
        ORDER BY q.order_index ASC`,
      [attempt.assessment_id]
    );
    const questions = questionResult.rows;
    if (questions.length === 0) {
      throw badRequest("This assessment has no questions");
    }

    // --- 1. Validasi bentuk jawaban sebelum menyentuh database ---
    const answerByQuestionId = new Map();
    for (const entry of answers) {
      if (!entry || typeof entry.questionId !== "string") {
        throw badRequest("Each answer must include a questionId");
      }
      if (answerByQuestionId.has(entry.questionId)) {
        throw badRequest(`Duplicate answer for question ${entry.questionId}`);
      }
      answerByQuestionId.set(entry.questionId, entry);
    }

    const knownIds = new Set(questions.map((q) => q.id));
    for (const questionId of answerByQuestionId.keys()) {
      if (!knownIds.has(questionId)) {
        throw badRequest(
          `Question ${questionId} does not belong to this assessment`
        );
      }
    }

    // --- 2. Selesaikan mapping concept + difficulty untuk SEMUA soal ---
    const mapping = resolveQuestionMeta(questions);

    // --- 3. Nilai (soal tanpa jawaban dihitung salah, bukan error) ---
    const graded = mapping.map((item) => {
      const entry = answerByQuestionId.get(item.question.id);
      const submittedAnswer = entry ? entry.answer ?? {} : null;
      const result = entry
        ? grade(item.question, submittedAnswer)
        : { isCorrect: false, score: 0, errorPattern: "NO_ANSWER" };

      return {
        ...item,
        submittedAnswer,
        responseTimeSeconds: entry
          ? sanitizeResponseTime(entry.responseTimeSeconds)
          : null,
        ...result,
      };
    });

    const totalPoints = graded.reduce((sum, g) => sum + Number(g.question.points), 0);
    const earnedPoints = graded.reduce(
      (sum, g) => sum + (Number(g.question.points) * g.score) / 100,
      0
    );
    const overallScore = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    // --- 4. Tulis semuanya dalam satu transaksi ---
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE attempts
            SET status = 'COMPLETED', completed_at = NOW(), score = $2
          WHERE id = $1`,
        [attemptId, round2(overallScore)]
      );

      // Hanya soal yang DIJAWAB yang menghasilkan evidence.
      //
      // Soal yang dilewati tidak boleh jadi evidence: `answer` dan
      // `is_correct` kolomnya NOT NULL, sehingga opsi termudah adalah
      // menyimpannya sebagai score 0. Itu salah — "belum menjawab"
      // bukan bukti tidak paham konsep, dan akan menarik mastery ke bawah
      // lalu memicu POSSIBLE_GAP untuk alasan yang keliru.
      for (const g of graded) {
        if (g.submittedAnswer === null) continue;
        await client.query(
          `INSERT INTO evidence
              (attempt_id, question_id, concept_id, answer, is_correct,
               score, error_pattern, response_time_seconds)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            attemptId,
            g.question.id,
            g.conceptId,
            JSON.stringify(g.submittedAnswer),
            g.isCorrect,
            round2(g.score),
            g.errorPattern,
            g.responseTimeSeconds,
          ]
        );
      }

      await client.query(
        `INSERT INTO learning_events
            (learner_id, event_type, entity_type, entity_id, metadata)
         VALUES ($1, 'ASSESSMENT_COMPLETED', 'attempt', $2, $3)`,
        [
          learnerId,
          attemptId,
          JSON.stringify({
            assessmentId: assessment.id,
            assessmentType: assessment.type,
            score: round2(overallScore),
            passingScore: assessment.passing_score,
            passed:
              assessment.passing_score === null
                ? null
                : overallScore >= Number(assessment.passing_score),
            questionCount: graded.length,
            correctCount: graded.filter((g) => g.isCorrect).length,
          }),
        ]
      );

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    // Recalculate mastery SETELAH commit evidence berhasil.
    // Jika ini gagal, attempt tetap tersimpan (data evidence utuh).
    let mastery = [];
    try {
      mastery = await masteryService.recalculateForConcepts(
        learnerId,
        graded.map((g) => g.conceptId)
      );
    } catch (error) {
      console.error("MASTERY RECALC FAILED (evidence tetap tersimpan):", error);
    }

    return {
      attemptId,
      status: "COMPLETED",
      score: round2(overallScore),
      passingScore: assessment.passing_score,
      passed:
        assessment.passing_score === null
          ? null
          : overallScore >= Number(assessment.passing_score),
      questionCount: graded.length,
      // Soal yang dilewati tetap dihitung 0 untuk attempts.score (poin tidak
      // diperoleh), tapi TIDAK menghasilkan evidence — lihat catatan di bawah.
      answeredCount: graded.filter((g) => g.submittedAnswer !== null).length,
      unansweredCount: graded.filter((g) => g.submittedAnswer === null).length,
      correctCount: graded.filter((g) => g.isCorrect).length,
      mastery,
      perQuestion: graded.map((g) => ({
        questionId: g.question.id,
        concept: g.conceptName,
        difficulty: g.difficulty,
        answered: g.submittedAnswer !== null,
        isCorrect: g.isCorrect,
        score: round2(g.score),
        errorPattern: g.errorPattern,
      })),
    };
  },

  /**
   * Batalkan attempt yang masih berjalan -> status ABANDONED.
   *
   * Tanpa ini, attempt yang ditinggalkan (learner menutup browser di tengah
   * quiz) menggantung selamanya: startAttempt() bersifat idempoten dan akan
   * selalu mengembalikan attempt IN_PROGRESS yang sama, sehingga learner tidak
   * bisa mengulang assessment tersebut.
   *
   * Attempt yang sudah COMPLETED/ABANDONED tidak bisa dibatalkan lagi.
   */
  async abandonAttempt(learnerId, attemptId) {
    const result = await pool.query(
      `UPDATE attempts
          SET status = 'ABANDONED', completed_at = NOW()
        WHERE id = $1
          AND learner_id = $2
          AND status = 'IN_PROGRESS'
        RETURNING id, status`,
      [attemptId, learnerId]
    );

    if (result.rows[0]) {
      return { attemptId: result.rows[0].id, status: result.rows[0].status };
    }

    // Belum berubah: bedakan "milik orang lain" vs "sudah tidak IN_PROGRESS".
    const existing = await pool.query(
      "SELECT id, learner_id, status FROM attempts WHERE id = $1",
      [attemptId]
    );
    if (!existing.rows[0]) throw notFound("Attempt not found");
    if (existing.rows[0].learner_id !== learnerId) {
      throw forbidden("This attempt belongs to another learner");
    }
    throw conflict(`Attempt is already ${existing.rows[0].status}`);
  },

  /** Riwayat attempt milik satu learner. */
  async listAttempts(learnerId, assessmentId = null) {
    const params = [learnerId];
    let sql = `SELECT a.id, a.assessment_id, a.status, a.score,
                      a.started_at, a.completed_at, asmt.title AS assessment_title,
                      asmt.type AS assessment_type
                 FROM attempts a
                 JOIN assessments asmt ON asmt.id = a.assessment_id
                WHERE a.learner_id = $1`;
    if (assessmentId) {
      params.push(assessmentId);
      sql += ` AND a.assessment_id = $2`;
    }
    sql += ` ORDER BY a.started_at DESC LIMIT 100`;

    const result = await pool.query(sql, params);
    return result.rows;
  },

  /** Detail satu attempt + evidence-nya (hanya milik pemiliknya). */
  async getAttempt(learnerId, attemptId) {
    const attemptResult = await pool.query(
      `SELECT a.id, a.learner_id, a.assessment_id, a.status, a.score,
              a.started_at, a.completed_at, asmt.title AS assessment_title
         FROM attempts a
         JOIN assessments asmt ON asmt.id = a.assessment_id
        WHERE a.id = $1`,
      [attemptId]
    );
    const attempt = attemptResult.rows[0];
    if (!attempt) throw notFound("Attempt not found");
    if (attempt.learner_id !== learnerId) {
      throw forbidden("This attempt belongs to another learner");
    }

    const evidenceResult = await pool.query(
      `SELECT e.question_id, e.is_correct, e.score, e.error_pattern,
              e.response_time_seconds, e.answer,
              c.name AS concept, q.order_index, q.difficulty
         FROM evidence e
         JOIN concepts c ON c.id = e.concept_id
         JOIN questions q ON q.id = e.question_id
        WHERE e.attempt_id = $1
        ORDER BY e.created_at ASC`,
      [attemptId]
    );

    return {
      id: attempt.id,
      assessmentId: attempt.assessment_id,
      assessmentTitle: attempt.assessment_title,
      status: attempt.status,
      score: attempt.score,
      startedAt: attempt.started_at,
      completedAt: attempt.completed_at,
      evidence: evidenceResult.rows.map((row) => ({
        questionId: row.question_id,
        isCorrect: row.is_correct,
        score: row.score,
        errorPattern: row.error_pattern,
        responseTimeSeconds: row.response_time_seconds,
        answer: row.answer,
        concept: row.concept,
        difficulty: row.difficulty || "MEDIUM",
      })),
    };
  },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/**
 * Tentukan concept + difficulty untuk setiap soal.
 *
 * Sumber tunggal: kolom `questions.concept_id` + `questions.difficulty`
 * (dipindahkan dari config/questionMeta.js ke database — lihat migrasi 002).
 *
 * Menolak daripada menyimpan evidence tanpa konsep benar:
 * evidence.concept_id NOT NULL, dan salah atribusi akan merusak perhitungan
 * mastery & gap detection untuk konsep yang tidak bersalah. `concept_id`
 * sendiri NOT NULL di DB, jadi ini hanya jaring pengaman.
 */
function resolveQuestionMeta(questions) {
  const problems = [];

  const resolved = questions.map((question) => {
    if (!question.concept_id) {
      problems.push(`question #${question.order_index}: concept_id kosong`);
      return null;
    }
    return {
      question,
      conceptId: question.concept_id,
      conceptName: question.concept_name || null,
      difficulty: question.difficulty || "MEDIUM",
    };
  });

  if (problems.length > 0) {
    throw badRequest(
      "Cannot grade: soal berikut belum punya pemetaan konsep di database: " +
        problems.join("; ")
    );
  }

  return resolved;
}

function sanitizeResponseTime(value) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(MAX_RESPONSE_SECONDS, Math.round(parsed)));
}

function round2(value) {
  return Math.round(value * 100) / 100;
}

module.exports = attemptService;
