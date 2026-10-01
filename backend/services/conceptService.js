// ============================================================
// XORA — Concept Service
// backend/services/conceptService.js
// ============================================================

const pool = require("../db");

const conceptService = {
  async getAll() {
    const result = await pool.query(`
      SELECT c.id, c.subject_id, c.name, c.description,
             c.status, c.created_at, c.updated_at,
             s.name AS subject_name
      FROM concepts c
      JOIN subjects s ON s.id = c.subject_id
      ORDER BY c.name ASC
    `);
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(`
      SELECT c.id, c.subject_id, c.name, c.description,
             c.status, c.created_at, c.updated_at,
             s.name AS subject_name
      FROM concepts c
      JOIN subjects s ON s.id = c.subject_id
      WHERE c.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  async getBySubjectId(subjectId) {
    const result = await pool.query(
      "SELECT id, name, description, status, created_at, updated_at FROM concepts WHERE subject_id = $1 ORDER BY name ASC",
      [subjectId]
    );
    return result.rows;
  },

  async getPrerequisites(conceptId) {
    const result = await pool.query(`
      SELECT cp.id, cp.prerequisite_concept_id, cp.dependency_weight,
             c.name AS prerequisite_name
      FROM concept_prerequisites cp
      JOIN concepts c ON c.id = cp.prerequisite_concept_id
      WHERE cp.concept_id = $1
      ORDER BY c.name ASC
    `, [conceptId]);
    return result.rows;
  },
};

module.exports = conceptService;
