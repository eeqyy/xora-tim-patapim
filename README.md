# Xora Project

**Xora** adalah platform *Evidence-Based Learning Diagnostic & Root-Cause Navigator*:
asesmen dipetakan ke **konsep**, setiap jawaban disimpan sebagai **evidence**, lalu
dipakai untuk mendeteksi *gap* dan merekomendasikan remediasi yang tepat sasaran.

> Dokumentasi arsitektur & aturan engineering ada di [`AGENT.md`](./AGENT.md).
> Panduan upgrade setelah `git pull` ada di [`UPGRADE.md`](./UPGRADE.md).

---

## 🧱 Tech Stack

| Lapisan | Teknologi |
| :--- | :--- |
| Frontend | React 18 + Vite 5 (CSS murni, tanpa UI framework) |
| Backend | Node.js + Express 4 (`pg`, `bcryptjs`, `cors`) |
| Database | PostgreSQL (+ ekstensi `pgcrypto`) |
| Auth | **Session token** (tabel `sessions`, `Authorization: Bearer <token>`) — bukan JWT |
| AI (opsional) | OpenRouter (aktif hanya jika `AI_API_KEY` diisi) |

---

## 📁 Struktur Folder Utama

```text
/project-root
 ├── AGENT.md                 # Acuan arsitektur & aturan engineering
 ├── README.md                 # Dokumentasi setup (file ini)
 ├── docker-compose.yml        # PostgreSQL + backend + frontend
 ├── .env.example              # Template environment (salin ke .env)
 │
 ├── database/
 │   ├── init/01-schema.sql    # DDL PostgreSQL kanonik (dijalankan otomatis di Docker)
 │   ├── migrations/           # Migrasi historis (002–008); sebagian sudah menyatu ke 01-schema.sql
 │   └── seeds/                # Data soal tambahan (question bank)
 │
 ├── backend/
 │   ├── index.js              # Entry point Express + mounting route + 404/error handler
 │   ├── db.js                 # Pool PostgreSQL (SSL kondisional via DATABASE_SSL)
 │   ├── seed.js               # Seed data dev (npm run seed)
 │   ├── middleware/           # auth.js, requireAdmin.js (session token)
 │   ├── routes/               # 17 file route (/api/*), termasuk admin.js
 │   ├── services/             # 20 file service (business logic)
 │   ├── config/               # aiPrompt.js, aiProvider.js, masteryThresholds.js
 │   └── utils/                # errors.js, grading.js, password.js, session.js, aiValidator.js
 │
 └── frontend/
     ├── index.html
     ├── vite.config.js
     └── src/
         ├── App.jsx               # Router outlet + layout
         ├── index.css             # Design system
         ├── context/              # AuthContext.jsx, RouterContext.jsx
         ├── services/api.js       # API client terpusat
         ├── components/           # Button, Icons, Navbar, GlassPanel, StatusBadge, dll.
         └── pages/                # 15 halaman (termasuk NotFoundPage 404 + area admin)
```

---

## ✅ Prasyarat

- **Node.js 20+** dan npm
- **PostgreSQL 16+** (untuk jalan lokal), **atau** Docker + Docker Desktop

---

## ⚙️ 1. Persiapan Environment

```bash
cp .env.example .env
```

Sesuaikan `.env` bila perlu. Untuk pengembangan lokal (Postgres Homebrew), cukup:

```env
DATABASE_URL=postgresql://USERNAME@127.0.0.1:5432/xora
DATABASE_SSL=false
```

> **SSL database aktif secara default** (untuk remote seperti Supabase). Untuk Postgres lokal,
> wajib set `DATABASE_SSL=false`.

> Root `.env` adalah **sumber tunggal** config backend (dibaca oleh `backend/db.js` & `backend/index.js`).

---

## 🚀 2. Menjalankan (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5001
- PostgreSQL: `localhost:5432` (volume `postgres_data`)

DDL di `database/init/*.sql` **hanya dijalankan saat volume masih kosong**. Jika mengubah
schema setelah pernah menjalankan, reset dulu (⚠️ menghapus seluruh data):

```bash
docker compose down -v && docker compose up --build
```

Setelah container hidup, isi data dev:

```bash
docker compose exec backend npm run seed
```

---

## 💻 3. Menjalankan (Lokal tanpa Docker)

```bash
# 1) Siapkan database
createdb xora
psql -d xora -f database/init/01-schema.sql

# 2) Backend
cd backend
npm install
npm run seed        # isi data contoh
npm run dev         # http://localhost:5001

# 3) Frontend (terminal terpisah)
cd frontend
npm install
cp .env.example .env   # opsional: pastikan VITE_API_URL = http://localhost:5001
npm run dev         # http://localhost:5173
```

> Port backend memakai **5001** karena `5000` sering dipakai macOS ControlCenter (AirPlay).
> Jika `frontend/.env` tidak ada, frontend memakai default `http://localhost:5001` — jadi
> pastikan `PORT` backend tidak diubah, atau samakan lewat `VITE_API_URL`.

### Akun seed

