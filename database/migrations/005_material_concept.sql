-- ============================================================
-- XORA — Migration 005: Link material -> concept
-- database/migrations/005_material_concept.sql
-- ============================================================
-- Tujuan:
--   Checklist "Mapping recommendation -> materi": rekomendasi (learning_action)
--   harus bisa menunjuk materi belajar yang relevan. Saat ini materials hanya
--   terhubung ke topics, sedangkan konsep tidak punya topic_id. Menambahkan
--   materials.concept_id memberi jalur langsung & presisi konsep -> materi.
--
-- Catatan: nullable agar materi lama/umum tetap valid. Fallback lewat
--   assessment.topic_id ditangani di recommendationService.
--
-- CARA PAKAI (idempotent — aman dijalankan ulang):
--   Jalankan di Supabase SQL Editor, atau lewat pool backend dengan file ini.
-- ============================================================

ALTER TABLE materials
    ADD COLUMN IF NOT EXISTS concept_id UUID;

CREATE INDEX IF NOT EXISTS idx_materials_concept_id
    ON materials(concept_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'fk_materials_concept'
    ) THEN
        ALTER TABLE materials
            ADD CONSTRAINT fk_materials_concept
            FOREIGN KEY (concept_id)
            REFERENCES concepts(id)
            ON DELETE SET NULL
            ON UPDATE CASCADE;
    END IF;
END $$;
