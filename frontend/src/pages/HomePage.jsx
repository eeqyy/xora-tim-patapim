// ============================================================
// XORA — Home Page (Editorial Grid System)
// frontend/src/pages/HomePage.jsx
// ------------------------------------------------------------
// Hero (PageHeader) + grid fitur + akses cepat.
// Pemisah = garis horizontal + ruang kosong (tanpa grid kotak).
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  GlassPanel,
  PrimaryButton,
  OutlineButton,
  Grid,
  HAIRLINE,
  INK,
  MUTED,
  cx,
} from "../components";
import {
  IconBook,
  IconCompass,
  IconChart,
  IconTarget,
  IconUser,
  IconArrowRight,
  IconSparkles,
} from "../components/Icons";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { navigate } = useRouter();
  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

  const features = [
    {
      icon: <IconBook size={20} />,
      title: "Asesmen Berbasis Bukti",
      desc: "Setiap respons dianalisis sebagai bukti pemahaman konsep yang valid dan terukur.",
    },
    {
      icon: <IconTarget size={20} />,
      title: "Deteksi Akar Masalah",
      desc: "Pelacakan otomatis hingga ke konsep prasyarat untuk menemukan sumber hambatan belajar.",
    },
    {
      icon: <IconChart size={20} />,
      title: "Pertumbuhan Terverifikasi",
      desc: "Pantau kemajuan kompetensi materi secara objektif melalui riwayat pengujian nyata.",
    },
    {
      icon: <IconCompass size={20} />,
      title: "Peta Belajar Terarah",
      desc: "Jalur pembelajaran adaptif yang menyesuaikan urutan materi sesuai kesiapan kognitif.",
    },
  ];

  const quickAccessClass = cx(
    "flex min-h-[72px] items-center gap-4 rounded-3xl bg-cell p-5 transition-colors",
    "dark:bg-cell-dark hover:bg-brand-soft"
  );

  return (
    <PageContainer maxWidth="normal">
      {/* Hero */}
      <PageHeader
        badge="Evidence-Based Learning Platform"
        title="Navigasi Presisi untuk Penguasaan Konsep Belajar"
        description="Xora menganalisis bukti belajar aktual dari asesmen untuk mengidentifikasi kesenjangan pemahaman dan merekomendasikan remedi yang tepat sasaran."
        actions={
          isAuthenticated ? (
            isAdmin ? (
              <PrimaryButton
                size="lg"
                onClick={() => navigate("/admin/assessments")}
                iconRight={<IconArrowRight size={16} />}
              >
                Kelola Konten &amp; Bank Soal
              </PrimaryButton>
            ) : (
              <>
                <span className={cx("w-full text-[12px] leading-relaxed", MUTED)}>
                  Selamat datang kembali, <strong className={INK}>{user?.name}</strong>
                </span>
                <PrimaryButton
                  size="lg"
                  onClick={() => navigate("/assessments")}
                  iconRight={<IconArrowRight size={16} />}
                >
                  Mulai Asesmen
                </PrimaryButton>
                <OutlineButton
                  size="lg"
                  onClick={() => navigate("/learning-path")}
                  icon={<IconCompass size={16} />}
                >
                  Peta Pembelajaran
                </OutlineButton>
                <OutlineButton
                  size="lg"
                  onClick={() => navigate("/progress")}
                  icon={<IconChart size={16} />}
                >
                  Progres Belajar
                </OutlineButton>
              </>
            )
          ) : (
            <>
              <PrimaryButton
                size="lg"
                onClick={() => navigate("/register")}
                iconRight={<IconArrowRight size={16} />}
              >
                Mulai Sekarang
              </PrimaryButton>
              <OutlineButton size="lg" onClick={() => navigate("/login")}>
                Masuk ke Akun
              </OutlineButton>
            </>
          )
        }
      />

      {/* Feature Cards (Visitor View) */}
      {!isAuthenticated && (
        <Grid cols={4} className="mt-8">
          {features.map((f) => (
            <GlassPanel key={f.title} className={cx("flex flex-col gap-3 border-t pt-6", HAIRLINE)}>
              <span className={INK}>{f.icon}</span>
              <h3 className={cx("text-sm font-bold", INK)}>{f.title}</h3>
              <p className={cx("text-[12px] leading-relaxed", MUTED)}>{f.desc}</p>
            </GlassPanel>
          ))}
        </Grid>
      )}

      {/* Quick-access Cards (Authenticated Learner View) */}
      {isAuthenticated && !isAdmin && (
        <Grid cols={2} className="mt-8">
          <Link to="/assessments" className={quickAccessClass}>
            <span className={cx("shrink-0", INK)}>
              <IconBook size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className={cx("block text-sm font-bold", INK)}>
                Asesmen Diagnostik
              </strong>
              <span className={cx("mt-0.5 block text-[12px] leading-relaxed", MUTED)}>
                Kerjakan soal dan kumpulkan bukti penguasaan konsep
              </span>
            </span>
            <IconArrowRight size={16} className={cx("shrink-0", MUTED)} />
          </Link>

          <Link to="/learning-path" className={quickAccessClass}>
            <span className={cx("shrink-0", INK)}>
              <IconCompass size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className={cx("block text-sm font-bold", INK)}>
                Peta Pembelajaran
              </strong>
              <span className={cx("mt-0.5 block text-[12px] leading-relaxed", MUTED)}>
                Lihat status kompetensi kurikulum dan prasyarat materi
              </span>
            </span>
            <IconArrowRight size={16} className={cx("shrink-0", MUTED)} />
          </Link>

          <Link to="/progress" className={quickAccessClass}>
            <span className={cx("shrink-0", INK)}>
              <IconChart size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className={cx("block text-sm font-bold", INK)}>
                Progres &amp; Riwayat
              </strong>
              <span className={cx("mt-0.5 block text-[12px] leading-relaxed", MUTED)}>
                Telusuri pertumbuhan penguasaan materi dan histori sesi
              </span>
            </span>
            <IconArrowRight size={16} className={cx("shrink-0", MUTED)} />
          </Link>

          <Link to="/profile" className={quickAccessClass}>
            <span className={cx("shrink-0", INK)}>
              <IconUser size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <strong className={cx("block text-sm font-bold", INK)}>Profil Saya</strong>
              <span className={cx("mt-0.5 block text-[12px] leading-relaxed", MUTED)}>
                Kelola identitas akun dan preferensi pembelajaran
              </span>
            </span>
            <IconArrowRight size={16} className={cx("shrink-0", MUTED)} />
          </Link>
        </Grid>
      )}
    </PageContainer>
  );
}
