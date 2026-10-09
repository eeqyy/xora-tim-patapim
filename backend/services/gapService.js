// ============================================================
// XORA — Gap Service (diagnostic & root-cause pipeline)
// backend/services/gapService.js
// ============================================================
// Alur gap (PRD: Mastery & Gap Detection):
//   POSSIBLE_GAP  -> agregasi evidence + dugaan root cause (prerequisite)
//   VERIFICATION  -> learner mengerjakan asesmen konsep root cause
//   CONFIRMED     -> dugaan terbukti lemah  -> rekomendasi PREREQUISITE_PRACTICE
//   REJECTED      -> dugaan gugur           -> rekomendasi TARGETED_PRACTICE
//
// Catatan arsitektur:
//   - Service ini SENGAJA tidak meng-import masteryService (menghindari
//     circular dependency). Semua data dibaca langsung dari pool.
//   - Dipanggil otomatis: masteryService (deteksi) & assessmentService (resolve).
// ============================================================

const pool = require("../db");
const {
  MASTERY_CONFIG,
  getDifficultyWeight,
  standardDeviationPercent,
  round2,
  clamp01,
} = require("../config/masteryThresholds");
const { badRequest, notFound, conflict } = require("../utils/errors");

const ACTIVE_GAP_STATUSES = [
  "POSSIBLE_GAP",
  "VERIFICATION",
  "CONFIRMED",
  "REJECTED",
  "INCONCLUSIVE",
  "IN_PRACTICE",
];

