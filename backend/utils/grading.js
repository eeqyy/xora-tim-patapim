// ============================================================
// XORA — Auto-grading (assessment item evaluation)
// backend/utils/grading.js
// ============================================================
// Menjawab FR: "Sistem dapat menentukan hasil benar/salah untuk assessment
// yang memiliki evaluasi otomatis."
//
// Bentuk `correct_answer` JSONB di database (lihat seed.js):
//   MULTIPLE_CHOICE -> { correct: "B", options: [...] }
//   CODE            -> { expected: "...", criteria: [...] }
//   ESSAY           -> { criteria: [...] }
//
// Bentuk jawaban peserta yang diterima API:
//   MULTIPLE_CHOICE -> { selected: "B" }
//   CODE            -> { code: "..." }
//   ESSAY           -> { text: "..." }
//
// Dua tingkat nilai:
//   isCorrect -> boolean, dipakai counter benar/salah dan pola galat
//   score     -> 0..100, memuat kredit parsial (kriteria yang terpenuhi)
//   Mastery dihitung dari `score`, bukan dari isCorrect, supaya jawaban
//   yang hampir benar tetap terhitung.
// ============================================================

// Persentase kriteria minimum agar jawaban dianggap benar.
const CRITERIA_PASS_THRESHOLD = 0.6;

/**
 * Token berupa kata polos dicocokkan dengan batas kata,
 * token berupa simbol/kode (<html>, DOCTYPE) dicocokkan sebagai substring.
 */
function matchesToken(text, token) {
  const hay = String(text).toLowerCase();
  const needle = String(token).toLowerCase().trim();
  if (!needle) return false;

  const isPlainWord = /^[a-z0-9][a-z0-9\s.'-]*$/i.test(needle);
  if (!isPlainWord) return hay.includes(needle);

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(hay);
}

/**
 * Bandingkan kode tanpa peduli spasi/baris dan huruf besar-kecil.
 * `"const name = 'Xora';\nlet number = 42;"` dianggap sama dengan
 * versi satu baris / indentasi berbeda.
 */
function normalizeCode(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function criteriaScore(text, criteria) {
  const missing = criteria.filter((c) => !matchesToken(text, c));
  const matchedCount = criteria.length - missing.length;
  return {
    score: Math.round((matchedCount / criteria.length) * 10000) / 100,
    missing,
  };
}

/**
 * Nilai satu jawaban peserta terhadap satu soal.
 *
 * @param {{type: string, correct_answer: object}} question
 * @param {object} submitted jawaban peserta
 * @returns {{isCorrect: boolean, score: number, errorPattern: string|null}}
 */
function grade(question, submitted) {
  const type = question.type;
  const correct = question.correct_answer || {};
  const answer = submitted || {};

  if (type === "MULTIPLE_CHOICE") {
    const expected = correct.correct;
    const selected =
      answer.selected ?? answer.answer ?? answer.choice ?? null;

    if (selected === null || selected === undefined || selected === "") {
      return { isCorrect: false, score: 0, errorPattern: "NO_ANSWER" };
    }

    const isCorrect =
      String(selected).trim().toUpperCase() === String(expected).trim().toUpperCase();
    return isCorrect
      ? { isCorrect: true, score: 100, errorPattern: null }
      : {
          isCorrect: false,
          score: 0,
          errorPattern: `WRONG_OPTION:selected=${String(selected).trim()};expected=${expected}`,
        };
  }

  if (type === "CODE") {
    const code = answer.code ?? answer.text ?? answer.answer ?? "";
    if (code === "") {
      return { isCorrect: false, score: 0, errorPattern: "NO_ANSWER" };
    }

    // 1) Jalur ketat: cocok persis dengan expected (setelah normalisasi spasi).
    if (correct.expected && normalizeCode(code) === normalizeCode(correct.expected)) {
      return { isCorrect: true, score: 100, errorPattern: null };
    }

    // 2) Jalur longgar: kriteria yang disebut jawaban (kredit parsial).
    if (Array.isArray(correct.criteria) && correct.criteria.length > 0) {
      const { score, missing } = criteriaScore(code, correct.criteria);
      return {
        isCorrect: score >= CRITERIA_PASS_THRESHOLD * 100,
        score,
        errorPattern: missing.length ? `MISSING_CRITERIA:${missing.join("|")}` : null,
      };
    }

    // 3) Tanpa kriteria dan tidak persis -> salah.
    return { isCorrect: false, score: 0, errorPattern: "CODE_MISMATCH" };
  }

  if (type === "ESSAY" || type === "DRAG_DROP") {
    const text =
      answer.text ?? answer.code ?? answer.answer ?? "";

    if (Array.isArray(correct.criteria) && correct.criteria.length > 0) {
      const { score, missing } = criteriaScore(text, correct.criteria);
      return {
        isCorrect: score >= CRITERIA_PASS_THRESHOLD * 100,
        score,
        errorPattern: missing.length ? `MISSING_CRITERIA:${missing.join("|")}` : null,
      };
    }

    // ESSAY tanpa kriteria belum bisa dinilai otomatis.
    return {
      isCorrect: false,
      score: 0,
      errorPattern: "UNGRADED_NO_CRITERIA",
    };
  }

  // Tipe tak dikenal -> nilai netral agar tidak merusak mastery.
  return { isCorrect: false, score: 0, errorPattern: `UNKNOWN_TYPE:${type}` };
}

module.exports = {
  grade,
  criteriaScore,
  matchesToken,
  normalizeCode,
  CRITERIA_PASS_THRESHOLD,
};
