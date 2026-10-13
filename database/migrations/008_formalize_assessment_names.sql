-- ============================================================
-- Migration: 008_formalize_assessment_names.sql
-- Description: Menyeragamkan penamaan formal asesmen kanonis dan membersihkan data fixture uji
-- ============================================================

-- 1. Bersihkan fixture uji tanpa riwayat attempt
DELETE FROM assessments 
 WHERE title = 'Asesmen Uji Stok Kurang'
   AND NOT EXISTS (SELECT 1 FROM attempts WHERE attempts.assessment_id = assessments.id);

-- 2. Formalisasi nama asesmen campuran inti (Canonical Mixed Assessments)
UPDATE assessments
   SET title = 'Asesmen Diagnostik Campuran — Tingkat Dasar',
       difficulty = 'EASY',
       passing_score = 70.0
 WHERE type = 'MIXED' 
   AND difficulty = 'EASY'
   AND (title ILIKE '%Mudah%' OR title ILIKE '%Dasar%');

UPDATE assessments
   SET title = 'Asesmen Campuran — Tingkat Menengah',
       difficulty = 'MEDIUM',
       passing_score = 70.0
 WHERE type = 'MIXED' 
   AND difficulty = 'MEDIUM'
   AND (title ILIKE '%Menengah%');

UPDATE assessments
   SET title = 'Asesmen Campuran — Tingkat Lanjut',
       difficulty = 'HARD',
       passing_score = 70.0
 WHERE type = 'MIXED' 
   AND difficulty = 'HARD'
   AND (title ILIKE '%Lanjut%' OR title ILIKE '%Sulit%');

-- 3. Formalisasi nama asesmen remedial / penguatan khusus (Canonical Practice Assessments)
UPDATE assessments
   SET title = 'Asesmen Penguatan HTML',
       difficulty = 'EASY'
 WHERE id = '4fd25ac4-fe37-4a79-bcca-9abc0537000c' 
    OR (type = 'PRACTICE' AND title ILIKE '%HTML%');

UPDATE assessments
   SET title = 'Asesmen Penguatan CSS',
       difficulty = 'EASY'
 WHERE id = '81f2a655-9bab-49f8-b8df-93421a48a593'
    OR (type = 'PRACTICE' AND title ILIKE '%CSS%');

UPDATE assessments
   SET title = 'Asesmen Penguatan JavaScript',
       difficulty = 'MEDIUM'
 WHERE id = '31915480-af00-4863-9047-ec910b12e227'
    OR (type = 'PRACTICE' AND title ILIKE '%JavaScript%');
