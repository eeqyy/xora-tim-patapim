# Xora Project

Proyek ini menggunakan arsitektur monorepo sederhana yang terdiri dari Frontend (React/Vite), Backend (Node.js/Express), dan Database (MySQL). Seluruh environment sudah di-dockerisasi agar semua anggota tim memiliki lingkungan development yang identik tanpa perlu setup manual di OS lokal masing-masing.

## 📁 Struktur Folder Utama
```text
/project-root
 ├── backend/            # Source code Node.js + Express
 │   ├── Dockerfile      # Konfigurasi Docker khusus backend
 │   └── .dockerignore
 ├── frontend/           # Source code React + Vite
 │   ├── Dockerfile      # Konfigurasi Docker khusus frontend
 │   └── .dockerignore
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

> **Penting (Hot Reload):** Karena kita menggunakan volume mount, semua perubahan kode yang kamu tulis di folder `backend/` atau `frontend/` akan langsung me-reload otomatis (berkat `nodemon` dan `vite`). **Kamu tidak perlu stop/start ulang docker setiap mengubah kode!**

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
