// ============================================================
// XOLEARN — Learning History Service
// backend/services/historyService.js
// ============================================================
// Menelusuri seluruh riwayat aktivitas belajar (audit trail / events):
//   - Events: ASSESSMENT_STARTED, ASSESSMENT_COMPLETED, PRACTICE_STARTED,
//     PRACTICE_COMPLETED, DIAGNOSTIC_VERIFIED, RECOMMENDATION_COMPLETED,
//     REASSESSMENT_COMPLETED, LEARNING_PATH_UPDATED
//   - Overview: metrik konsep (mastered, in practice, confirmed gap, possible gap, not assessed)
//   - Growth: perbandingan skor pada asesmen yang dapat dibandingkan (re-assessment / repeat)
//   - Insights: Next Best Action & rekomendasi aktif berbasis bukti
// ============================================================

const pool = require("../db");
const recommendationService = require("./recommendationService");

const historyService = {
  /**
   * Catat satu learning event ke tabel learning_events
   */
  async logEvent(learnerId, eventType, entityType, entityId, metadata = null) {
    if (!learnerId || !eventType) return null;
    const res = await pool.query(
      `INSERT INTO learning_events
          (learner_id, event_type, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, occurred_at`,
      [
        learnerId,
        eventType,
        entityType || "system",
        entityId || null,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
    return res.rows[0];
  },

  /**
   * Ambil riwayat belajar lengkap, progres konsep, dan pertumbuhan mastery untuk learner
   */
  async getLearnerHistory(learnerId, { limit = 50, offset = 0, eventType } = {}) {
    const lim = Math.max(1, Math.min(100, Number(limit) || 50));
    const off = Math.max(0, Number(offset) || 0);

    // ============================================================
    // 1. QUERY LEARNING EVENTS & ENRICH DENGAN ENTITAS NYATA
    // ============================================================
    let eventQuery = `
      SELECT id, event_type, entity_type, entity_id, metadata, occurred_at
        FROM learning_events
       WHERE learner_id = $1
    `;
    const params = [learnerId];

    if (eventType) {
      params.push(eventType);
      eventQuery += ` AND event_type = $${params.length}`;
    }

    eventQuery += ` ORDER BY occurred_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(lim, off);

    const eventsRes = await pool.query(eventQuery, params);

    let countQuery = `SELECT COUNT(*)::int AS total FROM learning_events WHERE learner_id = $1`;
    const countParams = [learnerId];
    if (eventType) {
      countParams.push(eventType);
      countQuery += ` AND event_type = $2`;
    }
    const countRes = await pool.query(countQuery, countParams);
    const totalEvents = countRes.rows[0]?.total || 0;

    // Kumpulkan ID entitas untuk batch lookup (mencegah N+1 query)
    const rawEvents = eventsRes.rows.map((r) => ({
      ...r,
      metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata || {},
    }));

    const attemptIds = [];
    const diagnosticIds = [];
    const actionIds = [];

    for (const ev of rawEvents) {
      if (ev.entity_type === "attempt" && ev.entity_id) attemptIds.push(ev.entity_id);
      else if (ev.entity_type === "diagnostic" && ev.entity_id) diagnosticIds.push(ev.entity_id);
      else if ((ev.entity_type === "learning_action" || ev.entity_type === "action") && ev.entity_id) actionIds.push(ev.entity_id);
    }

    // Batch query attempts
    const attemptsMap = new Map();
    if (attemptIds.length > 0) {
      const attRes = await pool.query(
        `SELECT att.id, a.title AS assessment_title, a.type AS assessment_type,
                att.score, att.status, att.completed_at
           FROM attempts att
           JOIN assessments a ON a.id = att.assessment_id
          WHERE att.id = ANY($1::uuid[])`,
        [attemptIds]
      );
      for (const row of attRes.rows) {
        attemptsMap.set(row.id, row);
      }
    }

    // Batch query diagnostics
    const diagnosticsMap = new Map();
    if (diagnosticIds.length > 0) {
      const diagRes = await pool.query(
        `SELECT d.id, c.name AS concept_name, rc.name AS candidate_root_cause_name,
                d.diagnostic_status, d.verification_result
           FROM diagnostics d
           JOIN concepts c ON c.id = d.concept_id
           LEFT JOIN concepts rc ON rc.id = d.candidate_root_cause_id
          WHERE d.id = ANY($1::uuid[])`,
        [diagnosticIds]
      );
      for (const row of diagRes.rows) {
        diagnosticsMap.set(row.id, row);
      }
    }

    // Batch query actions
    const actionsMap = new Map();
    if (actionIds.length > 0) {
      const actRes = await pool.query(
        `SELECT la.id, la.action_type, la.reason, la.status, c.name AS concept_name
           FROM learning_actions la
           JOIN concepts c ON c.id = la.concept_id
          WHERE la.id = ANY($1::uuid[])`,
        [actionIds]
      );
      for (const row of actRes.rows) {
        actionsMap.set(row.id, row);
      }
    }

    // Bentuk enriched timeline
    const timeline = rawEvents.map((ev) => {
      let enrichedTitle = ev.metadata?.title || ev.event_type;
      let enrichedSubtitle = ev.metadata?.reason || null;
      let score = ev.metadata?.score !== undefined ? ev.metadata.score : null;
      let status = null;

      const evTypeUpper = String(ev.event_type || "").toUpperCase();
      let activityLabel = "Aktivitas Belajar";
      if (evTypeUpper.includes("REASSESSMENT")) {
        activityLabel = "Uji Ulang (Re-assessment)";
      } else if (evTypeUpper.includes("ASSESSMENT")) {
        activityLabel = "Asesmen";
      } else if (evTypeUpper.includes("DIAGNOSTIC")) {
        activityLabel = "Verifikasi Diagnostik";
      } else if (evTypeUpper.includes("PRACTICE")) {
        activityLabel = "Latihan Mandiri / Remedi";
      } else if (evTypeUpper.includes("LOGIN")) {
        activityLabel = "Masuk Akun";
      }

      if (ev.entity_type === "attempt" && attemptsMap.has(ev.entity_id)) {
        const att = attemptsMap.get(ev.entity_id);
        enrichedTitle = att.assessment_title;
        enrichedSubtitle = `Asesmen (${att.assessment_type})`;
        score = att.score !== null ? Number(att.score) : score;
        status = att.status;
      } else if (ev.entity_type === "diagnostic" && diagnosticsMap.has(ev.entity_id)) {
        const d = diagnosticsMap.get(ev.entity_id);
        enrichedTitle = `Verifikasi: ${d.concept_name}`;
        enrichedSubtitle = d.candidate_root_cause_name ? `Prasyarat: ${d.candidate_root_cause_name}` : null;
        status = d.diagnostic_status;
      } else if ((ev.entity_type === "learning_action" || ev.entity_type === "action") && actionsMap.has(ev.entity_id)) {
        const a = actionsMap.get(ev.entity_id);
        enrichedTitle = `${a.action_type.replace(/_/g, " ")}: ${a.concept_name}`;
        enrichedSubtitle = a.reason;
        status = a.status;
      }

      return {
        id: ev.id,
        event_type: ev.event_type,
        activity_label: activityLabel,
        entity_type: ev.entity_type,
        entity_id: ev.entity_id,
        title: enrichedTitle,
        subtitle: enrichedSubtitle,
        score: score !== null ? Number(score) : null,
        status: status,
        occurred_at: ev.occurred_at,
        metadata: ev.metadata,
      };
    });

    // ============================================================
    // 2. LEARNER PROGRESS OVERVIEW DARI DATA RIIL (TANPA ANGKA DUMMY)
    // ============================================================
    // Ambil subject preferensi learner (jika ada) untuk membatasi kurikulum yang relevan
    const prefRes = await pool.query(
      `SELECT preferred_subject_id FROM learner_profiles WHERE user_id = $1`,
      [learnerId]
    );
    const prefSubjectId = prefRes.rows[0]?.preferred_subject_id || null;

    let conceptsQuery = `
      SELECT c.id, c.name, c.description
        FROM concepts c
    `;
    const conceptsQueryParams = [];
    if (prefSubjectId) {
      conceptsQuery = `
        SELECT DISTINCT c.id, c.name, c.description
          FROM concepts c
          JOIN topic_concepts tc ON tc.concept_id = c.id
          JOIN topics t ON t.id = tc.topic_id
          JOIN levels l ON l.id = t.level_id
         WHERE l.subject_id = $1
         ORDER BY c.name ASC
      `;
      conceptsQueryParams.push(prefSubjectId);
    } else {
      conceptsQuery += ` ORDER BY c.name ASC`;
    }

    const allConceptsRes = await pool.query(conceptsQuery, conceptsQueryParams);
    const allConcepts = allConceptsRes.rows;

    // Ambil seluruh state konsep learner
    const statesRes = await pool.query(
      `SELECT concept_id, mastery_score, evidence_confidence, evidence_count,
              gap_status, primary_error_pattern, last_assessed_at
         FROM learner_concept_states
        WHERE learner_id = $1`,
      [learnerId]
    );
    const stateByConcept = new Map();
    for (const s of statesRes.rows) {
      stateByConcept.set(s.concept_id, s);
    }

    let masteredCount = 0;
    let inPracticeCount = 0;
    let confirmedGapCount = 0;
    let possibleGapCount = 0;
    let notAssessedCount = 0;
    let assessedCount = 0;
    let totalMasterySum = 0;

    const conceptsDetail = allConcepts.map((c) => {
      const state = stateByConcept.get(c.id) || null;
      const evidenceCount = state ? Number(state.evidence_count) : 0;
      const isAssessed = state !== null && evidenceCount > 0;
      const masteryScore = isAssessed && state.mastery_score !== null ? Number(state.mastery_score) : null;

      let learningStatus = "NOT_ASSESSED";
      if (isAssessed) {
        assessedCount++;
        if (masteryScore !== null) totalMasterySum += masteryScore;

        if (masteryScore !== null && masteryScore >= 70) {
          learningStatus = "MASTERED";
          masteredCount++;
        } else if (state.gap_status === "IN_PRACTICE") {
          learningStatus = "IN_PRACTICE";
          inPracticeCount++;
        } else if (state.gap_status === "CONFIRMED") {
          learningStatus = "CONFIRMED_GAP";
          confirmedGapCount++;
        } else if (["POSSIBLE_GAP", "VERIFICATION", "HYPOTHESIS"].includes(state.gap_status)) {
          learningStatus = "POSSIBLE_GAP";
          possibleGapCount++;
        } else {
          learningStatus = state.gap_status || "EVALUATED";
        }
      } else {
        notAssessedCount++;
      }

      return {
        id: c.id,
        name: c.name,
        description: c.description,
        is_assessed: isAssessed,
        is_gap: ["CONFIRMED_GAP", "POSSIBLE_GAP"].includes(learningStatus),
        mastery_score: masteryScore,
        learning_status: learningStatus,
        evidence_count: evidenceCount,
        evidence_confidence: state?.evidence_confidence != null ? Number(state.evidence_confidence) : null,
        last_assessed_at: state?.last_assessed_at || null,
      };
    });

    const averageMastery = assessedCount > 0
      ? Math.round((totalMasterySum / assessedCount) * 10) / 10
      : null;

    const overview = {
      total_concepts: allConcepts.length,
      mastered_concepts: masteredCount,
      in_practice_concepts: inPracticeCount,
      confirmed_gap_concepts: confirmedGapCount,
      possible_gap_concepts: possibleGapCount,
      not_assessed_concepts: notAssessedCount,
      unassessed_concepts: notAssessedCount,
      assessed_concepts: assessedCount,
      assessed_concepts_count: assessedCount,
      average_mastery: averageMastery,
      mastery_percentage: allConcepts.length > 0 ? Math.round((masteredCount / allConcepts.length) * 100) : 0,
      concepts_detail: conceptsDetail,
      concepts_breakdown: conceptsDetail,
    };

    // ============================================================
    // 3. MASTERY GROWTH (PERBANDINGAN SKOR ATTEMPTS SEPADAN)
    // ============================================================
    const completedAttemptsRes = await pool.query(
      `SELECT att.id, att.assessment_id, a.title AS assessment_title,
              a.type AS assessment_type, att.score, att.completed_at
         FROM attempts att
         JOIN assessments a ON a.id = att.assessment_id
        WHERE att.learner_id = $1
          AND att.status = 'COMPLETED'
          AND att.score IS NOT NULL
        ORDER BY a.title ASC, att.completed_at ASC`,
      [learnerId]
    );

    const attemptsByAssessment = new Map();
    for (const r of completedAttemptsRes.rows) {
      if (!attemptsByAssessment.has(r.assessment_id)) {
        attemptsByAssessment.set(r.assessment_id, []);
      }
      attemptsByAssessment.get(r.assessment_id).push(r);
    }

    const comparableAssessments = [];
    const singleAttemptAssessments = [];

    for (const [asmtId, attList] of attemptsByAssessment.entries()) {
      if (attList.length >= 2) {
        const first = attList[0];
        const latest = attList[attList.length - 1];
        const firstScore = Number(first.score);
        const latestScore = Number(latest.score);
        const diff = Math.round((latestScore - firstScore) * 10) / 10;

        const progression = attList.map((a, idx) => ({
          attempt_id: a.id,
          attempt_number: idx + 1,
          score: Number(a.score),
          completed_at: a.completed_at,
        }));

        comparableAssessments.push({
          assessment_id: asmtId,
          assessment_title: latest.assessment_title,
          assessment_type: latest.assessment_type,
          is_comparable: true,
          total_completed_attempts: attList.length,
          attempts_count: attList.length,
          initial_score: firstScore,
          latest_score: latestScore,
          score_difference: diff,
          improved: diff > 0,
          initial_completed_at: first.completed_at,
          latest_completed_at: latest.completed_at,
          attempts_progression: progression,
          attempts: progression,
          notes: "Tersedia perbandingan perkembangan pengerjaan pada instrumen yang sama.",
        });
      } else {
        const single = attList[0];
        const singleItem = {
          assessment_id: asmtId,
          assessment_title: single.assessment_title,
          assessment_type: single.assessment_type,
          is_comparable: false,
          total_completed_attempts: 1,
          attempts_count: 1,
          initial_score: Number(single.score),
          latest_score: Number(single.score),
          score: Number(single.score),
          score_difference: null,
          improved: null,
          initial_completed_at: single.completed_at,
          latest_completed_at: single.completed_at,
          completed_at: single.completed_at,
          attempts_progression: [
            {
              attempt_id: single.id,
              attempt_number: 1,
              score: Number(single.score),
              completed_at: single.completed_at,
            },
          ],
          attempts: [
            {
              attempt_id: single.id,
              attempt_number: 1,
              score: Number(single.score),
              completed_at: single.completed_at,
            },
          ],
          notes: "Dibutuhkan minimal 2 kali penyelesaian asesmen pada instrumen yang sama untuk menghasilkan perbandingan pertumbuhan yang valid.",
        };
        singleAttemptAssessments.push(singleItem);
        comparableAssessments.push(singleItem);
      }
    }

    const hasValidComparisons = comparableAssessments.some((c) => c.is_comparable);

    const growth = {
      has_comparisons: hasValidComparisons,
      comparable_assessments: comparableAssessments,
      single_attempt_assessments: singleAttemptAssessments,
      note: hasValidComparisons
        ? "Perbandingan perkembangan dihitung secara objektif berdasarkan pengerjaan berulang atau re-assessment pada instrumen asesmen yang sama."
        : "Belum tersedia pengerjaan berulang pada instrumen yang sama. Ambil re-assessment untuk memvalidasi peningkatan skor Anda.",
    };

    // ============================================================
    // 4. ACTIONABLE INSIGHTS (NEXT BEST ACTION & REKOMENDASI AKTIF)
    // ============================================================
    let nextBestAction = null;
    let activeRecommendations = [];
    try {
      nextBestAction = await recommendationService.getNextStep(learnerId);
      activeRecommendations = await recommendationService.listForLearner(learnerId);
    } catch (recErr) {
      console.warn("Could not load recommendations for history insights:", recErr.message);
    }

    let nextStepFormatted = null;
    if (nextBestAction) {
      let targetUrl = "/learning-path";
      let ctaText = "Buka Peta Pembelajaran →";

      if (nextBestAction.action_type === "RUN_DIAGNOSTIC" && nextBestAction.diagnostic_id) {
        targetUrl = `/verification/${nextBestAction.diagnostic_id}`;
        ctaText = "Mulai Verifikasi Diagnostik →";
      } else if (
        ["PREREQUISITE_PRACTICE", "TARGETED_PRACTICE"].includes(nextBestAction.action_type)
      ) {
        targetUrl = `/practice/${nextBestAction.id}`;
        ctaText = "Mulai Latihan Terarah →";
      }

      nextStepFormatted = {
        id: nextBestAction.id,
        action_type: nextBestAction.action_type,
        concept_name: nextBestAction.concept_name,
        reason: nextBestAction.reason,
        priority: nextBestAction.priority,
        target_url: targetUrl,
        cta_text: ctaText,
      };
    }

    const insights = {
      next_best_action: nextStepFormatted,
      active_recommendations: (activeRecommendations || []).slice(0, 5),
    };

    // ============================================================
    // 5. SUMMARY EKSISTING (UNTUK BACKWARD COMPATIBILITY)
    // ============================================================
    const attemptsSummaryRes = await pool.query(
      `SELECT
          COUNT(*)::int AS total_attempts,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END)::int AS completed_attempts,
          ROUND(AVG(CASE WHEN status = 'COMPLETED' AND score IS NOT NULL THEN score END), 2) AS average_score
         FROM attempts
        WHERE learner_id = $1`,
      [learnerId]
    );
    const attemptStats = attemptsSummaryRes.rows[0] || {
      total_attempts: 0,
      completed_attempts: 0,
      average_score: null,
    };

    const recentAttemptsRes = await pool.query(
      `SELECT att.id, att.assessment_id, a.title, a.type, att.status,
              att.score, att.started_at, att.completed_at
         FROM attempts att
         JOIN assessments a ON a.id = att.assessment_id
        WHERE att.learner_id = $1
        ORDER BY att.started_at DESC
        LIMIT 5`,
      [learnerId]
    );

    return {
      overview,
      history: {
        timeline,
        total_events: totalEvents,
        pagination: {
          total: totalEvents,
          limit: lim,
          offset: off,
        },
      },
      growth,
      insights,
      // Backward compatibility fields
      summary: {
        total_events: totalEvents,
        total_attempts: attemptStats.total_attempts,
        completed_attempts: attemptStats.completed_attempts,
        average_score: attemptStats.average_score != null ? Number(attemptStats.average_score) : null,
        mastered_concepts: masteredCount,
        resolved_gaps: inPracticeCount + confirmedGapCount,
        active_gaps: confirmedGapCount + possibleGapCount,
      },
      recent_attempts: recentAttemptsRes.rows,
      events: rawEvents,
      pagination: {
        total: totalEvents,
        limit: lim,
        offset: off,
      },
    };
  },
};

module.exports = historyService;
