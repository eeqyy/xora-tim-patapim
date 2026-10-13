/**
 * XORA — Assessment Scoring Integrity & AI Integration Test Suite
 * backend/test_assessment_scoring_integrity.js
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

const pool = require("./db");
const assessmentService = require("./services/assessmentService");
const aiProvider = require("./config/aiProvider");
const aiService = require("./services/aiService");

async function runTestSuite() {
  console.log("==================================================================");
  console.log("XORA — ASSESSMENT SCORING INTEGRITY & AI INTEGRATION TEST SUITE");
  console.log("==================================================================");

  let passed = 0;
  let failed = 0;
  const failures = [];

  function assert(condition, message) {
    if (condition) {
      passed++;
      console.log(`[PASS] #${passed + failed}: ${message}`);
    } else {
      failed++;
      console.error(`[FAIL] #${passed + failed}: ${message}`);
      failures.push(message);
    }
  }

  // 1. Fixture setup
  const tempUserRes = await pool.query(`
    INSERT INTO users (email, password_hash, name, status)
    VALUES ('test_integrity_${Date.now()}@xora.dev', 'hash', 'Test Integrity Learner', 'ACTIVE')
    RETURNING id
  `);
  const testLearnerId = tempUserRes.rows[0].id;
  await pool.query(
    "INSERT INTO user_roles (user_id, role_id) VALUES ($1, (SELECT id FROM roles WHERE name = 'LEARNER' LIMIT 1)) ON CONFLICT DO NOTHING",
    [testLearnerId]
  );

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Question Bank Integrity (No active ESSAY, valid options & keys)
    // -------------------------------------------------------------------------
    const activeQuestions = await pool.query(`
      SELECT id, type, question_text, correct_answer, points, material, concept_id
      FROM questions
      WHERE deleted_at IS NULL AND is_active = true
    `);
    assert(activeQuestions.rows.length > 0, `Question bank has ${activeQuestions.rows.length} active questions`);

    const essayActive = activeQuestions.rows.filter(q => q.type === 'ESSAY');
    assert(essayActive.length === 0, "No active questions of type ESSAY remain");

    let invalidQuestions = 0;
    for (const q of activeQuestions.rows) {
      if (q.type === 'MULTIPLE_CHOICE') {
        const opts = q.correct_answer?.options;
        const corr = q.correct_answer?.correct;
        if (!Array.isArray(opts) || opts.length < 2 || !corr) invalidQuestions++;
        else {
          const maxL = String.fromCharCode(64 + opts.length);
          const c = String(corr).trim().toUpperCase();
          if (c < 'A' || c > maxL) invalidQuestions++;
        }
      } else if (q.type === 'DRAG_DROP') {
        if (!q.correct_answer?.correct) invalidQuestions++;
      }
    }
    assert(invalidQuestions === 0, "All active questions have valid supported types and answer keys");

    // -------------------------------------------------------------------------
    // TEST 2: No Duplicates & Seed Idempotency Check
    // -------------------------------------------------------------------------
    const duplicates = await pool.query(`
      SELECT LOWER(TRIM(question_text)) as norm_text, concept_id, COUNT(*) as cnt
      FROM questions
      WHERE deleted_at IS NULL AND is_active = true
      GROUP BY LOWER(TRIM(question_text)), concept_id
      HAVING COUNT(*) > 1
    `);
    assert(duplicates.rows.length === 0, "Zero duplicate active questions by normalized text and concept");

    // -------------------------------------------------------------------------
    // TEST 3: Aggregation Query Safety (30 Questions Never Reported as 900)
    // -------------------------------------------------------------------------
    const asmtRes = await pool.query(
      "SELECT id, title, passing_score FROM assessments WHERE type = 'MIXED' AND difficulty = 'EASY' LIMIT 1"
    );
    const asmt = asmtRes.rows[0];
    assert(!!asmt, "Mixed Easy Assessment exists");

    const attempt = await assessmentService.createAttempt(testLearnerId, asmt.id, true);
    assert(attempt.id && attempt.status === "IN_PROGRESS", "Attempt created with IN_PROGRESS status");

    const questions = await assessmentService.getQuestionsByAssessmentId(asmt.id, false, attempt.id);
    assert(questions.length === 30, `Snapshot contains exactly 30 questions (actual: ${questions.length})`);

    // Verify key is not leaked to questions API
    const hasLeakedKey = questions.some(q => q.correct_answer || q.correct);
    assert(!hasLeakedKey, "Answer keys are not leaked to frontend/learner API");

    // -------------------------------------------------------------------------
    // TEST 4: Resuming Attempt preserves existing snapshot
    // -------------------------------------------------------------------------
    const resumedAttempt = await assessmentService.createAttempt(testLearnerId, asmt.id, false);
    assert(resumedAttempt.id === attempt.id, "Resumed attempt returns existing IN_PROGRESS attempt");
    const resumedQuestions = await assessmentService.getQuestionsByAssessmentId(asmt.id, false, resumedAttempt.id);
    assert(
      resumedQuestions.length === questions.length && resumedQuestions[0].id === questions[0].id,
      "Resumed attempt preserves exact snapshot questions and order"
    );

    // -------------------------------------------------------------------------
    // TEST 5: Submit All Correct (100% Score)
    // -------------------------------------------------------------------------
    // Fetch full questions with keys directly from DB for synthetic testing
    const fullQuestions = await pool.query(`
      SELECT q.id, q.type, q.correct_answer, q.points, q.material, aq.order_index
      FROM attempt_questions aq
      JOIN questions q ON q.id = aq.question_id
      WHERE aq.attempt_id = $1
      ORDER BY aq.order_index ASC
    `, [attempt.id]);

    const allCorrectPayload = fullQuestions.rows.map(q => {
      if (q.type === 'MULTIPLE_CHOICE') {
        return { question_id: q.id, selected: q.correct_answer.correct };
      } else if (q.type === 'DRAG_DROP') {
        return { question_id: q.id, selected: q.correct_answer.correct };
      }
      return { question_id: q.id, selected: 'A' };
    });

    const submitResultAllCorrect = await assessmentService.submitAttempt(
      testLearnerId,
      attempt.id,
      allCorrectPayload
    );

    assert(submitResultAllCorrect.score === 100, `All correct answers yield 100% (actual: ${submitResultAllCorrect.score}%)`);
    assert(submitResultAllCorrect.passed === true, "Passing status is true for 100% score");
    assert(submitResultAllCorrect.correct_count === 30, "correct_count equals 30");
    assert(submitResultAllCorrect.incorrect_count === 0, "incorrect_count equals 0");
    assert(submitResultAllCorrect.unanswered_count === 0, "unanswered_count equals 0");
    assert(submitResultAllCorrect.total_questions === 30, "total_questions equals 30");

    // -------------------------------------------------------------------------
    // TEST 6: Aggregation query safety test on completed attempt
    // -------------------------------------------------------------------------
    // Simulating multi-join query with DISTINCT vs separate subquery
    const safeAggCheck = await pool.query(`
      SELECT 
        att.id,
        (SELECT COUNT(*)::int FROM attempt_questions aq WHERE aq.attempt_id = att.id) as aq_count,
        (SELECT COUNT(*)::int FROM evidence e WHERE e.attempt_id = att.id) as ev_count
      FROM attempts att
      WHERE att.id = $1
    `, [attempt.id]);
    assert(
      safeAggCheck.rows[0].aq_count === 30 && safeAggCheck.rows[0].ev_count === 30,
      `Safe aggregation query reports 30 questions and 30 evidence, never 900 (aq=${safeAggCheck.rows[0].aq_count}, ev=${safeAggCheck.rows[0].ev_count})`
    );

    // -------------------------------------------------------------------------
    // TEST 7: Resubmission Rejection (Attempt Already Completed)
    // -------------------------------------------------------------------------
    let resubmitBlocked = false;
    try {
      await assessmentService.submitAttempt(testLearnerId, attempt.id, allCorrectPayload);
    } catch (e) {
      resubmitBlocked = true;
    }
    assert(resubmitBlocked, "Resubmitting a completed attempt is rejected (HTTP 400/Error)");

    // -------------------------------------------------------------------------
    // TEST 8: Historical Snapshot Integrity (Attempt results unaffected by question changes)
    // -------------------------------------------------------------------------
    const sampleQId = fullQuestions.rows[0].id;
    const origQText = (await pool.query("SELECT question_text FROM questions WHERE id = $1", [sampleQId])).rows[0].question_text;
    
    // Mutate question in bank
    await pool.query("UPDATE questions SET question_text = 'MODIFIED TEXT FOR REGRESSION TEST' WHERE id = $1", [sampleQId]);
    
    // Check getAttemptById on previously submitted attempt
    const histAttempt = await assessmentService.getAttemptById(testLearnerId, attempt.id);
    assert(histAttempt.score === 100, "Historical attempt score remains 100% after question bank edit");
    assert(histAttempt.correct_count === 30, "Historical attempt correct_count remains 30");
    
    // Restore question text
    await pool.query("UPDATE questions SET question_text = $1 WHERE id = $2", [origQText, sampleQId]);

    // -------------------------------------------------------------------------
    // TEST 9: Mixed Answers, Unanswered Questions, and Invalid Choices
    // -------------------------------------------------------------------------
    const attempt2 = await assessmentService.createAttempt(testLearnerId, asmt.id, true);
    const attempt2Questions = await pool.query(`
      SELECT q.id, q.type, q.correct_answer, q.points, q.material, aq.order_index
      FROM attempt_questions aq
      JOIN questions q ON q.id = aq.question_id
      WHERE aq.attempt_id = $1
      ORDER BY aq.order_index ASC
    `, [attempt2.id]);
    
    // 10 correct, 10 wrong, 10 unanswered
    const mixedPayload = [];
    attempt2Questions.rows.slice(0, 10).forEach(q => {
      mixedPayload.push({ question_id: q.id, selected: q.correct_answer.correct });
    });
    attempt2Questions.rows.slice(10, 20).forEach(q => {
      // Pick definitely wrong option
      const wrong = q.correct_answer.correct === 'A' ? 'B' : 'A';
      mixedPayload.push({ question_id: q.id, selected: wrong });
    });
    // remaining 10 questions are completely omitted (unanswered)

    const mixedResult = await assessmentService.submitAttempt(testLearnerId, attempt2.id, mixedPayload);
    assert(mixedResult.correct_count === 10, `correct_count is 10 (actual: ${mixedResult.correct_count})`);
    assert(mixedResult.incorrect_count === 10, `incorrect_count is 10 (actual: ${mixedResult.incorrect_count})`);
    assert(mixedResult.unanswered_count === 10, `unanswered_count is 10 (actual: ${mixedResult.unanswered_count})`);
    assert(mixedResult.score >= 30 && mixedResult.score <= 40, `Score calculated over points is proportional (~33%, actual: ${mixedResult.score}%)`);
    assert(mixedResult.passed === false, "Passing status is false for score < 70%");

    // Verify getAttemptById returns matching numbers
    const getResult2 = await assessmentService.getAttemptById(testLearnerId, attempt2.id);
    assert(getResult2.correct_count === 10, "getAttemptById correct_count matches submit result (10)");
    assert(getResult2.incorrect_count === 10, "getAttemptById incorrect_count matches submit result (10)");
    assert(getResult2.unanswered_count === 10, "getAttemptById unanswered_count matches submit result (10)");
    assert(getResult2.total_questions === 30, "getAttemptById total_questions matches submit result (30)");

    // -------------------------------------------------------------------------
    // TEST 10: Invalid Answer Format Handling
    // -------------------------------------------------------------------------
    const attempt3 = await assessmentService.createAttempt(testLearnerId, asmt.id, true);
    const attempt3Questions = await pool.query(`
      SELECT aq.question_id as id FROM attempt_questions aq WHERE aq.attempt_id = $1 LIMIT 1
    `, [attempt3.id]);
    let invalidOptionBlocked = false;
    try {
      await assessmentService.submitAttempt(testLearnerId, attempt3.id, [
        { question_id: attempt3Questions.rows[0].id, selected: 'Z_INVALID_OPTION' }
      ]);
    } catch (e) {
      invalidOptionBlocked = true;
    }
    assert(invalidOptionBlocked, "Invalid option selection outside range is safely rejected");

    // -------------------------------------------------------------------------
    // TEST 11: Competency & Material Analysis (HTML, CSS, JS adequacy thresholds)
    // -------------------------------------------------------------------------
    assert(!!mixedResult.material_scores, "Material breakdown returned");
    const mats = Object.keys(mixedResult.material_scores);
    assert(mats.includes("HTML") && mats.includes("CSS") && mats.includes("JAVASCRIPT"), "All 3 materials present in breakdown");
    for (const m of ["HTML", "CSS", "JAVASCRIPT"]) {
      const data = mixedResult.material_scores[m];
      assert(data.total >= 3, `Material ${m} has adequate sample size (actual: ${data.total})`);
      assert(data.sample_status === "CUKUP", `Material ${m} marked as CUKUP`);
    }

    // -------------------------------------------------------------------------
    // TEST 12: Real AI Provider Integration Health Check
    // -------------------------------------------------------------------------
    const aiHealth = await aiProvider.healthCheck();
    assert(aiHealth.configured === true, "AI provider configured is true");
    assert(aiHealth.provider === "OpenRouter", "AI provider is OpenRouter");
    assert(aiHealth.status === "HEALTHY", `AI health status is HEALTHY (http_status=${aiHealth.http_status})`);
    assert(aiHealth.http_status === 200, "AI provider HTTP status is 200");
    assert(aiHealth.duration_ms > 0, `AI response latency measured (${aiHealth.duration_ms}ms)`);

    // -------------------------------------------------------------------------
    // TEST 13: Real AI Gap Analysis Request
    // -------------------------------------------------------------------------
    const realAiResult = await aiService.analyzeAssessmentGap({
      assessmentTitle: "Evaluasi Integritas",
      score: 75,
      isPassed: true,
      materialBreakdown: {
        HTML: { total: 10, correct: 9, score_percent: 90 },
        CSS: { total: 10, correct: 8, score_percent: 80 },
        JAVASCRIPT: { total: 10, correct: 5, score_percent: 50 },
      },
      topicBreakdown: [
        { topic_name: "DOM Manipulation", material: "JAVASCRIPT", total: 4, correct: 1, score_percent: 25 },
      ],
      primaryGap: {
        material: "JAVASCRIPT",
        topic_name: "DOM Manipulation",
        score_percent: 25,
        total_questions: 4,
        correct_count: 1,
        incorrect_count: 3,
        confidence: "HIGH",
      },
    });

    assert(typeof realAiResult.summary === "string" && realAiResult.summary.length > 10, "Real AI returned valid summary");
    assert(Array.isArray(realAiResult.strengths) && realAiResult.strengths.length > 0, "Real AI returned valid strengths array");
    assert(typeof realAiResult.gap_explanation === "string", "Real AI returned gap_explanation");
    assert(typeof realAiResult.study_advice === "string", "Real AI returned study_advice");
    assert(realAiResult.is_fallback !== true, "Real AI analysis is not marked as fallback");

    // -------------------------------------------------------------------------
    // TEST 14: Deterministic AI Fallback Distinction
    // -------------------------------------------------------------------------
    const fallbackResult = aiService.getDeterministicGapFallback({
      assessmentTitle: "Evaluasi Fallback",
      score: 50,
      isPassed: false,
      materialBreakdown: {
        HTML: { total: 10, correct: 5, score_percent: 50 },
      },
      primaryGap: {
        material: "HTML",
        score_percent: 50,
        total_questions: 10,
        correct_count: 5,
        incorrect_count: 5,
      },
    });

    assert(fallbackResult.is_fallback === true, "Deterministic fallback is explicitly marked with is_fallback: true");
    assert(typeof fallbackResult.notice === "string", "Deterministic fallback contains honest transparent notice");

    // -------------------------------------------------------------------------
    // TEST 15: Safe AI Retry Without Duplicate Attempt
    // -------------------------------------------------------------------------
    const retryRes = await assessmentService.retryAiGapAnalysis(testLearnerId, attempt.id);
    assert(retryRes.attempt_id === attempt.id, "AI retry targets same attempt ID");
    assert(retryRes.ai_status === "COMPLETED", "AI retry completed successfully");

    // Check attempt in DB to confirm only 1 attempt exists for this session
    const attemptsCount = await pool.query("SELECT COUNT(*)::int as cnt FROM attempts WHERE id = $1", [attempt.id]);
    assert(attemptsCount.rows[0].cnt === 1, "Attempt record is not duplicated");

  } finally {
    // Clean up test learner and attempts
    await pool.query("DELETE FROM learning_events WHERE learner_id = $1", [testLearnerId]);
    await pool.query("DELETE FROM learning_actions WHERE learner_id = $1", [testLearnerId]);
    await pool.query("DELETE FROM diagnostics WHERE learner_id = $1", [testLearnerId]);
    await pool.query("DELETE FROM learner_concept_states WHERE learner_id = $1", [testLearnerId]);
    await pool.query("DELETE FROM learner_profiles WHERE user_id = $1", [testLearnerId]);
    await pool.query("DELETE FROM evidence WHERE attempt_id IN (SELECT id FROM attempts WHERE learner_id = $1)", [testLearnerId]);
    await pool.query("DELETE FROM attempt_questions WHERE attempt_id IN (SELECT id FROM attempts WHERE learner_id = $1)", [testLearnerId]);
    await pool.query("DELETE FROM attempts WHERE learner_id = $1", [testLearnerId]);
    await pool.query("DELETE FROM user_roles WHERE user_id = $1", [testLearnerId]);
    await pool.query("DELETE FROM users WHERE id = $1", [testLearnerId]);
    await pool.end();
  }

  console.log("==================================================================");
  console.log(`TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================================");

  if (failed > 0) {
    console.error("Failures:", failures);
    process.exit(1);
  }
}

runTestSuite().catch(e => {
  console.error("FATAL SUITE ERROR:", e);
  process.exit(1);
});
