// ============================================================
// XORA — Admin: Beranda (landing) — Editorial Grid System
// frontend/src/pages/AdminHomePage.jsx
// ============================================================
// Pintu masuk area admin. Berisi tiga sel menuju:
//   - Kelola Asesmen (/admin/assessments)
//   - Kelola Pengguna (/admin/users)
//   - Kesehatan Sistem (/admin/system)
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// ============================================================

import React from "react";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  Grid,
  GlassPanel,
  INK,
  MUTED,
  cx,
} from "../components";

const MENU = [
  {
    to: "/admin/assessments",
    title: "Kelola Asesmen",
    description:
      "Buat dan ubah asesmen, atur soal, serta kelola bank soal yang dipakai peserta.",
    cta: "Buka Kelola Asesmen →",
  },
  {
    to: "/admin/users",
    title: "Kelola Pengguna",
    description:
      "Lihat daftar akun, ubah status (aktif/nonaktif), atur role, dan reset password bila diperlukan.",
    cta: "Buka Kelola Pengguna →",
  },
  {
    to: "/admin/system",
    title: "Kesehatan Sistem",
    description:
      "Pantau status database, statistik data, aktivitas terbaru, dan ringkasan analytics.",
    cta: "Buka Kesehatan Sistem →",
  },
];

export default function AdminHomePage() {
  const { navigate } = useRouter();

  return (
    <PageContainer>
      <PageHeader
        badge="ADMIN"
        title="Panel Admin"
        description="Pusat kendali untuk mengelola konten asesmen, akun pengguna, dan memantau kesehatan sistem Xora."
      />

      <Grid cols={3} className="mt-12">
        {MENU.map((item) => (
          <GlassPanel
            key={item.to}
            className="group flex cursor-pointer flex-col gap-3 border-t border-hairline pt-6 dark:border-hairline-dark"
            onClick={() => navigate(item.to)}
          >
            <h2 className={cx("text-lg font-bold tracking-tight md:text-xl", INK)}>
              {item.title}
            </h2>
            <p className={cx("text-[13px] leading-relaxed", MUTED)}>{item.description}</p>
            <span className="mt-auto pt-2 text-[12px] font-semibold tracking-[0.02em] text-brand">
              {item.cta}
            </span>
          </GlassPanel>
        ))}
      </Grid>
    </PageContainer>
  );
}
