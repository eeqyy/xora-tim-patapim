-- ============================================================
-- XORA — Migration 003: Link diagnostic verification -> attempt
-- database/migrations/003_diagnostic_verification_attempt.sql
-- ============================================================
-- Tujuan:
--   Gap pipeline (FR: POSSIBLE_GAP -> VERIFICATION -> CONFIRMED/REJECTED)
--   perlu mengaitkan satu baris `diagnostic_verifications` dengan attempt
--   asesmen yang dipakai learner untuk memverifikasi dugaan root cause.
--   Tanpa `attempt_id`, resolveVerification tidak tahu attempt mana yang
--   menutup satu verification yang masih PENDING.
--
-- CARA PAKAI (idempotent — aman dijalankan ulang):
--   Jalankan di Supabase SQL Editor, atau lewat pool backend dengan file ini.
-- ============================================================

ALTER TABLE diagnostic_verifications
    ADD COLUMN IF NOT EXISTS attempt_id UUID;

CREATE INDEX IF NOT EXISTS idx_diagnostic_verifications_attempt
    ON diagnostic_verifications(attempt_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_diagnostic_verifications_attempt'
    ) THEN
        ALTER TABLE diagnostic_verifications
            ADD CONSTRAINT fk_diagnostic_verifications_attempt
            FOREIGN KEY (attempt_id)
            REFERENCES attempts(id)
            ON DELETE RESTRICT
            ON UPDATE CASCADE;
    END IF;
END $$;
