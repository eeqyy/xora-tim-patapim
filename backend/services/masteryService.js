// ============================================================
// XORA — Mastery Service
// backend/services/masteryService.js
// ============================================================
// Hitung mastery dari evidence NYATA (bukan dari angka seed).
// Rumus: mastery = (weightedAvg*0.75) + (consistency*100*0.25)
//   weightedAvg = Σ(score_i * w_d_i) / Σ(w_d_i)  (w_d: EASY 0.7/MEDIUM 1.0/HARD 1.4)
//   consistency  = 1 - (σ / 100), clamp 0..1 (jika < 2 evidence -> 1.0)
// gap_status   : < 3 evidence -> INSUFFICIENT_EVIDENCE; < 50 -> POSSIBLE_GAP; >=70 -> MASTERED; else NO_GAP
// confidence   : min(1, n/5)*(0.5 + 0.5*consistency)
// primary_error_pattern = pola galat paling sering muncul (case-insensitive, exclude null/empty)
// ============================================================

const pool = require("../db");
const {
  MASTERY_CONFIG,
  getDifficultyWeight,
  standardDeviationPercent,
  round2,
  clamp01,
} = require("../config/masteryThresholds");
const gapService = require("./gapService");

const masteryService = {
  /**
   * Hitung ulang mastery untuk sekumpulan konsep milik satu learner.
   * Dipanggil setelah submitAttempt menyimpan evidence baru.
   *
   * @param {string} learnerId
   * @param {string[]} conceptIds array UUID (dapat berisi duplikat -> dibersihkan)
   */
  async recalculateForConcepts(learnerId, conceptIds) {
    if (!conceptIds || conceptIds.length === 0) return [];
    const unique = Array.from(new Set(conceptIds.filter(Boolean)));
    const results = [];
    for (const cid of unique) {
      results.push(await this.recalculateForConcept(learnerId, cid));
    }
    return results;
  },

  async recalculateForConcept(learnerId, conceptId) {
    // Ambil semua evidence untuk konsep ini (termasuk yang baru saja di-insert)
    const evRes = await pool.query(
      `SELECT e.id, e.score, e.error_pattern, e.created_at,
              q.difficulty
         FROM evidence e
         JOIN questions q ON q.id = e.question_id
         JOIN attempts a  ON a.id = e.attempt_id
        WHERE e.concept_id = $1
          AND a.learner_id = $2
        ORDER BY e.created_at ASC`,
      [conceptId, learnerId]
    );

    const rows = evRes.rows;
    const n = rows.length;

    // Status siklus gap yang sedang berjalan tidak boleh diturunkan oleh
    // perhitungan mastery biasa (lihat resolveLifecycle untuk promosi RESOLVED).
    const stateRes = await pool.query(
      `SELECT gap_status FROM learner_concept_states
        WHERE learner_id = $1 AND concept_id = $2`,
      [learnerId, conceptId]
    );
    const existingGap = stateRes.rows[0]?.gap_status || null;
    const lifecycleActive = ["CONFIRMED", "IN_PRACTICE", "VERIFICATION"].includes(
      existingGap
    );

    if (n === 0) {
      if (lifecycleActive) {
        return { conceptId, evidenceCount: 0, gap_status: existingGap };
      }
      // Tidak ada evidence -> reset ke INSUFFICIENT_EVIDENCE (opsional)
      await this.upsertState(learnerId, conceptId, {
        mastery_score: 0,
        evidence_confidence: 0,
        evidence_count: 0,
        primary_error_pattern: null,
        gap_status: "INSUFFICIENT_EVIDENCE",
        last_assessed_at: null,
      });
      return { conceptId, evidenceCount: 0, gap_status: "INSUFFICIENT_EVIDENCE" };
    }

    // Bangun mapping difficulty per evidence (langsung dari questions.difficulty)
    const scores = [];
    const weights = [];
    const errorList = [];

    for (const r of rows) {
      const w = getDifficultyWeight(r.difficulty);
      scores.push(Number(r.score));
      weights.push(w);
      if (r.error_pattern && r.error_pattern.trim()) {
        errorList.push(r.error_pattern.trim());
      }
    }

    // weightedAvg
    let weightedSum = 0;
    let weightSum = 0;
    for (let i = 0; i < scores.length; i++) {
      weightedSum += scores[i] * weights[i];
      weightSum += weights[i];
    }
    const weightedAvg = weightSum > 0 ? weightedSum / weightSum : 0;

    // consistency (0..1). Jika < 2 evidence, konsistensi dianggap tinggi (1.0)
    let consistency = 1.0;
    if (scores.length >= 2) {
      const sd = standardDeviationPercent(scores);
      consistency = clamp01(1 - sd / 100);
    } else {
      consistency = 1.0;
    }

    // mastery
    const mastery =
      weightedAvg * MASTERY_CONFIG.weightedAvgWeight +
      consistency * 100 * MASTERY_CONFIG.consistencyWeight;

    // gap_status
    // Prioritaskan status siklus gap yang sedang berjalan (CONFIRMED/IN_PRACTICE/
    // VERIFICATION) agar recalc biasa tidak menimpanya. Promosi ke RESOLVED
    // dilakukan gapService.resolveLifecycle di bawah.
    let gap_status;
    if (lifecycleActive) {
      gap_status = existingGap;
    } else if (n < MASTERY_CONFIG.minEvidence) {
      gap_status = "INSUFFICIENT_EVIDENCE";
    } else if (mastery < MASTERY_CONFIG.possibleGapThreshold) {
      gap_status = "POSSIBLE_GAP";
    } else if (mastery >= MASTERY_CONFIG.masteredThreshold) {
      gap_status = existingGap === "RESOLVED" ? "RESOLVED" : "MASTERED";
    } else {
      gap_status = "NO_GAP";
    }

    // confidence
    const evidenceRatio = n / MASTERY_CONFIG.confidenceMaxEvidence;
    const confidenceBase = MASTERY_CONFIG.confidenceBaseMin;
    const confidenceConsistencyPart = consistency * MASTERY_CONFIG.confidenceConsistencyMax;
    const confidence = clamp01(evidenceRatio) * (confidenceBase + confidenceConsistencyPart);
    const evidence_confidence = round2(confidence * 100); // simpan 0-100 agar seragam dengan skor lain

    // primary_error_pattern
    const primary_error_pattern = this.mostFrequent(errorList);

    const last_assessed_at = rows.length > 0 ? rows[rows.length - 1].created_at : null;

    await this.upsertState(learnerId, conceptId, {
      mastery_score: round2(mastery),
      evidence_confidence,
      evidence_count: n,
      primary_error_pattern,
      gap_status,
      last_assessed_at,
    });

    // Gap pipeline: begitu konsep berstatus POSSIBLE_GAP, jalankan diagnosis
    // otomatis (idempotent). Kegagalan di sini tidak boleh membatalkan recalc.
    // Jika mastery sudah pulih, jalankan siklus resolusi (complete action +
    // RESOLVED) — termasuk resolusi gap induk lewat prerequisite.
    try {
      if (gap_status === "POSSIBLE_GAP") {
        await gapService.onPossibleGapDetected(learnerId, conceptId);
      } else if (mastery >= MASTERY_CONFIG.masteredThreshold) {
        await gapService.resolveLifecycle(learnerId, conceptId, round2(mastery));
      }
    } catch (gapErr) {
      console.error("gapService lifecycle ERROR:", gapErr);
    }

    return {
      conceptId,
      evidenceCount: n,
      weightedAvg: round2(weightedAvg),
      consistency: round2(consistency * 100),
      mastery_score: round2(mastery),
      gap_status,
      evidence_confidence,
    };
  },

  /**
   * Upsert learner_concept_states (1 baris per learner+concept)
   */
  async upsertState(learnerId, conceptId, values) {
    const res = await pool.query(
      `INSERT INTO learner_concept_states
          (learner_id, concept_id, mastery_score, evidence_confidence,
           evidence_count, primary_error_pattern, gap_status, last_assessed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (learner_id, concept_id) DO UPDATE
         SET mastery_score = EXCLUDED.mastery_score,
             evidence_confidence = EXCLUDED.evidence_confidence,
             evidence_count = EXCLUDED.evidence_count,
             primary_error_pattern = EXCLUDED.primary_error_pattern,
             gap_status = EXCLUDED.gap_status,
             last_assessed_at = EXCLUDED.last_assessed_at,
             updated_at = NOW()
       RETURNING id`,
      [
        learnerId,
        conceptId,
        values.mastery_score ?? 0,
        values.evidence_confidence ?? 0,
        values.evidence_count ?? 0,
        values.primary_error_pattern,
        values.gap_status || "INSUFFICIENT_EVIDENCE",
        values.last_assessed_at,
      ]
    );
    return res.rows[0]?.id;
  },

  /**
   * Ringkasan mastery untuk satu learner
   */
  async summary(learnerId) {
    const res = await pool.query(
      `SELECT c.id AS concept_id, c.name AS concept,
              lcs.mastery_score, lcs.evidence_confidence, lcs.evidence_count,
              lcs.primary_error_pattern, lcs.gap_status, lcs.last_assessed_at
         FROM learner_concept_states lcs
         JOIN concepts c ON c.id = lcs.concept_id
        WHERE lcs.learner_id = $1
        ORDER BY c.name ASC`,
      [learnerId]
    );
    return res.rows;
  },

  /**
   * Ambil satu baris learner_concept_states untuk learner+concept
   */
  async getOne(learnerId, conceptId) {
    const res = await pool.query(
      `SELECT c.id AS concept_id, c.name AS concept,
              lcs.mastery_score, lcs.evidence_confidence, lcs.evidence_count,
              lcs.primary_error_pattern, lcs.gap_status, lcs.last_assessed_at,
              lcs.updated_at
         FROM learner_concept_states lcs
         JOIN concepts c ON c.id = lcs.concept_id
        WHERE lcs.learner_id = $1 AND lcs.concept_id = $2`,
      [learnerId, conceptId]
    );
    return res.rows[0] || null;
  },

  mostFrequent(list) {
    if (!list || list.length === 0) return null;
    const freq = new Map();
    for (const x of list) {
      const k = String(x).toLowerCase();
      freq.set(k, (freq.get(k) || 0) + 1);
    }
    let bestKey = null;
    let bestCount = -1;
    for (const [k, v] of freq) {
      if (bestKey === null || v > bestCount || (v === bestCount && bestKey > k)) {
        bestKey = k;
        bestCount = v;
      }
    }
    // kembalikan bentuk asli yang paling pertama muncul dengan key ini
    for (const x of list) {
      if (String(x).toLowerCase() === bestKey) return x;
    }
    return bestKey;
  },
};

module.exports = masteryService;
