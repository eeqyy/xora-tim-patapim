// ============================================================
// XORA — Mastery calculation thresholds & helpers
// backend/config/masteryThresholds.js
// ============================================================
// Konstanta ini konsisten dengan keputusan yang sudah disepakati:
//   - minEvidence = 3
//   - possibleGap < 50, prereqMastery (kita pakai sebagai Mastered >= 70)
//   - difficulty weights: EASY 0.7, MEDIUM 1.0, HARD 1.4
//   - consistency weight 0.25 (75% weightedAvg, 25% consistency)
// ============================================================

const DIFFICULTY_WEIGHT = Object.freeze({
  EASY: 0.7,
  MEDIUM: 1.0,
  HARD: 1.4,
});

const MASTERY_CONFIG = Object.freeze({
  minEvidence: 3,
  consistencyWeight: 0.25, // kontribusi consistency ke mastery
  weightedAvgWeight: 0.75, // kontribusi weightedAvg ke mastery
  possibleGapThreshold: 50, // < 50 -> POSSIBLE_GAP
  masteredThreshold: 70, // >= 70 -> MASTERED
  confidenceMaxEvidence: 5, // floor(evidenceCount/5) top-out
  confidenceBaseMin: 0.5, // 50% base
  confidenceConsistencyMax: 0.5, // +50% dari consistency
});

function getDifficultyWeight(difficulty) {
  if (!difficulty) return DIFFICULTY_WEIGHT.MEDIUM;
  const key = String(difficulty).toUpperCase();
  return DIFFICULTY_WEIGHT[key] || DIFFICULTY_WEIGHT.MEDIUM;
}

// Standard deviation sederhana (population SD) dari array nilai 0..100
function standardDeviationPercent(scores) {
  if (scores.length < 2) return 0;
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance =
    scores.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / scores.length;
  return Math.sqrt(variance);
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function clamp01(x) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

module.exports = {
  DIFFICULTY_WEIGHT,
  MASTERY_CONFIG,
  getDifficultyWeight,
  standardDeviationPercent,
  round2,
  clamp01,
};
