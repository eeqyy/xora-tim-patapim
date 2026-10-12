-- ============================================================
-- XORA — Migration 007: Question Bank Flexibility
-- Memungkinkan soal di question bank dibuat independen tanpa terikat ke 1 assessment spesifik
-- ============================================================

ALTER TABLE questions
    ALTER COLUMN assessment_id DROP NOT NULL;

ALTER TABLE questions
    ALTER COLUMN order_index DROP NOT NULL;
