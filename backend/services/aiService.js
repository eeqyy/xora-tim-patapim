const pool = require("../db");
const { SYSTEM_INSTRUCTION, USER_INPUT_FORMAT, EXPECTED_OUTPUT_SCHEMA, buildPrompt } = require("../config/aiPrompt");
const aiProvider = require("../config/aiProvider");

async function analyzeEvidence(learnerId, { conceptId } = {}) {
  if (!learnerId || typeof learnerId !== "string") {
    const err = new Error("learnerId wajib diisi");
    err.statusCode = 400;
    throw err;
  }

  let query = `SELECT e.id AS evidence_id, e.concept_id, e.score, e.error_pattern, e.created_at,
               q.difficulty, a.id AS attempt_id
          FROM evidence e
          JOIN questions q ON q.id = e.question_id
          JOIN attempts a ON a.id = e.attempt_id
         WHERE a.learner_id = $1`;
  const params = [learnerId];
  if (conceptId) {
    query += ` AND e.concept_id = $2`;
    params.push(conceptId);
  }
  query += ` ORDER BY e.created_at DESC`;

  const evidenceRes = await pool.query(query, params);
  const evidenceRows = evidenceRes.rows;

  if (evidenceRows.length === 0) {
    const err = new Error("Tidak ada evidence untuk dianalisis");
    err.statusCode = 400;
    throw err;
  }

  const evidenceIds = evidenceRows.map((r) => r.evidence_id);

  // Error pattern aggregation
  const patternCounts = {};
  for (const r of evidenceRows) {
    const p = r.error_pattern ? String(r.error_pattern).trim() : "_none_";
    patternCounts[p] = (patternCounts[p] || 0) + 1;
  }
  const dominantPattern = Object.entries(patternCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  const evidenceList = evidenceRows.map((r) => ({
    evidence_id: r.evidence_id,
    concept_id: r.concept_id,
    score: Number(r.score),
    difficulty: r.difficulty,
    error_pattern: r.error_pattern,
    created_at: r.created_at,
    attempt_id: r.attempt_id,
  }));
  const conceptIdsQuery = await pool.query(`SELECT id FROM concepts`);
  const validConceptIds = conceptIdsQuery.rows.map((r) => r.id);
  const validEvidenceIds = evidenceIds;
  const userInput = {
    learner_id: learnerId,
    target_concept_id: conceptId || evidenceRows[0].concept_id,
    target_concept_name: null,
    gap_status: null,
    evidence_records: evidenceList,
    prerequisite_chain: [],
    error_analysis: {
      dominant_error_pattern: dominantPattern,
      pattern_distribution: patternCounts,
    },
  };

  const prompt = buildPrompt(userInput);
  const messages = [
    { role: "system", content: prompt.system || SYSTEM_INSTRUCTION },
    { role: "user", content: prompt.user + (EXPECTED_OUTPUT_SCHEMA ? "\n\nOutput schema:\n" + EXPECTED_OUTPUT_SCHEMA : "") },
  ];

  const raw = await aiProvider.chat(messages, { jsonMode: true });

  // Tolerant parse against code fence
  let clean = raw.trim();
  if (clean.startsWith("```json")) clean = clean.replace("```json", "").replace(/```$/, "").trim();
  else if (clean.startsWith("```")) clean = clean.replace("```", "").trim();
  let candidate;
  try {
    candidate = JSON.parse(clean);
  } catch (e) {
    const err = new Error("Respons AI tidak valid: JSON parse gagal");
    err.statusCode = 502;
    throw err;
  }

  // Validate against contract
  let validatorModule;
  try {
    validatorModule = require("../utils/aiValidator");
  } catch (e) {
    // File pending; skip validation but log
    console.warn("aiValidator module tidak tersedia (pending)");
  }

  if (validatorModule && validatorModule.validateAiDiagnosis) {
    const result = validatorModule.validateAiDiagnosis(candidate, {
      validConceptIds,
      validEvidenceIds: evidenceIds,
    });
    if (!result.ok) {
      const err = new Error(`Respons AI tidak valid: ${(result.errors || []).join("; ")}`);
      err.statusCode = 502;
      throw err;
    }
    candidate = result.value || candidate;
  }

  return {
    suspected_concept: candidate.suspected_concept || candidate,
    confidence: candidate.confidence,
    reason: candidate.reason,
    reference_evidence_ids: candidate.reference_evidence_ids,
    provider_model: process.env.AI_MODEL || "gpt-4o-mini",
    evidence_count: evidenceList.length,
  };
}

module.exports = { analyzeEvidence };
