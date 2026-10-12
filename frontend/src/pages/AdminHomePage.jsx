// ============================================================
// XORA — Admin: Beranda (landing)
// frontend/src/pages/AdminHomePage.jsx
// ============================================================
// Pintu masuk area admin. Berisi tiga kartu menuju:
//   - Kelola Asesmen (/admin/assessments)
//   - Kelola Pengguna (/admin/users)
//   - Kesehatan Sistem (/admin/system)
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// ============================================================

import React from "react";
import { useRouter } from "../context/RouterContext";

const MENU = [
  {
    to: "/admin/assessments",
    icon: "📝",
    title: "Kelola Asesmen",
    description:
      "Buat dan ubah asesmen, atur soal, serta kelola bank soal yang dipakai peserta.",
    cta: "Buka Kelola Asesmen →",
  },
  {
    to: "/admin/users",
    icon: "👥",
    title: "Kelola Pengguna",
    description:
      "Lihat daftar akun, ubah status (aktif/nonaktif), atur role, dan reset password bila diperlukan.",
    cta: "Buka Kelola Pengguna →",
  },
  {
    to: "/admin/system",
    icon: "📊",
    title: "Kesehatan Sistem",
    description:
      "Pantau status database, statistik data, aktivitas terbaru, dan ringkasan analytics.",
    cta: "Buka Kesehatan Sistem →",
  },
];

export default function AdminHomePage() {
  const { navigate } = useRouter();

  return (
    <div className="assessment-container">
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <h1 className="assessment-title">Panel Admin</h1>
            <p className="assessment-subtitle">
              Pusat kendali untuk mengelola konten asesmen, akun pengguna, dan
              memantau kesehatan sistem Xora.
            </p>
          </div>
        </div>
      </div>

      <div className="admin-menu-grid">
        {MENU.map((item) => (
          <button
            key={item.to}
            type="button"
            className="card admin-menu-card"
            onClick={() => navigate(item.to)}
          >
            <span className="admin-menu-card-icon" aria-hidden="true">
              {item.icon}
            </span>
            <h2 className="admin-menu-card-title">{item.title}</h2>
            <p className="admin-menu-card-desc">{item.description}</p>
            <span className="admin-menu-card-cta">{item.cta}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
