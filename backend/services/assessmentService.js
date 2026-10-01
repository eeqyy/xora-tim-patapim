// ============================================================
// XORA — Assessment Service
// backend/services/assessmentService.js
// ============================================================

const pool = require("../db");

const assessmentService = {
  async getAll() {
    const result = await pool.query(`
      SELECT a.id, a.subject_id, a.level_id, a.topic_id,
             a.type, a.title, a.duration_minutes, a.passing_score, a.created_at,
             s.name AS subject_name,
             l.name AS level_name,
             t.name AS topic_name
      FROM assessments a
      JOIN subjects s ON s.id = a.subject_id
      LEFT JOIN levels l ON l.id = a.level_id
      LEFT JOIN topics t ON t.id = a.topic_id
      ORDER BY a.created_at ASC
    `);
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(`
      SELECT a.id, a.subject_id, a.level_id, a.topic_id,
             a.type, a.title, a.duration_minutes, a.passing_score, a.created_at,
             s.name AS subject_name,
             l.name AS level_name,
             t.name AS topic_name
      FROM assessments a
      JOIN subjects s ON s.id = a.subject_id
      LEFT JOIN levels l ON l.id = a.level_id
      LEFT JOIN topics t ON t.id = a.topic_id
      WHERE a.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async getQuestionsByAssessmentId(assessmentId) {
    const result = await pool.query(
      "SELECT id, type, question_text, correct_answer, points, order_index FROM questions WHERE assessment_id = $1 ORDER BY order_index ASC",
      [assessmentId]
    );
    return result.rows.map(assessmentService.toPublicQuestion);
  },

  /**
   * Amankan soal sebelum dikirim ke client.
   *
   * Kolom correct_answer di database menyimpan JAWABAN sekaligus pilihan opsi:
   *   { correct: "B", options: [...] }  <- MULTIPLE_CHOICE
   *   { expected: "...", criteria: [...] } <- CODE / ESSAY
   * Karena itu correct_answer tidak boleh dikirim mentah — peserta bisa
   * membaca kuncinya. Yang dibutuhkan frontend hanya opsi tampilannya.
   *
   * (PRD TR-09/TR-08: penilaian dilakukan backend, bukan client.)
   */
  toPublicQuestion(row) {
    const correct = row.correct_answer || {};
    return {
      id: row.id,
      type: row.type,
      question_text: row.question_text,
      points: row.points,
      order_index: row.order_index,
      options: row.type === "MULTIPLE_CHOICE" ? correct.options || [] : [],
    };
  },
};

module.exports = assessmentService;
