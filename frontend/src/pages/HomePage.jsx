// ============================================================
// XORA — Home Page
// Premium Light Glassmorphism · Minimal · Reusable
// frontend/src/pages/HomePage.jsx
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useRouter } from "../context/RouterContext";
import { PageContainer, GlassPanel, PrimaryButton, OutlineButton } from "../components";
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

  return (
    <PageContainer maxWidth="normal">
      <div className="home-container">
        {/* Hero Section */}
        <GlassPanel variant="elevated" className="hero-card">
          <div className="hero-badge-row">
            <span className="hero-badge">Evidence-Based Learning Platform</span>
          </div>

          <h1 className="hero-title">
            Navigasi Presisi untuk{" "}
            <span className="hero-title-highlight">Penguasaan Konsep</span> Belajar
          </h1>

          <p className="hero-description">
            Xora menganalisis bukti belajar aktual dari asesmen untuk mengidentifikasi
            kesenjangan pemahaman dan merekomendasikan remedi yang tepat sasaran.
          </p>

          <div className="hero-actions">
            {isAuthenticated ? (
              isAdmin ? (
                <PrimaryButton
                  size="lg"
                  onClick={() => navigate("/admin/assessments")}
                  iconRight={<IconArrowRight size={16} />}
                >
                  Kelola Konten &amp; Bank Soal
                </PrimaryButton>
              ) : (
                <div className="hero-learner-cta">
                  <div className="hero-welcome">
                    Selamat datang kembali, <strong>{user?.name}</strong>
                  </div>
                  <div className="hero-cta-group">
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
                  </div>
                </div>
              )
            ) : (
              <div className="hero-cta-group">
                <PrimaryButton
                  size="lg"
                  onClick={() => navigate("/register")}
                  iconRight={<IconArrowRight size={16} />}
                >
                  Mulai Sekarang
                </PrimaryButton>
                <OutlineButton
                  size="lg"
                  onClick={() => navigate("/login")}
                >
                  Masuk ke Akun
                </OutlineButton>
              </div>
            )}
          </div>
        </GlassPanel>

        {/* Feature Cards (Visitor View) */}
        {!isAuthenticated && (
          <div className="home-features-grid">
            {features.map((f) => (
              <GlassPanel key={f.title} variant="default" className="home-feature-card">
                <div className="feature-icon-wrap">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </GlassPanel>
            ))}
          </div>
        )}

        {/* Quick-access Cards (Authenticated Learner View) */}
        {isAuthenticated && !isAdmin && (
          <div className="home-quickaccess-grid">
            <Link to="/assessments" className="glass-panel glass-panel-interactive home-quickaccess-card">
              <div className="qa-icon-wrap">
                <IconBook size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <strong className="qa-title">Asesmen Diagnostik</strong>
                <p className="qa-desc">Kerjakan soal dan kumpulkan bukti penguasaan konsep</p>
              </div>
              <IconArrowRight size={16} className="qa-arrow" />
            </Link>

            <Link to="/learning-path" className="glass-panel glass-panel-interactive home-quickaccess-card">
              <div className="qa-icon-wrap">
                <IconCompass size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <strong className="qa-title">Peta Pembelajaran</strong>
                <p className="qa-desc">Lihat status kompetensi kurikulum dan prasyarat materi</p>
              </div>
              <IconArrowRight size={16} className="qa-arrow" />
            </Link>

            <Link to="/progress" className="glass-panel glass-panel-interactive home-quickaccess-card">
              <div className="qa-icon-wrap">
                <IconChart size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <strong className="qa-title">Progres &amp; Riwayat</strong>
                <p className="qa-desc">Telusuri pertumbuhan penguasaan materi dan histori sesi</p>
              </div>
              <IconArrowRight size={16} className="qa-arrow" />
            </Link>

            <Link to="/profile" className="glass-panel glass-panel-interactive home-quickaccess-card">
              <div className="qa-icon-wrap">
                <IconUser size={20} />
              </div>
              <div style={{ flex: 1 }}>
                <strong className="qa-title">Profil Saya</strong>
                <p className="qa-desc">Kelola identitas akun dan preferensi pembelajaran</p>
              </div>
              <IconArrowRight size={16} className="qa-arrow" />
            </Link>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
