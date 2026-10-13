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
    provider_model: (await aiProvider.currentInfo()).model,
    evidence_count: evidenceList.length,
  };
}

/**
 * AI Research Gap Analysis untuk hasil pengerjaan asesmen campuran / topik.
 * Menganalisis kelemahan materi & topik secara kualitatif.
 */
async function analyzeAssessmentGap({
  assessmentTitle,
  score,
  isPassed,
  materialBreakdown = {},
  topicBreakdown = [],
  primaryGap = null,
}) {
  const systemInstruction = `Anda adalah AI Educational Diagnostic Engine untuk sistem XORA.
Tugas Anda adalah menafsirkan data hasil asesmen learner, menjelaskan gap pemahaman (learning gap), kekuatan materi, serta memberikan arahan belajar kontekstual.
Gunakan bahasa Indonesia yang profesional, empatik, berbasis bukti, dan jelas.
Output WAJIB berupa JSON murni dengan format:
{
  "summary": "Ringkasan evaluasi performa learner",
  "strengths": ["Daftar kekuatan / materi yang dikuasai dengan baik"],
  "gap_explanation": "Penjelasan mendalam mengenai materi/topik yang paling membutuhkan peningkatan",
  "study_advice": "Rekomendasi langkah pembelajaran terarah berikutnya"
}`;

  const userContent = JSON.stringify({
    assessment_title: assessmentTitle,
    overall_score: score,
    is_passed: isPassed,
    material_performance: materialBreakdown,
    topic_performance: topicBreakdown,
    detected_primary_gap: primaryGap,
  }, null, 2);

  const messages = [
    { role: "system", content: systemInstruction },
    { role: "user", content: `Analisis data asesmen berikut dan buatkan gap analysis:\n${userContent}` },
  ];

  const raw = await aiProvider.chat(messages, { jsonMode: true });
  let clean = raw.trim();
  if (clean.startsWith("```json")) clean = clean.replace("```json", "").replace(/```$/, "").trim();
  else if (clean.startsWith("```")) clean = clean.replace("```", "").trim();

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (e) {
    const err = new Error("Respons AI tidak valid (JSON parse gagal)");
    err.statusCode = 502;
    throw err;
  }

  return {
    summary: parsed.summary || `Evaluasi asesmen dengan skor akhir ${score}%.`,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    gap_explanation: parsed.gap_explanation || (primaryGap ? `Fokus peningkatan utama ada pada materi ${primaryGap.material}.` : "Performa seimbang di semua materi."),
    study_advice: parsed.study_advice || "Lanjutkan latihan remediasi terarah pada materi yang masih perlu penguatan.",
    provider_model: (await aiProvider.currentInfo()).model,
    analyzed_at: new Date().toISOString(),
  };
}

/**
 * Fallback deterministik jika provider AI tidak tersedia / offline.
 * Menjamin hasil penilaian tetap valid dan transparan tanpa memalsukan keberhasilan AI.
 */
function getDeterministicGapFallback({
  assessmentTitle,
  score,
  isPassed,
  materialBreakdown = {},
  primaryGap = null,
}) {
  const strengths = [];
  for (const [mat, data] of Object.entries(materialBreakdown)) {
    if (data.score_percent >= 75) {
      strengths.push(`Penguasaan ${mat} kuat (${data.score_percent}% benar, ${data.correct}/${data.total} soal)`);
    }
  }

  let gapExplanation = "Distribusi performa seimbang pada seluruh materi yang diuji.";
  let studyAdvice = "Pertahankan konsistensi belajar Anda dan lanjutkan ke tantangan tingkat berikutnya.";

  if (primaryGap && primaryGap.material) {
    gapExplanation = `Berdasarkan data jawaban tersimpan, materi ${primaryGap.material} menunjukkan tingkat akurasi terendah (${primaryGap.score_percent}%, ${primaryGap.correct_count}/${primaryGap.total_questions} soal). Disarankan memprioritaskan review pada topik-topik fundamental ${primaryGap.material}.`;
    studyAdvice = `Kerjakan latihan terarah khusus materi ${primaryGap.material} untuk memperkuat konsep dasar sebelum mengulang asesmen tingkat ini.`;
  } else if (!isPassed) {
    gapExplanation = `Skor akhir (${score}%) belum mencapai ambang kelulusan. Diperlukan penguatan konsep merata sebelum mengambil retake.`;
    studyAdvice = "Pelajari kembali materi yang belum maksimal dan manfaatkan modul latihan topik.";
  }

  return {
    is_fallback: true,
    notice: "Analisis dihasilkan oleh engine deterministik berbasis data tersimpan (layanan AI kualitatif sedang offline).",
    summary: `Hasil asesmen "${assessmentTitle}" mencatat skor ${score}% (${isPassed ? "LULUS" : "BELUM LULUS"}).`,
    strengths,
    gap_explanation: gapExplanation,
    study_advice: studyAdvice,
    analyzed_at: new Date().toISOString(),
  };
}

module.exports = {
  analyzeEvidence,
  analyzeAssessmentGap,
  getDeterministicGapFallback,
};

