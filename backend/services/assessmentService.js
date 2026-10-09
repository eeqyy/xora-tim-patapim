// ============================================================
// XORA — Assessment Service
// backend/services/assessmentService.js
// ============================================================

const pool = require("../db");
const masteryService = require("./masteryService");
const gapService = require("./gapService");
const recommendationService = require("./recommendationService");
const questionService = require("./questionService");
const { badRequest, notFound, conflict } = require("../utils/errors");
// Grader bersama untuk ESSAY/CODE — dipakai juga oleh attemptService,
// supaya kedua jalur submit menilai dengan kriteria yang sama.
const { grade } = require("../utils/grading");

const ASSESSMENT_TYPES = ["TOPIC", "LEVEL_FINAL", "MIXED", "REASSESSMENT", "PRACTICE"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const assessmentService = {
  async getAll(filters = {}) {
    let query = `
      SELECT a.id, a.subject_id, a.level_id, a.topic_id,
             a.type, a.title, a.duration_minutes, a.passing_score, a.created_at,
             s.name AS subject_name,
             l.name AS level_name,
             t.name AS topic_name,
             (SELECT COUNT(*)::int FROM questions q WHERE q.assessment_id = a.id) AS question_count
      FROM assessments a
      JOIN subjects s ON s.id = a.subject_id
      LEFT JOIN levels l ON l.id = a.level_id
      LEFT JOIN topics t ON t.id = a.topic_id
    `;
    const conditions = [];
    const values = [];

    if (filters.subject_id) {
      values.push(filters.subject_id);
      conditions.push(`a.subject_id = $${values.length}`);
    }

    if (filters.level_id) {
      values.push(filters.level_id);
      conditions.push(`a.level_id = $${values.length}`);
    }

    if (filters.topic_id) {
      values.push(filters.topic_id);
      conditions.push(`a.topic_id = $${values.length}`);
    }

    if (filters.type) {
      values.push(filters.type);
      conditions.push(`a.type = $${values.length}`);
    }
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY a.created_at ASC";

    const result = await pool.query(query, values);
    return result.rows;
  },

  async getById(id) {
    const result = await pool.query(`
      SELECT a.id, a.subject_id, a.level_id, a.topic_id,
             a.type, a.title, a.duration_minutes, a.passing_score, a.created_at,
             s.name AS subject_name,
             l.name AS level_name,
             t.name AS topic_name,
             (SELECT COUNT(*)::int FROM questions q WHERE q.assessment_id = a.id) AS question_count
      FROM assessments a
      JOIN subjects s ON s.id = a.subject_id
      LEFT JOIN levels l ON l.id = a.level_id
      LEFT JOIN topics t ON t.id = a.topic_id
      WHERE a.id = $1
    `, [id]);
    return result.rows[0] || null;
  },

  /**
   * Mengambil daftar soal yang SUDAH DISANITASI.
   * JANGAN bocorkan correct_answer.correct atau kunci jawaban ke client.
   */
  async getQuestionsByAssessmentId(assessmentId) {
    const result = await pool.query(
      "SELECT id, assessment_id, type, question_text, correct_answer, points, order_index FROM questions WHERE assessment_id = $1 ORDER BY order_index ASC",
      [assessmentId]
    );


    // Sanitize questions: strip correct answers and secret scoring criteria
    return result.rows.map((q) => {
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
  },

  /**
   * Membuat atau mengembalikan attempt aktif (IN_PROGRESS) untuk learner.
   */
  async createAttempt(learnerId, assessmentId, forceNew = false) {
    // Verifikasi assessment exists
    const assessment = await this.getById(assessmentId);
    if (!assessment) {
      const err = new Error("Assessment tidak ditemukan");
      err.statusCode = 404;
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
        return {
          ...existingAttempt.rows[0],
          assessment,
        };
      }
    }

    // Buat attempt baru
    const newAttempt = await pool.query(`
      INSERT INTO attempts (learner_id, assessment_id, status, started_at)
      VALUES ($1, $2, 'IN_PROGRESS', NOW())
      RETURNING id, learner_id, assessment_id, status, started_at, completed_at, score
    `, [learnerId, assessmentId]);

    return {
      ...newAttempt.rows[0],
      assessment,
    };
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

    const attempt = await this.createAttempt(learnerId, assessmentId, true);
    const questions = await this.getQuestionsByAssessmentId(assessmentId);

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
             a.title AS assessment_title,
             a.passing_score,
             a.type AS assessment_type,
             s.name AS subject_name,
             (SELECT COUNT(*)::int FROM questions q WHERE q.assessment_id = a.id) AS total_questions
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
      total_questions: attempt.total_questions,
      answered_count: counts.answered_count,
      correct_count: counts.correct_count,
      incorrect_count: counts.incorrect_count,
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

// 4. Ambil semua soal dari assessment ini (termasuk correct_answer internal)
    const questionsRes = await pool.query(`
      SELECT id, assessment_id, type, question_text, correct_answer, points, order_index, concept_id
      FROM questions
      WHERE assessment_id = $1
      ORDER BY order_index ASC
    `, [attempt.assessment_id]);

    const questions = questionsRes.rows;
    if (questions.length === 0) {
      const err = new Error("Asesmen ini belum memiliki pertanyaan");
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
    let totalEarnedPoints = 0;
    let totalPossiblePoints = 0;
    let correctCount = 0;

    for (const q of questions) {
      totalPossiblePoints += Number(q.points);
    }

    for (const item of answersPayload) {
      if (!item || !item.question_id) {
        continue;
      }

      // Validasi: question belongs to assessment
      const question = questionMap.get(item.question_id);
      if (!question) {
        const err = new Error(`Pertanyaan dengan ID ${item.question_id} tidak valid atau tidak termasuk dalam asesmen ini`);
        err.statusCode = 400;
        throw err;
      }

      // Hindari duplikasi jawaban untuk soal yang sama
      if (answeredQuestionIds.has(item.question_id)) {
        continue;
      }
      answeredQuestionIds.add(item.question_id);

      let isCorrect = false;
      // Persentase penilaian per soal, skala 0..100 — skala yang diwajibkan
      // CHECK evidence.score dan formula mastery (masteryService), bukan poin.
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

        // Normalisasi pilihan jawaban learner
        let learnerChoiceLetter = null;
        if (typeof item.selected === "string") {
          const trimmed = item.selected.trim().toUpperCase();
          if (trimmed.length === 1 && trimmed >= "A" && trimmed <= "Z") {
            learnerChoiceLetter = trimmed;
          } else {
            // Mungkin berupa text dari option
            const optIndex = options.findIndex((opt) => opt.trim().toLowerCase() === item.selected.trim().toLowerCase());
            if (optIndex >= 0) {
              learnerChoiceLetter = String.fromCharCode(65 + optIndex);
            }
          }
        } else if (typeof item.selected === "number" && item.selected >= 0 && item.selected < options.length) {
          learnerChoiceLetter = String.fromCharCode(65 + item.selected);
        }

        // Validasi: pilihan harus valid di dalam list opsi
        if (!learnerChoiceLetter) {
          const err = new Error(`Pilihan jawaban tidak valid untuk pertanyaan #${question.order_index}`);
          err.statusCode = 400;
          throw err;
        }

        const maxOptionLetter = String.fromCharCode(64 + options.length);
        if (learnerChoiceLetter < "A" || learnerChoiceLetter > maxOptionLetter) {
          const err = new Error(`Pilihan jawaban di luar rentang opsi untuk pertanyaan #${question.order_index}`);
          err.statusCode = 400;
          throw err;
        }

        answerObj = { selected: learnerChoiceLetter };

        // Evaluasi correctness di server (skala 0..100)
        if (correctLetter && learnerChoiceLetter === correctLetter) {
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
        if (item.selected && typeof item.selected === "object") {
          learnerMatches = item.selected;
        } else if (item.matches && typeof item.matches === "object") {
          learnerMatches = item.matches;
        } else if (item.answer && typeof item.answer === "object") {
          learnerMatches = item.answer;
        } else if (typeof item.selected === "string") {
          try {
            learnerMatches = JSON.parse(item.selected);
          } catch (e) {
            learnerMatches = {};
          }
        }

        answerObj = { matches: learnerMatches };

        // Evaluasi server-side (skala 0..100)
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
        // ESSAY / CODE — dinilai oleh grader bersama (utils/grading.js),
        // jalur yang sama dengan attemptService: kredit parsial berbasis
        // kriteria (ESSAY) dan diff token yang diabaikan (CODE).
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

      // Poin yang diperoleh = kredit parsial terhadap poin soal
      // (sama polanya dengan attemptService: points * score / 100).
      const questionScore = (Number(question.points) * percent) / 100;
      totalEarnedPoints += questionScore;
      if (isCorrect) correctCount++;

      // Tentukan concept_id untuk evidence langsung dari kolom questions.concept_id
      // (dipindahkan dari config/questionMeta.js ke database — lihat migrasi 002).
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
    // Batasi dalam rentang 0 .. 100
    finalPercentage = Math.max(0, Math.min(100, finalPercentage));

    const passingScoreNum = Number(attempt.passing_score) || 70;
    const isPassed = finalPercentage >= passingScoreNum;

    // 8. Simpan ke database dengan Database Transaction
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

      // Update attempt status menjadi COMPLETED dan simpan score
      const updatedAttempt = await client.query(`
        UPDATE attempts
        SET status = 'COMPLETED', completed_at = NOW(), score = $1
        WHERE id = $2
        RETURNING id, learner_id, assessment_id, status, started_at, completed_at, score
      `, [finalPercentage, attemptId]);

      await client.query("COMMIT");

      // Rehit mastery SETELAH commit evidence berhasil.
      // Sama polanya dengan attemptService: kalau gagal, attempt tetap tersimpan.
      try {
        await masteryService.recalculateForConcepts(
          learnerId,
          evaluatedEvidence.map((ev) => ev.concept_id)
        );
      } catch (masteryError) {
        console.error("MASTERY RECALC FAILED (evidence tetap tersimpan):", masteryError);
      }

      // Gap pipeline: bila attempt ini adalah attempt verifikasi diagnostic,
      // selesaikan verifikasi (CONFIRMED/REJECTED) setelah evidence ter-commit.
      try {
        await gapService.resolveVerification(learnerId, attemptId);
      } catch (gapError) {
        console.error("GAP VERIFICATION RESOLVE FAILED (evidence tetap tersimpan):", gapError);
      }

      // Siklus rekomendasi: bila attempt ini menjalankan sebuah learning_action
      // (practice), tandai action tersebut COMPLETED.
      try {
        await recommendationService.onAttemptSubmitted(learnerId, attemptId);
      } catch (recError) {
        console.error("RECOMMENDATION COMPLETE FAILED (evidence tetap tersimpan):", recError);
      }

      // Re-assessment event log bila assessment bertipe REASSESSMENT
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
        total_questions: questions.length,
        answered_count: evaluatedEvidence.length,
        correct_count: correctCount,
        incorrect_count: questions.length - correctCount,
        completed_at: updatedAttempt.rows[0].completed_at,
      };
    } catch (dbError) {
      await client.query("ROLLBACK");
      throw dbError;
    } finally {
      client.release();
    }
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
