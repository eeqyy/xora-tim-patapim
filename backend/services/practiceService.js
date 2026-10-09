// ============================================================
// XORA — Practice Service
// backend/services/practiceService.js
// ============================================================
// "Practice" TIDAK punya tabel sendiri — model-nya reuse assessments
// (type = 'PRACTICE') + attempts + evidence, sesuai keputusan desain.
//
//   Practice model          : assessments.type = 'PRACTICE'
//   Practice concept mapping: questions.concept_id (assessment <-> concept)
//   Practice result/evidence: evidence per soal + learner_concept_states
//
// Service ini adalah lapisan baca/orchestrasi (thin) di atas assessmentService
// — TIDAK menduplikasi logika penilaian. Submit tetap memakai
// assessmentService.submitAttempt (yang juga menjalankan mastery recalc,
// gap resolution, dan recommendation lifecycle).
// ============================================================

const pool = require("../db");
const assessmentService = require("./assessmentService");
const { ApiError, notFound } = require("../utils/errors");

const practiceService = {
  // Daftar assessment bertipe PRACTICE, opsional difilter per subject/level/concept.
  async listPractices({ subjectId, levelId, conceptId } = {}) {
    const where = ["a.type = 'PRACTICE'"];
    const params = [];

    if (subjectId) {
      params.push(subjectId);
      where.push(`a.subject_id = $${params.length}`);
    }
    if (levelId) {
      params.push(levelId);
      where.push(`a.level_id = $${params.length}`);
    }
    if (conceptId) {
      params.push(conceptId);
      where.push(
        `EXISTS (SELECT 1 FROM questions q WHERE q.assessment_id = a.id AND q.concept_id = $${params.length})`
      );
    }

    const res = await pool.query(
      `SELECT a.id, a.subject_id, a.level_id, a.topic_id, a.type, a.title,
              a.duration_minutes, a.passing_score, a.created_at,
              s.name AS subject_name,
              l.name AS level_name,
              t.name AS topic_name,
              (SELECT COUNT(*)::int FROM questions q WHERE q.assessment_id = a.id) AS question_count
         FROM assessments a
         JOIN subjects s ON s.id = a.subject_id
         LEFT JOIN levels l ON l.id = a.level_id
         LEFT JOIN topics t ON t.id = a.topic_id
        WHERE ${where.join(" AND ")}
        ORDER BY a.created_at DESC, a.title ASC`,
      params
    );
    return res.rows;
  },

  // Detail practice + konsep yang dicakup (practice concept mapping).
  async getPracticeById(id) {
    const assessment = await assessmentService.getById(id);
    if (!assessment || assessment.type !== "PRACTICE") {
      throw notFound("Practice tidak ditemukan");
    }
    const concepts = await this._conceptsForAssessment(id);
    return { ...assessment, concepts };
  },

  // Mulai (atau lanjutkan) attempt practice + kirim soal aman.
  async startPractice(learnerId, assessmentId) {
    const assessment = await assessmentService.getById(assessmentId);
    if (!assessment || assessment.type !== "PRACTICE") {
      throw notFound("Practice tidak ditemukan");
    }

    const attempt = await this._delegate(() =>
      assessmentService.createAttempt(learnerId, assessmentId)
    );
    const questions = await assessmentService.getQuestionsByAssessmentId(assessmentId);
    const concepts = await this._conceptsForAssessment(assessmentId);

    return {
      attempt: {
        id: attempt.id,
        assessment_id: attempt.assessment_id,
        status: attempt.status,
        started_at: attempt.started_at,
        score: attempt.score != null ? Number(attempt.score) : null,
      },
      assessment,
      concepts,
      questions,
    };
  },

  // Submit jawaban — delegasi penuh ke assessmentService (tanpa duplikasi grading).
  async submitPractice(learnerId, attemptId, answers) {
    return this._delegate(() =>
      assessmentService.submitAttempt(learnerId, attemptId, answers)
    );
  },

  // Hasil + bukti (evidence) per soal/konsep untuk sebuah attempt practice.
  async getResult(learnerId, attemptId) {
    const attempt = await this._delegate(() =>
      assessmentService.getAttemptById(learnerId, attemptId)
    );

    const evRes = await pool.query(
      `SELECT e.id, e.question_id, e.concept_id,
              c.name AS concept_name,
              q.question_text, q.type AS question_type,
              e.answer, e.is_correct, e.score, e.error_pattern, e.created_at
         FROM evidence e
         JOIN questions q ON q.id = e.question_id
         JOIN concepts c ON c.id = e.concept_id
        WHERE e.attempt_id = $1
        ORDER BY q.order_index ASC`,
      [attemptId]
    );

    const conceptIds = Array.from(new Set(evRes.rows.map((r) => r.concept_id)));
    let concepts = [];
    if (conceptIds.length > 0) {
      const cRes = await pool.query(
        `SELECT lcs.concept_id, c.name AS concept_name,
                lcs.mastery_score, lcs.evidence_confidence,
                lcs.evidence_count, lcs.gap_status
           FROM learner_concept_states lcs
           JOIN concepts c ON c.id = lcs.concept_id
          WHERE lcs.learner_id = $1 AND lcs.concept_id = ANY($2::uuid[])`,
        [learnerId, conceptIds]
      );
      concepts = cRes.rows;
    }

    const aRes = await pool.query(
      `SELECT id, action_type, status FROM learning_actions
        WHERE learner_id = $1 AND attempt_id = $2
        LIMIT 1`,
      [learnerId, attemptId]
    );

    return {
      attempt,
      evidence: evRes.rows,
      concepts,
      recommendation: aRes.rows[0] || null,
    };
  },

  // ── Helpers ──────────────────────────────────────────────────
  // assessmentService melempar Error biasa dengan statusCode; sendError hanya
  // menghormati ApiError. Bungkus agar kode HTTP tetap benar.
  async _delegate(fn) {
    try {
      return await fn();
    } catch (err) {
      if (err && err.name === "ApiError") throw err;
      throw new ApiError(err?.statusCode || 500, err?.message || "Internal server error");
    }
  },

  async _conceptsForAssessment(assessmentId) {
    const res = await pool.query(
      `SELECT c.id, c.name, COUNT(q.id)::int AS question_count
         FROM questions q
         JOIN concepts c ON c.id = q.concept_id
        WHERE q.assessment_id = $1
        GROUP BY c.id, c.name
        ORDER BY c.name ASC`,
      [assessmentId]
    );
    return res.rows;
  },
};

module.exports = practiceService;
