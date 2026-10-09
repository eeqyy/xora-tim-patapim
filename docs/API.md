# XORA API Documentation

Dokumentasi lengkap REST API untuk platform adaptif pembelajaran **XORA**.

- **Base URL**: `http://localhost:5000` (atau variabel lingkungan `CLIENT_URL`)
- **Autentikasi**: Session Token via Header `Authorization: Bearer <token>`
- **Format Respons Konsisten (Envelope)**:
  - Sukses: `{ "status": "ok", "data": ... }`
  - Gagal: `{ "status": "error", "message": "..." }`

---

## 1. Autentikasi (`/api/auth`)

### `POST /api/auth/register`
Mendaftarkan akun baru.
- **Body**:
  ```json
  {
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "password": "password123"
  }
  ```
- **Respons (201)**:
  ```json
  {
    "status": "ok",
    "data": {
      "user": { "id": "uuid", "name": "Budi Santoso", "email": "budi@example.com", "role": "LEARNER" },
      "token": "session_token_string"
    }
  }
  ```

### `POST /api/auth/login`
Masuk ke akun yang sudah terdaftar.
- **Body**: `{ "email": "budi@example.com", "password": "password123" }`
- **Respons (200)**: Token & profil user.

### `GET /api/auth/me`
Mengambil data sesi user aktif (`requireAuth`).
- **Respons (200)**: `{ "status": "ok", "data": { "user": { ... } } }`

---

## 2. Profil Learner (`/api/profile`)

### `GET /api/profile`
Mengambil data preferensi & target belajar (`requireAuth`).

### `PATCH /api/profile`
Memperbarui profil belajar (`requireAuth`).
- **Body**: `{ "name", "learning_goal", "experience_level", "preferred_subject_id" }`

### `PATCH /api/profile/onboarding`
Menyelesaikan alur onboarding awal (`requireAuth`).

---

## 3. Peta Belajar / Learning Map (`/api/learning-path`)

### `GET /api/learning-path` / `GET /api/learning-path/:subjectId`
Mengambil hierarki pohon pembelajaran lengkap: **Subject → Level → Topic → Concept** beserta status mastery dan status kunci prerequisite (`requireAuth`).
- **Setiap node Concept memuat**:
  - `id`: UUID konsep
  - `name`: Nama konsep
  - `mastery_score`: Nilai penguasaan (0..100) atau `null` bila belum ada evidence
  - `gap_status`: `INSUFFICIENT_EVIDENCE` | `NO_GAP` | `POSSIBLE_GAP` | `CONFIRMED` | `IN_PRACTICE` | `RESOLVED` | `MASTERED`
  - `is_mastered`: `true` jika `mastery_score >= 70`
  - `evidence_count`: Jumlah bukti penilaian yang terkumpul
  - `evidence_confidence`: Tingkat keyakinan bukti (0..100)
  - `is_locked`: `true` jika terdapat prerequisite yang belum dikuasai (`mastery < 70`)
  - `prerequisites`: Daftar prerequisite langsung beserta nilai mastery & status pemenuhan

---

## 4. Asesmen & Remedial / Re-assessment (`/api/assessments`)

### `GET /api/assessments`
Mendapatkan daftar asesmen publik dengan filter opsional.
- **Query Params**: `?subject_id=&level_id=&topic_id=&type=` (`TOPIC`, `LEVEL_FINAL`, `MIXED`, `REASSESSMENT`, `PRACTICE`)

### `GET /api/assessments/:id/questions`
Mengambil daftar pertanyaan yang aman (kunci jawaban tidak disertakan).

### `POST /api/assessments/:id/attempts`
Memulai attempt baru (atau melanjutkan attempt aktif `IN_PROGRESS`).

### `POST /api/assessments/:id/reassess`
**Re-assessment API**: Memulai asesmen remedial / uji ulang untuk membuktikan perbaikan konsep, memaksa pembuatan attempt baru dan mencatat event aktivitas.

### `POST /api/assessments/attempts/:attemptId/submit`
Mengirimkan seluruh jawaban asesmen.
- **Body**:
  ```json
  {
    "answers": [
      { "question_id": "uuid", "selected": "B", "response_time_seconds": 15 },
      { "question_id": "uuid", "code": "const x = 10;", "response_time_seconds": 45 }
    ]
  }
  ```
- **Siklus Otomatis Server**:
  1. Menilai jawaban (Multiple Choice, Code, Essay, Drag & Drop).
  2. Menyimpan setiap jawaban sebagai **Evidence** di database.
  3. Menghitung ulang **Mastery Score** secara adaptif (pembobotan difficulty & konsistensi).
  4. Mendeteksi & memperbarui **Learning Gap** (`POSSIBLE_GAP` / `RESOLVED`).
  5. Menutup siklus rekomendasi bila attempt terkait sebuah latihan.
  6. Mencatat event `REASSESSMENT_COMPLETED` bila tipe asesmen adalah `REASSESSMENT`.

