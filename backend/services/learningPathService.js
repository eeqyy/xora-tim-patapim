// ============================================================
// XORA — Learning Path Service
// backend/services/learningPathService.js
// ============================================================

const pool = require("../db");
const { MASTERY_CONFIG } = require("../config/masteryThresholds");

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const learningPathService = {
  /**
   * Get complete hierarchical learning path for a given subject:
   * Subject → Levels → Topics → Concepts
   *
   * Jika learnerId diberikan, tiap konsep di-annotate dengan:
   *   - prerequisites: [{ id, name, mastery_score, gap_status, satisfied }]
   *   - is_locked: true jika ada minimal 1 prerequisite yang belum dikuasai
   *     (syarat "dikuasai": mastery_score >= masteredThreshold / MASTERED, lihat
   *      config/masteryThresholds.js). Konsep tanpa prerequisite (root) selalu terbuka.
   *   Prerequisite tanpa baris learner_concept_states = belum pernah dinilai -> belum terpenuhi.
   */
  async getLearningPathBySubjectId(subjectId, learnerId = null) {
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

    // 6. Annotate prerequisites (display-only lock) — hanya jika learner diketahui
    if (learnerId) {
      await this.annotatePrerequisites(hierarchicalLevels, learnerId);
    }

    return {
      subject,
      levels: hierarchicalLevels,
    };
  },

  /**
   * Annotate setiap konsep pada hierarki (in-place) dengan prerequisites + is_locked.
   * 2 query total (pakai ANY(uuid[])), tanpa N+1.
   */
  async annotatePrerequisites(levels, learnerId) {
    // Kumpulkan semua concept_id dari hierarki
    const conceptIds = [];
    for (const lvl of levels) {
      for (const topic of lvl.topics || []) {
        for (const concept of topic.concepts || []) {
          conceptIds.push(concept.id);
        }
      }
    }
    if (conceptIds.length === 0) return;

    // 1) Prerequisite dari setiap konsep di path ini (JOIN nama prereq)
    const prereqRes = await pool.query(
      `SELECT cp.concept_id, cp.prerequisite_concept_id, c.name AS prerequisite_name
         FROM concept_prerequisites cp
         JOIN concepts c ON c.id = cp.prerequisite_concept_id
        WHERE cp.concept_id = ANY($1::uuid[])`,
      [conceptIds]
    );

    // Semua concept_id yang butuh status mastery learner:
    // baik sebagai prerequisite MAUPUN sebagai node konsep itu sendiri
    const allQueryIds = Array.from(
      new Set([...conceptIds, ...prereqRes.rows.map((r) => r.prerequisite_concept_id)])
    );

    // 2) Status mastery learner untuk semua konsep tsb (tanpa baris = belum dinilai)
    const stateByConcept = new Map();
    if (allQueryIds.length > 0) {
      const stateRes = await pool.query(
        `SELECT concept_id, mastery_score, gap_status, evidence_count, evidence_confidence
           FROM learner_concept_states
          WHERE learner_id = $1
            AND concept_id = ANY($2::uuid[])`,
        [learnerId, allQueryIds]
      );
      for (const row of stateRes.rows) {
        stateByConcept.set(row.concept_id, row);
      }
    }
    // Group prerequisite per konsep asal
    const prereqsByConcept = new Map();
    for (const row of prereqRes.rows) {
      if (!prereqsByConcept.has(row.concept_id)) {
        prereqsByConcept.set(row.concept_id, []);
      }
      prereqsByConcept.get(row.concept_id).push(row);
    }

    // Annotate in-place
    for (const lvl of levels) {
      for (const topic of lvl.topics || []) {
        for (const concept of topic.concepts || []) {
          const rows = prereqsByConcept.get(concept.id) || [];
          const prerequisites = rows.map((r) => {
            const state = stateByConcept.get(r.prerequisite_concept_id) || null;
            const mastery = state && state.mastery_score != null ? Number(state.mastery_score) : null;
            const satisfied =
              mastery !== null && mastery >= MASTERY_CONFIG.masteredThreshold;
            return {
              id: r.prerequisite_concept_id,
              name: r.prerequisite_name,
              mastery_score: mastery,
              gap_status: state ? state.gap_status : "INSUFFICIENT_EVIDENCE",
              satisfied,
            };
          });

          const selfState = stateByConcept.get(concept.id) || null;
          const selfMastery = selfState && selfState.mastery_score != null ? Number(selfState.mastery_score) : null;

          concept.mastery_score = selfMastery;
          concept.gap_status = selfState ? selfState.gap_status : "INSUFFICIENT_EVIDENCE";
          concept.is_mastered = selfMastery !== null && selfMastery >= MASTERY_CONFIG.masteredThreshold;
          concept.evidence_count = selfState ? Number(selfState.evidence_count) : 0;
          concept.evidence_confidence = selfState?.evidence_confidence != null ? Number(selfState.evidence_confidence) : 0;
          concept.prerequisites = prerequisites;
          concept.is_locked = prerequisites.some((p) => !p.satisfied);
        }
      }
    }
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
