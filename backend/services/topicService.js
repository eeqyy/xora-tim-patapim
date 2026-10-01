// ============================================================
// XORA — Topic Service
// backend/services/topicService.js
// ============================================================

const pool = require("../db");

const topicService = {
  async getAll() {
    const result = await pool.query(`
      SELECT t.id, t.level_id, t.name, t.description,
             t.order_index, t.status, t.created_at, t.updated_at,
             l.name AS level_name
      FROM topics t
      JOIN levels l ON l.id = t.level_id
      ORDER BY l.order_index ASC, t.order_index ASC
    `);
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(`
      SELECT t.id, t.level_id, t.name, t.description,
             t.order_index, t.status, t.created_at, t.updated_at,
             l.name AS level_name
      FROM topics t
      JOIN levels l ON l.id = t.level_id
      WHERE t.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async getByLevelId(levelId) {
    const result = await pool.query(
      "SELECT id, name, description, order_index, status, created_at, updated_at FROM topics WHERE level_id = $1 ORDER BY order_index ASC",
      [levelId]
    );
    return result.rows;
  },
};

module.exports = topicService;
