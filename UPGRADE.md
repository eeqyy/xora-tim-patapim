# UPGRADE.md — Langkah Wajib Setelah `git pull`

Ada perubahan **database** dan **konfigurasi**. Lakukan sekali saja, sekitar 5 menit.

## 1. Ambil kode & install ulang

```bash
git pull
cd backend && npm install
cd ../frontend && npm install
```

## 2. Sesuaikan file `.env`

Pilih sesuai cara kalian menjalankan database:

| Kalau kalian pakai… | Yang perlu ditambahkan ke `.env` |
| :--- | :--- |
| **Supabase** (online) | Tidak ada — langsung jalan |
| **Postgres lokal** | `DATABASE_SSL=false` |
| **Docker** | Ganti `MYSQL_...` menjadi `POSTGRES_...` (contoh di `.env.example`) |

Kalau belum punya `.env`, jalankan `cp .env.example .env` lalu isi datanya.

## 3. Update database

Pilih **salah satu**:

**Tidak pakai Docker** — jalankan 2 file migrasi ini:
```bash
psql -d xora -f database/migrations/006_assessment_engine_and_question_bank.sql
psql -d xora -f database/migrations/007_question_bank_flexibility.sql
```

**Pakai Docker** — reset lalu isi ulang data contoh:
```bash
docker compose down -v
docker compose up --build
docker compose exec backend npm run seed
```
> `down -v` akan menghapus data di dalam Docker (ini data dev, biasanya aman).

## 4. Cek berhasil

```bash
curl http://localhost:5001/api/health
```

Harus muncul: `{"status":"ok","database":"connected"}`.
Terakhir, coba login dan buka halaman daftar asesmen.

## Kalau ada error

| Pesan error | Solusi |
| :--- | :--- |
| `server does not support SSL connections` | Tambah `DATABASE_SSL=false` di `.env` |
| `column ... does not exist` (tabel/kolom tidak ada) | Langkah 3 belum dijalankan |
| Halaman acak balas `Endpoint tidak ditemukan` | Normal — itu fitur halaman 404 baru |
