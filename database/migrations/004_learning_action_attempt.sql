-- ============================================================
-- XORA — Migration 004: Link learning action -> attempt
-- database/migrations/004_learning_action_attempt.sql
-- ============================================================
-- Tujuan:
--   Siklus rekomendasi/practice perlu tahu attempt mana yang dipakai untuk
--   menjalankan sebuah learning_action (status RECOMMENDED -> IN_PROGRESS),
--   supaya saat attempt di-submit:
--     - action dapat ditandai COMPLETED
--     - gap_status konsep bisa naik ke RESOLVED (mastery >= masteredThreshold)
--   Tanpa `attempt_id` kita tidak bisa mengaitkan submit -> action.
--
-- CARA PAKAI (idempotent — aman dijalankan ulang):
--   Jalankan di Supabase SQL Editor, atau lewat pool backend dengan file ini.
-- ============================================================

ALTER TABLE learning_actions
    ADD COLUMN IF NOT EXISTS attempt_id UUID;

CREATE INDEX IF NOT EXISTS idx_learning_actions_attempt_id
    ON learning_actions(attempt_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_learning_actions_attempt'
    ) THEN
        ALTER TABLE learning_actions
            ADD CONSTRAINT fk_learning_actions_attempt
            FOREIGN KEY (attempt_id)
            REFERENCES attempts(id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE;
    END IF;
END $$;
