// ============================================================
// XORA — System Monitor Service (kesehatan sistem & data)
// backend/services/systemMonitorService.js
// ============================================================
// Dipakai HANYA oleh routes/admin.js (role ADMIN).
// Memberi ringkasan kesehatan koneksi DB, statistik data, aktivitas
// terbaru (learning_events & audit_logs), dan agregat analytics.
// ============================================================

const pool = require("../db");

const systemMonitorService = {
  /**
   * Kesehatan sistem: status DB + latensi query ringan.
   */
  async getHealth() {
    const startedAt = Date.now();
    let database = "connected";
    let latencyMs = null;
    let message = null;

    try {
      await pool.query("SELECT 1");
      latencyMs = Date.now() - startedAt;
    } catch (error) {
      database = "disconnected";
      message = error.message || String(error);
    }

    return {
      status: database === "connected" ? "ok" : "degraded",
      database,
      db_latency_ms: latencyMs,
      uptime_seconds: Math.round(process.uptime()),
      node_version: process.version,
      timestamp: new Date().toISOString(),
      ...(message ? { message } : {}),
    };
  },

  /**
   * Statistik data utama platform.
   */
  async getStats() {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS total_users,
        (SELECT COUNT(*)::int FROM users WHERE status = 'ACTIVE') AS active_users,
        (SELECT COUNT(*)::int FROM users WHERE status = 'INACTIVE') AS inactive_users,
        (SELECT COUNT(*)::int FROM users WHERE status = 'SUSPENDED') AS suspended_users,
        (SELECT COUNT(DISTINCT ur.user_id)::int
           FROM user_roles ur JOIN roles r ON r.id = ur.role_id
          WHERE r.name = 'ADMIN') AS admin_users,
        (SELECT COUNT(*)::int FROM subjects) AS subjects,
        (SELECT COUNT(*)::int FROM subjects WHERE status = 'PUBLISHED') AS published_subjects,
        (SELECT COUNT(*)::int FROM levels) AS levels,
        (SELECT COUNT(*)::int FROM topics) AS topics,
        (SELECT COUNT(*)::int FROM concepts) AS concepts,
        (SELECT COUNT(*)::int FROM assessments) AS assessments,
        (SELECT COUNT(*)::int FROM questions WHERE deleted_at IS NULL) AS questions,
        (SELECT COUNT(*)::int FROM questions WHERE deleted_at IS NULL AND is_active = TRUE) AS active_questions,
        (SELECT COUNT(*)::int FROM attempts) AS attempts,
        (SELECT COUNT(*)::int FROM attempts WHERE status = 'COMPLETED') AS completed_attempts,
        (SELECT COUNT(*)::int FROM sessions
          WHERE status = 'ACTIVE' AND expires_at > NOW()) AS active_sessions,
        (SELECT COUNT(*)::int FROM learning_events) AS learning_events,
        (SELECT COUNT(*)::int FROM audit_logs) AS audit_logs
    `);
    return result.rows[0];
  },

  /**
   * Aktivitas terbaru: learning_events + audit_logs.
   */
  async getActivity({ limit, offset } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const [eventsRes, auditsRes] = await Promise.all([
      pool.query(
        `SELECT le.id, le.event_type, le.entity_type, le.entity_id,
                le.metadata, le.occurred_at,
                u.name AS actor_name, u.email AS actor_email
           FROM learning_events le
           LEFT JOIN users u ON u.id = le.learner_id
          ORDER BY le.occurred_at DESC
          LIMIT $1 OFFSET $2`,
        [safeLimit, safeOffset]
      ),
      pool.query(
        `SELECT al.id, al.action, al.actor_type, al.entity_type, al.entity_id,
                al.occurred_at,
                u.name AS actor_name, u.email AS actor_email
           FROM audit_logs al
           LEFT JOIN users u ON u.id = al.actor_id
          ORDER BY al.occurred_at DESC
          LIMIT $1 OFFSET $2`,
        [safeLimit, safeOffset]
      ),
    ]);

    return {
      events: eventsRes.rows,
      audits: auditsRes.rows,
      limit: safeLimit,
      offset: safeOffset,
    };
  },

  /**
   * Agregat data analytics (bila sudah terisi) + konsep dengan gap terbanyak.
   */
  async getAnalytics() {
    const [summaryRes, gapsRes] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int AS learners_tracked,
          ROUND(AVG(average_mastery), 2) AS average_mastery,
          COALESCE(SUM(mastered_concept_count), 0)::int AS total_mastered_concepts,
          COALESCE(SUM(active_gap_count), 0)::int AS total_active_gaps,
          COALESCE(SUM(completed_actions), 0)::int AS total_completed_actions,
          COALESCE(SUM(learning_time_minutes), 0)::int AS total_learning_minutes
        FROM learner_analytics
      `),
      pool.query(`
        SELECT c.name AS concept_name,
               ca.error_count,
               ca.gap_count,
               ca.average_mastery
          FROM concept_analytics ca
          JOIN concepts c ON c.id = ca.concept_id
         ORDER BY ca.gap_count DESC, ca.error_count DESC
         LIMIT 5
      `),
    ]);

    return {
      summary: summaryRes.rows[0],
      top_gap_concepts: gapsRes.rows,
    };
  },
};

module.exports = systemMonitorService;
