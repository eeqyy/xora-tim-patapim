-- ============================================================
-- XOLEARN — Migration 006: Assessment Engine, Question Bank & Snapshots
-- database/migrations/006_assessment_engine_and_question_bank.sql
-- ============================================================

-- 1. Tambah kolom metadata pada tabel questions
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS material VARCHAR(50);

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS explanation TEXT;

ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_questions_material
    ON questions(material);

CREATE INDEX IF NOT EXISTS idx_questions_is_active
    ON questions(is_active);

-- 2. Tambah kolom difficulty pada tabel assessments (bila belum ada)
ALTER TABLE assessments
    ADD COLUMN IF NOT EXISTS difficulty level_difficulty;

CREATE INDEX IF NOT EXISTS idx_assessments_difficulty
    ON assessments(difficulty);

-- 3. Tabel attempt_questions untuk Snapshot Soal Per Attempt
-- Menjamin setiap attempt memiliki urutan dan daftar soal yang tetap
-- meskipun user merefresh halaman atau keluar-masuk sesi.
CREATE TABLE IF NOT EXISTS attempt_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL,
    question_id UUID NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_attempt_questions_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES attempts(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_attempt_questions_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_attempt_question_order
        UNIQUE (attempt_id, order_index),

    CONSTRAINT uq_attempt_question
        UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_questions_attempt_id
    ON attempt_questions(attempt_id);

CREATE INDEX IF NOT EXISTS idx_attempt_questions_question_id
    ON attempt_questions(question_id);

-- 4. Tambah kolom analitik performa per materi/topik dan AI pada tabel attempts
ALTER TABLE attempts
    ADD COLUMN IF NOT EXISTS material_scores JSONB;

ALTER TABLE attempts
    ADD COLUMN IF NOT EXISTS topic_scores JSONB;

ALTER TABLE attempts
    ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

ALTER TABLE attempts
    ADD COLUMN IF NOT EXISTS ai_status VARCHAR(20) NOT NULL DEFAULT 'NONE';

ALTER TABLE attempts
    ADD COLUMN IF NOT EXISTS is_passed BOOLEAN DEFAULT false;

-- 5. Backfill material pada soal yang sudah ada berdasarkan level / topik
UPDATE questions q
   SET material = 'HTML'
 WHERE q.material IS NULL
   AND EXISTS (
       SELECT 1 FROM concepts c
       JOIN topic_concepts tc ON tc.concept_id = c.id
       JOIN topics t ON t.id = tc.topic_id
       JOIN levels l ON l.id = t.level_id
       WHERE c.id = q.concept_id AND (l.name ILIKE '%HTML%' OR t.name ILIKE '%HTML%')
   );

UPDATE questions q
   SET material = 'CSS'
 WHERE q.material IS NULL
   AND EXISTS (
       SELECT 1 FROM concepts c
       JOIN topic_concepts tc ON tc.concept_id = c.id
       JOIN topics t ON t.id = tc.topic_id
       JOIN levels l ON l.id = t.level_id
       WHERE c.id = q.concept_id AND (l.name ILIKE '%CSS%' OR t.name ILIKE '%CSS%' OR t.name ILIKE '%Box Model%' OR t.name ILIKE '%Flexbox%')
   );

UPDATE questions q
   SET material = 'JAVASCRIPT'
 WHERE q.material IS NULL
   AND EXISTS (
       SELECT 1 FROM concepts c
       JOIN topic_concepts tc ON tc.concept_id = c.id
       JOIN topics t ON t.id = tc.topic_id
       JOIN levels l ON l.id = t.level_id
       WHERE c.id = q.concept_id AND (l.name ILIKE '%JavaScript%' OR t.name ILIKE '%JavaScript%' OR t.name ILIKE '%Function%' OR t.name ILIKE '%Variable%')
   );
