// ============================================================
// XORA — Learning History Service
// backend/services/historyService.js
// ============================================================
// Menelusuri seluruh riwayat aktivitas belajar (audit trail / events):
//   - Events: ASSESSMENT_STARTED, ASSESSMENT_COMPLETED, PRACTICE_STARTED,
//     PRACTICE_COMPLETED, DIAGNOSTIC_VERIFIED, RECOMMENDATION_COMPLETED,
//     REASSESSMENT_COMPLETED, LEARNING_PATH_UPDATED
//   - Summary: ringkasan attempt, total waktu, konsep mastered, gap resolved
// ============================================================

const pool = require("../db");

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
   * Ambil riwayat belajar lengkap untuk learner tertentu
   */
  async getLearnerHistory(learnerId, { limit = 50, offset = 0, eventType } = {}) {
    const lim = Math.max(1, Math.min(100, Number(limit) || 50));
    const off = Math.max(0, Number(offset) || 0);

    // 1. Query events
    let eventQuery = `
      SELECT id, event_type, entity_type, entity_id, metadata, occurred_at,
             occurred_at AS created_at
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

    // 2. Total count of events
    let countQuery = `SELECT COUNT(*)::int AS total FROM learning_events WHERE learner_id = $1`;
    const countParams = [learnerId];
    if (eventType) {
      countParams.push(eventType);
      countQuery += ` AND event_type = $2`;
    }
    const countRes = await pool.query(countQuery, countParams);
    const totalEvents = countRes.rows[0]?.total || 0;

    // 3. Ringkasan attempts
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

    // 4. Ringkasan konsep mastery & gap
    const masteryStatsRes = await pool.query(
      `SELECT
          COUNT(CASE WHEN gap_status = 'MASTERED' OR mastery_score >= 70 THEN 1 END)::int AS mastered_concepts,
          COUNT(CASE WHEN gap_status = 'RESOLVED' THEN 1 END)::int AS resolved_gaps,
          COUNT(CASE WHEN gap_status IN ('POSSIBLE_GAP', 'CONFIRMED', 'IN_PRACTICE') THEN 1 END)::int AS active_gaps
         FROM learner_concept_states
        WHERE learner_id = $1`,
      [learnerId]
    );
    const masteryStats = masteryStatsRes.rows[0] || {
      mastered_concepts: 0,
      resolved_gaps: 0,
      active_gaps: 0,
    };

    // 5. 5 Attempt terbaru
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
      summary: {
        total_events: totalEvents,
        total_attempts: attemptStats.total_attempts,
        completed_attempts: attemptStats.completed_attempts,
        average_score: attemptStats.average_score != null ? Number(attemptStats.average_score) : null,
        mastered_concepts: masteryStats.mastered_concepts,
        resolved_gaps: masteryStats.resolved_gaps,
        active_gaps: masteryStats.active_gaps,
      },
      recent_attempts: recentAttemptsRes.rows,
      events: eventsRes.rows.map((r) => ({
        ...r,
        metadata: typeof r.metadata === "string" ? JSON.parse(r.metadata) : r.metadata,
      })),
      pagination: {
        total: totalEvents,
        limit: lim,
        offset: off,
      },
    };
  },
};

module.exports = historyService;
