const assert = require("assert");

let fetchCallCount = 0;
function mockFetch(contentOrFn) {
  fetchCallCount = 0;
  global.fetch = async (...args) => {
    fetchCallCount++;
    const content = typeof contentOrFn === "function" ? contentOrFn(fetchCallCount, ...args) : contentOrFn;
    if (content && content._raw) return content;
    return {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: typeof content === "string" ? content : JSON.stringify(content) } }],
      }),
    };
  };
}

async function main() {
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "test-model";

  const pool = require("./db");
  const realFetch = global.fetch;

  const results = [];
  function record(name, passed) {
    const tag = passed ? "PASS" : "FAIL";
    console.log(`${name}: ${tag}`);
    results.push({ name, passed });
  }

  try {
    // ── SETUP: query DB for real data ──
    const setupRes = await pool.query(
      `SELECT a.learner_id, e.id AS evidence_id, e.concept_id
         FROM evidence e
         JOIN attempts a ON a.id = e.attempt_id
        ORDER BY e.created_at DESC
        LIMIT 5`
    );
    assert(setupRes.rows.length >= 1, "Need at least 1 evidence row in DB");
    const learnerId = setupRes.rows[0].learner_id;
    const evidenceId = setupRes.rows[0].evidence_id;
    const conceptId = setupRes.rows[0].concept_id;

    const allEvRes = await pool.query(
      `SELECT e.id FROM evidence e JOIN attempts a ON a.id = e.attempt_id WHERE a.learner_id = $1`,
      [learnerId]
    );
    const allEvidenceIds = allEvRes.rows.map((r) => r.id);

    const { analyzeEvidence } = require("./services/aiService");

    // ── 1. Test AI ──
    try {
      mockFetch({
        suspected_concept: conceptId,
        confidence: 0.8,
        reason: `Evidence ${evidenceId} shows persistent errors indicating a gap in understanding this concept`,
        reference_evidence_ids: [evidenceId],
      });
      const out = await analyzeEvidence(learnerId, { conceptId });
      const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      assert(uuidRe.test(out.suspected_concept), "suspected_concept must be UUID");
      assert(typeof out.confidence === "number" && out.confidence >= 0 && out.confidence <= 1, "confidence 0-1");
      assert(typeof out.reason === "string" && out.reason.length >= 10, "reason >= 10 chars");
      assert(Array.isArray(out.reference_evidence_ids) && out.reference_evidence_ids.length > 0, "non-empty array");
      assert(typeof out.provider_model === "string", "provider_model string");
      assert(typeof out.evidence_count === "number" && out.evidence_count >= 1, "evidence_count >= 1");
      record("Test AI", true);
    } catch (e) {
      console.error("  Error:", e.message);
      record("Test AI", false);
    }

    // ── 2. suspected gap ──
    try {
      mockFetch({
        suspected_concept: conceptId,
        confidence: 0.7,
        reason: `Evidence ${evidenceId} reveals a learning gap for this concept based on repeated errors`,
        reference_evidence_ids: [evidenceId],
      });
      const out = await analyzeEvidence(learnerId, { conceptId });
      const dbCheck = await pool.query(`SELECT id FROM concepts WHERE id = $1`, [out.suspected_concept]);
      assert(dbCheck.rows.length === 1, "suspected_concept must exist in concepts table");
      record("suspected gap", true);
    } catch (e) {
      console.error("  Error:", e.message);
      record("suspected gap", false);
    }

    // ── 3. Test suspected gap (low confidence with gap keyword) ──
    try {
      mockFetch({
        suspected_concept: conceptId,
        confidence: 0.45,
        reason: `Insufficient data — evidence ${evidenceId} alone cannot confirm root cause with certainty`,
        reference_evidence_ids: [evidenceId],
      });
      const out = await analyzeEvidence(learnerId, { conceptId });
      assert(out.confidence === 0.45, "confidence should be 0.45");
      assert(out.reason.toLowerCase().includes("insufficient"), "reason contains 'insufficient'");
      record("Test suspected gap", true);
    } catch (e) {
      console.error("  Error:", e.message);
      record("Test suspected gap", false);
    }

    // ── 4. diagnostic ──
    try {
      mockFetch({
        suspected_concept: conceptId,
        confidence: 0.75,
        reason: `Evidence ${allEvidenceIds[0]} shows consistent errors across multiple attempts indicating a knowledge gap`,
        reference_evidence_ids: allEvidenceIds,
      });
      const out = await analyzeEvidence(learnerId);
      assert(out.evidence_count === allEvidenceIds.length, `evidence_count should be ${allEvidenceIds.length}, got ${out.evidence_count}`);
      record("diagnostic", true);
    } catch (e) {
      console.error("  Error:", e.message);
      record("diagnostic", false);
    }

    // ── 5. Test diagnostic PASS ──
    try {
      const specificConcept = conceptId;
      mockFetch({
        suspected_concept: specificConcept,
        confidence: 0.85,
        reason: `Evidence ${evidenceId} demonstrates clear difficulty with this concept requiring intervention`,
        reference_evidence_ids: [evidenceId],
      });
      const out = await analyzeEvidence(learnerId, { conceptId });
      assert(out.suspected_concept === specificConcept, "exact concept match");
      assert(out.confidence === 0.85, "exact confidence match");
      record("Test diagnostic PASS", true);
    } catch (e) {
      console.error("  Error:", e.message);
      record("Test diagnostic PASS", false);
    }

    // ── 6. Test diagnostic FAIL (retry exhaustion → 504) ──
    try {
      const t0 = Date.now();
      mockFetch(() => ({
        _raw: true,
        ok: false,
        status: 500,
        text: async () => "server error",
      }));
      let threw = false;
      try {
        await analyzeEvidence(learnerId, { conceptId });
      } catch (e) {
        threw = true;
        assert(e.statusCode === 504, `expected 504, got ${e.statusCode}`);
      }
      assert(threw, "should have thrown");
      const elapsed = Date.now() - t0;
      assert(elapsed >= 1400, `should take ~1.5s with backoff, took ${elapsed}ms`);
      record("Test diagnostic FAIL", true);
    } catch (e) {
      console.error("  Error:", e.message);
      record("Test diagnostic FAIL", false);
    }

    // ── 7. Test false positive (invalid concept UUID) ──
    try {
      const fakeConcept = "00000000-0000-0000-0000-000000000000";
      mockFetch({
        suspected_concept: fakeConcept,
        confidence: 0.9,
        reason: `Evidence ${evidenceId} strongly indicates a problem but the concept is fabricated`,
        reference_evidence_ids: [evidenceId],
      });
      let threw = false;
      try {
        await analyzeEvidence(learnerId, { conceptId });
      } catch (e) {
        threw = true;
        assert(e.statusCode === 502, `expected 502, got ${e.statusCode}`);
        assert(e.message.includes("not in validConceptIds"), `error should mention 'not in validConceptIds', got: ${e.message}`);
      }
      assert(threw, "should have thrown for false positive");
      record("Test false positive", true);
    } catch (e) {
      console.error("  Error:", e.message);
      record("Test false positive", false);
    }

    // ── 8. Test low confidence (two sub-cases) ──
    try {
      // 8a: low confidence WITHOUT gap keyword → reject
      mockFetch({
        suspected_concept: conceptId,
        confidence: 0.3,
        reason: `The student needs more practice on evidence ${evidenceId} to improve their skills overall`,
        reference_evidence_ids: [evidenceId],
      });
      let threw8a = false;
      try {
        await analyzeEvidence(learnerId, { conceptId });
      } catch (e) {
        threw8a = true;
        assert(e.statusCode === 502, `8a: expected 502, got ${e.statusCode}`);
        assert(e.message.includes("data gap when confidence"), `8a: error should mention 'data gap when confidence', got: ${e.message}`);
      }
      assert(threw8a, "8a should have thrown");

      // 8b: low confidence WITH gap keyword → pass
      mockFetch({
        suspected_concept: conceptId,
        confidence: 0.3,
        reason: `Limited data available for evidence ${evidenceId} so diagnosis cannot be confirmed fully`,
        reference_evidence_ids: [evidenceId],
      });
      const out8b = await analyzeEvidence(learnerId, { conceptId });
      assert(out8b.confidence === 0.3, `8b: confidence should be 0.3, got ${out8b.confidence}`);
      record("Test low confidence", true);
    } catch (e) {
      console.error("  Error:", e.message);
      record("Test low confidence", false);
    }

    // ── 9. Test invalid AI response (three sub-cases) ──
    try {
      // 9a: non-JSON text
      mockFetch("this is not json");
      let threw9a = false;
      try {
        await analyzeEvidence(learnerId, { conceptId });
      } catch (e) {
        threw9a = true;
        assert(e.statusCode === 502, `9a: expected 502, got ${e.statusCode}`);
        assert(e.message.includes("JSON parse"), `9a: should mention 'JSON parse', got: ${e.message}`);
      }
      assert(threw9a, "9a should have thrown");

      // 9b: JSON missing 'reason' field
      mockFetch({
        suspected_concept: conceptId,
        confidence: 0.8,
        reference_evidence_ids: [evidenceId],
      });
      let threw9b = false;
      try {
        await analyzeEvidence(learnerId, { conceptId });
      } catch (e) {
        threw9b = true;
        assert(e.statusCode === 502, `9b: expected 502, got ${e.statusCode}`);
      }
      assert(threw9b, "9b should have thrown");

      // 9c: confidence out of range
      mockFetch({
        suspected_concept: conceptId,
        confidence: 5,
        reason: `Evidence ${evidenceId} shows a clear problem with the student understanding this topic fully`,
        reference_evidence_ids: [evidenceId],
      });
      let threw9c = false;
      try {
        await analyzeEvidence(learnerId, { conceptId });
      } catch (e) {
        threw9c = true;
        assert(e.statusCode === 502, `9c: expected 502, got ${e.statusCode}`);
        assert(e.message.includes("confidence must be between"), `9c: should mention 'confidence must be between', got: ${e.message}`);
      }
      assert(threw9c, "9c should have thrown");

      record("Test invalid AI response", true);
    } catch (e) {
      console.error("  Error:", e.message);
      record("Test invalid AI response", false);
    }
  } finally {
    global.fetch = realFetch;
    await pool.end();
  }

  // ── Summary ──
  const passed = results.filter((r) => r.passed).length;
  console.log(`\n${passed}/${results.length} PASS`);
  if (passed < results.length) process.exit(1);
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
