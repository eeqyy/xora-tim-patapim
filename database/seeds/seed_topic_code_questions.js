// ============================================================
// XORA — Seed Script: Topic Code Questions & Practice Assessments
// database/seeds/seed_topic_code_questions.js
// ============================================================
// Idempoten: Aman dijalankan berulang kali tanpa menambah duplikat.
// ============================================================

const pool = require('../../backend/db');
const htmlQuestions = require('./questions_data/html_questions');
const cssQuestions = require('./questions_data/css_questions');
const jsQuestions = require('./questions_data/js_questions');
const jsExtraQuestions = require('./questions_data/js_questions_extra');

async function seedTopicCodeQuestions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ambil Subject, Level, Topic, Concept
    const subRes = await client.query("SELECT id FROM subjects WHERE name = 'Web Development' LIMIT 1");
    if (subRes.rows.length === 0) throw new Error("Subject Web Development tidak ditemukan");
    const subjectId = subRes.rows[0].id;

    const topicsRes = await client.query("SELECT id, name, level_id FROM topics");
    const topicMap = {};
    for (const t of topicsRes.rows) {
      topicMap[t.name.toLowerCase()] = t;
    }

    const conceptsRes = await client.query("SELECT id, name FROM concepts");
    const conceptMap = {};
    for (const c of conceptsRes.rows) {
      conceptMap[c.name.toLowerCase()] = c.id;
    }

    console.log(`Loaded ${conceptsRes.rows.length} concepts and ${topicsRes.rows.length} topics from DB.`);

    // 2. Definisi Asesmen Penguatan / Latihan Kanonis untuk 14 Topik
    const canonicalPractices = [
      // HTML
      { topicName: 'HTML Basics', title: 'Asesmen Penguatan HTML', difficulty: 'EASY' },
      { topicName: 'Semantic HTML', title: 'Latihan Penguatan: Semantic HTML', difficulty: 'EASY' },
      { topicName: 'Forms & Validation', title: 'Latihan Penguatan: Forms & Validation', difficulty: 'MEDIUM' },
      // CSS
      { topicName: 'CSS Basics', title: 'Asesmen Penguatan CSS', difficulty: 'EASY' },
      { topicName: 'Box Model', title: 'Latihan Penguatan: Box Model', difficulty: 'MEDIUM' },
      { topicName: 'Flexbox', title: 'Latihan Penguatan: Flexbox', difficulty: 'MEDIUM' },
      { topicName: 'Responsive Design', title: 'Latihan Penguatan: Responsive Design', difficulty: 'MEDIUM' },
      // JavaScript
      { topicName: 'Variables & Data Types', title: 'Asesmen Penguatan JavaScript', difficulty: 'EASY' },
      { topicName: 'Functions', title: 'Latihan Penguatan: Functions', difficulty: 'MEDIUM' },
      { topicName: 'Arrays & Objects', title: 'Latihan Penguatan: Arrays & Objects', difficulty: 'MEDIUM' },
      { topicName: 'Control Flow', title: 'Latihan Penguatan: Control Flow', difficulty: 'MEDIUM' },
      { topicName: 'DOM Manipulation', title: 'Latihan Penguatan: DOM Manipulation', difficulty: 'MEDIUM' },
      { topicName: 'Async JavaScript', title: 'Latihan Penguatan: Async JavaScript', difficulty: 'HARD' },
      { topicName: 'Promises', title: 'Latihan Penguatan: Promises', difficulty: 'HARD' },
    ];

    const practiceAssessmentIds = {};
    for (const cp of canonicalPractices) {
      const top = topicMap[cp.topicName.toLowerCase()];
      if (!top) {
        console.warn(`Topic ${cp.topicName} not found in DB, skipping practice creation.`);
        continue;
      }

      // Cek apakah sudah ada assessment PRACTICE untuk topik ini
      const checkAsmt = await client.query(`
        SELECT id, title FROM assessments
        WHERE (type = 'PRACTICE' AND topic_id = $1)
           OR title = $2
        ORDER BY created_at ASC
        LIMIT 1
      `, [top.id, cp.title]);

      if (checkAsmt.rows.length > 0) {
        const existing = checkAsmt.rows[0];
        practiceAssessmentIds[cp.topicName] = existing.id;
        await client.query(`
          UPDATE assessments
             SET topic_id = $1,
                 level_id = COALESCE(level_id, $2),
                 subject_id = $3,
                 type = 'PRACTICE',
                 passing_score = 70.0,
                 duration_minutes = 20
           WHERE id = $4
        `, [top.id, top.level_id, subjectId, existing.id]);
      } else {
        const ins = await client.query(`
          INSERT INTO assessments (
            subject_id, level_id, topic_id, title,
            type, difficulty, passing_score, duration_minutes
          )
          VALUES ($1, $2, $3, $4, 'PRACTICE', $5, 70.0, 20)
          RETURNING id
        `, [
          subjectId,
          top.level_id,
          top.id,
          cp.title,
          cp.difficulty
        ]);
        practiceAssessmentIds[cp.topicName] = ins.rows[0].id;
      }
    }
    console.log(`Canonical practice assessments verified for ${Object.keys(practiceAssessmentIds).length} topics.`);

    // 3. Gabungkan semua soal baru
    const allQuestions = [
      ...htmlQuestions,
      ...cssQuestions,
      ...jsQuestions,
      ...jsExtraQuestions
    ];

    console.log(`Total questions to upsert: ${allQuestions.length}`);

    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < allQuestions.length; i++) {
      const q = allQuestions[i];
      const conceptId = conceptMap[q.concept_name.toLowerCase()];
      if (!conceptId) {
        throw new Error(`Concept "${q.concept_name}" not found in DB for question: "${q.question_text.slice(0, 40)}"`);
      }

      const correctAnswerObj = {
        options: q.options,
        correct: q.correct
      };

      const checkQ = await client.query(
        "SELECT id FROM questions WHERE LOWER(TRIM(question_text)) = LOWER(TRIM($1))",
        [q.question_text]
      );

      if (checkQ.rows.length === 0) {
        await client.query(`
          INSERT INTO questions (
            concept_id, material, difficulty, type, question_text,
            correct_answer, points, order_index, is_active, explanation
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, $9)
        `, [
          conceptId,
          q.material,
          q.difficulty,
          q.type || 'MULTIPLE_CHOICE',
          q.question_text,
          JSON.stringify(correctAnswerObj),
          q.points || 10,
          i + 1,
          q.explanation || null
        ]);
        inserted++;
      } else {
        const existingId = checkQ.rows[0].id;
        await client.query(`
          UPDATE questions
             SET concept_id = $1,
                 material = $2,
                 difficulty = $3,
                 type = $4,
                 correct_answer = $5,
                 points = $6,
                 is_active = true,
                 explanation = $7
           WHERE id = $8
        `, [
          conceptId,
          q.material,
          q.difficulty,
          q.type || 'MULTIPLE_CHOICE',
          JSON.stringify(correctAnswerObj),
          q.points || 10,
          q.explanation || null,
          existingId
        ]);
        updated++;
      }
    }

    await client.query('COMMIT');
    console.log(`Seeding successful! Inserted: ${inserted}, Updated: ${updated}`);
    return { inserted, updated, total: allQuestions.length };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seedTopicCodeQuestions();
}

module.exports = { seedTopicCodeQuestions };