const gapService = {
  // ── Agregasi evidence ────────────────────────────────────────
  // "Gap evidence aggregation": rangkum bukti nyata satu konsep.
  async aggregateEvidence(learnerId, conceptId) {
    const res = await pool.query(
      `SELECT e.id, e.score, e.error_pattern, e.created_at,
              q.difficulty
         FROM evidence e
         JOIN questions q ON q.id = e.question_id
         JOIN attempts a  ON a.id = e.attempt_id
        WHERE e.concept_id = $1
          AND a.learner_id = $2
        ORDER BY e.created_at DESC`,
      [conceptId, learnerId]
    );

    const rows = res.rows;
    const n = rows.length;
    if (n === 0) {
      return {
        conceptId,
        evidenceCount: 0,
        weightedAvg: 0,
        averageScore: 0,
        consistency: 0,
        meetsMinEvidence: false,
        errorPatterns: [],
        primaryErrorPattern: null,
        lastAssessedAt: null,
      };
    }

    let weightedSum = 0;
    let weightSum = 0;
    const scores = [];
    const patternCounts = new Map();

    for (const r of rows) {
      const w = getDifficultyWeight(r.difficulty);
      weightedSum += Number(r.score) * w;
      weightSum += w;
      scores.push(Number(r.score));
      if (r.error_pattern && String(r.error_pattern).trim()) {
        const key = String(r.error_pattern).trim();
        patternCounts.set(key, (patternCounts.get(key) || 0) + 1);
      }
    }

    const weightedAvg = weightSum > 0 ? weightedSum / weightSum : 0;
    const averageScore = scores.reduce((s, v) => s + v, 0) / n;
    const consistency =
      n >= 2 ? clamp01(1 - standardDeviationPercent(scores) / 100) : 1.0;

    const errorPatterns = Array.from(patternCounts.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count);

    return {
      conceptId,
      evidenceCount: n,
      weightedAvg: round2(weightedAvg),
      averageScore: round2(averageScore),
      consistency: round2(consistency * 100),
      meetsMinEvidence: n >= MASTERY_CONFIG.minEvidence,
      errorPatterns,
      primaryErrorPattern: errorPatterns.length ? errorPatterns[0].pattern : null,
      lastAssessedAt: rows[0].created_at,
    };
  },

  // ── Dugaan root cause ────────────────────────────────────────
  // "Connect evidence -> suspected concept": pilih prerequisite dengan
  // mastery terlemah (< masteredThreshold) sebagai kandidat root cause.
  async suspectRootCause(learnerId, conceptId) {
    const res = await pool.query(
      `SELECT cp.prerequisite_concept_id AS id,
              c.name,
              cp.dependency_weight,
              COALESCE(lcs.mastery_score, 0)  AS mastery_score,
              COALESCE(lcs.evidence_count, 0) AS evidence_count,
              lcs.gap_status
         FROM concept_prerequisites cp
         JOIN concepts c ON c.id = cp.prerequisite_concept_id
         LEFT JOIN learner_concept_states lcs
           ON lcs.concept_id = cp.prerequisite_concept_id
          AND lcs.learner_id = $2
        WHERE cp.concept_id = $1
        ORDER BY COALESCE(lcs.mastery_score, 0) ASC, c.name ASC`,
      [conceptId, learnerId]
    );

    if (res.rows.length === 0) return null;

    const weakest = res.rows[0];
    return {
      conceptId: weakest.id,
      name: weakest.name,
      masteryScore: Number(weakest.mastery_score),
      evidenceCount: Number(weakest.evidence_count),
      gapStatus: weakest.gap_status,
      dependencyWeight: Number(weakest.dependency_weight),
      isWeak: Number(weakest.mastery_score) < MASTERY_CONFIG.masteredThreshold,
      alternatives: res.rows.slice(1).map((r) => ({
        conceptId: r.id,
        name: r.name,
        masteryScore: Number(r.mastery_score),
      })),
    };
  },

  // ── Orkestrasi deteksi (dipanggil masteryService) ────────────
  async onPossibleGapDetected(learnerId, conceptId) {
    const aggregate = await this.aggregateEvidence(learnerId, conceptId);

    // Tanpa cukup bukti -> cukup minta learner kumpulkan evidence lagi.
    if (!aggregate.meetsMinEvidence) {
      await this._ensureAction(learnerId, conceptId, null, {
        actionType: "COLLECT_MORE_EVIDENCE",
        reason: `Bukti untuk konsep masih sedikit (${aggregate.evidenceCount}/${MASTERY_CONFIG.minEvidence}). Kumpulkan lebih banyak latihan.`,
        priority: 1,
      });
      return { created: false, reason: "insufficient_evidence", aggregate };
    }

    const candidate = await this.suspectRootCause(learnerId, conceptId);

    // Sudah ada diagnostic yang belum final -> idempotent refresh.
    const open = await pool.query(
      `SELECT id, candidate_root_cause_id, diagnostic_status
         FROM diagnostics
        WHERE learner_id = $1 AND concept_id = $2
          AND diagnostic_status IN ('PENDING', 'HYPOTHESIS')
        ORDER BY created_at DESC
        LIMIT 1`,
      [learnerId, conceptId]
    );

    if (open.rows.length > 0) {
      const existing = open.rows[0];
      if (
        candidate &&
        existing.candidate_root_cause_id !== candidate.conceptId
      ) {
        await pool.query(
          `UPDATE diagnostics SET candidate_root_cause_id = $1 WHERE id = $2`,
          [candidate.conceptId, existing.id]
        );
      }
      return {
        created: false,
        diagnosticId: existing.id,
        candidate,
        aggregate,
      };
    }

    if (!candidate) {
      // Tidak ada prerequisite -> tidak bisa menelusuri root cause.
      const diag = await pool.query(
        `INSERT INTO diagnostics
            (learner_id, concept_id, candidate_root_cause_id,
             diagnostic_status, verified_at)
         VALUES ($1, $2, NULL, 'INCONCLUSIVE', NOW())
         RETURNING id`,
        [learnerId, conceptId]
      );
      await this._ensureAction(learnerId, conceptId, diag.rows[0].id, {
        actionType: "COLLECT_MORE_EVIDENCE",
        reason:
          "Gap terdeteksi tetapi konsep ini tidak punya prerequisite untuk ditelusuri. Perbanyak latihan pada konsep ini.",
        priority: 1,
      });
      await this._logEvent(learnerId, "DIAGNOSTIC_GENERATED", "diagnostic", diag.rows[0].id, {
        conceptId,
        inconclusive: true,
      });
      return { created: true, diagnosticId: diag.rows[0].id, candidate: null, aggregate };
    }

    const diag = await pool.query(
      `INSERT INTO diagnostics
          (learner_id, concept_id, candidate_root_cause_id, diagnostic_status)
       VALUES ($1, $2, $3, 'HYPOTHESIS')
       RETURNING id`,
      [learnerId, conceptId, candidate.conceptId]
    );
    const diagnosticId = diag.rows[0].id;

    await this._logEvent(learnerId, "DIAGNOSTIC_GENERATED", "diagnostic", diagnosticId, {
      conceptId,
      candidateRootCauseId: candidate.conceptId,
      candidateMastery: candidate.masteryScore,
    });

    // Rekomendasi utama: jalankan verifikasi dugaan root cause.
    await this._ensureAction(learnerId, conceptId, diagnosticId, {
      actionType: "RUN_DIAGNOSTIC",
      conceptId: candidate.conceptId,
      reason: `Dugaan root cause: penguasaan "${candidate.name}" lemah (mastery ${round2(candidate.masteryScore)}). Jalankan verifikasi.`,
      priority: 1,
    });
    await this._ensureAction(learnerId, conceptId, diagnosticId, {
      actionType: "COLLECT_MORE_EVIDENCE",
      conceptId: conceptId,
      reason: "Kumpulkan lebih banyak bukti pada konsep yang bermasalah.",
      priority: 2,
    });

    await this._logEvent(learnerId, "RECOMMENDATION_CREATED", "learning_action", diagnosticId, {
      conceptId,
      actionType: "RUN_DIAGNOSTIC",
    });

    return { created: true, diagnosticId, candidate, aggregate };
  },

  // ── Mulai verifikasi (dipanggil route) ───────────────────────
  async startVerification(learnerId, diagnosticId) {
    const diagRes = await pool.query(
      `SELECT id, learner_id, concept_id, candidate_root_cause_id, diagnostic_status
         FROM diagnostics
        WHERE id = $1`,
      [diagnosticId]
    );
    if (diagRes.rows.length === 0) throw notFound("Diagnostic tidak ditemukan");
    const diag = diagRes.rows[0];

    if (diag.learner_id !== learnerId) {
      throw conflict("Diagnostic ini bukan milik Anda");
    }
    if (!["PENDING", "HYPOTHESIS"].includes(diag.diagnostic_status)) {
      throw conflict("Diagnostic sudah selesai diverifikasi");
    }
    if (!diag.candidate_root_cause_id) {
      throw badRequest("Diagnostic ini tidak memiliki kandidat root cause untuk diverifikasi");
    }

    // Sudah ada verifikasi PENDING? -> lanjutkan attempt yang sama (resume).
    const pending = await pool.query(
      `SELECT id, attempt_id, verification_assessment_id
         FROM diagnostic_verifications
        WHERE diagnostic_id = $1 AND result = 'PENDING'
        ORDER BY created_at DESC
        LIMIT 1`,
      [diagnosticId]
    );
    if (pending.rows.length > 0) {
      return this._verificationPayload(diag, pending.rows[0]);
    }

    // Pilih asesmen yang memuat soal konsep kandidat (paling banyak soalnya).
    const assessRes = await pool.query(
      `SELECT q.assessment_id AS id, COUNT(*)::int AS question_count
         FROM questions q
        WHERE q.concept_id = $1
        GROUP BY q.assessment_id
        ORDER BY COUNT(*) DESC, q.assessment_id ASC
        LIMIT 1`,
      [diag.candidate_root_cause_id]
    );
    if (assessRes.rows.length === 0) {
      throw conflict(
        "Belum ada asesmen yang memuat konsep root cause untuk verifikasi. Kumpulkan lebih banyak bukti."
      );
    }
    const assessmentId = assessRes.rows[0].id;

    const attempt = await this._findOrCreateAttempt(learnerId, assessmentId);

    const verRes = await pool.query(
      `INSERT INTO diagnostic_verifications
          (diagnostic_id, verification_assessment_id, attempt_id, result)
       VALUES ($1, $2, $3, 'PENDING')
       RETURNING id, attempt_id, verification_assessment_id`,
      [diagnosticId, assessmentId, attempt.id]
    );

    // Tandai status konsep gap sebagai VERIFICATION.
    await pool.query(
      `UPDATE learner_concept_states
          SET gap_status = 'VERIFICATION', updated_at = NOW()
        WHERE learner_id = $1 AND concept_id = $2`,
      [learnerId, diag.concept_id]
    );

    return this._verificationPayload(diag, verRes.rows[0], attempt);
  },

  async getDiagnostic(learnerId, diagnosticId) {
    const res = await pool.query(
      `SELECT d.id, d.learner_id, d.concept_id, d.candidate_root_cause_id,
              d.final_root_cause_id, d.verification_result, d.diagnostic_status,
              d.created_at, d.verified_at,
              c.name AS concept_name,
              rc.name AS candidate_root_cause_name
         FROM diagnostics d
         JOIN concepts c ON c.id = d.concept_id
         LEFT JOIN concepts rc ON rc.id = d.candidate_root_cause_id
        WHERE d.id = $1`,
      [diagnosticId]
    );
    if (res.rows.length === 0) throw notFound("Diagnostic tidak ditemukan");
    const diag = res.rows[0];
    if (diag.learner_id !== learnerId) throw notFound("Diagnostic tidak ditemukan");

    const vers = await pool.query(
      `SELECT id, verification_assessment_id, attempt_id, result,
              evidence_score, created_at
         FROM diagnostic_verifications
        WHERE diagnostic_id = $1
        ORDER BY created_at DESC`,
      [diagnosticId]
    );
    const actions = await pool.query(
      `SELECT id, concept_id, action_type, reason, priority, status, created_at
         FROM learning_actions
        WHERE diagnostic_id = $1
        ORDER BY priority ASC, created_at ASC`,
      [diagnosticId]
    );

    return { ...diag, verifications: vers.rows, actions: actions.rows };
  },

  // ── Daftar gap aktif milik learner ───────────────────────────
  async getGapsForLearner(learnerId) {
    const res = await pool.query(
      `SELECT lcs.concept_id, c.name AS concept_name,
              lcs.mastery_score, lcs.evidence_confidence, lcs.evidence_count,
              lcs.primary_error_pattern, lcs.gap_status, lcs.last_assessed_at,
              d.id AS diagnostic_id, d.diagnostic_status,
              d.candidate_root_cause_id, d.final_root_cause_id,
              d.verification_result,
              rc.name AS candidate_root_cause_name
         FROM learner_concept_states lcs
         JOIN concepts c ON c.id = lcs.concept_id
         LEFT JOIN LATERAL (
           SELECT * FROM diagnostics d2
            WHERE d2.learner_id = lcs.learner_id
              AND d2.concept_id = lcs.concept_id
            ORDER BY d2.created_at DESC
            LIMIT 1
         ) d ON TRUE
         LEFT JOIN concepts rc ON rc.id = d.candidate_root_cause_id
        WHERE lcs.learner_id = $1
          AND lcs.gap_status = ANY($2::gap_status[])
        ORDER BY lcs.mastery_score ASC`,
      [learnerId, ACTIVE_GAP_STATUSES]
    );

    const actions = await pool.query(
      `SELECT id, concept_id, diagnostic_id, action_type, reason, priority, status
         FROM learning_actions
        WHERE learner_id = $1 AND status IN ('RECOMMENDED', 'IN_PROGRESS')
        ORDER BY priority ASC, created_at ASC`,
      [learnerId]
    );

    const byConcept = new Map();
    for (const a of actions.rows) {
      if (!byConcept.has(a.concept_id)) byConcept.set(a.concept_id, []);
      byConcept.get(a.concept_id).push(a);
    }

    return res.rows.map((g) => ({
      ...g,
      actions: byConcept.get(g.concept_id) || [],
    }));
  },

  // ── Detail satu gap ──────────────────────────────────────────
  async getGapDetail(learnerId, conceptId) {
    const concept = await pool.query(
      `SELECT id, name, description FROM concepts WHERE id = $1`,
      [conceptId]
    );
    if (concept.rows.length === 0) throw notFound("Concept tidak ditemukan");

    const state = await pool.query(
      `SELECT mastery_score, evidence_confidence, evidence_count,
              primary_error_pattern, gap_status, last_assessed_at
         FROM learner_concept_states
        WHERE learner_id = $1 AND concept_id = $2`,
      [learnerId, conceptId]
    );

    const aggregate = await this.aggregateEvidence(learnerId, conceptId);
    const candidate = await this.suspectRootCause(learnerId, conceptId);
    const diagnostic = await pool.query(
      `SELECT id, candidate_root_cause_id, final_root_cause_id,
              verification_result, diagnostic_status, created_at, verified_at
         FROM diagnostics
        WHERE learner_id = $1 AND concept_id = $2
        ORDER BY created_at DESC
        LIMIT 1`,
      [learnerId, conceptId]
    );
    const actions = await pool.query(
      `SELECT id, concept_id, diagnostic_id, action_type, reason, priority, status
         FROM learning_actions
        WHERE learner_id = $1 AND concept_id = $2
        ORDER BY priority ASC, created_at ASC`,
      [learnerId, conceptId]
    );

    return {
      concept: concept.rows[0],
      state: state.rows[0] || null,
      aggregate,
      suspectRootCause: candidate,
      diagnostic: diagnostic.rows[0] || null,
      actions: actions.rows,
    };
  },

  // ── Resolusi verifikasi (dipanggil assessmentService) ────────
  // Dipanggil setelah submitAttempt. Jika attempt adalah attempt verifikasi,
  // nilai evidence konsep kandidat menentukan CONFIRMED/REJECTED.
  async resolveVerification(learnerId, attemptId) {
    const verRes = await pool.query(
      `SELECT dv.id AS verification_id, dv.diagnostic_id,
              d.learner_id, d.concept_id, d.candidate_root_cause_id
         FROM diagnostic_verifications dv
         JOIN diagnostics d ON d.id = dv.diagnostic_id
        WHERE dv.attempt_id = $1 AND dv.result = 'PENDING'
        LIMIT 1`,
      [attemptId]
    );
    if (verRes.rows.length === 0) return null;

    const ver = verRes.rows[0];
    if (ver.learner_id !== learnerId) return null;

    // Skor evidence untuk konsep kandidat di attempt ini.
    const scoreRes = await pool.query(
      `SELECT AVG(e.score)::float AS score, COUNT(*)::int AS n
         FROM evidence e
        WHERE e.attempt_id = $1 AND e.concept_id = $2`,
      [attemptId, ver.candidate_root_cause_id]
    );

    let score = scoreRes.rows[0].n > 0 ? Number(scoreRes.rows[0].score) : null;
    if (score === null) {
      // fallback: skor keseluruhan attempt
      const attRes = await pool.query(
        `SELECT score FROM attempts WHERE id = $1`,
        [attemptId]
      );
      score = attRes.rows.length ? Number(attRes.rows[0].score) : 0;
    }
    const scoreRounded = round2(score);
    const passed = scoreRounded >= MASTERY_CONFIG.masteredThreshold;

    const result = passed ? "REJECTED" : "CONFIRMED";

    await pool.query(
      `UPDATE diagnostic_verifications
          SET result = $1, evidence_score = $2
        WHERE id = $3`,
      [result, scoreRounded, ver.verification_id]
    );

    await pool.query(
      `UPDATE diagnostics
          SET verification_result = $1,
              diagnostic_status = 'VERIFIED',
              final_root_cause_id = $2,
              verified_at = NOW()
        WHERE id = $3`,
      [result, passed ? null : ver.candidate_root_cause_id, ver.diagnostic_id]
    );

    // Status konsep gap mengikuti hasil verifikasi.
    await pool.query(
      `UPDATE learner_concept_states
          SET gap_status = $1, updated_at = NOW()
        WHERE learner_id = $2 AND concept_id = $3`,
      [passed ? "REJECTED" : "CONFIRMED", learnerId, ver.concept_id]
    );

    // Rekomendasi tindak lanjut.
    if (passed) {
      await this._ensureAction(learnerId, ver.concept_id, ver.diagnostic_id, {
        actionType: "TARGETED_PRACTICE",
        conceptId: ver.concept_id,
        reason: `Dugaan root cause gugur (skor verifikasi ${scoreRounded}). Latihan terarah langsung pada konsep ini.`,
        priority: 1,
      });
    } else {
      await this._ensureAction(learnerId, ver.concept_id, ver.diagnostic_id, {
        actionType: "PREREQUISITE_PRACTICE",
        conceptId: ver.candidate_root_cause_id,
        reason: `Root cause terkonfirmasi: penguasaan prerequisite lemah (skor verifikasi ${scoreRounded}). Perkuat prerequisite dulu.`,
        priority: 1,
      });
    }

    await this._logEvent(learnerId, "DIAGNOSTIC_VERIFIED", "diagnostic", ver.diagnostic_id, {
      conceptId: ver.concept_id,
      result,
      verificationScore: scoreRounded,
    });

    return {
      diagnosticId: ver.diagnostic_id,
      result,
      verificationScore: scoreRounded,
      passed,
    };
  },

  // ── Siklus practice / rekomendasi ────────────────────────────
  // Tandai konsep gap sedang dalam latihan.
  async markInPractice(learnerId, conceptId) {
    const res = await pool.query(
      `UPDATE learner_concept_states
          SET gap_status = 'IN_PRACTICE', updated_at = NOW()
        WHERE learner_id = $1 AND concept_id = $2
          AND gap_status IN ('CONFIRMED', 'REJECTED', 'IN_PRACTICE')
        RETURNING gap_status`,
      [learnerId, conceptId]
    );
    return res.rows[0]?.gap_status || null;
  },

  // Selesaikan semua action terbuka yang terkait dengan satu konsep gap
  // (action langsung pada konsep itu, atau action dari diagnostic konsep itu).
  async completeOpenActions(learnerId, conceptId) {
    const res = await pool.query(
      `UPDATE learning_actions
          SET status = 'COMPLETED', completed_at = NOW()
        WHERE learner_id = $1
          AND status IN ('RECOMMENDED', 'IN_PROGRESS')
          AND (
            concept_id = $2
            OR diagnostic_id IN (
              SELECT id FROM diagnostics WHERE learner_id = $1 AND concept_id = $2
            )
          )
        RETURNING id, action_type, concept_id`,
      [learnerId, conceptId]
    );
    return res.rows;
  },

  // Dipanggil masteryService setelah mastery dihitung ulang untuk satu konsep.
  // Logic lifecycle:
  //   1) Konsep gap (CONFIRMED/IN_PRACTICE) yang mastery-nya pulih -> RESOLVED.
  //   2) Konsep prerequisite yang mastery-nya pulih, sementara ada action
  //      PREREQUISITE_PRACTICE terbuka -> gap induk (diagnostic.concept_id)
  //      dianggap RESOLVED dan action di-complete.
  async resolveLifecycle(learnerId, conceptId, newMastery) {
    const mastered = Number(newMastery) >= MASTERY_CONFIG.masteredThreshold;

    // 1) Gap pada konsep itu sendiri
    const stateRes = await pool.query(
      `SELECT gap_status FROM learner_concept_states
        WHERE learner_id = $1 AND concept_id = $2`,
      [learnerId, conceptId]
    );
    const gapStatus = stateRes.rows[0]?.gap_status || null;

    if (
      mastered &&
      ["CONFIRMED", "IN_PRACTICE", "RESOLVED"].includes(gapStatus)
    ) {
      if (gapStatus !== "RESOLVED") {
        await pool.query(
          `UPDATE learner_concept_states
              SET gap_status = 'RESOLVED', updated_at = NOW()
            WHERE learner_id = $1 AND concept_id = $2`,
          [learnerId, conceptId]
        );
      }
      const actions = await this.completeOpenActions(learnerId, conceptId);
      if (actions.length > 0) {
        await this._logEvent(learnerId, "RECOMMENDATION_COMPLETED", "concept", conceptId, {
          resolvedBy: "mastery",
          mastery: newMastery,
          completedActionCount: actions.length,
        });
      }
    }

    // 2) Gap induk lewat prerequisite yang pulih
    if (mastered) {
      const parents = await pool.query(
        `SELECT a.id AS action_id, d.id AS diagnostic_id, d.concept_id AS gap_concept_id
           FROM learning_actions a
           JOIN diagnostics d ON d.id = a.diagnostic_id
          WHERE a.learner_id = $1
            AND a.concept_id = $2
            AND a.action_type IN ('PREREQUISITE_PRACTICE', 'COLLECT_MORE_EVIDENCE')
            AND a.status IN ('RECOMMENDED', 'IN_PROGRESS')`,
        [learnerId, conceptId]
      );

      for (const p of parents.rows) {
        await pool.query(
          `UPDATE learner_concept_states
              SET gap_status = 'RESOLVED', updated_at = NOW()
            WHERE learner_id = $1 AND concept_id = $2
              AND gap_status IN ('CONFIRMED', 'IN_PRACTICE')`,
          [learnerId, p.gap_concept_id]
        );
        await this.completeOpenActions(learnerId, p.gap_concept_id);
        await this._logEvent(learnerId, "RECOMMENDATION_COMPLETED", "diagnostic", p.diagnostic_id, {
          resolvedBy: "prerequisite_mastery",
          prerequisiteConceptId: conceptId,
          gapConceptId: p.gap_concept_id,
          mastery: newMastery,
        });
      }
    }
  },

  // ── Helpers ──────────────────────────────────────────────────
  async _verificationPayload(diag, verification, attempt) {
    const assessRes = await pool.query(
      `SELECT id, title, type, duration_minutes, passing_score
         FROM assessments WHERE id = $1`,
      [verification.verification_assessment_id]
    );
    let attemptRow = attempt;
    if (!attemptRow && verification.attempt_id) {
      const a = await pool.query(
        `SELECT id, learner_id, assessment_id, status, started_at, completed_at, score
           FROM attempts WHERE id = $1`,
        [verification.attempt_id]
      );
      attemptRow = a.rows[0] || null;
    }
    return {
      diagnosticId: diag.id,
      conceptId: diag.concept_id,
      candidateRootCauseId: diag.candidate_root_cause_id,
      verificationId: verification.id,
      attempt: attemptRow,
      assessment: assessRes.rows[0] || null,
    };
  },

  async _findOrCreateAttempt(learnerId, assessmentId) {
    const existing = await pool.query(
      `SELECT id, learner_id, assessment_id, status, started_at, completed_at, score
         FROM attempts
        WHERE learner_id = $1 AND assessment_id = $2 AND status = 'IN_PROGRESS'
        ORDER BY started_at DESC
        LIMIT 1`,
      [learnerId, assessmentId]
    );
    if (existing.rows.length > 0) return existing.rows[0];

    const created = await pool.query(
      `INSERT INTO attempts (learner_id, assessment_id, status, started_at)
       VALUES ($1, $2, 'IN_PROGRESS', NOW())
       RETURNING id, learner_id, assessment_id, status, started_at, completed_at, score`,
      [learnerId, assessmentId]
    );
    return created.rows[0];
  },

  // Buat action bila belum ada action sejenis yang masih berjalan (idempotent).
  async _ensureAction(learnerId, conceptId, diagnosticId, opts) {
    const actionConceptId = opts.conceptId || conceptId;
    const dup = await pool.query(
      `SELECT id FROM learning_actions
        WHERE learner_id = $1 AND concept_id = $2 AND action_type = $3
          AND status IN ('RECOMMENDED', 'IN_PROGRESS')
        LIMIT 1`,
      [learnerId, actionConceptId, opts.actionType]
    );
    if (dup.rows.length > 0) return dup.rows[0].id;

    const res = await pool.query(
      `INSERT INTO learning_actions
          (learner_id, concept_id, diagnostic_id, action_type, reason, priority)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        learnerId,
        actionConceptId,
        diagnosticId,
        opts.actionType,
        opts.reason,
        opts.priority,
      ]
    );
    return res.rows[0].id;
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

module.exports = gapService;
