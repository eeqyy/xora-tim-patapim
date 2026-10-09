// ============================================================
// XORA — Recommendation Service (learning action lifecycle)
// backend/services/recommendationService.js
// ============================================================
// Menutup siklus gap: learning_action (RECOMMENDED) -> learner menjalankan
// (IN_PROGRESS) -> selesai (COMPLETED) / dilewati (SKIPPED).
//
// "Practice" = attempt pada assessment yang memuat soal konsep target action.
// Tidak ada tabel practice tersendiri — memakai assessments/attempts/evidence.
//
// Catatan arsitektur:
//   Service ini TIDAK meng-import masteryService / assessmentService supaya
//   assessmentService bisa meng-import-nya tanpa circular dependency.
//   Ia hanya butuh pool, utils/errors, dan gapService.
// ============================================================

const pool = require("../db");
const gapService = require("./gapService");
const { badRequest, notFound, conflict } = require("../utils/errors");

const OPEN_STATUSES = ["RECOMMENDED", "IN_PROGRESS"];
const PRACTICE_TYPES = [
  "PREREQUISITE_PRACTICE",
  "TARGETED_PRACTICE",
  "COLLECT_MORE_EVIDENCE",
  "ADVANCE",
];

const recommendationService = {
  // Daftar action learner + konteks diagnostic-nya.
  async listForLearner(learnerId, statuses = OPEN_STATUSES) {
    const res = await pool.query(
      `SELECT a.id, a.concept_id, c.name AS concept_name,
              a.diagnostic_id, a.action_type, a.reason, a.priority, a.status,
              a.attempt_id, a.created_at, a.completed_at,
              d.concept_id AS gap_concept_id, gc.name AS gap_concept_name,
              d.candidate_root_cause_id
         FROM learning_actions a
         JOIN concepts c ON c.id = a.concept_id
         LEFT JOIN diagnostics d ON d.id = a.diagnostic_id
         LEFT JOIN concepts gc ON gc.id = d.concept_id
        WHERE a.learner_id = $1
          AND a.status = ANY($2::action_status[])
        ORDER BY a.priority ASC, a.created_at ASC`,
      [learnerId, statuses]
    );
    return this._attachMaterials(res.rows);
  },

  // "Next learning step": satu action paling prioritas yang belum selesai.
  async getNextStep(learnerId) {
    const res = await pool.query(
      `SELECT a.id, a.concept_id, c.name AS concept_name,
              a.diagnostic_id, a.action_type, a.reason, a.priority, a.status,
              a.attempt_id, a.created_at,
              d.concept_id AS gap_concept_id, gc.name AS gap_concept_name,
              d.candidate_root_cause_id
         FROM learning_actions a
         JOIN concepts c ON c.id = a.concept_id
         LEFT JOIN diagnostics d ON d.id = a.diagnostic_id
         LEFT JOIN concepts gc ON gc.id = d.concept_id
        WHERE a.learner_id = $1
          AND a.status = ANY($2::action_status[])
        ORDER BY a.priority ASC, a.created_at ASC
        LIMIT 1`,
      [learnerId, OPEN_STATUSES]
    );
    const action = res.rows[0] || null;
    if (!action) return null;
    const [enriched] = await this._attachMaterials([action]);
    return enriched;
  },

  // Materi belajar yang relevan dengan sebuah action.
  async getMaterialsForAction(learnerId, actionId) {
    const action = await this._getOwnedAction(learnerId, actionId);
    const materials = await this._materialsForConcept(action.concept_id);
    return { actionId: action.id, conceptId: action.concept_id, materials };
  },

  /**
   * Mulai sebuah action.
   *  - RUN_DIAGNOSTIC -> delegasi ke gapService.startVerification.
   *  - tipe practice  -> siapkan/ lanjutkan attempt pada assessment konsep target.
   */
  async startAction(learnerId, actionId) {
    const action = await this._getOwnedAction(learnerId, actionId);
    if (!OPEN_STATUSES.includes(action.status)) {
      throw conflict(`Action sudah berstatus ${action.status}`);
    }

    if (action.action_type === "RUN_DIAGNOSTIC") {
      if (!action.diagnostic_id) {
        throw badRequest("Action RUN_DIAGNOSTIC tidak punya diagnostic_id");
      }
      const verification = await gapService.startVerification(
        learnerId,
        action.diagnostic_id
      );
      await this._setActionStatus(actionId, "IN_PROGRESS", verification.attempt?.id);
      return { kind: "diagnostic", action: { ...action, status: "IN_PROGRESS" }, ...verification };
    }

    if (!PRACTICE_TYPES.includes(action.action_type)) {
      throw badRequest(`Tipe action ${action.action_type} tidak bisa dijalankan`);
    }

    // Sudah pernah mulai -> kembalikan attempt yang sama (resume).
    if (action.attempt_id) {
      const resumed = await this._attemptPayload(action.attempt_id);
      if (resumed) {
        await this._setActionStatus(actionId, "IN_PROGRESS", action.attempt_id);
        await this._markGapInPractice(learnerId, action);
        const materials = await this._materialsForConcept(action.concept_id);
        return {
          kind: "practice",
          action: { ...action, status: "IN_PROGRESS" },
          materials,
          ...resumed,
        };
      }
    }

    const assessmentId = await this._findAssessmentForConcept(action.concept_id);
    if (!assessmentId) {
      throw conflict(
        "Belum ada assessment yang memuat konsep ini untuk latihan. Kumpulkan bukti lewat asesmen lain dulu."
      );
    }

    const attempt = await this._findOrCreateAttempt(learnerId, assessmentId);
    await this._setActionStatus(actionId, "IN_PROGRESS", attempt.id);
    await this._markGapInPractice(learnerId, action);

    await this._logEvent(learnerId, "PRACTICE_STARTED", "learning_action", actionId, {
      conceptId: action.concept_id,
      actionType: action.action_type,
      attemptId: attempt.id,
      assessmentId,
    });

    const payload = await this._attemptPayload(attempt.id);
    const materials = await this._materialsForConcept(action.concept_id);
    return {
      kind: "practice",
      action: { ...action, status: "IN_PROGRESS" },
      materials,
      ...payload,
    };
  },

  // Tandai action selesai secara manual.
  async completeAction(learnerId, actionId) {
    const action = await this._getOwnedAction(learnerId, actionId);
    if (action.status === "COMPLETED") {
      return { id: actionId, status: "COMPLETED" };
    }
    await pool.query(
      `UPDATE learning_actions
          SET status = 'COMPLETED', completed_at = NOW()
        WHERE id = $1`,
      [actionId]
    );
    await this._logEvent(learnerId, "RECOMMENDATION_COMPLETED", "learning_action", actionId, {
      conceptId: action.concept_id,
      actionType: action.action_type,
      completedBy: "learner",
    });
    return { id: actionId, status: "COMPLETED" };
  },

  // Lewati action.
  async skipAction(learnerId, actionId) {
    const action = await this._getOwnedAction(learnerId, actionId);
    if (action.status === "SKIPPED") {
      return { id: actionId, status: "SKIPPED" };
    }
    await pool.query(
      `UPDATE learning_actions
          SET status = 'SKIPPED', completed_at = NOW()
        WHERE id = $1`,
      [actionId]
    );
    return { id: actionId, status: "SKIPPED" };
  },

  /**
   * Dipanggil assessmentService setelah submit attempt.
   * Jika attempt ini terkait sebuah action yang sedang IN_PROGRESS, tandai
   * action tersebut COMPLETED. (Resolusi gap ditangani masteryService.)
   */
  async onAttemptSubmitted(learnerId, attemptId) {
    const res = await pool.query(
      `UPDATE learning_actions
          SET status = 'COMPLETED', completed_at = NOW()
        WHERE learner_id = $1
          AND attempt_id = $2
          AND status = 'IN_PROGRESS'
        RETURNING id, concept_id, action_type`,
      [learnerId, attemptId]
    );
    if (res.rows.length === 0) return null;

    const action = res.rows[0];
    await this._logEvent(learnerId, "PRACTICE_COMPLETED", "learning_action", action.id, {
      conceptId: action.concept_id,
      actionType: action.action_type,
      attemptId,
    });
    return action;
  },

  // ── Helpers ──────────────────────────────────────────────────
  async _getOwnedAction(learnerId, actionId) {
    const res = await pool.query(
      `SELECT id, learner_id, concept_id, diagnostic_id, action_type, reason,
              priority, status, attempt_id
         FROM learning_actions
        WHERE id = $1`,
      [actionId]
    );
    const action = res.rows[0];
    if (!action || action.learner_id !== learnerId) {
      throw notFound("Action tidak ditemukan");
    }
    return action;
  },

  async _setActionStatus(actionId, status, attemptId = null) {
    await pool.query(
      `UPDATE learning_actions
          SET status = $2, attempt_id = COALESCE($3, attempt_id)
        WHERE id = $1`,
      [actionId, status, attemptId]
    );
  },

  // Tandai konsep gap (dari diagnostic) sebagai IN_PRACTICE bila memungkinkan.
  async _markGapInPractice(learnerId, action) {
    let gapConceptId = action.concept_id;
    if (action.diagnostic_id) {
      const d = await pool.query(
        `SELECT concept_id FROM diagnostics WHERE id = $1`,
        [action.diagnostic_id]
      );
      if (d.rows[0]) gapConceptId = d.rows[0].concept_id;
    }
    await gapService.markInPractice(learnerId, gapConceptId);
  },

  // Tempelkan daftar materi relevan ke tiap action (dedup per konsep).
  async _attachMaterials(actions) {
    const cache = new Map();
    for (const action of actions) {
      if (!cache.has(action.concept_id)) {
        cache.set(action.concept_id, await this._materialsForConcept(action.concept_id));
      }
      action.materials = cache.get(action.concept_id);
    }
    return actions;
  },

  // Materi untuk satu konsep: cocok langsung (materials.concept_id), atau
  // fallback lewat topic dari assessment yang memuat soal konsep tsb.
  async _materialsForConcept(conceptId) {
    const res = await pool.query(
      `SELECT DISTINCT m.id, m.concept_id, m.title, m.type,
              m.order_index, m.topic_id, t.name AS topic_name
         FROM materials m
         JOIN topics t ON t.id = m.topic_id
        WHERE m.status = 'PUBLISHED'
          AND (
            m.concept_id = $1
            OR m.topic_id IN (
              SELECT a.topic_id FROM assessments a
                JOIN questions q ON q.assessment_id = a.id
               WHERE q.concept_id = $1 AND a.topic_id IS NOT NULL
            )
          )
        ORDER BY m.order_index ASC, m.title ASC
        LIMIT 20`,
      [conceptId]
    );
    return res.rows;
  },

  async _findAssessmentForConcept(conceptId) {
    const res = await pool.query(
      `SELECT q.assessment_id AS id, COUNT(*)::int AS n
         FROM questions q
        WHERE q.concept_id = $1
        GROUP BY q.assessment_id
        ORDER BY COUNT(*) DESC, q.assessment_id ASC
        LIMIT 1`,
      [conceptId]
    );
    return res.rows[0]?.id || null;
  },

  async _findOrCreateAttempt(learnerId, assessmentId) {
    const existing = await pool.query(
      `SELECT id FROM attempts
        WHERE learner_id = $1 AND assessment_id = $2 AND status = 'IN_PROGRESS'
        ORDER BY started_at DESC LIMIT 1`,
      [learnerId, assessmentId]
    );
    if (existing.rows[0]) return existing.rows[0];

    const created = await pool.query(
      `INSERT INTO attempts (learner_id, assessment_id, status, started_at)
       VALUES ($1, $2, 'IN_PROGRESS', NOW())
       RETURNING id`,
      [learnerId, assessmentId]
    );
    return created.rows[0];
  },

  async _attemptPayload(attemptId) {
    const attRes = await pool.query(
      `SELECT a.id, a.assessment_id, a.status, a.started_at,
              asmt.title, asmt.type, asmt.duration_minutes, asmt.passing_score
         FROM attempts a
         JOIN assessments asmt ON asmt.id = a.assessment_id
        WHERE a.id = $1`,
      [attemptId]
    );
    const attempt = attRes.rows[0];
    if (!attempt) return null;

    const qRes = await pool.query(
      `SELECT id, type, question_text, correct_answer, points, order_index
         FROM questions WHERE assessment_id = $1 ORDER BY order_index ASC`,
      [attempt.assessment_id]
    );

    return {
      attempt: {
        id: attempt.id,
        assessment_id: attempt.assessment_id,
        status: attempt.status,
        started_at: attempt.started_at,
      },
      assessment: {
        id: attempt.assessment_id,
        title: attempt.title,
        type: attempt.type,
        duration_minutes: attempt.duration_minutes,
        passing_score: attempt.passing_score,
      },
      questions: qRes.rows.map(toPublicQuestion),
    };
  },

  async _logEvent(learnerId, eventType, entityType, entityId, metadata) {
    await pool.query(
      `INSERT INTO learning_events
          (learner_id, event_type, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [learnerId, eventType, entityType, entityId, metadata ? JSON.stringify(metadata) : null]
    );
  },
};

// Bentuk soal aman untuk peserta (tanpa kunci jawaban) — sama dengan
// assessmentService.toPublicQuestion (tidak di-import demi menghindari siklus).
function toPublicQuestion(row) {
  const correct = row.correct_answer || {};
  return {
    id: row.id,
    type: row.type,
    question_text: row.question_text,
    points: row.points,
    order_index: row.order_index,
    options: row.type === "MULTIPLE_CHOICE" ? correct.options || [] : [],
  };
}

module.exports = recommendationService;
