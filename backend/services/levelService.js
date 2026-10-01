// ============================================================
// XORA — Level Service
// backend/services/levelService.js
// ============================================================

const pool = require("../db");

const levelService = {
  async getAll() {
    const result = await pool.query(`
      SELECT l.id, l.subject_id, l.name, l.difficulty, l.description,
             l.order_index, l.status, l.created_at, l.updated_at,
             s.name AS subject_name
      FROM levels l
      JOIN subjects s ON s.id = l.subject_id
      ORDER BY l.order_index ASC
    `);
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(`
      SELECT l.id, l.subject_id, l.name, l.difficulty, l.description,
             l.order_index, l.status, l.created_at, l.updated_at,
             s.name AS subject_name
      FROM levels l
      JOIN subjects s ON s.id = l.subject_id
      WHERE l.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async getBySubjectId(subjectId) {
    const result = await pool.query(
      "SELECT id, name, difficulty, description, order_index, status, created_at, updated_at FROM levels WHERE subject_id = $1 ORDER BY order_index ASC",
      [subjectId]
    );
    return result.rows;
  },
};

module.exports = levelService;
