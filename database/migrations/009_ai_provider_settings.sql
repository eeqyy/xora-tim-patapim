-- ============================================================
-- Migration: 009_ai_provider_settings.sql
-- Description: Konfigurasi AI provider dari dashboard admin.
--   Admin dapat menyimpan beberapa API key (label, base URL, model,
--   preferensi JSON mode). Hanya SATU baris yang boleh aktif; baris
--   aktif dipakai oleh backend/config/aiProvider.js. Bila tidak ada
--   baris aktif, sistem jatuh kembali ke konfigurasi .env.
--
--   API key disimpan TERENKRIPSI (AES-256-GCM, lihat
--   backend/utils/secretBox.js). Kolom api_key_last4 hanya untuk
--   menampilkan mask di UI — key mentah tidak pernah dikirim ke klien.
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_provider_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    base_url TEXT NOT NULL DEFAULT 'https://openrouter.ai/api/v1',
    api_key_ciphertext TEXT NOT NULL,
    api_key_last4 TEXT,
    model TEXT NOT NULL,
    json_mode BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ai_provider_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT fk_ai_provider_updated_by
        FOREIGN KEY (updated_by)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

-- Jaminan hanya satu provider yang aktif (partial unique index).
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_provider_settings_active
    ON ai_provider_settings(is_active)
    WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_ai_provider_settings_created_by
    ON ai_provider_settings(created_by);


-- Trigger updated_at (fungsi set_updated_at sudah ada di 01-schema.sql;
-- CREATE OR REPLACE agar migrasi ini aman dijalankan berdiri sendiri).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ai_provider_settings_updated_at ON ai_provider_settings;

CREATE TRIGGER trg_ai_provider_settings_updated_at
BEFORE UPDATE ON ai_provider_settings
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