| Role | Email | Password |
| :--- | :--- | :--- |
| Learner | `learner@xora.dev` | `password123` |
| Admin | `admin@xora.dev` | `password123` |

---

## 🔐 Autentikasi (Session Token)

1. `POST /api/auth/login` → `{ data: { user, token } }`.
2. Kirim token di header: `Authorization: Bearer <token>`.
3. `POST /api/auth/logout` (butuh token) → mencabut sesi di server (`sessions.status = 'REVOKED'`).
4. `GET /api/auth/me` → profil user aktif.

Token disimpan sebagai hash di tabel `sessions` dengan masa berlaku `expires_at`.

---

## 🛠️ Peran Admin

Login sebagai `admin@xora.dev`, lalu buka **`/admin`**. Tiga kemampuan utama:

1. **Kelola soal & asesmen** (`/admin/assessments`) — buat/ubah/hapus asesmen dan soal di bank soal.
2. **Kelola pengguna** (`/admin/users`) — lihat akun, ubah status (aktif/nonaktif/suspend),
   atur role (`LEARNER`/`ADMIN`), dan reset password.
3. **Pantau sistem & data** (`/admin/system`) — status database, statistik data, aktivitas
   terbaru, dan ringkasan analytics.

> Perubahan status/role, reset password, serta perubahan asesmen/soal dicatat ke tabel
> `audit_logs` dan tampil di halaman **Kesehatan Sistem**. Admin **tidak bisa** mengubah
> status/role akunnya sendiri (mencegah akun terkunci).

---

## 🔌 Endpoint Penting

| Kelompok | Endpoint |
| :--- | :--- |
| Health | `GET /api/health` → `{"status":"ok","database":"connected"}` |
| Auth | `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` |
| Katalog | `GET /api/subjects`, `/api/levels`, `/api/topics`, `/api/concepts` |
| Learning path | `GET /api/learning-path`, `/api/learning-path/:subjectId` |
| Asesmen | `GET /api/assessments`, `/:id`, `/:id/questions`, `POST /:id/attempts`, `POST /api/assessments/attempts/:id/submit` |
| Attempt | `POST /api/attempts`, `GET /api/attempts`, `GET /api/attempts/:id`, `POST /api/attempts/:id/submit`, `DELETE /api/attempts/:id` |
| Diagnostik | `GET /api/mastery`, `/api/gaps`, `/api/diagnostics/:id`, `POST /api/diagnostics/:id/verify/start` |
| Remediasi | `GET /api/recommendations`, `/next`, `POST /:id/start|complete|skip`, `GET /:id/materials`, `GET /api/practices`, `GET /api/history` |
| Admin — asesmen | `/api/assessments/admin/questions/bank` (CRUD soal), `/api/assessments/admin/full/:id` |
| Admin — pengguna | `GET /api/admin/users`, `GET /:id`, `PATCH /:id/status`, `PUT /:id/roles`, `POST /:id/reset-password` |
| Admin — sistem | `GET /api/admin/system/health`, `/stats`, `/activity`, `/analytics` |
| Admin — AI | `GET/POST/PUT/DELETE /api/admin/ai/providers`, `/models`, `/test`, `PATCH .../activate` |
| AI (opsional) | `POST /api/ai/analyze`, `GET /api/ai/health` |

> Semua endpoint `/api/admin/*` butuh role `ADMIN`. Detail lengkap: lihat `AGENT.md` §4.
> Halaman admin: `/admin` (landing), `/admin/assessments`, `/admin/users`, `/admin/ai`, `/admin/system`.

---

## 🤖 Fitur AI

Provider AI bisa dikonfigurasi dari panel admin (**/admin/ai**): simpan API key (terenkripsi
AES-256-GCM, butuh `AI_CREDENTIALS_SECRET` di `.env`), muat daftar model, lalu pilih & uji.
Bila tidak ada provider aktif di database, sistem memakai `AI_API_KEY`/`AI_MODEL` dari `.env`.

Tanpa keduanya, endpoint `/api/ai/*` mengembalikan **503** dan kolom analisis AI pada
attempt berstatus `FAILED`. Fitur inti (asesmen, scoring, mastery, gap, rekomendasi) **tetap berjalan**.

---

## 🗄️ Mengelola Script SQL

- Letakkan file `.sql` di `database/init/` dengan prefix angka (mis. `01-schema.sql`) agar urut.
- File tersebut hanya dieksekusi pada volume database yang baru.

---

## 🧪 Verifikasi Cepat

```bash
# Backend sehat?
curl http://localhost:5001/api/health

# Frontend bisa di-build tanpa error?
cd frontend && npm run build
```

---

## 🛠️ Troubleshooting

- **Port 5000 bentrok (macOS)?** Gunakan `PORT=5001` (default proyek).
- **Error "server does not support SSL connections"?** Postgres lokal tidak memakai SSL —
  set `DATABASE_SSL=false`.
- **Perubahan schema tidak terlihat?** SQL init hanya jalan saat volume kosong:
  `docker compose down -v`.
- **Endpoint balas 404 JSON** (`{"status":"error","message":"Endpoint tidak ditemukan..."}`) —
  path salah; cek daftar endpoint di atas.
