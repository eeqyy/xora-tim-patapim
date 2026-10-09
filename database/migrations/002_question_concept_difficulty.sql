-- ============================================================
-- XORA — Migration 002: Question -> Concept mapping + difficulty
-- database/migrations/002_question_concept_difficulty.sql
-- ============================================================
-- Tujuan:
--   Pindahkan pemetaan soal -> konsep + difficulty dari layer backend
--   (config/questionMeta.js, di-key [judul assessment][order_index]) ke
--   kolom nyata di tabel `questions`, agar:
--     FR-12 tiap soal punya primary concept
--     FR-13 tiap soal punya difficulty
--     FR-19 mastery mempertimbangkan difficulty
--   Satu konsep primer per soal (sejalan dengan evidence: 1 baris/soal).
--
-- CARA PAKAI (idempotent — aman dijalankan ulang):
--   Jalankan BERTAHAP di Supabase SQL Editor, satu blok STAGE sekaligus.
--   Laporkan hasil STAGE 4 sebelum menjalankan STAGE 5.
-- ============================================================


-- ============================================================
-- STAGE 1 — Tambah kolom + index + FK (nullable dulu -> aman untuk backfill)
-- ============================================================

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS concept_id UUID;

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS difficulty level_difficulty NOT NULL DEFAULT 'MEDIUM';

CREATE INDEX IF NOT EXISTS idx_questions_concept_id
    ON questions(concept_id);

-- FK dijaga terpisah supaya bisa dijalankan ulang di DB yang sudah ada.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_questions_concept'
    ) THEN
        ALTER TABLE questions
            ADD CONSTRAINT fk_questions_concept
            FOREIGN KEY (concept_id)
            REFERENCES concepts(id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE;
    END IF;
END $$;


-- ============================================================
-- STAGE 2 — Backfill concept_id
-- ============================================================

-- 2a. Quiz: HTML Basics (20 soal) — nama konsep tersimpan di correct_answer.concept
UPDATE questions q
   SET concept_id = c.id
  FROM assessments a, concepts c
 WHERE q.assessment_id = a.id
   AND c.subject_id = a.subject_id
   AND a.title = 'Quiz: HTML Basics'
   AND c.name = q.correct_answer->>'concept'
   AND q.concept_id IS NULL
   AND q.correct_answer ? 'concept';

-- 2b. Level Final: HTML & Web Fundamentals — eksplisit per order_index
UPDATE questions q
   SET concept_id = c.id
  FROM assessments a, concepts c
 WHERE q.assessment_id = a.id
   AND c.subject_id = a.subject_id
   AND a.title = 'Level Final: HTML & Web Fundamentals'
   AND c.name = CASE q.order_index
                  WHEN 1 THEN 'Semantic Elements'
                  WHEN 2 THEN 'Accessibility'
                END
   AND q.concept_id IS NULL;

-- 2c. Practice: JavaScript Variables — eksplisit per order_index
UPDATE questions q
   SET concept_id = c.id
  FROM assessments a, concepts c
 WHERE q.assessment_id = a.id
   AND c.subject_id = a.subject_id
   AND a.title = 'Practice: JavaScript Variables'
   AND c.name = 'Variable Declaration'
   AND q.concept_id IS NULL;


-- ============================================================
-- STAGE 3 — Backfill difficulty (default MEDIUM dari STAGE 1)
-- ============================================================

-- Quiz: HTML Basics #1 EASY, #2 EASY, #3 MEDIUM (lihat questionMeta.js)
UPDATE questions q
   SET difficulty = v.difficulty::level_difficulty
  FROM assessments a
  JOIN (VALUES (1, 'EASY'), (2, 'EASY'), (3, 'MEDIUM')) AS v(ord, difficulty)
    ON TRUE
 WHERE q.assessment_id = a.id
   AND a.title = 'Quiz: HTML Basics'
   AND q.order_index = v.ord;

-- Level Final #1 MEDIUM, #2 HARD
UPDATE questions q
   SET difficulty = v.difficulty::level_difficulty
  FROM assessments a
  JOIN (VALUES (1, 'MEDIUM'), (2, 'HARD')) AS v(ord, difficulty)
    ON TRUE
 WHERE q.assessment_id = a.id
   AND a.title = 'Level Final: HTML & Web Fundamentals'
   AND q.order_index = v.ord;

-- Practice JS #1 EASY, #2 MEDIUM
UPDATE questions q
   SET difficulty = v.difficulty::level_difficulty
  FROM assessments a
  JOIN (VALUES (1, 'EASY'), (2, 'MEDIUM')) AS v(ord, difficulty)
    ON TRUE
 WHERE q.assessment_id = a.id
   AND a.title = 'Practice: JavaScript Variables'
   AND q.order_index = v.ord;


-- ============================================================
-- STAGE 4 — VERIFIKASI (jalankan & laporkan hasilnya sebelum STAGE 5)
-- ============================================================

-- Harus 0 baris "missing".
SELECT q.id, a.title, q.order_index, q.concept_id, q.difficulty
  FROM questions q
  JOIN assessments a ON a.id = q.assessment_id
 WHERE q.concept_id IS NULL
 ORDER BY a.title, q.order_index;

-- Ringkasan coverage.
SELECT a.title,
       COUNT(*)::int AS total,
       COUNT(q.concept_id)::int AS punya_concept,
       (COUNT(*) - COUNT(q.concept_id))::int AS belum_concept
  FROM questions q
  JOIN assessments a ON a.id = q.assessment_id
 GROUP BY a.title
 ORDER BY a.title;


-- ============================================================
-- STAGE 5 — Finalisasi: concept_id NOT NULL (hanya setelah STAGE 4 bersih)
-- ============================================================

DO $$
DECLARE missing int;
BEGIN
    SELECT COUNT(*) INTO missing FROM questions WHERE concept_id IS NULL;
    IF missing > 0 THEN
        RAISE EXCEPTION
            'Backfill belum lengkap: % soal masih NULL concept_id. Perbaiki dulu sebelum SET NOT NULL.',
            missing;
    END IF;
END $$;

ALTER TABLE questions
    ALTER COLUMN concept_id SET NOT NULL;