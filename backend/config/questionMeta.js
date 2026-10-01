// ============================================================
// XORA — Question Metadata (concept mapping + difficulty)
// backend/config/questionMeta.js
// ============================================================
// Kenapa file ini ada:
//   Skema `questions` (01-schema.sql) tidak punya kolom concept_id
//   maupun difficulty. PRD tetap mensyaratkan keduanya:
//     FR-12  setiap assessment item punya primary concept
//     FR-13  setiap assessment item punya difficulty level
//     FR-19  mastery harus mempertimbangkan difficulty
//   Untuk sementara mappingnya disimpan di layer backend (keputusan tim),
//   bukan di database.
//
// KUNCI: [judul assessment][order_index soal]
//   Pakai judul + nomor urut karena keduanya STABLE lintas environment,
//   berbeda dengan UUID yang berubah per database.
//
// ⚠️  KONTRAK:
//   Saat menambah soal di Supabase, kunci ini HARUS ikut ditambah di sini.
//   Jika tidak, submit attempt akan ditolak (400) agar tidak menghasilkan
//   evidence yang salah atribusi — lebih baik gagal jelas daripada data rusak.
// ============================================================

const QUESTION_META = {
  "Quiz: HTML Basics": {
    1: { concept: "HTML Element", difficulty: "EASY" },
    2: { concept: "HTML Attribute", difficulty: "EASY" },
    3: { concept: "Document Structure", difficulty: "MEDIUM" },
  },

  "Level Final: HTML & Web Fundamentals": {
    // Soal pilihan: menguji pemilihan elemen yang tepat
    1: { concept: "Semantic Elements", difficulty: "MEDIUM" },
    // Soal essay: menguji dampak elemen semantik (kriteria memuat 'accessibility')
    2: { concept: "Accessibility", difficulty: "HARD" },
  },

  "Practice: JavaScript Variables": {
    1: { concept: "Variable Declaration", difficulty: "EASY" },
    2: { concept: "Variable Declaration", difficulty: "MEDIUM" },
  },
};

// Fallback dipakai HANYA jika assessment bertipe TOPIC dan soalnya belum
// ada di QUESTION_META. Konsep fallback = konsep utama topik (order_index = 1).
// Assessment LEVEL_FINAL/MIXED tidak punya topic_id, jadi tidak ada fallback —
// wajib terdaftar di QUESTION_META.
const USE_TOPIC_PRIMARY_FALLBACK = true;

// Level difficulty yang valid — harus sama dengan enum `level_difficulty` di DB.
const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];

module.exports = {
  QUESTION_META,
  USE_TOPIC_PRIMARY_FALLBACK,
  DIFFICULTIES,
};
