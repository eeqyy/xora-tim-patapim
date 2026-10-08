// ============================================================
// XORA — Learning Path Service
// backend/services/learningPathService.js
// ============================================================

const pool = require("../db");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const learningPathService = {
  /**
   * Get complete hierarchical learning path for a given subject:
   * Subject → Levels → Topics → Concepts
   */
  async getLearningPathBySubjectId(subjectId) {
    if (!subjectId || typeof subjectId !== "string" || !UUID_REGEX.test(subjectId)) {
      const err = new Error("ID subject harus berupa UUID yang valid");
      err.statusCode = 400;
      throw err;
    }

    // 1. Fetch Subject
    const subjectResult = await pool.query(
      `SELECT id, name, description, status, created_at, updated_at
       FROM subjects
       WHERE id = $1`,
      [subjectId]
    );

    if (subjectResult.rows.length === 0) {
      const err = new Error("Subject tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    const subject = subjectResult.rows[0];

    // 2. Fetch Levels for Subject
    const levelsResult = await pool.query(
      `SELECT id, subject_id, name, difficulty, description, order_index, status
       FROM levels
       WHERE subject_id = $1
       ORDER BY order_index ASC`,
      [subjectId]
    );

    const levels = levelsResult.rows;

    if (levels.length === 0) {
      return {
        subject,
        levels: [],
      };
    }

    const levelIds = levels.map((l) => l.id);

    // 3. Fetch Topics for Levels
    const topicsResult = await pool.query(
      `SELECT t.id, t.level_id, t.name, t.description, t.order_index, t.status
       FROM topics t
       WHERE t.level_id = ANY($1::uuid[])
       ORDER BY t.order_index ASC`,
      [levelIds]
    );

    const topics = topicsResult.rows;
    const topicIds = topics.map((t) => t.id);

    // 4. Fetch Concepts for Topics via topic_concepts
    let concepts = [];
    if (topicIds.length > 0) {
      const conceptsResult = await pool.query(
        `SELECT tc.topic_id, tc.concept_id, tc.relevance_weight, tc.order_index,
                c.name, c.description, c.status
         FROM topic_concepts tc
         JOIN concepts c ON c.id = tc.concept_id
         WHERE tc.topic_id = ANY($1::uuid[])
         ORDER BY tc.order_index ASC`,
        [topicIds]
      );
      concepts = conceptsResult.rows;
    }

    // 5. Assemble Hierarchy (Level → Topic → Concept)
    const conceptsByTopic = {};
    for (const c of concepts) {
      if (!conceptsByTopic[c.topic_id]) {
        conceptsByTopic[c.topic_id] = [];
      }
      conceptsByTopic[c.topic_id].push({
        id: c.concept_id,
        name: c.name,
        description: c.description,
        relevance_weight: c.relevance_weight,
        order_index: c.order_index,
        status: c.status,
      });
    }

    const topicsByLevel = {};
    for (const t of topics) {
      if (!topicsByLevel[t.level_id]) {
        topicsByLevel[t.level_id] = [];
      }
      topicsByLevel[t.level_id].push({
        id: t.id,
        level_id: t.level_id,
        name: t.name,
        description: t.description,
        order_index: t.order_index,
        status: t.status,
        concepts: conceptsByTopic[t.id] || [],
      });
    }

    const hierarchicalLevels = levels.map((lvl) => ({
      ...lvl,
      topics: topicsByLevel[lvl.id] || [],
    }));

    return {
      subject,
      levels: hierarchicalLevels,
    };
  },

  /**
   * Determine preferred or default subject ID for authenticated user
   */
  async getDefaultSubjectId(userId) {
    if (userId) {
      const profileResult = await pool.query(
        `SELECT preferred_subject_id FROM learner_profiles WHERE user_id = $1`,
        [userId]
      );
      if (profileResult.rows.length > 0 && profileResult.rows[0].preferred_subject_id) {
        return profileResult.rows[0].preferred_subject_id;
      }
    }

    const fallbackResult = await pool.query(
      `SELECT id FROM subjects ORDER BY created_at ASC LIMIT 1`
    );
    return fallbackResult.rows[0]?.id || null;
  },
};

module.exports = learningPathService;
