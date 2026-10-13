// ============================================================
// XOLEARN — Assessment Service
// backend/services/assessmentService.js
// ============================================================

const pool = require("../db");
const masteryService = require("./masteryService");
const gapService = require("./gapService");
const recommendationService = require("./recommendationService");
const questionService = require("./questionService");
const aiService = require("./aiService");
const { badRequest, notFound, conflict, forbidden } = require("../utils/errors");
// Grader bersama untuk ESSAY/CODE — dipakai juga oleh attemptService,
// supaya kedua jalur submit menilai dengan kriteria yang sama.
const { grade } = require("../utils/grading");

const ASSESSMENT_TYPES = ["TOPIC", "LEVEL_FINAL", "MIXED", "REASSESSMENT", "PRACTICE"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sanitizeQuestionList(rows) {
  return rows.map((q) => {
    let options = [];
    if (q.type === "MULTIPLE_CHOICE" && q.correct_answer && Array.isArray(q.correct_answer.options)) {
      options = q.correct_answer.options;
    }

    let items = [];
    let targets = [];
    if (q.type === "DRAG_DROP" && q.correct_answer) {
      if (Array.isArray(q.correct_answer.items)) {
        items = q.correct_answer.items.map((it) => ({ id: it.id, label: it.label }));
      }
      if (Array.isArray(q.correct_answer.targets)) {
        targets = q.correct_answer.targets.map((tg) => ({ id: tg.id, label: tg.label }));
      }
    }

    return {
      id: q.id,
      assessment_id: q.assessment_id,
      material: q.material || null,
      type: q.type,
      question_text: q.question_text,
      points: Number(q.points),
      order_index: q.order_index,
      options,
      items,
      targets,
      concept: (q.correct_answer && q.correct_answer.concept) ? q.correct_answer.concept : null,
      category: (q.correct_answer && q.correct_answer.category) ? q.correct_answer.category : null,
    };
  });
}

function isQuestionGradable(question) {
  if (!question || !question.type) return false;
  if (question.type === "MULTIPLE_CHOICE") {
    const options = question.correct_answer && Array.isArray(question.correct_answer.options)
      ? question.correct_answer.options
      : [];
    const correctLetter = question.correct_answer && question.correct_answer.correct
      ? String(question.correct_answer.correct).trim().toUpperCase()
      : null;
    if (options.length < 2 || !correctLetter) return false;
    const maxLetter = String.fromCharCode(64 + options.length);
    return correctLetter >= "A" && correctLetter <= maxLetter;
  }
  if (question.type === "DRAG_DROP") {
    return !!(question.correct_answer && typeof question.correct_answer.correct === "object" && Object.keys(question.correct_answer.correct).length > 0);
  }
  if (question.type === "CODE") {
    return true;
  }
  return false;
}

const assessmentService = {
  async getAll(filters = {}, learnerId = null) {
    let query = `
      SELECT a.id, a.subject_id, a.level_id, a.topic_id, a.difficulty,
             a.type, a.title, a.duration_minutes, a.passing_score, a.created_at,
             s.name AS subject_name,
             l.name AS level_name,
             l.difficulty AS level_difficulty,
             l.order_index AS level_order,
             COALESCE(
               (CASE
                 WHEN a.type = 'MIXED' THEN LEAST(30, (SELECT COUNT(*)::int FROM questions q WHERE q.difficulty = a.difficulty AND q.type <> 'ESSAY' AND q.deleted_at IS NULL AND q.is_active = true))
                 WHEN a.type IN ('PRACTICE', 'REASSESSMENT') THEN LEAST(20, COALESCE(
                    NULLIF((SELECT COUNT(*)::int FROM questions q WHERE q.assessment_id = a.id AND q.deleted_at IS NULL), 0),
                    NULLIF((SELECT COUNT(*)::int FROM questions q JOIN topic_concepts tc ON tc.concept_id = q.concept_id WHERE tc.topic_id = a.topic_id AND q.type <> 'ESSAY' AND q.deleted_at IS NULL AND q.is_active = true), 0),
                    (SELECT COUNT(*)::int FROM questions q WHERE q.type <> 'ESSAY' AND q.deleted_at IS NULL AND q.is_active = true AND (
                      (a.title ILIKE '%HTML%' AND q.material = 'HTML') OR
                      (a.title ILIKE '%CSS%' AND q.material = 'CSS') OR
                      (a.title ILIKE '%JavaScript%' AND q.material = 'JAVASCRIPT')
                    ))
                  ))
                 ELSE (SELECT COUNT(*)::int FROM questions q WHERE q.assessment_id = a.id AND q.deleted_at IS NULL)
               END), 0
             ) AS question_count,
             (
               SELECT ARRAY_AGG(DISTINCT t2.name)
               FROM questions q
               JOIN concepts c ON c.id = q.concept_id
               JOIN topic_concepts tc ON tc.concept_id = c.id
               JOIN topics t2 ON t2.id = tc.topic_id
               WHERE q.assessment_id = a.id
             ) AS covered_topics
      FROM assessments a
      JOIN subjects s ON s.id = a.subject_id
      LEFT JOIN levels l ON l.id = a.level_id
      LEFT JOIN topics t ON t.id = a.topic_id
    `;
    const conditions = [];
    const values = [];

    if (filters.subject_id) {
      values.push(filters.subject_id);
      conditions.push(`a.subject_id = ${values.length}`);
    }

    if (filters.level_id) {
      values.push(filters.level_id);
      conditions.push(`a.level_id = ${values.length}`);
    }

    if (filters.topic_id) {
      values.push(filters.topic_id);
      conditions.push(`a.topic_id = ${values.length}`);
    }

    if (filters.type) {
      values.push(filters.type);
      conditions.push(`a.type = ${values.length}`);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY COALESCE(l.order_index, 0) ASC, a.created_at ASC";

    const result = await pool.query(query, values);
    const assessments = result.rows;

    if (!learnerId) {
      return assessments.map((a) => {
        let coveredTopics = a.covered_topics;
        if (a.type === "MIXED") {
          coveredTopics = ["HTML", "CSS", "JavaScript"];
        } else if (a.type === "PRACTICE" || a.type === "REASSESSMENT") {
          if (a.topic_name) coveredTopics = [a.topic_name];
          else {
            const upperT = (a.title || "").toUpperCase();
            if (upperT.includes("HTML")) coveredTopics = ["HTML"];
            else if (upperT.includes("CSS")) coveredTopics = ["CSS"];
            else if (upperT.includes("JAVASCRIPT")) coveredTopics = ["JavaScript"];
            else coveredTopics = ["Materi Penguatan"];
          }
        } else if (!Array.isArray(coveredTopics) || coveredTopics.length === 0) {
          coveredTopics = a.topic_name ? [a.topic_name] : (a.level_name ? [a.level_name] : ["Materi Inti"]);
        }
        return {
          ...a,
          covered_topics: coveredTopics,
          learner_status: {
            active_attempt_id: null,
            latest_attempt_id: null,
            latest_score: null,
            best_score: null,
            is_passed: false,
            is_locked: false,
            lock_reason: null,
            access_status: "AVAILABLE",
            is_recommended: false,
            recommendation_reason: null,
          },
        };
      });
    }

    // Ambil data attempt milik learner untuk penilaian status akses & alur kelulusan
    const attemptsRes = await pool.query(
      `SELECT id, assessment_id, status, score, material_scores, topic_scores, started_at, completed_at, is_passed
         FROM attempts
        WHERE learner_id = $1
        ORDER BY started_at DESC`,
      [learnerId]
    );

    const attemptsByAssessment = new Map();
    for (const att of attemptsRes.rows) {
      if (!attemptsByAssessment.has(att.assessment_id)) {
        attemptsByAssessment.set(att.assessment_id, []);
      }
      attemptsByAssessment.get(att.assessment_id).push(att);
    }

    // Cek level mana saja yang sudah lulus (skor >= passing_score)
    const passedDifficulties = new Set();
    const passedLevelOrders = new Set();
    const gapMaterials = new Set();
    const gapReasons = new Map();
    const gapTopics = new Set();
    const gapTopicReasons = new Map();

    for (const att of attemptsRes.rows) {
      if (att.status === "COMPLETED") {
        if (att.material_scores && typeof att.material_scores === "object") {
          for (const [matKey, stats] of Object.entries(att.material_scores)) {
            if (stats && typeof stats === "object") {
              const totalQ = Number(stats.total || 0);
              const correctQ = Number(stats.correct || 0);
              const pct = Number(
                stats.score_percent !== undefined
                  ? stats.score_percent
                  : totalQ > 0
                  ? (correctQ / totalQ) * 100
                  : 100
              );
              if (pct < 70 && totalQ >= 1) {
                const normalized = matKey.toUpperCase();
                gapMaterials.add(normalized);
                if (!gapReasons.has(normalized)) {
                  gapReasons.set(
                    normalized,
                    `Penguasaan materi ${matKey} (${Math.round(pct)}%) perlu diperkuat berdasarkan hasil asesmen.`
                  );
                }
              }
            }
          }
        }
        if (Array.isArray(att.topic_scores)) {
          for (const ts of att.topic_scores) {
            if (ts && ts.topic_name) {
              const totalQ = Number(ts.total || 0);
              const correctQ = Number(ts.correct || 0);
              const pct = Number(
                ts.score_percent !== undefined
                  ? ts.score_percent
                  : totalQ > 0 ? (correctQ / totalQ) * 100 : 100
              );
              if (pct < 70 && totalQ >= 1) {
                const topKey = ts.topic_name.toLowerCase();
                gapTopics.add(topKey);
                if (!gapTopicReasons.has(topKey)) {
                  gapTopicReasons.set(
                    topKey,
                    `Penguasaan topik ${ts.topic_name} (${Math.round(pct)}%) perlu penguatan berdasarkan evaluasi asesmen.`
                  );
                }
              }
            }
          }
        }
        if (Number(att.score) < 70) {
          // Fallback bila attempt belum memiliki breakdown per materi
          gapMaterials.add("HTML");
          gapMaterials.add("CSS");
          gapMaterials.add("JAVASCRIPT");
          if (!gapReasons.has("HTML")) {
            gapReasons.set("HTML", "Latihan terarah disarankan untuk memperkuat materi HTML.");
          }
        }
      }
    }

    for (const a of assessments) {
      const atts = attemptsByAssessment.get(a.id) || [];
      const passingScore = Number(a.passing_score) || 70;
      const hasPassed = atts.some(
        (att) => att.status === "COMPLETED" && (att.is_passed || Number(att.score) >= passingScore)
      );
      if (hasPassed) {
        const diff = (a.difficulty || a.level_difficulty || "EASY").toUpperCase();
        passedDifficulties.add(diff);
        if (a.level_order) {
          passedLevelOrders.add(Number(a.level_order));
        }
      }
    }

    return assessments.map((a) => {
      const atts = attemptsByAssessment.get(a.id) || [];
      const inProgressAtt = atts.find((att) => att.status === "IN_PROGRESS");
      const completedAtts = atts.filter((att) => att.status === "COMPLETED");
      const latestCompleted = completedAtts[0] || null;
      const bestScore = completedAtts.length > 0
        ? Math.max(...completedAtts.map((att) => Number(att.score || 0)))
        : null;
      const passingScore = Number(a.passing_score) || 70;
      const isPassed = bestScore !== null && bestScore >= passingScore;

      // Alur pembukaan tingkat bertahap:
      // EASY (Tingkat 1-2): selalu terbuka (AVAILABLE).
      // MEDIUM (Tingkat 3-4): terbuka jika learner sudah lulus asesmen tingkat Mudah (EASY).
      // HARD (Tingkat 5): terbuka jika learner sudah lulus asesmen tingkat Menengah (MEDIUM).
      const difficulty = (a.difficulty || a.level_difficulty || "EASY").toUpperCase();
      let isLocked = false;
      let lockReason = null;

      if (difficulty === "MEDIUM") {
        const hasPassedEasy = passedDifficulties.has("EASY") || Array.from(passedLevelOrders).some((ord) => ord <= 2);
        if (!hasPassedEasy) {
          isLocked = true;
          lockReason = "Lulus asesmen tingkat Mudah terlebih dahulu untuk membuka tingkat Menengah.";
        }
      } else if (difficulty === "HARD") {
        const hasPassedMedium = passedDifficulties.has("MEDIUM") || Array.from(passedLevelOrders).some((ord) => ord >= 3 && ord <= 4);
        if (!hasPassedMedium) {
          isLocked = true;
          lockReason = "Lulus asesmen tingkat Menengah terlebih dahulu untuk membuka tingkat Sulit.";
        }
      }

      let accessStatus = "AVAILABLE";
      if (isLocked) {
        accessStatus = "LOCKED";
      } else if (inProgressAtt) {
        accessStatus = "IN_PROGRESS";
      } else if (isPassed) {
        accessStatus = "PASSED";
      } else if (latestCompleted && !isPassed) {
        accessStatus = "NEEDS_PRACTICE";
      }

      let coveredTopics = a.covered_topics;
      if (a.type === "MIXED") {
        coveredTopics = ["HTML", "CSS", "JavaScript"];
      } else if (a.type === "PRACTICE" || a.type === "REASSESSMENT") {
        if (a.topic_name) coveredTopics = [a.topic_name];
        else {
          const upperT = (a.title || "").toUpperCase();
          if (upperT.includes("HTML")) coveredTopics = ["HTML"];
          else if (upperT.includes("CSS")) coveredTopics = ["CSS"];
          else if (upperT.includes("JAVASCRIPT")) coveredTopics = ["JavaScript"];
          else coveredTopics = ["Materi Penguatan"];
        }
      } else if (!Array.isArray(coveredTopics) || coveredTopics.length === 0) {
        coveredTopics = a.topic_name ? [a.topic_name] : (a.level_name ? [a.level_name] : ["Materi Inti"]);
      }

      let isRecommended = false;
      let recommendationReason = null;
      if (a.type === "PRACTICE" || a.type === "REASSESSMENT") {
        const topName = (a.topic_name || "").toLowerCase();
        const upperTitle = (a.title || "").toUpperCase();
        if (topName && gapTopics.has(topName)) {
          isRecommended = true;
          recommendationReason = gapTopicReasons.get(topName) || `Direkomendasikan untuk penguatan topik ${a.topic_name}.`;
        } else if (upperTitle.includes("HTML") && gapMaterials.has("HTML")) {
          isRecommended = true;
          recommendationReason = gapReasons.get("HTML") || "Direkomendasikan untuk penguatan materi HTML.";
        } else if (upperTitle.includes("CSS") && gapMaterials.has("CSS")) {
          isRecommended = true;
          recommendationReason = gapReasons.get("CSS") || "Direkomendasikan untuk penguatan materi CSS.";
        } else if (upperTitle.includes("JAVASCRIPT") && gapMaterials.has("JAVASCRIPT")) {
          isRecommended = true;
          recommendationReason = gapReasons.get("JAVASCRIPT") || "Direkomendasikan untuk penguatan materi JavaScript.";
        }
      }

      return {
        ...a,
        covered_topics: coveredTopics,
        learner_status: {
          active_attempt_id: inProgressAtt ? inProgressAtt.id : null,
          latest_attempt_id: latestCompleted ? latestCompleted.id : null,
          latest_score: latestCompleted ? Number(latestCompleted.score) : null,
          best_score: bestScore,
          is_passed: isPassed,
          is_locked: isLocked,
          lock_reason: lockReason,
          access_status: accessStatus,
          is_recommended: isRecommended,
          recommendation_reason: recommendationReason,
        },
      };
    });
  },

  async getById(id, learnerId = null) {
    const result = await pool.query(`
      SELECT a.id, a.subject_id, a.level_id, a.topic_id, a.difficulty,
             a.type, a.title, a.duration_minutes, a.passing_score, a.created_at,
             s.name AS subject_name,
             l.name AS level_name,
             l.difficulty AS level_difficulty,
             l.order_index AS level_order,
             t.name AS topic_name,
             COALESCE(
                (CASE
                  WHEN a.type = 'MIXED' THEN LEAST(30, (SELECT COUNT(*)::int FROM questions q WHERE q.difficulty = a.difficulty AND q.type <> 'ESSAY' AND q.deleted_at IS NULL AND q.is_active = true))
                  WHEN a.type IN ('PRACTICE', 'REASSESSMENT') THEN LEAST(20, COALESCE(
                    NULLIF((SELECT COUNT(*)::int FROM questions q WHERE q.assessment_id = a.id AND q.deleted_at IS NULL), 0),
                    NULLIF((SELECT COUNT(*)::int FROM questions q JOIN topic_concepts tc ON tc.concept_id = q.concept_id WHERE tc.topic_id = a.topic_id AND q.type <> 'ESSAY' AND q.deleted_at IS NULL AND q.is_active = true), 0),
                    (SELECT COUNT(*)::int FROM questions q WHERE q.type <> 'ESSAY' AND q.deleted_at IS NULL AND q.is_active = true AND (
                      (a.title ILIKE '%HTML%' AND q.material = 'HTML') OR
                      (a.title ILIKE '%CSS%' AND q.material = 'CSS') OR
                      (a.title ILIKE '%JavaScript%' AND q.material = 'JAVASCRIPT')
                    ))
                  ))
                  ELSE (SELECT COUNT(*)::int FROM questions q WHERE q.assessment_id = a.id AND q.deleted_at IS NULL)
                END), 0
              ) AS question_count,
             (
               SELECT ARRAY_AGG(DISTINCT t2.name)
               FROM questions q
               JOIN concepts c ON c.id = q.concept_id
               JOIN topic_concepts tc ON tc.concept_id = c.id
               JOIN topics t2 ON t2.id = tc.topic_id
               WHERE q.assessment_id = a.id
             ) AS covered_topics
      FROM assessments a
      JOIN subjects s ON s.id = a.subject_id
      LEFT JOIN levels l ON l.id = a.level_id
      LEFT JOIN topics t ON t.id = a.topic_id
      WHERE a.id = $1
    `, [id]);
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    let coveredTopics = row.covered_topics;
    if (row.type === "MIXED") {
      coveredTopics = ["HTML", "CSS", "JavaScript"];
    } else if (row.type === "PRACTICE" || row.type === "REASSESSMENT") {
      if (row.topic_name) coveredTopics = [row.topic_name];
      else {
        const upperT = (row.title || "").toUpperCase();
        if (upperT.includes("HTML")) coveredTopics = ["HTML"];
        else if (upperT.includes("CSS")) coveredTopics = ["CSS"];
        else if (upperT.includes("JAVASCRIPT")) coveredTopics = ["JavaScript"];
        else coveredTopics = ["Materi Penguatan"];
      }
    } else if (!Array.isArray(coveredTopics) || coveredTopics.length === 0) {
      coveredTopics = row.topic_name ? [row.topic_name] : (row.level_name ? [row.level_name] : []);
    }

    let learnerStatus = {
      active_attempt_id: null,
      latest_score: null,
      best_score: null,
      is_passed: false,
      is_locked: false,
      lock_reason: null,
      access_status: "AVAILABLE",
    };

    if (learnerId) {
      const attemptsRes = await pool.query(
        `SELECT id, status, score, started_at, completed_at, is_passed
           FROM attempts
          WHERE learner_id = $1 AND assessment_id = $2
          ORDER BY started_at DESC`,
        [learnerId, id]
      );
      const inProgressAtt = attemptsRes.rows.find((att) => att.status === "IN_PROGRESS");
      const completedAtts = attemptsRes.rows.filter((att) => att.status === "COMPLETED");
      const latestCompleted = completedAtts[0] || null;
      const bestScore = completedAtts.length > 0
        ? Math.max(...completedAtts.map((att) => Number(att.score || 0)))
        : null;
      const passingScore = Number(row.passing_score) || 70;
      const isPassed = bestScore !== null && bestScore >= passingScore;

      const difficulty = (row.difficulty || row.level_difficulty || "EASY").toUpperCase();
      let isLocked = false;
      let lockReason = null;

      if (difficulty === "MEDIUM") {
        const passedEasyRes = await pool.query(
          `SELECT 1 FROM attempts att
           JOIN assessments a ON a.id = att.assessment_id
           LEFT JOIN levels l ON l.id = a.level_id
          WHERE att.learner_id = $1 AND att.status = 'COMPLETED'
            AND (att.is_passed = true OR att.score >= COALESCE(a.passing_score, 70))
            AND (a.difficulty = 'EASY' OR l.difficulty = 'EASY' OR COALESCE(l.order_index, 0) <= 2)
          LIMIT 1`,
          [learnerId]
        );
        if (passedEasyRes.rows.length === 0) {
          isLocked = true;
          lockReason = "Lulus asesmen tingkat Mudah terlebih dahulu untuk membuka tingkat Menengah.";
        }
      } else if (difficulty === "HARD") {
        const passedMediumRes = await pool.query(
          `SELECT 1 FROM attempts att
           JOIN assessments a ON a.id = att.assessment_id
           LEFT JOIN levels l ON l.id = a.level_id
          WHERE att.learner_id = $1 AND att.status = 'COMPLETED'
            AND (att.is_passed = true OR att.score >= COALESCE(a.passing_score, 70))
            AND (a.difficulty = 'MEDIUM' OR l.difficulty = 'MEDIUM' OR (COALESCE(l.order_index, 0) >= 3 AND COALESCE(l.order_index, 0) <= 4))
          LIMIT 1`,
          [learnerId]
        );
        if (passedMediumRes.rows.length === 0) {
          isLocked = true;
          lockReason = "Lulus asesmen tingkat Menengah terlebih dahulu untuk membuka tingkat Sulit.";
        }
      }

      let accessStatus = "AVAILABLE";
      if (isLocked) {
        accessStatus = "LOCKED";
      } else if (inProgressAtt) {
        accessStatus = "IN_PROGRESS";
      } else if (isPassed) {
        accessStatus = "PASSED";
      } else if (latestCompleted && !isPassed) {
        accessStatus = "NEEDS_PRACTICE";
      }

      learnerStatus = {
        active_attempt_id: inProgressAtt ? inProgressAtt.id : null,
        latest_score: latestCompleted ? Number(latestCompleted.score) : null,
        best_score: bestScore,
        is_passed: isPassed,
        is_locked: isLocked,
        lock_reason: lockReason,
        access_status: accessStatus,
      };
    }

    return {
      ...row,
      covered_topics: coveredTopics,
      learner_status: learnerStatus,
    };
  },

  /**
   * Mengambil daftar soal yang SUDAH DISANITASI.
   * JANGAN bocorkan correct_answer.correct atau kunci jawaban ke client.
   * Soal tipe ESSAY dihilangkan dari alur asesmen learner.
   * Jika attemptId disertakan, mengembalikan soal snapshot resmi dari attempt_questions.
   */
  async getQuestionsByAssessmentId(assessmentId, includeEssay = false, attemptId = null) {
    if (typeof includeEssay === "string" && !attemptId) {
      attemptId = includeEssay;
      includeEssay = false;
    }
    if (attemptId) {
      const snapRes = await pool.query(
        `SELECT q.id, q.assessment_id, q.type, q.question_text, q.correct_answer,
                q.points, aq.order_index, q.material, q.concept_id
           FROM attempt_questions aq
           JOIN questions q ON q.id = aq.question_id
          WHERE aq.attempt_id = $1
            ${includeEssay ? "" : "AND q.type <> 'ESSAY'"}
          ORDER BY aq.order_index ASC`,
        [attemptId]
      );
      if (snapRes.rows.length > 0) {
        return sanitizeQuestionList(snapRes.rows);
      }
    }

    let query = `
      SELECT q.id, q.assessment_id, q.type, q.question_text, q.correct_answer,
             q.points, q.order_index, q.material, q.concept_id
        FROM questions q
       WHERE q.assessment_id = $1 AND q.deleted_at IS NULL
    `;
    if (!includeEssay) {
      query += " AND type <> 'ESSAY'";
    }
    query += " ORDER BY q.order_index ASC";
    const result = await pool.query(query, [assessmentId]);

    if (result.rows.length > 0) {
      return sanitizeQuestionList(result.rows);
    }

    // Untuk asesmen bertipe MIXED, sediakan soal dari bank soal yang sesuai difficulty
    const aRes = await pool.query("SELECT difficulty, type, title FROM assessments WHERE id = $1", [assessmentId]);
    if (aRes.rows.length > 0 && aRes.rows[0].type === "MIXED") {
      const diff = aRes.rows[0].difficulty || "EASY";
      const sampleRes = await pool.query(
        `SELECT q.id, q.assessment_id, q.type, q.question_text, q.correct_answer,
                q.points, q.order_index, q.material, q.concept_id
           FROM questions q
          WHERE q.deleted_at IS NULL
            AND q.is_active = true
            AND q.type <> 'ESSAY'
            AND q.difficulty = $1
          ORDER BY q.material ASC, q.order_index ASC
          LIMIT 30`,
        [diff]
      );
      return sanitizeQuestionList(sampleRes.rows);
    }

    if (aRes.rows.length > 0 && (aRes.rows[0].type === "PRACTICE" || aRes.rows[0].type === "REASSESSMENT")) {
      const topicId = aRes.rows[0].topic_id;
      if (topicId) {
        const topicPracticeRes = await pool.query(
          `SELECT q.id, q.assessment_id, q.type, q.question_text, q.correct_answer,
                  q.points, q.order_index, q.material, q.concept_id
             FROM questions q
             JOIN topic_concepts tc ON tc.concept_id = q.concept_id
            WHERE tc.topic_id = $1
              AND q.deleted_at IS NULL
              AND q.is_active = true
              AND q.type <> 'ESSAY'
            ORDER BY q.difficulty ASC, q.order_index ASC
            LIMIT 20`,
          [topicId]
        );
        if (topicPracticeRes.rows.length > 0) {
          return sanitizeQuestionList(topicPracticeRes.rows);
        }
      }
      const upperT = (aRes.rows[0].title || "").toUpperCase();
      const mat = upperT.includes("CSS") ? "CSS" : (upperT.includes("JAVASCRIPT") ? "JAVASCRIPT" : "HTML");
      const practiceRes = await pool.query(
        `SELECT q.id, q.assessment_id, q.type, q.question_text, q.correct_answer,
                q.points, q.order_index, q.material, q.concept_id
           FROM questions q
          WHERE q.deleted_at IS NULL
            AND q.is_active = true
            AND q.type <> 'ESSAY'
            AND q.material = $1
          ORDER BY q.order_index ASC
          LIMIT 20`,
        [mat]
      );
      return sanitizeQuestionList(practiceRes.rows);
    }

    return [];
  },

  /**
   * Pemilihan soal adaptif untuk attempt:
   * - Menyeimbangkan distribusi materi (HTML, CSS, JavaScript target 10 tiap materi pada Mixed).
   * - Menghindari pengulangan soal yang baru dikerjakan learner (retake diversity) jika stok tersedia.
   * - Mengizinkan pengulangan terkontrol jika stok terbatas agar pengerjaan tidak gagal.
   * - Menangani stok kurang secara eksplisit dan aman.
   */
  async selectQuestionsForAttempt(assessment, learnerId) {
    const isMixed = assessment.type === "MIXED";
    const difficulty = (assessment.difficulty || assessment.level_difficulty || "EASY").toUpperCase();

    if (isMixed) {
      const bankRes = await pool.query(
        `SELECT q.id, q.material, q.difficulty, q.points, q.concept_id
           FROM questions q
          WHERE q.deleted_at IS NULL
            AND q.is_active = true
            AND q.type <> 'ESSAY'
            AND q.difficulty = $1
            AND q.material IN ('HTML', 'CSS', 'JAVASCRIPT')`,
        [difficulty]
      );

      const allEligible = bankRes.rows;
      const htmlPool = allEligible.filter((q) => q.material === "HTML");
      const cssPool = allEligible.filter((q) => q.material === "CSS");
      const jsPool = allEligible.filter((q) => q.material === "JAVASCRIPT");

      const missingMaterials = [];
      if (htmlPool.length === 0) missingMaterials.push("HTML");
      if (cssPool.length === 0) missingMaterials.push("CSS");
      if (jsPool.length === 0) missingMaterials.push("JavaScript");

      if (missingMaterials.length > 0) {
        const err = new Error(
          `Stok soal tidak mencukupi untuk asesmen campuran tingkat ${difficulty}: materi ${missingMaterials.join(", ")} belum memiliki soal yang memenuhi syarat di bank soal.`
        );
        err.statusCode = 400;
        throw err;
      }

      // Riwayat soal yang pernah dikerjakan oleh learner pada asesmen ini
      const seenRes = await pool.query(
        `SELECT DISTINCT q_id FROM (
           SELECT aq.question_id AS q_id
             FROM attempt_questions aq
             JOIN attempts a ON a.id = aq.attempt_id
            WHERE a.learner_id = $1 AND a.assessment_id = $2
           UNION
           SELECT e.question_id AS q_id
             FROM evidence e
             JOIN attempts a ON a.id = e.attempt_id
            WHERE a.learner_id = $1 AND a.assessment_id = $2
         ) sub`,
        [learnerId, assessment.id]
      );
      const seenIds = new Set(seenRes.rows.map((r) => r.q_id));

      const selectForMaterial = (poolItems, targetCount) => {
        const unseen = poolItems.filter((q) => !seenIds.has(q.id));
        const seen = poolItems.filter((q) => seenIds.has(q.id));
        shuffleArray(unseen);
        shuffleArray(seen);

        const chosen = [];
        for (const q of unseen) {
          if (chosen.length < targetCount) chosen.push(q);
        }
        if (chosen.length < targetCount) {
          for (const q of seen) {
            if (chosen.length < targetCount) chosen.push(q);
          }
        }
        return chosen;
      };

      const targetPerMaterial = 10;
      const selectedHtml = selectForMaterial(htmlPool, targetPerMaterial);
      const selectedCss = selectForMaterial(cssPool, targetPerMaterial);
      const selectedJs = selectForMaterial(jsPool, targetPerMaterial);

      const combined = [...selectedHtml, ...selectedCss, ...selectedJs];
      shuffleArray(combined);

      return combined.map((q, idx) => ({
        question_id: q.id,
        order_index: idx + 1,
      }));
    } else {
      let directRes = await pool.query(
        `SELECT q.id, q.points, q.order_index
           FROM questions q
          WHERE q.assessment_id = $1
            AND q.deleted_at IS NULL
            AND q.is_active = true
            AND q.type <> 'ESSAY'
          ORDER BY q.order_index ASC`,
        [assessment.id]
      );

      // Penjaminan 20 soal adaptif untuk asesmen PRACTICE / REASSESSMENT per topik
      if (assessment.type === "PRACTICE" || assessment.type === "REASSESSMENT") {
        // 1. Dapatkan topic_id yang valid
        let topicId = assessment.topic_id;
        if (!topicId) {
          const asmtInfo = await pool.query(`
            SELECT a.topic_id, t.id AS matched_topic_id
            FROM assessments a
            LEFT JOIN topics t ON a.title ILIKE '%' || t.name || '%'
            WHERE a.id = $1
            LIMIT 1
          `, [assessment.id]);
          topicId = asmtInfo.rows[0]?.topic_id || asmtInfo.rows[0]?.matched_topic_id;
        }

        let topicPool = [];
        if (topicId) {
          const tqRes = await pool.query(
            `SELECT q.id, q.material, q.difficulty, q.points, q.concept_id
               FROM questions q
               JOIN topic_concepts tc ON tc.concept_id = q.concept_id
              WHERE tc.topic_id = $1
                AND q.deleted_at IS NULL
                AND q.is_active = true
                AND q.type <> 'ESSAY'`,
            [topicId]
          );
          topicPool = tqRes.rows;
        }

        // Fallback ke direct questions jika belum ada di topic_concepts
        if (topicPool.length === 0) {
          topicPool = directRes.rows;
        }

        // Fallback ke materi jika asesmen belum dipetakan ke topik
        if (topicPool.length === 0) {
          const upperT = (assessment.title || "").toUpperCase();
          const mat = upperT.includes("CSS") ? "CSS" : (upperT.includes("JAVASCRIPT") ? "JAVASCRIPT" : "HTML");
          const matRes = await pool.query(
            `SELECT q.id, q.material, q.difficulty, q.points, q.concept_id
               FROM questions q
              WHERE q.material = $1
                AND q.deleted_at IS NULL
                AND q.is_active = true
                AND q.type <> 'ESSAY'
              LIMIT 30`,
            [mat]
          );
          topicPool = matRes.rows;
        }

        if (topicPool.length === 0) {
          return [];
        }

        // 2. Ambil riwayat soal yang sudah pernah dikerjakan oleh learner (retake diversity)
        const seenRes = await pool.query(
          `SELECT DISTINCT q_id FROM (
             SELECT aq.question_id AS q_id
               FROM attempt_questions aq
               JOIN attempts a ON a.id = aq.attempt_id
              WHERE a.learner_id = $1 AND (
                a.assessment_id = $2
                ${topicId ? "OR aq.question_id IN (SELECT q2.id FROM questions q2 JOIN topic_concepts tc2 ON tc2.concept_id = q2.concept_id WHERE tc2.topic_id = $3)" : ""}
              )
             UNION
             SELECT e.question_id AS q_id
               FROM evidence e
               JOIN attempts a ON a.id = e.attempt_id
              WHERE a.learner_id = $1 AND a.assessment_id = $2
           ) sub`,
          topicId ? [learnerId, assessment.id, topicId] : [learnerId, assessment.id]
        );
        const seenIds = new Set(seenRes.rows.map((r) => r.q_id));

        // 3. Kelompokkan berdasarkan difficulty untuk komposisi seimbang (target: 7 Easy, 7 Medium, 6 Hard = 20)
        const easyPool = topicPool.filter((q) => (q.difficulty || "EASY").toUpperCase() === "EASY");
        const medPool = topicPool.filter((q) => (q.difficulty || "MEDIUM").toUpperCase() === "MEDIUM");
        const hardPool = topicPool.filter((q) => (q.difficulty || "HARD").toUpperCase() === "HARD");

        const targetTotal = Math.min(20, topicPool.length);
        const targetEasy = Math.min(7, easyPool.length);
        const targetMed = Math.min(7, medPool.length);
        const targetHard = Math.min(6, hardPool.length);

        const pickFromBucket = (poolItems, targetCount, selectedSet) => {
          const unseen = poolItems.filter((q) => !seenIds.has(q.id) && !selectedSet.has(q.id));
          const seen = poolItems.filter((q) => seenIds.has(q.id) && !selectedSet.has(q.id));
          shuffleArray(unseen);
          shuffleArray(seen);

          const chosen = [];
          for (const q of unseen) {
            if (chosen.length < targetCount) {
              chosen.push(q);
              selectedSet.add(q.id);
            }
          }
          if (chosen.length < targetCount) {
            for (const q of seen) {
              if (chosen.length < targetCount) {
                chosen.push(q);
                selectedSet.add(q.id);
              }
            }
          }
          return chosen;
        };

        const selectedSet = new Set();
        const selected = [
          ...pickFromBucket(easyPool, targetEasy, selectedSet),
          ...pickFromBucket(medPool, targetMed, selectedSet),
          ...pickFromBucket(hardPool, targetHard, selectedSet),
        ];

        // Penuhi sisa slot jika ada bucket yang kurang dari kuota
        if (selected.length < targetTotal) {
          const remainingUnseen = topicPool.filter((q) => !seenIds.has(q.id) && !selectedSet.has(q.id));
          const remainingSeen = topicPool.filter((q) => seenIds.has(q.id) && !selectedSet.has(q.id));
          shuffleArray(remainingUnseen);
          shuffleArray(remainingSeen);

          for (const q of remainingUnseen) {
            if (selected.length < targetTotal) {
              selected.push(q);
              selectedSet.add(q.id);
            }
          }
          if (selected.length < targetTotal) {
            for (const q of remainingSeen) {
              if (selected.length < targetTotal) {
                selected.push(q);
                selectedSet.add(q.id);
              }
            }
          }
        }

        // Acak urutan tampilan akhir di server
        shuffleArray(selected);

        return selected.map((q, idx) => ({
          question_id: q.id,
          order_index: idx + 1,
        }));
      }

      if (directRes.rows.length === 0) {
        return [];
      }

      const questions = [...directRes.rows];
      return questions.map((q, idx) => ({
        question_id: q.id,
        order_index: idx + 1,
      }));
    }
  },

  /**
   * Membuat atau mengembalikan attempt aktif (IN_PROGRESS) untuk learner.
   * Menjamin snapshot soal tersimpan di attempt_questions sehingga konsisten saat reload.
   */
  async createAttempt(learnerId, assessmentId, forceNew = false, bypassLock = false) {
    const assessment = await this.getById(assessmentId, learnerId);
    if (!assessment) {
      const err = new Error("Assessment tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    if (!bypassLock && assessment.type !== "PRACTICE" && assessment.learner_status?.is_locked) {
      const err = new Error(assessment.learner_status.lock_reason || "Asesmen ini belum terbuka.");
      err.statusCode = 403;
      throw err;
    }

    // Periksa apakah sudah ada attempt IN_PROGRESS yang sedang berjalan
    if (!forceNew) {
      const existingAttempt = await pool.query(`
        SELECT id, learner_id, assessment_id, status, started_at, completed_at, score
        FROM attempts
        WHERE learner_id = $1 AND assessment_id = $2 AND status = 'IN_PROGRESS'
        ORDER BY started_at DESC
        LIMIT 1
      `, [learnerId, assessmentId]);

      if (existingAttempt.rows.length > 0) {
        const att = existingAttempt.rows[0];
        // Pastikan snapshot attempt_questions sudah ada
        const aqCheck = await pool.query(
          "SELECT 1 FROM attempt_questions WHERE attempt_id = $1 LIMIT 1",
          [att.id]
        );
        if (aqCheck.rows.length === 0) {
          const selectedQuestions = await this.selectQuestionsForAttempt(assessment, learnerId);
          for (const sq of selectedQuestions) {
            await pool.query(
              "INSERT INTO attempt_questions (attempt_id, question_id, order_index) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
              [att.id, sq.question_id, sq.order_index]
            );
          }
        }
        return {
          ...att,
          assessment,
        };
      }
    }

    // Pilih soal untuk attempt baru
    const selectedQuestions = await this.selectQuestionsForAttempt(assessment, learnerId);
    if (selectedQuestions.length === 0) {
      const err = new Error("Asesmen ini belum memiliki pertanyaan yang tersedia untuk dikerjakan.");
      err.statusCode = 400;
      throw err;
    }

    // Buat attempt baru dalam transaksi database
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const newAttemptRes = await client.query(`
        INSERT INTO attempts (learner_id, assessment_id, status, started_at)
        VALUES ($1, $2, 'IN_PROGRESS', NOW())
        RETURNING id, learner_id, assessment_id, status, started_at, completed_at, score
      `, [learnerId, assessmentId]);

      const newAttempt = newAttemptRes.rows[0];

      for (const sq of selectedQuestions) {
        await client.query(
          "INSERT INTO attempt_questions (attempt_id, question_id, order_index) VALUES ($1, $2, $3)",
          [newAttempt.id, sq.question_id, sq.order_index]
        );
      }

      await client.query("COMMIT");
      return {
        ...newAttempt,
        assessment,
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Memulai Re-assessment (Remedial / asesmen ulang konsep).
   * Memaksa pembuatan attempt baru dan mengembalikan soal-soal publik yang aman.
   */
  async reassess(learnerId, assessmentId) {
    const assessment = await this.getById(assessmentId);
    if (!assessment) {
      const err = new Error("Assessment tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    // Resume idempoten: jika sudah ada attempt IN_PROGRESS yang sedang berjalan, lanjutkan sesi tersebut
    const existingAttempt = await pool.query(
      `SELECT id, learner_id, assessment_id, status, started_at
         FROM attempts
        WHERE learner_id = $1 AND assessment_id = $2 AND status = 'IN_PROGRESS'
        ORDER BY started_at DESC LIMIT 1`,
      [learnerId, assessmentId]
    );

    let attempt;
    if (existingAttempt.rows.length > 0) {
      attempt = existingAttempt.rows[0];
    } else {
      attempt = await this.createAttempt(learnerId, assessmentId, true, true);
      try {
        await pool.query(
          `INSERT INTO learning_events (learner_id, event_type, entity_type, entity_id, metadata)
           VALUES ($1, 'ASSESSMENT_STARTED', 'attempt', $2, $3)`,
          [
            learnerId,
            attempt.id,
            JSON.stringify({
              assessmentId,
              title: assessment.title,
              type: assessment.type,
              isReassessment: true,
            }),
          ]
        );
      } catch (e) {
        console.warn("Failed to log assessment start event:", e.message);
      }
    }

    const questions = await this.getQuestionsByAssessmentId(assessmentId, false, attempt.id);

    return {
      attempt,
      assessment,
      questions,
    };
  },
  /**
   * Mengambil data attempt milik learner.
   */
  async getAttemptById(learnerId, attemptId) {
    const result = await pool.query(`
      SELECT att.id, att.learner_id, att.assessment_id, att.status,
             att.started_at, att.completed_at, att.score,
             att.material_scores, att.topic_scores, att.ai_analysis, att.ai_status, att.is_passed,
             a.title AS assessment_title,
             a.passing_score,
             a.type AS assessment_type,
             s.name AS subject_name,
             COALESCE(
               NULLIF((SELECT COUNT(*)::int FROM attempt_questions aq WHERE aq.attempt_id = att.id), 0),
               NULLIF((SELECT COUNT(*)::int FROM questions q WHERE q.assessment_id = a.id), 0),
               (SELECT COUNT(*)::int FROM evidence e WHERE e.attempt_id = att.id)
             ) AS total_questions
      FROM attempts att
      JOIN assessments a ON a.id = att.assessment_id
      JOIN subjects s ON s.id = a.subject_id
      WHERE att.id = $1
    `, [attemptId]);

    if (result.rows.length === 0) {
      const err = new Error("Attempt tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    const attempt = result.rows[0];

    // Authorization: hanya pemilik attempt yang boleh melihat
    if (attempt.learner_id !== learnerId) {
      const err = new Error("Akses ditolak: Anda tidak memiliki akses ke attempt ini");
      err.statusCode = 403;
      throw err;
    }

    // Evidence summary
    const evidenceSummary = await pool.query(`
      SELECT
        COUNT(*)::int AS answered_count,
        COUNT(*) FILTER (WHERE is_correct = true)::int AS correct_count,
        COUNT(*) FILTER (WHERE is_correct = false)::int AS incorrect_count
      FROM evidence
      WHERE attempt_id = $1
    `, [attemptId]);

    const counts = evidenceSummary.rows[0] || { answered_count: 0, correct_count: 0, incorrect_count: 0 };
    const passingScoreNum = Number(attempt.passing_score) || 70;
    const scoreNum = attempt.score !== null ? Number(attempt.score) : null;

    // 1. Concept-level breakdown for this attempt
    const conceptBreakdownRes = await pool.query(`
      SELECT
        e.concept_id,
        c.name AS concept_name,
        COUNT(*)::int AS total_questions,
        COUNT(*) FILTER (WHERE e.is_correct = true)::int AS correct_count,
        ROUND(AVG(e.score), 1)::float AS attempt_score,
        lcs.mastery_score,
        lcs.evidence_confidence,
        lcs.evidence_count,
        lcs.gap_status,
        lcs.primary_error_pattern
      FROM evidence e
      JOIN concepts c ON c.id = e.concept_id
      LEFT JOIN learner_concept_states lcs
        ON lcs.concept_id = e.concept_id AND lcs.learner_id = $1
      WHERE e.attempt_id = $2
      GROUP BY e.concept_id, c.name, lcs.mastery_score, lcs.evidence_confidence, lcs.evidence_count, lcs.gap_status, lcs.primary_error_pattern
      ORDER BY c.name ASC
    `, [learnerId, attemptId]);

    const conceptsPerformance = conceptBreakdownRes.rows.map((row) => ({
      concept_id: row.concept_id,
      concept_name: row.concept_name,
      total_questions: row.total_questions,
      correct_count: row.correct_count,
      attempt_score: row.attempt_score,
      mastery_score: row.mastery_score !== null ? Number(row.mastery_score) : null,
      evidence_confidence: row.evidence_confidence !== null ? Number(row.evidence_confidence) : null,
      evidence_count: row.evidence_count !== null ? Number(row.evidence_count) : 0,
      gap_status: row.gap_status || "INSUFFICIENT_EVIDENCE",
      primary_error_pattern: row.primary_error_pattern || null,
    }));

    // 2. Verification context jika attempt ini sendiri adalah verification attempt
    const verContextRes = await pool.query(`
      SELECT dv.id, dv.diagnostic_id, dv.result, dv.evidence_score,
             d.concept_id, c.name AS concept_name,
             d.candidate_root_cause_id, rc.name AS candidate_root_cause_name
      FROM diagnostic_verifications dv
      JOIN diagnostics d ON d.id = dv.diagnostic_id
      JOIN concepts c ON c.id = d.concept_id
      LEFT JOIN concepts rc ON rc.id = d.candidate_root_cause_id
      WHERE dv.attempt_id = $1
      LIMIT 1
    `, [attemptId]);
    const verificationContext = verContextRes.rows[0] || null;

    // 3. Diagnostics strictly relevant to concepts in this attempt with active gaps
    let diagnosticsList = [];
    let relevantActions = [];
    let nextAction = null;

    // Pastikan status NO_GAP / MASTERED tidak memicu rekomendasi diagnosis yang tidak relevan.
    // Hanya ambil diagnosis untuk konsep yang memang memiliki indikasi kesenjangan aktif,
    // atau jika attempt ini sendiri adalah sesi verifikasi.
    const activeGapConceptIds = conceptsPerformance
      .filter((c) =>
        ["POSSIBLE_GAP", "VERIFICATION", "CONFIRMED", "REJECTED", "INCONCLUSIVE", "IN_PRACTICE"].includes(c.gap_status)
      )
      .map((c) => c.concept_id);

    if (verificationContext && verificationContext.concept_id && !activeGapConceptIds.includes(verificationContext.concept_id)) {
      activeGapConceptIds.push(verificationContext.concept_id);
    }

    if (activeGapConceptIds.length > 0) {
      const diagRes = await pool.query(`
        SELECT
          d.id AS diagnostic_id,
          d.concept_id,
          c.name AS concept_name,
          d.candidate_root_cause_id,
          rc.name AS candidate_root_cause_name,
          d.diagnostic_status,
          d.verification_result,
          d.created_at,
          d.verified_at,
          lcs_rc.mastery_score AS candidate_mastery_score,
          lcs_rc.evidence_count AS candidate_evidence_count,
          lcs_rc.gap_status AS candidate_gap_status
        FROM diagnostics d
        JOIN concepts c ON c.id = d.concept_id
        LEFT JOIN concepts rc ON rc.id = d.candidate_root_cause_id
        LEFT JOIN learner_concept_states lcs_rc
          ON lcs_rc.concept_id = d.candidate_root_cause_id AND lcs_rc.learner_id = $1
        WHERE d.learner_id = $1
          AND d.concept_id = ANY($2::uuid[])
        ORDER BY d.created_at DESC
      `, [learnerId, activeGapConceptIds]);

      const seenConcepts = new Set();
      for (const d of diagRes.rows) {
        if (!seenConcepts.has(d.concept_id)) {
          seenConcepts.add(d.concept_id);
          diagnosticsList.push({
            id: d.diagnostic_id,
            concept_id: d.concept_id,
            concept_name: d.concept_name,
            candidate_root_cause_id: d.candidate_root_cause_id,
            candidate_root_cause_name: d.candidate_root_cause_name,
            candidate_mastery_score: d.candidate_mastery_score !== null ? Number(d.candidate_mastery_score) : null,
            candidate_evidence_count: d.candidate_evidence_count !== null ? Number(d.candidate_evidence_count) : 0,
            candidate_gap_status: d.candidate_gap_status || null,
            diagnostic_status: d.diagnostic_status,
            verification_result: d.verification_result,
            created_at: d.created_at,
            verified_at: d.verified_at,
          });
        }
      }

      // 4. Learning Actions strictly relevant to these diagnostics or active gap concepts
      const actionsRes = await pool.query(`
        SELECT
          la.id,
          la.concept_id,
          la.diagnostic_id,
          la.action_type,
          la.reason,
          la.priority,
          la.status,
          c.name AS concept_name
        FROM learning_actions la
        JOIN concepts c ON c.id = la.concept_id
        WHERE la.learner_id = $1
          AND la.status IN ('RECOMMENDED', 'IN_PROGRESS')
          AND (
            la.concept_id = ANY($2::uuid[])
            OR la.diagnostic_id IN (
              SELECT id FROM diagnostics WHERE learner_id = $1 AND concept_id = ANY($2::uuid[])
            )
          )
        ORDER BY la.priority ASC, la.created_at ASC
      `, [learnerId, activeGapConceptIds]);

      relevantActions = actionsRes.rows;
      nextAction = relevantActions.length > 0 ? relevantActions[0] : null;
    }

    // 5. Practice context jika attempt ini menjalankan sebuah learning_action
    const actContextRes = await pool.query(`
      SELECT la.id, la.action_type, la.concept_id, c.name AS concept_name, la.status
      FROM learning_actions la
      JOIN concepts c ON c.id = la.concept_id
      WHERE la.attempt_id = $1
      LIMIT 1
    `, [attemptId]);
    const actionContext = actContextRes.rows[0] || null;

    // 6. Evaluasi perbandingan Re-assessment jika ada attempt sebelumnya pada assessment yang sama
    let comparison = null;
    if (attempt.completed_at) {
      const priorAttemptRes = await pool.query(`
        SELECT id, score, completed_at
        FROM attempts
        WHERE learner_id = $1
          AND assessment_id = $2
          AND status = 'COMPLETED'
          AND id != $3
          AND completed_at < $4
        ORDER BY completed_at DESC
        LIMIT 1
      `, [learnerId, attempt.assessment_id, attemptId, attempt.completed_at]);

      if (priorAttemptRes.rows.length > 0) {
        const prior = priorAttemptRes.rows[0];
        const prevScore = prior.score !== null ? Number(prior.score) : null;
        const scoreDiff = (scoreNum !== null && prevScore !== null)
          ? Math.round((scoreNum - prevScore) * 100) / 100
          : null;

        // Ambil skor per konsep pada attempt sebelumnya untuk perbandingan level konsep
        const priorConceptRes = await pool.query(`
          SELECT concept_id, ROUND(AVG(score), 1)::float AS prior_concept_score
          FROM evidence
          WHERE attempt_id = $1
          GROUP BY concept_id
        `, [prior.id]);
        const priorConceptMap = new Map();
        for (const r of priorConceptRes.rows) {
          priorConceptMap.set(r.concept_id, r.prior_concept_score);
        }

        for (const cp of conceptsPerformance) {
          if (priorConceptMap.has(cp.concept_id)) {
            const pScore = priorConceptMap.get(cp.concept_id);
            cp.previous_attempt_score = pScore;
            cp.score_difference = Math.round((cp.attempt_score - pScore) * 10) / 10;
            cp.is_comparable = true;
          } else {
            cp.previous_attempt_score = null;
            cp.score_difference = null;
            cp.is_comparable = false;
          }
        }

        comparison = {
          is_comparable: true,
          comparison_type: "SAME_ASSESSMENT",
          previous_attempt_id: prior.id,
          previous_score: prevScore,
          current_score: scoreNum,
          score_difference: scoreDiff,
          improved: scoreDiff !== null ? scoreDiff > 0 : false,
          previous_completed_at: prior.completed_at,
        };
      } else {
        comparison = {
          is_comparable: false,
          reason: "Belum ada riwayat attempt sebelumnya pada asesmen ini untuk perbandingan langsung.",
        };
      }
    }

    // 7. Kelayakan Re-assessment
    const reassessmentEligible = actionContext !== null || conceptsPerformance.some((c) =>
      ["IN_PRACTICE", "CONFIRMED", "RESOLVED", "POSSIBLE_GAP"].includes(c.gap_status)
    );

    // 8. Primary Gap & Remedial Recommendation dari topic_scores & material_scores
    let primaryGap = null;
    let remedialRecommendation = null;
    const remedialRecommendations = [];

    // Prioritaskan evaluasi kelemahan spesifik per topik (< 70%)
    if (Array.isArray(attempt.topic_scores) && attempt.topic_scores.length > 0) {
      const topicGaps = attempt.topic_scores
        .filter((ts) => ts && ts.total >= 1 && (ts.score_percent !== undefined ? ts.score_percent < 70 : (ts.correct / ts.total) < 0.7))
        .sort((a, b) => (a.score_percent ?? 0) - (b.score_percent ?? 0));

      if (topicGaps.length > 0) {
        const weakest = topicGaps[0];
        primaryGap = {
          material: weakest.material || null,
          topic_name: weakest.topic_name,
          score_percent: weakest.score_percent,
          total_questions: weakest.total,
          correct_count: weakest.correct,
          incorrect_count: weakest.total - weakest.correct,
          confidence: weakest.total >= 4 ? "HIGH" : (weakest.total >= 2 ? "MEDIUM" : "LOW"),
        };

        for (const tGap of topicGaps.slice(0, 3)) {
          const topicQuery = await pool.query(`
            SELECT a.id, a.title, a.type, a.difficulty, a.passing_score, t.name AS topic_name
              FROM assessments a
              JOIN topics t ON t.id = a.topic_id
             WHERE t.name = $1 AND a.type = 'PRACTICE' AND a.id <> $2
             ORDER BY a.created_at ASC
             LIMIT 1
          `, [tGap.topic_name, attempt.assessment_id]);

          if (topicQuery.rows.length > 0) {
            const recAsmt = topicQuery.rows[0];
            const recObj = {
              assessment_id: recAsmt.id,
              title: recAsmt.title,
              type: recAsmt.type,
              target_material: tGap.material || null,
              target_topic: tGap.topic_name,
              difficulty: recAsmt.difficulty || "MEDIUM",
              question_count: 20,
              reason: `Latihan terarah 20 soal untuk memperkuat topik ${tGap.topic_name} (${tGap.score_percent}% benar).`,
              available: true,
            };
            remedialRecommendations.push(recObj);
            if (!remedialRecommendation) remedialRecommendation = recObj;
          }
        }
      }
    }

    if (!primaryGap && attempt.material_scores && typeof attempt.material_scores === "object") {
      const testedMaterials = [];
      for (const [mat, data] of Object.entries(attempt.material_scores)) {
        if (data && data.total > 0) {
          testedMaterials.push({
            material: mat,
            total: data.total,
            correct: data.correct,
            incorrect: data.incorrect,
            score_percent: data.score_percent,
          });
        }
      }
      testedMaterials.sort((a, b) => a.score_percent - b.score_percent);
      if (testedMaterials.length > 0) {
        const lowestMat = testedMaterials[0];
        if (lowestMat.total >= 3 && lowestMat.score_percent < 70) {
          primaryGap = {
            material: lowestMat.material,
            topic_name: null,
            score_percent: lowestMat.score_percent,
            total_questions: lowestMat.total,
            correct_count: lowestMat.correct,
            incorrect_count: lowestMat.incorrect,
            confidence: lowestMat.total >= 5 ? "HIGH" : "MEDIUM",
          };

          const targetMat = primaryGap.material.toUpperCase();
          const remQuery = await pool.query(`
            SELECT a.id, a.title, a.type, a.difficulty, a.passing_score, t.name AS topic_name
              FROM assessments a
              LEFT JOIN topics t ON t.id = a.topic_id
              LEFT JOIN levels l ON l.id = a.level_id
             WHERE (
               a.title ILIKE $1
               OR t.name ILIKE $1
               OR l.name ILIKE $1
             )
             AND a.id <> $2
             ORDER BY (CASE WHEN a.type = 'PRACTICE' THEN 1 ELSE 2 END), a.created_at ASC
             LIMIT 1
          `, [`%${targetMat === "JAVASCRIPT" ? "JavaScript" : targetMat}%`, attempt.assessment_id]);

          if (remQuery.rows.length > 0) {
            const rem = remQuery.rows[0];
            remedialRecommendation = {
              assessment_id: rem.id,
              title: rem.title,
              type: rem.type,
              target_material: targetMat,
              target_topic: rem.topic_name || null,
              difficulty: rem.difficulty || "MEDIUM",
              question_count: 20,
              reason: `Rekomendasi remedial terarah untuk memperkuat materi ${targetMat} berdasarkan gap asesmen.`,
              available: true,
            };
            remedialRecommendations.push(remedialRecommendation);
          }
        }
      }
    }

    return {
      id: attempt.id,
      learner_id: attempt.learner_id,
      assessment_id: attempt.assessment_id,
      assessment_title: attempt.assessment_title,
      assessment_type: attempt.assessment_type,
      subject_name: attempt.subject_name,
      status: attempt.status,
      started_at: attempt.started_at,
      completed_at: attempt.completed_at,
      score: scoreNum,
      passing_score: passingScoreNum,
      passed: scoreNum !== null ? scoreNum >= passingScoreNum : false,
      total_questions: Number(attempt.total_questions) || counts.answered_count,
      gradable_count: Number(attempt.total_questions) || counts.answered_count,
      answered_count: counts.answered_count,
      correct_count: counts.correct_count,
      incorrect_count: counts.incorrect_count,
      unanswered_count: Math.max(0, (Number(attempt.total_questions) || counts.answered_count) - counts.answered_count),
      // Enriched diagnostics & learning analytics
      concepts: conceptsPerformance,
      diagnostics: diagnosticsList,
      actions: relevantActions,
      next_action: nextAction,
      verification_context: verificationContext,
      action_context: actionContext,
      comparison,
      reassessment_eligible: reassessmentEligible,
      reassessment_assessment_id: attempt.assessment_id,
      material_scores: attempt.material_scores || null,
      topic_scores: attempt.topic_scores || null,
      primary_gap: primaryGap,
      remedial_recommendation: remedialRecommendation,
      ai_analysis: attempt.ai_analysis || null,
      ai_status: attempt.ai_status || "NONE",
      is_passed: attempt.is_passed !== null ? attempt.is_passed : (scoreNum !== null ? scoreNum >= passingScoreNum : false),
    };
  },

  /**
   * Submit attempt dengan server-side correctness evaluation & transaction.
   */
  async submitAttempt(learnerId, attemptId, answersPayload = []) {
    // 1. Ambil data attempt
const attemptRes = await pool.query(`
      SELECT att.id, att.learner_id, att.assessment_id, att.status,
             a.passing_score, a.title AS assessment_title, a.type AS assessment_type
      FROM attempts att
      JOIN assessments a ON a.id = att.assessment_id
      WHERE att.id = $1
    `, [attemptId]);

    if (attemptRes.rows.length === 0) {
      const err = new Error("Attempt tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    const attempt = attemptRes.rows[0];

    // 2. Authorization: hanya pemilik attempt yang boleh submit
    if (attempt.learner_id !== learnerId) {
      const err = new Error("Akses ditolak: Anda tidak memiliki akses ke attempt ini");
      err.statusCode = 403;
      throw err;
    }

    // 3. Status validation: attempt yang sudah submitted tidak dapat diubah lagi
    if (attempt.status !== "IN_PROGRESS") {
      const err = new Error("Attempt ini sudah selesai dan tidak dapat disubmit ulang");
      err.statusCode = 400;
      throw err;
    }

    if (!Array.isArray(answersPayload)) {
      const err = new Error("Format jawaban tidak valid (harus berupa array)");
      err.statusCode = 400;
      throw err;
    }

    // 4. Ambil semua soal non-esai dari attempt_questions (snapshot resmi attempt)
    let questionsRes = await pool.query(`
      SELECT q.id, q.assessment_id, q.type, q.question_text, q.correct_answer,
             q.points, aq.order_index, q.concept_id, q.material,
             c.name AS concept_name, t.name AS topic_name
        FROM attempt_questions aq
        JOIN questions q ON q.id = aq.question_id
        LEFT JOIN concepts c ON c.id = q.concept_id
        LEFT JOIN topic_concepts tc ON tc.concept_id = c.id
        LEFT JOIN topics t ON t.id = tc.topic_id
       WHERE aq.attempt_id = $1 AND q.type <> 'ESSAY'
       ORDER BY aq.order_index ASC
    `, [attemptId]);

    // Fallback jika attempt dibuat sebelum migrasi snapshot
    if (questionsRes.rows.length === 0) {
      questionsRes = await pool.query(`
        SELECT q.id, q.assessment_id, q.type, q.question_text, q.correct_answer,
               q.points, q.order_index, q.concept_id, q.material,
               c.name AS concept_name, t.name AS topic_name
          FROM questions q
          LEFT JOIN concepts c ON c.id = q.concept_id
          LEFT JOIN topic_concepts tc ON tc.concept_id = c.id
          LEFT JOIN topics t ON t.id = tc.topic_id
         WHERE q.assessment_id = $1 AND q.type <> 'ESSAY'
         ORDER BY q.order_index ASC
      `, [attempt.assessment_id]);
    }

    const questions = questionsRes.rows;
    if (questions.length === 0) {
      const err = new Error("Asesmen ini belum memiliki pertanyaan yang dapat dinilai");
      err.statusCode = 400;
      throw err;
    }

    const questionMap = new Map();
    for (const q of questions) {
      questionMap.set(q.id, q);
    }

    // 6. Validasi dan evaluasi setiap jawaban di SERVER
    const evaluatedEvidence = [];
    const answeredQuestionIds = new Set();
    const excludedQuestions = [];
    let totalEarnedPoints = 0;
    let totalPossiblePoints = 0;
    let correctCount = 0;

    for (const q of questions) {
      if (isQuestionGradable(q)) {
        totalPossiblePoints += Number(q.points);
      } else {
        excludedQuestions.push(q.id);
      }
    }

    for (const item of answersPayload) {
      if (!item || !item.question_id) {
        continue;
      }

      const question = questionMap.get(item.question_id);
      if (!question) {
        const err = new Error(`Pertanyaan dengan ID ${item.question_id} tidak valid atau tidak termasuk dalam asesmen ini`);
        err.statusCode = 400;
        throw err;
      }

      if (answeredQuestionIds.has(item.question_id)) {
        continue;
      }
      answeredQuestionIds.add(item.question_id);

      let isCorrect = false;
      let percent = 0;
      let errorPattern = null;
      let answerObj = {};

      if (question.type === "MULTIPLE_CHOICE") {
        const options = (question.correct_answer && Array.isArray(question.correct_answer.options))
          ? question.correct_answer.options
          : [];
        const correctLetter = (question.correct_answer && question.correct_answer.correct)
          ? String(question.correct_answer.correct).trim().toUpperCase()
          : null;

        let rawVal = item.selected !== undefined ? item.selected : (item.answer !== undefined ? item.answer : item.answer_text);
        if (rawVal && typeof rawVal === "object" && rawVal.selected) {
          rawVal = rawVal.selected;
        }

        let learnerChoiceLetter = null;
        if (rawVal === null || rawVal === undefined || String(rawVal).trim() === "") {
          learnerChoiceLetter = null;
        } else if (typeof rawVal === "number" && rawVal >= 0 && rawVal < options.length) {
          learnerChoiceLetter = String.fromCharCode(65 + rawVal);
        } else if (typeof rawVal === "string") {
          const trimmed = rawVal.trim();
          const upper = trimmed.toUpperCase();
          if (upper.length === 1 && upper >= "A" && upper <= "Z") {
            learnerChoiceLetter = upper;
          } else if (/^\d+$/.test(trimmed)) {
            const num = parseInt(trimmed, 10);
            if (num >= 0 && num < options.length) {
              learnerChoiceLetter = String.fromCharCode(65 + num);
            }
          } else {
            const optIndex = options.findIndex(
              (opt) => String(opt).trim().toLowerCase() === trimmed.toLowerCase()
            );
            if (optIndex >= 0) {
              learnerChoiceLetter = String.fromCharCode(65 + optIndex);
            }
          }
        }

        if (rawVal !== null && rawVal !== undefined && String(rawVal).trim() !== "" && !learnerChoiceLetter) {
          const err = new Error(`Pilihan jawaban tidak valid untuk pertanyaan #${question.order_index}`);
          err.statusCode = 400;
          throw err;
        }

        const maxOptionLetter = options.length > 0 ? String.fromCharCode(64 + options.length) : "Z";
        if (learnerChoiceLetter && (learnerChoiceLetter < "A" || learnerChoiceLetter > maxOptionLetter)) {
          const err = new Error(`Pilihan jawaban di luar rentang opsi untuk pertanyaan #${question.order_index}`);
          err.statusCode = 400;
          throw err;
        }

        answerObj = { selected: learnerChoiceLetter || "" };

        if (!learnerChoiceLetter) {
          isCorrect = false;
          percent = 0;
          errorPattern = "NO_ANSWER";
        } else if (correctLetter && learnerChoiceLetter === correctLetter) {
          isCorrect = true;
          percent = 100;
        } else {
          isCorrect = false;
          percent = 0;
          errorPattern = `WRONG_OPTION:selected=${learnerChoiceLetter};expected=${correctLetter}`;
        }
      } else if (question.type === "DRAG_DROP") {
        const correctMap = (question.correct_answer && typeof question.correct_answer.correct === "object")
          ? question.correct_answer.correct
          : {};

        let learnerMatches = {};
        const rawDrag = item.selected !== undefined ? item.selected : (item.answer !== undefined ? item.answer : (item.matches !== undefined ? item.matches : item.answer_text));
        if (rawDrag && typeof rawDrag === "object") {
          learnerMatches = rawDrag;
        } else if (typeof rawDrag === "string") {
          try {
            learnerMatches = JSON.parse(rawDrag);
          } catch (e) {
            learnerMatches = {};
          }
        }

        answerObj = { matches: learnerMatches };

        const correctKeys = Object.keys(correctMap);
        if (correctKeys.length > 0) {
          let allMatch = true;
          for (const key of correctKeys) {
            if (learnerMatches[key] !== correctMap[key]) {
              allMatch = false;
              break;
            }
          }
          if (allMatch && Object.keys(learnerMatches).length >= correctKeys.length) {
            isCorrect = true;
            percent = 100;
          } else {
            isCorrect = false;
            percent = 0;
            errorPattern = "DRAG_DROP_MISMATCH";
          }
        } else {
          isCorrect = false;
          percent = 0;
          errorPattern = "DRAG_DROP_NO_KEY";
        }
      } else {
        const submittedText =
          typeof item.answer === "string"
            ? item.answer
            : item.answer && typeof item.answer === "object"
              ? item.answer.text ?? item.answer.code ?? item.answer.input ?? ""
              : typeof item.selected === "string"
                ? item.selected
                : "";

        answerObj = question.type === "CODE" ? { code: submittedText } : { text: submittedText };
        const graded = grade(question, answerObj);
        isCorrect = graded.isCorrect;
        percent = graded.score;
        errorPattern = graded.errorPattern;
      }

      const questionScore = (Number(question.points) * percent) / 100;
      totalEarnedPoints += questionScore;
      if (isCorrect) correctCount++;

      const assignedConceptId = question.concept_id;
      if (!assignedConceptId) {
        const err = new Error(`Pertanyaan #${question.order_index} belum memiliki pemetaan konsep`);
        err.statusCode = 400;
        throw err;
      }

      evaluatedEvidence.push({
        question_id: question.id,
        concept_id: assignedConceptId,
        answer: answerObj,
        is_correct: isCorrect,
        score: percent,
        error_pattern: errorPattern,
        response_time_seconds: Number.isInteger(item.response_time_seconds) ? item.response_time_seconds : null,
      });
    }

    // 7. Hitung final percentage score (0..100)
    let finalPercentage = 0;
    if (totalPossiblePoints > 0) {
      finalPercentage = Math.round((totalEarnedPoints / totalPossiblePoints) * 100 * 100) / 100;
    }
    finalPercentage = Math.max(0, Math.min(100, finalPercentage));

    const passingScoreNum = Number(attempt.passing_score) || 70;
    const isPassed = finalPercentage >= passingScoreNum;

    // 8. Agregasi performa per materi (HTML, CSS, JavaScript) & per topik
    const materialStats = {};
    const topicStatsMap = new Map();

    for (const q of questions) {
      if (excludedQuestions.includes(q.id)) continue;
      // Jangan menamai otomatis sebagai HTML jika materi belum terpetakan
      const mat = q.material ? q.material.toUpperCase() : "BELUM_TERPETAKAN";
      if (!materialStats[mat]) {
        materialStats[mat] = {
          total: 0,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          earned_points: 0,
          possible_points: 0,
          score_percent: 0,
          sample_status: "DATA_TERBATAS",
          mastery_status: "DATA_TERBATAS",
          sample_note: "Sampel soal belum mencukupi untuk penilaian definitif.",
        };
      }
      materialStats[mat].total += 1;
      materialStats[mat].possible_points += Number(q.points);

      const ev = evaluatedEvidence.find((e) => e.question_id === q.id);
      if (ev) {
        if (ev.is_correct) materialStats[mat].correct += 1;
        else materialStats[mat].incorrect += 1;
        materialStats[mat].earned_points += (Number(q.points) * ev.score) / 100;
      } else {
        materialStats[mat].unanswered += 1;
      }

      const topicName = q.topic_name || "Belum Terpetakan";
      if (!topicStatsMap.has(topicName)) {
        topicStatsMap.set(topicName, {
          topic_name: topicName,
          material: mat,
          total: 0,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          score_percent: 0,
          sample_status: "DATA_TERBATAS",
          mastery_status: "DATA_TERBATAS",
        });
      }
      const ts = topicStatsMap.get(topicName);
      ts.total += 1;
      if (ev) {
        if (ev.is_correct) ts.correct += 1;
        else ts.incorrect += 1;
      } else {
        ts.unanswered += 1;
      }
    }

    for (const mat of Object.keys(materialStats)) {
      const ms = materialStats[mat];
      ms.score_percent = ms.total > 0 ? Math.round((ms.correct / ms.total) * 100) : 0;
      if (ms.total < 3) {
        ms.sample_status = "DATA_TERBATAS";
        ms.mastery_status = "DATA_TERBATAS";
        ms.sample_note = `Sampel ${ms.total} soal belum cukup untuk menyimpulkan penguasaan (minimal 3 soal).`;
      } else if (ms.score_percent < 70) {
        ms.sample_status = "CUKUP";
        ms.mastery_status = "PERLU_PENGUATAN";
        ms.sample_note = "Akurasi di bawah ambang 70%, memerlukan latihan penguatan.";
      } else if (ms.score_percent < 85) {
        ms.sample_status = "CUKUP";
        ms.mastery_status = "BERKEMBANG";
        ms.sample_note = "Pemahaman berkembang baik (70% - 84%).";
      } else {
        ms.sample_status = "CUKUP";
        ms.mastery_status = "MENGUASAI";
        ms.sample_note = "Memenuhi ambang penguasaan materi (>= 85%).";
      }
    }

    const topicBreakdown = [];
    for (const ts of topicStatsMap.values()) {
      ts.score_percent = ts.total > 0 ? Math.round((ts.correct / ts.total) * 100) : 0;
      if (ts.total < 3) {
        ts.sample_status = "DATA_TERBATAS";
        ts.mastery_status = "DATA_TERBATAS";
      } else if (ts.score_percent < 70) {
        ts.sample_status = "CUKUP";
        ts.mastery_status = "PERLU_PENGUATAN";
      } else if (ts.score_percent < 85) {
        ts.sample_status = "CUKUP";
        ts.mastery_status = "BERKEMBANG";
      } else {
        ts.sample_status = "CUKUP";
        ts.mastery_status = "MENGUASAI";
      }
      topicBreakdown.push(ts);
    }

    // 9. Deteksi Research Gap Analysis Berbasis Data Topik & Materi
    const testedMaterials = Object.entries(materialStats)
      .filter(([_, data]) => data.total > 0)
      .map(([mat, data]) => ({ material: mat, ...data }));

    testedMaterials.sort((a, b) => a.score_percent - b.score_percent);

    // Cari topik spesifik terlemah (< 70%) dengan sampel mencukupi (total >= 3)
    const candidateTopicGaps = topicBreakdown
      .filter((tb) => tb.total >= 3 && tb.score_percent < 70)
      .sort((a, b) => a.score_percent - b.score_percent || (b.total - b.correct) - (a.total - a.correct));

    let primaryGap = null;
    let gapConfidence = "NONE";
    let gapReason = null;

    if (candidateTopicGaps.length > 0) {
      const weakestTopic = candidateTopicGaps[0];
      gapConfidence = weakestTopic.total >= 5 ? "HIGH" : "MEDIUM";
      primaryGap = {
        material: weakestTopic.material,
        topic_name: weakestTopic.topic_name,
        score_percent: weakestTopic.score_percent,
        total_questions: weakestTopic.total,
        correct_count: weakestTopic.correct,
        incorrect_count: weakestTopic.total - weakestTopic.correct,
        confidence: gapConfidence,
      };
      gapReason = `Akurasi topik ${weakestTopic.topic_name} (${weakestTopic.score_percent}%) merupakan yang terendah dan berada di bawah ambang penguasaan 70%.`;
    } else if (testedMaterials.length > 0) {
      const lowestMat = testedMaterials[0];
      if (lowestMat.total < 3) {
        gapConfidence = "LOW";
        gapReason = `Data sampel soal untuk materi ${lowestMat.material} terlalu sedikit (${lowestMat.total} soal) untuk menentukan learning gap secara definitif.`;
      } else if (lowestMat.score_percent < 70) {
        gapConfidence = lowestMat.total >= 5 ? "HIGH" : "MEDIUM";
        primaryGap = {
          material: lowestMat.material,
          topic_name: null,
          score_percent: lowestMat.score_percent,
          total_questions: lowestMat.total,
          correct_count: lowestMat.correct,
          incorrect_count: lowestMat.incorrect,
          confidence: gapConfidence,
        };
        gapReason = `Akurasi materi ${lowestMat.material} (${lowestMat.score_percent}%) merupakan yang terendah dan berada di bawah ambang penguasaan 70%.`;
      } else {
        gapConfidence = "HIGH";
        gapReason = "Semua materi yang diuji mencapai ambang batas kompetensi minimal 70%.";
      }
    }

    // 10. Rekomendasi Remedial Berdasarkan Gap (Dipetakan ke Practice Assessment Topik/Materi)
    let remedialRecommendation = null;
    const remedialRecommendations = [];
    const recommendedTopicIds = new Set();

    if (candidateTopicGaps.length > 0) {
      for (const tGap of candidateTopicGaps) {
        if (remedialRecommendations.length >= 3) break;
        const topicQuery = await pool.query(`
          SELECT a.id, a.title, a.type, a.difficulty, a.passing_score, t.name AS topic_name, t.id AS topic_id
            FROM assessments a
            JOIN topics t ON t.id = a.topic_id
           WHERE t.name = $1 AND a.type = 'PRACTICE' AND a.id <> $2
           ORDER BY a.created_at ASC
           LIMIT 1
        `, [tGap.topic_name, attempt.assessment_id]);

        if (topicQuery.rows.length > 0) {
          const recAsmt = topicQuery.rows[0];
          if (!recommendedTopicIds.has(recAsmt.id)) {
            recommendedTopicIds.add(recAsmt.id);
            const recObj = {
              assessment_id: recAsmt.id,
              title: recAsmt.title,
              type: recAsmt.type,
              target_material: tGap.material,
              target_topic: tGap.topic_name,
              difficulty: recAsmt.difficulty || "MEDIUM",
              question_count: 20,
              reason: `Latihan terarah 20 soal untuk memperkuat topik ${tGap.topic_name} (${tGap.score_percent}% benar).`,
              available: true,
            };
            remedialRecommendations.push(recObj);
            if (!remedialRecommendation) {
              remedialRecommendation = recObj;
            }
          }
        }
      }
    }

    if (!remedialRecommendation && primaryGap && primaryGap.material) {
      const targetMat = primaryGap.material.toUpperCase();
      const remQuery = await pool.query(`
        SELECT a.id, a.title, a.type, a.difficulty, a.passing_score, t.name AS topic_name
          FROM assessments a
          LEFT JOIN topics t ON t.id = a.topic_id
          LEFT JOIN levels l ON l.id = a.level_id
         WHERE (
           a.title ILIKE $1
           OR t.name ILIKE $1
           OR l.name ILIKE $1
         )
         AND a.id <> $2
         ORDER BY (CASE WHEN a.type = 'PRACTICE' THEN 1 ELSE 2 END), a.created_at ASC
         LIMIT 1
      `, [`%${targetMat === "JAVASCRIPT" ? "JavaScript" : targetMat}%`, attempt.assessment_id]);

      if (remQuery.rows.length > 0) {
        const rem = remQuery.rows[0];
        remedialRecommendation = {
          assessment_id: rem.id,
          title: rem.title,
          type: rem.type,
          target_material: targetMat,
          target_topic: rem.topic_name || null,
          difficulty: rem.difficulty || "MEDIUM",
          question_count: 20,
          reason: `Rekomendasi latihan terarah 20 soal untuk memperkuat materi ${targetMat} berdasarkan gap asesmen.`,
          available: true,
        };
        remedialRecommendations.push(remedialRecommendation);
      }
    }

    // 11. AI Research Gap Analysis (dengan safe fallback jika provider offline/gagal)
    let aiAnalysis = null;
    let aiStatus = "NONE";

    try {
      const aiRes = await aiService.analyzeAssessmentGap({
        assessmentTitle: attempt.assessment_title,
        score: finalPercentage,
        isPassed,
        materialBreakdown: materialStats,
        topicBreakdown,
        primaryGap,
      });
      aiAnalysis = aiRes;
      aiStatus = "COMPLETED";
    } catch (aiErr) {
      console.warn("AI GAP ANALYSIS FAILED / OFFLINE (menggunakan fallback deterministik):", aiErr.message);
      aiAnalysis = aiService.getDeterministicGapFallback({
        assessmentTitle: attempt.assessment_title,
        score: finalPercentage,
        isPassed,
        materialBreakdown: materialStats,
        primaryGap,
      });
      aiStatus = "FAILED";
    }

    // 12. Simpan ke database dengan Database Transaction
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Simpan evidence rows
      for (const ev of evaluatedEvidence) {
        await client.query(`
          INSERT INTO evidence (attempt_id, question_id, concept_id, answer, is_correct, score, error_pattern, response_time_seconds, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        `, [
          attemptId,
          ev.question_id,
          ev.concept_id,
          JSON.stringify(ev.answer),
          ev.is_correct,
          ev.score,
          ev.error_pattern,
          ev.response_time_seconds,
        ]);
      }

      // Update attempt status menjadi COMPLETED dan simpan score + analitik performa + AI
      const updatedAttempt = await client.query(`
        UPDATE attempts
        SET status = 'COMPLETED',
            completed_at = NOW(),
            score = $1,
            material_scores = $2,
            topic_scores = $3,
            ai_analysis = $4,
            ai_status = $5,
            is_passed = $6
        WHERE id = $7
        RETURNING id, learner_id, assessment_id, status, started_at, completed_at, score,
                  material_scores, topic_scores, ai_analysis, ai_status, is_passed
      `, [
        finalPercentage,
        JSON.stringify(materialStats),
        JSON.stringify(topicBreakdown),
        JSON.stringify(aiAnalysis),
        aiStatus,
        isPassed,
        attemptId,
      ]);

      await client.query("COMMIT");

      // Rehit mastery SETELAH commit evidence berhasil
      try {
        await masteryService.recalculateForConcepts(
          learnerId,
          evaluatedEvidence.map((ev) => ev.concept_id)
        );
      } catch (masteryError) {
        console.error("MASTERY RECALC FAILED (evidence tetap tersimpan):", masteryError);
      }

      // Gap pipeline resolution
      try {
        await gapService.resolveVerification(learnerId, attemptId);
      } catch (gapError) {
        console.error("GAP VERIFICATION RESOLVE FAILED (evidence tetap tersimpan):", gapError);
      }

      // Recommendation cycle
      try {
        await recommendationService.onAttemptSubmitted(learnerId, attemptId);
      } catch (recError) {
        console.error("RECOMMENDATION COMPLETE FAILED (evidence tetap tersimpan):", recError);
      }

      // Re-assessment event log
      if (attempt.assessment_type === "REASSESSMENT") {
        try {
          await pool.query(
            `INSERT INTO learning_events (learner_id, event_type, entity_type, entity_id, metadata)
             VALUES ($1, 'REASSESSMENT_COMPLETED', 'attempt', $2, $3)`,
            [
              learnerId,
              attemptId,
              JSON.stringify({
                assessmentId: attempt.assessment_id,
                title: attempt.assessment_title,
                score: finalPercentage,
                passingScore: passingScoreNum,
                passed: isPassed,
              }),
            ]
          );
        } catch (evtErr) {
          console.error("REASSESSMENT EVENT LOG ERROR:", evtErr);
        }
      }

      return {
        id: updatedAttempt.rows[0].id,
        assessment_id: attempt.assessment_id,
        assessment_title: attempt.assessment_title,
        status: "COMPLETED",
        score: finalPercentage,
        passing_score: passingScoreNum,
        passed: isPassed,
        is_passed: isPassed,
        total_questions: questions.length,
        gradable_count: questions.length - excludedQuestions.length,
        excluded_count: excludedQuestions.length,
        answered_count: evaluatedEvidence.length,
        correct_count: correctCount,
        incorrect_count: evaluatedEvidence.length - correctCount,
        unanswered_count: Math.max(0, (questions.length - excludedQuestions.length) - evaluatedEvidence.length),
        completed_at: updatedAttempt.rows[0].completed_at,
        material_scores: materialStats,
        topic_scores: topicBreakdown,
        primary_gap: primaryGap,
        remedial_recommendation: remedialRecommendation,
        remedial_recommendations: remedialRecommendations,
        ai_analysis: aiAnalysis,
        ai_status: aiStatus,
      };
    } catch (dbError) {
      await client.query("ROLLBACK");
      throw dbError;
    } finally {
      client.release();
    }
  },

  /**
   * Status perkembangan alur level (Easy -> Medium -> Hard) berbasis verifikasi backend.
   */
  async getLevelProgressionStatus(learnerId) {
    const res = await pool.query(
      `SELECT a.id AS assessment_id, a.title, a.difficulty, a.passing_score,
              att.id AS attempt_id, att.score, att.is_passed, att.completed_at
         FROM assessments a
         LEFT JOIN attempts att ON att.assessment_id = a.id AND att.learner_id = $1 AND att.status = 'COMPLETED'
        WHERE a.type = 'MIXED'
        ORDER BY (
          CASE a.difficulty
            WHEN 'EASY' THEN 1
            WHEN 'MEDIUM' THEN 2
            WHEN 'HARD' THEN 3
            ELSE 4
          END
        ), att.completed_at DESC NULLS LAST`,
      [learnerId]
    );

    const levelsMap = {
      EASY: { difficulty: "EASY", assessment: null, attempts: [], is_unlocked: true, is_passed: false, best_score: null },
      MEDIUM: { difficulty: "MEDIUM", assessment: null, attempts: [], is_unlocked: false, is_passed: false, best_score: null },
      HARD: { difficulty: "HARD", assessment: null, attempts: [], is_unlocked: false, is_passed: false, best_score: null },
    };

    for (const r of res.rows) {
      const diff = (r.difficulty || "EASY").toUpperCase();
      if (!levelsMap[diff]) continue;
      if (!levelsMap[diff].assessment) {
        levelsMap[diff].assessment = {
          id: r.assessment_id,
          title: r.title,
          passing_score: Number(r.passing_score) || 70,
        };
      }
      if (r.attempt_id) {
        const sc = Number(r.score);
        levelsMap[diff].attempts.push({
          attempt_id: r.attempt_id,
          score: sc,
          is_passed: r.is_passed || sc >= (Number(r.passing_score) || 70),
          completed_at: r.completed_at,
        });
      }
    }

    for (const diff of ["EASY", "MEDIUM", "HARD"]) {
      const lvl = levelsMap[diff];
      if (lvl.attempts.length > 0) {
        lvl.best_score = Math.max(...lvl.attempts.map((a) => a.score));
        const passing = lvl.assessment ? lvl.assessment.passing_score : 70;
        lvl.is_passed = lvl.attempts.some((a) => a.is_passed || a.score >= passing);
      }
    }

    if (levelsMap.EASY.is_passed) {
      levelsMap.MEDIUM.is_unlocked = true;
    }
    if (levelsMap.MEDIUM.is_passed) {
      levelsMap.HARD.is_unlocked = true;
    }

    let currentLevel = "EASY";
    if (levelsMap.HARD.is_passed) {
      currentLevel = "COMPLETED";
    } else if (levelsMap.MEDIUM.is_passed) {
      currentLevel = "HARD";
    } else if (levelsMap.EASY.is_passed) {
      currentLevel = "MEDIUM";
    }

    return {
      current_level: currentLevel,
      unlocked_levels: Object.values(levelsMap).filter((l) => l.is_unlocked).map((l) => l.difficulty),
      completed_levels: Object.values(levelsMap).filter((l) => l.is_passed).map((l) => l.difficulty),
      levels: levelsMap,
    };
  },

  /**
   * Retry AI Research Gap Analysis jika sebelumnya berstatus FAILED / PENDING.
   */
  async retryAiGapAnalysis(learnerId, attemptId) {
    const attemptRes = await pool.query(
      `SELECT att.id, att.learner_id, att.status, att.score, att.is_passed,
              att.material_scores, att.topic_scores, a.title AS assessment_title
         FROM attempts att
         JOIN assessments a ON a.id = att.assessment_id
        WHERE att.id = $1`,
      [attemptId]
    );

    if (attemptRes.rows.length === 0) throw notFound("Attempt tidak ditemukan");
    const attempt = attemptRes.rows[0];
    if (attempt.learner_id !== learnerId) throw forbidden("Akses ditolak");
    if (attempt.status !== "COMPLETED") throw badRequest("Hanya attempt yang sudah selesai yang dapat dianalisis AI");

    const materialStats = attempt.material_scores || {};
    const topicBreakdown = attempt.topic_scores || [];
    const testedMaterials = Object.entries(materialStats)
      .filter(([_, data]) => data.total > 0)
      .map(([mat, data]) => ({ material: mat, ...data }))
      .sort((a, b) => a.score_percent - b.score_percent);

    const primaryGap = (testedMaterials.length > 0 && testedMaterials[0].score_percent < 70)
      ? testedMaterials[0]
      : null;

    let aiAnalysis;
    let aiStatus;
    try {
      aiAnalysis = await aiService.analyzeAssessmentGap({
        assessmentTitle: attempt.assessment_title,
        score: Number(attempt.score),
        isPassed: attempt.is_passed,
        materialBreakdown: materialStats,
        topicBreakdown,
        primaryGap,
      });
      aiStatus = "COMPLETED";
    } catch (e) {
      aiAnalysis = aiService.getDeterministicGapFallback({
        assessmentTitle: attempt.assessment_title,
        score: Number(attempt.score),
        isPassed: attempt.is_passed,
        materialBreakdown: materialStats,
        primaryGap,
      });
      aiStatus = "FAILED";
    }

    await pool.query(
      "UPDATE attempts SET ai_analysis = $1, ai_status = $2 WHERE id = $3",
      [JSON.stringify(aiAnalysis), aiStatus, attemptId]
    );

    return {
      attempt_id: attemptId,
      ai_status: aiStatus,
      ai_analysis: aiAnalysis,
    };
  },

  // ============================================================
// Admin CRUD (dilindungi requireAuth + requireAdmin di layer routes)
// ============================================================

  /** Detail assessment untuk editor: meta + soal lengkap (ada kunci jawaban). */
  async getFullById(id) {
    requireUuid(id, "id");
    const assessment = await this.getById(id);
    if (!assessment) throw notFound("Assessment tidak ditemukan");
    const questions = await questionService.getFullByAssessmentId(id);
    return { ...toPublicAssessment(assessment), questions };
  },

  /** Buat assessment baru. */
  async create(input = {}) {
    const title = requireText(input.title, "title");
    const subjectId = requireUuid(input.subjectId, "subjectId");
    const type = requireEnum(input.type, ASSESSMENT_TYPES, "type");
    const levelId = input.levelId ? requireUuid(input.levelId, "levelId") : null;
    const topicId = input.topicId ? requireUuid(input.topicId, "topicId") : null;
    const durationMinutes = input.durationMinutes != null && input.durationMinutes !== ""
      ? requirePositiveInt(input.durationMinutes, "durationMinutes")
      : null;
    const passingScore = input.passingScore != null && input.passingScore !== ""
      ? requireScore(input.passingScore)
      : null;

    await assertReferenceExists(subjectId, "subjects", "Subject tidak ditemukan");
    if (levelId) await assertReferenceExists(levelId, "levels", "Level tidak ditemukan");
    if (topicId) await assertReferenceExists(topicId, "topics", "Topic tidak ditemukan");

    // Klarifikasi rule CHECK di schema lebih dulu, supaya bukan 500.
    if (type === "TOPIC" && !topicId) {
      throw badRequest("Assessment bertipe TOPIC wajib memilih topic");
    }
    if (type === "LEVEL_FINAL" && !levelId) {
      throw badRequest("Assessment bertipe LEVEL_FINAL wajib memilih level");
    }

    const result = await pool.query(
      `INSERT INTO assessments (subject_id, level_id, topic_id, type, title, duration_minutes, passing_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [subjectId, levelId, topicId, type, title, durationMinutes, passingScore]
    );
    return toPublicAssessment(await this.getById(result.rows[0].id));
  },

  /** Ubah assessment (partial). */
  async update(id, input = {}) {
    requireUuid(id, "id");
    const current = await this.getById(id);
    if (!current) throw notFound("Assessment tidak ditemukan");

    const fields = [];
    const values = [];
    const push = (col, val) => {
      values.push(val);
      fields.push(`${col} = $${values.length}`);
    };

    const title = input.title !== undefined ? requireText(input.title, "title") : current.title;
    const type = input.type !== undefined
      ? requireEnum(input.type, ASSESSMENT_TYPES, "type")
      : current.type;
    const subjectId = input.subjectId !== undefined
      ? requireUuid(input.subjectId, "subjectId")
      : current.subject_id;
    const levelId = input.levelId !== undefined
      ? (input.levelId ? requireUuid(input.levelId, "levelId") : null)
      : current.level_id;
    const topicId = input.topicId !== undefined
      ? (input.topicId ? requireUuid(input.topicId, "topicId") : null)
      : current.topic_id;
    const durationMinutes = input.durationMinutes !== undefined
      ? (input.durationMinutes === null || input.durationMinutes === ""
          ? null
          : requirePositiveInt(input.durationMinutes, "durationMinutes"))
      : current.duration_minutes;
    const passingScore = input.passingScore !== undefined
      ? (input.passingScore === null || input.passingScore === ""
          ? null
          : requireScore(input.passingScore))
      : current.passing_score;

    await assertReferenceExists(subjectId, "subjects", "Subject tidak ditemukan");
    if (levelId) await assertReferenceExists(levelId, "levels", "Level tidak ditemukan");
    if (topicId) await assertReferenceExists(topicId, "topics", "Topic tidak ditemukan");

    if (type === "TOPIC" && !topicId) throw badRequest("Assessment bertipe TOPIC wajib memilih topic");
    if (type === "LEVEL_FINAL" && !levelId) throw badRequest("Assessment bertipe LEVEL_FINAL wajib memilih level");

    if (title !== current.title) push("title", title);
    if (type !== current.type) push("type", type);
    if (subjectId !== current.subject_id) push("subject_id", subjectId);
    if (levelId !== (current.level_id || null)) push("level_id", levelId);
    if (topicId !== (current.topic_id || null)) push("topic_id", topicId);
    if (durationMinutes !== (current.duration_minutes || null)) push("duration_minutes", durationMinutes);
    if (passingScore !== (current.passing_score || null)) push("passing_score", passingScore);

    if (fields.length === 0) return toPublicAssessment(current);

    const result = await pool.query(
      `UPDATE assessments SET ${fields.join(", ")} WHERE id = $${values.length + 1}`,
      [...values, id]
    );
    if (result.rowCount === 0) throw notFound("Assessment tidak ditemukan");
    return toPublicAssessment(await this.getById(id));
  },

  /**
   * Hapus assessment.
   * 409 bila sudah ada riwayat pengerjaan (attempts/evidence) — data peserta
   * tidak boleh dihapus. Soal ikut terhapus dalam transaksi karena FK
   * questions -> assessments adalah RESTRICT.
   */
  async remove(id) {
    requireUuid(id, "id");
    const assessment = await this.getById(id);
    if (!assessment) throw notFound("Assessment tidak ditemukan");

    const attempts = await pool.query(
      "SELECT COUNT(*)::int AS c FROM attempts WHERE assessment_id = $1",
      [id]
    );
    if (attempts.rows[0].c > 0) {
      throw conflict(
        `Assessment tidak bisa dihapus karena sudah dikerjakan ${attempts.rows[0].c} kali`
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM questions WHERE assessment_id = $1", [id]);
      await client.query("DELETE FROM assessments WHERE id = $1", [id]);
      await client.query("COMMIT");
      return id;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }
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
   *
   * Dipakai oleh attemptService untuk menyiapkan daftar soal peserta.
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

// ------------------------------------------------------------
// Bentuk camelCase untuk endpoint admin (create / update / getFullById).
// getById() tetap snake_case karena dipakai halaman peserta
// (AssessmentPage) — jangan diubah.
// ------------------------------------------------------------
function toPublicAssessment(row) {
  if (!row) return null;
  return {
    id: row.id,
    subjectId: row.subject_id,
    levelId: row.level_id || null,
    topicId: row.topic_id || null,
    type: row.type,
    title: row.title,
    durationMinutes: row.duration_minutes != null ? Number(row.duration_minutes) : null,
    passingScore: row.passing_score != null ? Number(row.passing_score) : null,
    questionCount: Number(row.question_count || 0),
    subjectName: row.subject_name || null,
    levelName: row.level_name || null,
    topicName: row.topic_name || null,
    createdAt: row.created_at,
  };
}

// ------------------------------------------------------------
// Validator untuk admin CRUD (melempar ApiError -> status HTTP benar)
// ------------------------------------------------------------

function requireText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw badRequest(`${field} wajib diisi`);
  }
  return value.trim();
}

function requireEnum(value, allowed, field) {
  if (typeof value !== "string") {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  const v = value.toUpperCase();
  if (!allowed.includes(v)) {
    throw badRequest(`${field} harus salah satu dari: ${allowed.join(", ")}`);
  }
  return v;
}

function requireUuid(value, field) {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    throw badRequest(`${field} harus berupa UUID yang valid`);
  }
  return value;
}

function requirePositiveInt(value, field) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) {
    throw badRequest(`${field} harus berupa bilangan bulat > 0`);
  }
  return n;
}

function requireScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n > 100) {
    throw badRequest("passingScore harus berada di rentang 0..100");
  }
  return Math.round(n * 100) / 100;
}

/** Pastikan FK benar-benar ada sebelum insert, supaya bukan 500 dari Postgres. */
async function assertReferenceExists(id, table, message) {
  const allowed = { subjects: "subjects", levels: "levels", topics: "topics" };
  if (!allowed[table]) throw badRequest("Referensi tidak valid");
  const res = await pool.query(`SELECT 1 FROM ${allowed[table]} WHERE id = $1`, [id]);
  if (res.rows.length === 0) throw badRequest(message);
}

module.exports = assessmentService;
