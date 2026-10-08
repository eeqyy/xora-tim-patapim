// ============================================================
// XORA — Assessment Service
// backend/services/assessmentService.js
// ============================================================

const pool = require("../db");
const masteryService = require("./masteryService");

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
  async createAttempt(learnerId, assessmentId) {
    // Verifikasi assessment exists
    const assessment = await this.getById(assessmentId);
    if (!assessment) {
      const err = new Error("Assessment tidak ditemukan");
      err.statusCode = 404;
      throw err;
    }

    // Periksa apakah sudah ada attempt IN_PROGRESS yang sedang berjalan
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
             a.topic_id, a.level_id, a.subject_id, a.passing_score, a.title AS assessment_title
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
      SELECT id, assessment_id, type, question_text, correct_answer, points, order_index
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

    // 5. Ambil list concept_id yang valid untuk asesmen ini (untuk FK evidence)
    let conceptList = [];
    if (attempt.topic_id) {
      const tcRes = await pool.query(`
        SELECT tc.concept_id FROM topic_concepts tc
        JOIN concepts c ON c.id = tc.concept_id
        WHERE tc.topic_id = $1
        ORDER BY c.created_at ASC
      `, [attempt.topic_id]);
      conceptList = tcRes.rows.map((r) => r.concept_id);
    } else if (attempt.level_id) {
      const tcRes = await pool.query(`
        SELECT tc.concept_id FROM topics t
        JOIN topic_concepts tc ON tc.topic_id = t.id
        JOIN concepts c ON c.id = tc.concept_id
        WHERE t.level_id = $1
        ORDER BY c.created_at ASC
      `, [attempt.level_id]);
      conceptList = tcRes.rows.map((r) => r.concept_id);
    }

    // Fallback concept jika tidak ada relasi langsung
    if (conceptList.length === 0) {
      const fallbackConcept = await pool.query(`
        SELECT id FROM concepts WHERE subject_id = $1 LIMIT 1
      `, [attempt.subject_id]);
      if (fallbackConcept.rows.length > 0) {
        conceptList.push(fallbackConcept.rows[0].id);
      } else {
        const anyConcept = await pool.query("SELECT id FROM concepts LIMIT 1");
        if (anyConcept.rows.length > 0) {
          conceptList.push(anyConcept.rows[0].id);
        }
      }
    }

    // Ambil seluruh concepts untuk subject_id ini untuk pemetaan presisi dari question metadata
    const allConceptsRes = await pool.query(
      "SELECT id, name FROM concepts WHERE subject_id = $1",
      [attempt.subject_id]
    );
    const conceptMapByName = new Map(allConceptsRes.rows.map((c) => [c.name, c.id]));

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
      let questionScore = 0;
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

        // Evaluasi correctness di server
        if (correctLetter && learnerChoiceLetter === correctLetter) {
          isCorrect = true;
          questionScore = Number(question.points);
          correctCount++;
        } else {
          isCorrect = false;
          questionScore = 0;
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

        // Evaluasi server-side
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
            questionScore = Number(question.points);
            correctCount++;
          } else {
            isCorrect = false;
            questionScore = 0;
          }
        } else {
          isCorrect = false;
          questionScore = 0;
        }
      } else {
        // Tipe lain (ESSAY / CODE)
        answerObj = typeof item.answer === "object" ? item.answer : { input: item.answer || item.selected || "" };
        isCorrect = false;
        questionScore = 0;
      }

      totalEarnedPoints += questionScore;

      // Tentukan concept_id untuk evidence berdasarkan metadata soal
      let assignedConceptId = null;
      if (question.correct_answer && question.correct_answer.concept_id) {
        assignedConceptId = question.correct_answer.concept_id;
      } else if (
        question.correct_answer &&
        question.correct_answer.concept &&
        conceptMapByName.has(question.correct_answer.concept)
      ) {
        assignedConceptId = conceptMapByName.get(question.correct_answer.concept);
      } else {
        const conceptIndex = (question.order_index - 1) % conceptList.length;
        assignedConceptId = conceptList[conceptIndex] || conceptList[0];
      }

      evaluatedEvidence.push({
        question_id: question.id,
        concept_id: assignedConceptId,
        answer: answerObj,
        is_correct: isCorrect,
        score: questionScore,
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
          INSERT INTO evidence (attempt_id, question_id, concept_id, answer, is_correct, score, response_time_seconds, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          attemptId,
          ev.question_id,
          ev.concept_id,
          JSON.stringify(ev.answer),
          ev.is_correct,
          ev.score,
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

module.exports = assessmentService;
