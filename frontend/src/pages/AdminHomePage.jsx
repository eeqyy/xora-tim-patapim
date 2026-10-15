// ============================================================
// XOLEARN — Admin: Beranda (Panel) — Editorial Grid System
// frontend/src/pages/AdminHomePage.jsx
// ============================================================
// Pintu masuk area admin, disusun bernomor seperti dashboard pelajar:
//   01 / RINGKASAN CEPAT  -> angka kunci (baca-saja)
//   02 / MENU ADMIN       -> sel menuju tiap halaman admin
//
// Angka ringkasan diambil dari GET /api/admin/system/stats (endpoint
// yang sama dengan halaman Kesehatan Sistem) — tidak ada data baru.
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// ============================================================

import { useEffect, useState } from "react";
import { adminSystemApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  Grid,
  GlassPanel,
  MetricCell,
  GhostButton,
  SkeletonSummary,
  Alert,
  AnimatedContent,
  IconArrowRight,
  IconClipboard,
  IconUser,
  IconDiagnose,
  IconChart,
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
    cta: "Buka Kelola Asesmen",
    icon: IconClipboard,
  },
  {
    to: "/admin/users",
    title: "Kelola Pengguna",
    description:
      "Lihat daftar akun, ubah status (aktif/nonaktif), atur role, dan reset password bila diperlukan.",
    cta: "Buka Kelola Pengguna",
    icon: IconUser,
  },
  {
    to: "/admin/ai",
    title: "AI & Model",
    description:
      "Simpan API key provider AI, pilih model, dan uji koneksi untuk mesin diagnosis Xolearn.",
    cta: "Buka AI & Model",
    icon: IconDiagnose,
  },
  {
    to: "/admin/system",
    title: "Kesehatan Sistem",
    description:
      "Pantau status database, statistik data, aktivitas terbaru, dan ringkasan analytics.",
    cta: "Buka Kesehatan Sistem",
    icon: IconChart,
  },
];

export default function AdminHomePage() {
  const { navigate } = useRouter();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await adminSystemApi.getStats();
        if (isMounted) setStats(res?.data || null);
      } catch (err) {
        if (isMounted) setError(err.message || "Gagal memuat ringkasan sistem.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = stats
    ? [
        {
          label: "Asesmen",
          value: stats.assessments ?? 0,
          hint: `${stats.questions ?? 0} soal · ${stats.active_questions ?? 0} aktif`,
        },
        {
          label: "Pengguna",
          value: stats.total_users ?? 0,
          hint: `${stats.active_users ?? 0} aktif · ${stats.admin_users ?? 0} admin`,
        },
        {
          label: "Pengerjaan",
          value: stats.attempts ?? 0,
          hint: `${stats.completed_attempts ?? 0} selesai · ${stats.active_sessions ?? 0} sesi aktif`,
        },
        {
          label: "Jejak Belajar",
          value: stats.learning_events ?? 0,
          hint: `${stats.audit_logs ?? 0} catatan audit`,
        },
      ]
    : [];

  return (
    <PageContainer>
      <PageHeader
        badge="ADMIN"
        title="Panel Admin"
        description="Pusat kendali untuk mengelola konten asesmen, akun pengguna, dan memantau kesehatan sistem Xolearn."
        actions={
          <GhostButton onClick={() => navigate("/")}>
            Beranda peserta
          </GhostButton>
        }
      />

      {error ? (
        <Alert tone="error" className="mt-8">
          {error}
        </Alert>
      ) : null}

      {/* 01 — Ringkasan */}
      <SectionHeader
        id="admin-summary"
        index="1"
        title="Ringkasan Cepat"
        meta={isLoading ? "Memuat…" : "Data terkini"}
      />
      <AnimatedContent>
        {isLoading ? (
          <SkeletonSummary />
        ) : (
          <Grid cols={4}>
            {metrics.map((m) => (
              <MetricCell key={m.label} label={m.label} value={m.value} hint={m.hint} />
            ))}
          </Grid>
        )}
      </AnimatedContent>

      {/* 02 — Menu */}
      <SectionHeader
        id="admin-menu"
        index="2"
        title="Menu Admin"
        meta={`${MENU.length} halaman`}
      />
      <Grid cols={2}>
        {MENU.map((item, i) => (
          <AnimatedContent key={item.to} style={{ "--i": i }}>
            <GlassPanel
              onClick={() => navigate(item.to)}
              className={cx(
                "group flex h-full flex-col gap-3 border-t pt-6 transition-[border-color,transform] duration-150 ease-out active:scale-[.99]",
                "border-hairline hover:border-brand dark:border-hairline-dark"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-[12px] font-bold tabular-nums text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={cx("inline-flex", MUTED)}>
                  <item.icon size={20} className="icon-zoom" />
                </span>
              </div>
              <h2 className={cx("text-lg font-bold tracking-tight md:text-xl", INK)}>
                {item.title}
              </h2>
              <p className={cx("text-[13px] leading-relaxed", MUTED)}>{item.description}</p>
              <span className="mt-auto flex items-center gap-2 pt-2 text-[12px] font-semibold tracking-[0.02em] text-accent">
                {item.cta}
                <IconArrowRight size={14} className="icon-go-right" />
              </span>
            </GlassPanel>
          </AnimatedContent>
        ))}
      </Grid>
    </PageContainer>
  );
}
