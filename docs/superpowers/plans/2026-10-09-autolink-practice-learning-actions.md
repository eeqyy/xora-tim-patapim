# Auto-link Practice Catalog to Learning Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically link practice attempts started from the practice catalog to relevant open learning actions, updating action status to IN_PROGRESS, marking concept gaps as IN_PRACTICE, and completing actions on submit.

**Architecture:** Extend `practiceService.startPractice` to find matching open learning actions across the practice's concepts, bind `attempt_id`, transition status to `IN_PROGRESS`, and invoke `gapService.markInPractice`. When submitted, existing `assessmentService.submitAttempt` automatically invokes `recommendationService.onAttemptSubmitted`, completing the action.

**Tech Stack:** Node.js Express (CommonJS), PostgreSQL (`pg` pool).

---

### Task 1: Auto-link logic in `practiceService.js`

**Files:**
- Modify: `backend/services/practiceService.js`
- Test: `backend/_test_autolink.js` (throwaway smoke test)

- [ ] **Step 1: Write throwaway verification test `backend/_test_autolink.js`**

```javascript
// backend/_test_autolink.js
const pool = require("./db");
const practiceService = require("./services/practiceService");
const assessmentService = require("./services/assessmentService");

async function main() {
  console.log("=== Testing Auto-link Practice Catalog to Learning Action ===");

  // 1. Pick a learner and a practice assessment with questions
  const learnerRes = await pool.query(
    "SELECT id FROM users WHERE role = 'LEARNER' LIMIT 1"
  );
  if (learnerRes.rows.length === 0) {
    throw new Error("No learner found in DB");
  }
  const learnerId = learnerRes.rows[0].id;

  const assessRes = await pool.query(`
    SELECT a.id, q.concept_id
      FROM assessments a
      JOIN questions q ON q.assessment_id = a.id
     WHERE a.type = 'PRACTICE' AND q.concept_id IS NOT NULL
     LIMIT 1
  `);
  if (assessRes.rows.length === 0) {
    throw new Error("No practice assessment with concepts found");
  }
  const assessmentId = assessRes.rows[0].id;
  const conceptId = assessRes.rows[0].concept_id;

  console.log(`Using learner: ${learnerId}, assessment: ${assessmentId}, concept: ${conceptId}`);

  // 2. Insert test learning_action
  const actionRes = await pool.query(`
    INSERT INTO learning_actions (learner_id, concept_id, action_type, reason, priority, status)
    VALUES ($1, $2, 'TARGETED_PRACTICE', 'Test autolink', 1, 'RECOMMENDED')
    RETURNING id
  `, [learnerId, conceptId]);
  const testActionId = actionRes.rows[0].id;
  console.log(`Created test learning_action: ${testActionId}`);

  try {
    // 3. Start practice via practiceService
    const startRes = await practiceService.startPractice(learnerId, assessmentId);
    console.log("startPractice returned linked_action:", startRes.linked_action?.id);

    if (!startRes.linked_action || startRes.linked_action.id !== testActionId) {
      throw new Error(`Expected linked_action.id === ${testActionId}, got: ${startRes.linked_action?.id}`);
    }

    // Verify DB status is IN_PROGRESS and attempt_id is bound
    const checkDb = await pool.query(
      "SELECT status, attempt_id FROM learning_actions WHERE id = $1",
      [testActionId]
    );
    if (checkDb.rows[0].status !== "IN_PROGRESS" || checkDb.rows[0].attempt_id !== startRes.attempt.id) {
      throw new Error(`DB state mismatch: status=${checkDb.rows[0].status}, attempt_id=${checkDb.rows[0].attempt_id}`);
    }
    console.log("OK: Action marked IN_PROGRESS with attempt_id");

    // 4. Submit practice
    const submitRes = await practiceService.submitPractice(learnerId, startRes.attempt.id, []);
    console.log("submitPractice status:", submitRes.status);

    // Verify action is now COMPLETED
    const checkAfterSubmit = await pool.query(
      "SELECT status FROM learning_actions WHERE id = $1",
      [testActionId]
    );
    if (checkAfterSubmit.rows[0].status !== "COMPLETED") {
      throw new Error(`Expected action status COMPLETED, got: ${checkAfterSubmit.rows[0].status}`);
    }
    console.log("OK: Action marked COMPLETED after submit");

    // 5. Check getResult includes recommendation
    const resultRes = await practiceService.getResult(learnerId, startRes.attempt.id);
    if (!resultRes.recommendation || resultRes.recommendation.id !== testActionId) {
      throw new Error("getResult did not include linked recommendation");
    }
    console.log("OK: getResult returned recommendation:", resultRes.recommendation);

    console.log("ALL AUTOLINK TESTS PASSED!");
  } finally {
    // Cleanup test records
    await pool.query("DELETE FROM learning_actions WHERE id = $1", [testActionId]);
    console.log("Cleaned up testAction");
  }
}

main().then(() => process.exit(0)).catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
```

