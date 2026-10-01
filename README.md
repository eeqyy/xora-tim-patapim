# Xora Project

Proyek ini menggunakan arsitektur monorepo sederhana yang terdiri dari Frontend (React/Vite), Backend (Node.js/Express), dan Database (MySQL). Seluruh environment sudah di-dockerisasi agar semua anggota tim memiliki lingkungan development yang identik tanpa perlu setup manual di OS lokal masing-masing.

## 📁 Struktur Folder Utama
```text
/project-root
 ├── backend/            # Source code Node.js + Express
 │   ├── index.js        # Entry point Express server
 │   ├── db.js           # Connection pool MySQL (mysql2)
 │   ├── package.json    # Dependency backend
 │   ├── nodemon.json    # Konfigurasi hot reload
 │   ├── Dockerfile      # Konfigurasi Docker khusus backend
 │   └── .dockerignore
 ├── frontend/           # Source code React + Vite
 │   ├── index.html      # Root HTML Vite
 │   ├── vite.config.js  # Konfigurasi Vite dev server
 │   ├── src/            # Source React (main.jsx, App.jsx, index.css)
 │   ├── package.json    # Dependency frontend
 │   ├── Dockerfile      # Konfigurasi Docker khusus frontend
 │   └── .dockerignore
 ├── database/
 │   └── init/           # Script SQL yang auto-run saat MySQL container pertama start
 ├── docker-compose.yml  # Orkestrasi semua container (Frontend, Backend, MySQL)
 ├── .env.example        # Template konfigurasi environment variables
 ├── .gitignore          # Mengabaikan file yang tidak perlu di push ke Github
 └── README.md           # Panduan ini
```

---

## 🚀 Panduan Setup Awal (Wajib dibaca sebelum ngoding!)

Jika kamu baru saja men-clone repositori ini, ikuti langkah-langkah berikut secara berurutan:

### 1. Persiapan Environment Variables
Kamu butuh file konfigurasi lokal agar database dan aplikasi bisa berjalan.
- **Copy file `.env.example`** dan ubah namanya menjadi `.env`.
- (Opsional) Buka file `.env` dan sesuaikan nilainya jika diperlukan. Untuk tahap awal *development*, biarkan nilainya secara *default* karena sudah disetting siap pakai.

> **Mac/Linux/Git Bash:** 
> ```bash
> cp .env.example .env
> ```

### 2. Jalankan Docker Compose
Pastikan kamu sudah meng-install **Docker** & **Docker Desktop** (jika pakai Mac/Windows) di komputermu, dan dalam keadaan berjalan.
Di terminal root proyek ini, jalankan:

```bash
docker compose up --build
```
*(Tambahkan `-d` di akhir jika tidak ingin log-nya memenuhi terminal, contoh: `docker compose up --build -d`)*

Proses ini akan men-download image, meng-install dependensi (`npm install`) secara terisolasi, dan menyalakan semua sistem. 

### 3. Mulai Ngoding!
Ketika terminal sudah menunjukkan status bahwa server berjalan:
- **Frontend** dapat diakses di browser pada: `http://localhost:5173`
- **Backend API** dapat diakses pada: `http://localhost:5000`
- **Database MySQL** berjalan di port `3306` (host: `localhost` jika akses via DBeaver/DataGrip, atau `mysql` jika diakses via script backend).

> **Penting (Hot Reload):** Karena kita menggunakan volume mount, semua perubahan kode yang kamu tulis di folder `backend/` atau `frontend/` akan langsung me-reload otomatis (berkat `nodemon` dan `vite`). Untuk environment Docker di Windows (bind mount), kami mengaktifkan `legacyWatch` (nodemon) dan `usePolling` (Vite) agar perubahan file terdeteksi dengan stabil. **Kamu tidak perlu stop/start ulang docker setiap mengubah kode!**

---

## 🗄️ Menjalankan Script SQL Otomatis

Letakkan file `.sql` di folder `database/init/` dengan prefix angka agar urut (misal `01-schema.sql`, `02-seed.sql`).

> **⚠️ PENTING:** File SQL di `database/init/` **hanya dieksekusi saat container MySQL start untuk pertama kali** (ketika volume `mysql_data` masih kosong). Jika kamu menambah atau mengubah file SQL setelah database pernah running, kamu perlu me-reset database:
> ```bash
> docker compose down -v && docker compose up --build
> ```
> Perintah `-v` akan **MENGHAPUS seluruh data** pada volume MySQL. Pastikan tidak ada data penting yang tersimpan sebelum menjalankannya.

---

## 🔧 Panduan Troubleshooting

- **Gagal akses Frontend dari browser?** 
  Pastikan Vite dijalankan dengan argumen `--host` atau dikonfigurasi `host: true` di `vite.config.js` frontend kamu. (Hal ini sudah ditangani otomatis oleh `Dockerfile` frontend).
- **Backend Error CORS ke Frontend?**
  Pastikan backend kamu mengizinkan URL frontend (http://localhost:5173). Instal dan gunakan `cors` middleware di Express.
- **Butuh nambah package / NPM install baru?**
  Jika kamu menambahkan dependensi baru (misalnya install `axios` di frontend: `cd frontend && npm install axios`), kamu perlu me-rebuild container kamu agar Docker memasukkan dependensi baru tersebut:
  ```bash
  docker compose up --build
  ```
- **Cara stop service?**
  Tekan `Ctrl+C` di terminal yang sedang menjalankan docker compose, atau jika berjalan di background (`-d`), gunakan:
  ```bash
  docker compose down
  ```
- **Cek semua sistem sehat?**
  Buka `http://localhost:5000/api/health`. Endpoint ini akan menampilkan `{"status":"ok","database":"connected"}` apabila backend berhasil terhubung ke MySQL.
