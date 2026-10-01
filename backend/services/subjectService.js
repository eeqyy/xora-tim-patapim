// ============================================================
// XORA — Subject Service
// backend/services/subjectService.js
// ============================================================

const pool = require("../db");

const subjectService = {
  async getAll() {
    const result = await pool.query(
      "SELECT id, name, description, status, created_at, updated_at FROM subjects ORDER BY created_at ASC"
    );
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(
      "SELECT id, name, description, status, created_at, updated_at FROM subjects WHERE id = $1",
      [id]
    );
    return result.rows[0] || null;
  },

  async getByIdWithLevels(id) {
    const subject = await this.getById(id);
    if (!subject) return null;

    const levels = await pool.query(
      "SELECT id, name, difficulty, description, order_index, status, created_at, updated_at FROM levels WHERE subject_id = $1 ORDER BY order_index ASC",
      [id]
    );
    subject.levels = levels.rows;
    return subject;
  },
};

module.exports = subjectService;