- [ ] **Step 2: Run test to verify failure**

Run: `node backend/_test_autolink.js`
Expected: FAIL with "Expected linked_action.id === ..." because auto-link is not yet implemented.

- [ ] **Step 3: Implement auto-link in `backend/services/practiceService.js`**

Import `gapService = require("./gapService")`.
Add `_linkLearningAction(learnerId, assessmentId, attemptId)` helper in `practiceService`:
```javascript
  async _linkLearningAction(learnerId, assessmentId, attemptId) {
    const concepts = await this._conceptsForAssessment(assessmentId);
    const conceptIds = concepts.map((c) => c.id);
    if (conceptIds.length === 0) return null;

    const findRes = await pool.query(
      `SELECT id, concept_id, diagnostic_id, action_type, priority, status
         FROM learning_actions
        WHERE learner_id = $1
          AND concept_id = ANY($2::uuid[])
          AND status IN ('RECOMMENDED', 'IN_PROGRESS')
          AND action_type = ANY($3::action_type[])
        ORDER BY priority ASC, created_at ASC
        LIMIT 1`,
      [
        learnerId,
        conceptIds,
        ["TARGETED_PRACTICE", "PREREQUISITE_PRACTICE", "COLLECT_MORE_EVIDENCE", "ADVANCE"],
      ]
    );

    if (findRes.rows.length === 0) return null;
    const action = findRes.rows[0];

    await pool.query(
      `UPDATE learning_actions
          SET status = 'IN_PROGRESS',
              attempt_id = $2
        WHERE id = $1`,
      [action.id, attemptId]
    );

    let gapConceptId = action.concept_id;
    if (action.diagnostic_id) {
      const d = await pool.query(
        `SELECT concept_id FROM diagnostics WHERE id = $1`,
        [action.diagnostic_id]
      );
      if (d.rows[0]) gapConceptId = d.rows[0].concept_id;
    }
    await gapService.markInPractice(learnerId, gapConceptId);

    await pool.query(
      `INSERT INTO learning_events
          (learner_id, event_type, entity_type, entity_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        learnerId,
        "PRACTICE_STARTED",
        "learning_action",
        action.id,
        JSON.stringify({
          conceptId: action.concept_id,
          actionType: action.action_type,
          attemptId,
          assessmentId,
          source: "practice_catalog",
        }),
      ]
    );

    return {
      ...action,
      status: "IN_PROGRESS",
      attempt_id: attemptId,
    };
  },
```

Call `_linkLearningAction` inside `startPractice(learnerId, assessmentId)`:
```javascript
    const attempt = await this._delegate(() =>
      assessmentService.createAttempt(learnerId, assessmentId)
    );
    const linkedAction = await this._linkLearningAction(learnerId, assessmentId, attempt.id);
    const questions = await assessmentService.getQuestionsByAssessmentId(assessmentId);
    const concepts = await this._conceptsForAssessment(assessmentId);

    return {
      attempt: {
        id: attempt.id,
        assessment_id: attempt.assessment_id,
        status: attempt.status,
        started_at: attempt.started_at,
        score: attempt.score != null ? Number(attempt.score) : null,
      },
      assessment,
      concepts,
      questions,
      linked_action: linkedAction,
    };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node backend/_test_autolink.js`
Expected: ALL AUTOLINK TESTS PASSED! exit code 0.

- [ ] **Step 5: Cleanup test file & verify syntax**

Run: `rm backend/_test_autolink.js`
Run: `node --check backend/services/practiceService.js`

- [ ] **Step 6: Commit and push**

Run: `git add backend/services/practiceService.js docs/superpowers/plans/2026-10-09-autolink-practice-learning-actions.md`
Run: `git commit -m "feat(practice): auto-link practice catalog attempts to learning actions"`
Run: `git push origin feat/user-profile`