---

## 5. Penguasaan Konsep / Mastery (`/api/mastery`)

### `GET /api/mastery`
Mengambil ringkasan penguasaan seluruh konsep yang telah dipelajari learner.

### `GET /api/mastery/concepts/:id`
Mengambil rincian penguasaan satu konsep: riwayat evidence, pola galat dominan (`primary_error_pattern`), dan status gap.

---

## 6. Diagnosis Learning Gap (`/api/gaps` & `/api/diagnostics`)

### `GET /api/gaps`
Daftar konsep yang mengalami kesenjangan pemahaman (`POSSIBLE_GAP` / `CONFIRMED`).

### `POST /api/gaps/:conceptId/diagnose`
Memicu analisis penelusuran akar masalah (*root-cause*) pada pohon prerequisite.

### `GET /api/diagnostics/:id`
Melihat detail diagnosa kesenjangan & dugaan konsep prerequisite penyebab masalah.

### `POST /api/diagnostics/:id/verify/start`
Memulai attempt verifikasi untuk membuktikan apakah dugaan root-cause benar.

---

## 7. Rekomendasi Langkah Belajar (`/api/recommendations`)

### `GET /api/recommendations`
Daftar tindakan belajar yang direkomendasikan sistem (`RECOMMENDED`, `IN_PROGRESS`).

### `GET /api/recommendations/next-step`
Satu langkah pembelajaran prioritas tertinggi yang disarankan untuk dikerjakan saat ini.

### `GET /api/recommendations/:id/materials`
Daftar modul/materi belajar yang relevan untuk konsep rekomendasi tersebut.

### `POST /api/recommendations/:id/start-practice`
Memulai latihan khusus yang ditautkan ke rekomendasi.

---

## 8. Katalog Latihan Mandiri / Practices (`/api/practices`)

### `GET /api/practices`
Katalog latihan mandiri yang tersedia (filter `?subjectId=&levelId=&conceptId=`).

### `POST /api/practices/:id/start`
Memulai attempt latihan dari katalog.
- **Auto-link**: Secara otomatis mendeteksi dan menautkan attempt ke `learning_actions` yang sedang terbuka untuk konsep terkait, menandai status action menjadi `IN_PROGRESS`, serta menandai gap menjadi `IN_PRACTICE`.

### `POST /api/practices/attempts/:attemptId/submit`
Mengirim jawaban latihan, menyelesaikan `learning_action`, dan memperbarui status penguasaan konsep.

### `GET /api/practices/attempts/:attemptId/result`
Mengambil hasil latihan, bukti evidence, nilai mastery terkini, serta rekomendasi yang berhasil diselesaikan.

---

## 9. Riwayat Belajar / Learning History (`/api/history`)

### `GET /api/history`
Mengambil riwayat kronologis aktivitas dan metrik akumulatif belajar (`requireAuth`).
- **Query Params**: `?limit=50&offset=0&eventType=`
- **Respons (200)**:
  ```json
  {
    "status": "ok",
    "data": {
      "summary": {
        "total_events": 24,
        "total_attempts": 6,
        "completed_attempts": 5,
        "average_score": 82.5,
        "mastered_concepts": 4,
        "resolved_gaps": 2,
        "active_gaps": 1
      },
      "recent_attempts": [ ... ],
      "events": [
        {
          "id": "uuid",
          "event_type": "PRACTICE_COMPLETED",
          "entity_type": "learning_action",
          "entity_id": "uuid",
          "metadata": { ... },
          "created_at": "2026-10-09T..."
        }
      ],
      "pagination": { "total": 24, "limit": 50, "offset": 0 }
    }
  }
  ```

---

## 10. Standar Error & Status Code

| Kode HTTP | Makna | Kondisi Terjadinya |
|---|---|---|
| `200 OK` | Sukses | Permintaan berhasil diproses |
| `201 Created` | Sumber daya baru | Pendaftaran user, pembuatan attempt |
| `400 Bad Request` | Validasi gagal | Format UUID tidak valid, jawaban di luar rentang |
| `401 Unauthorized` | Autentikasi hilang | Token tidak ada atau kedaluwarsa |
| `403 Forbidden` | Akses ditolak | Learner mengakses attempt milik orang lain |
| `404 Not Found` | Tidak ditemukan | Assessment / Konsep / Attempt tidak ada di sistem |
| `409 Conflict` | Bentrok status | Memulai ulang action yang sudah selesai |
| `500 Server Error` | Galat internal | Kesalahan tidak terduga di server |
