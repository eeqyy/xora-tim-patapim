// ============================================================
// XORA — Landing page (Home)
// frontend/src/pages/HomePage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { systemApi } from "../services/api";
import { useAuth, homePathFor } from "../context/AuthContext";
import { Link } from "../context/RouterContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";

const FEATURES = [
  {
    title: "Asesmen Awal Adaptif",
    desc: "Posisi kamu dipetakan dari pertanyaan bertingkat, lalu diterjemahkan menjadi learning map yang akurat.",
    tag: "01 / ASSESS",
  },
  {
    title: "Learning Map",
    desc: "Fondasi konsep tersambung dengan prasyarat — setiap node terkunci sampai fondasinya benar-benar kuat.",
    tag: "02 / MAP",
  },
  {
    title: "Rekomendasi cerdas",
    desc: "Gap terdeteksi otomatis diikuti langkah belajar paling berdampak, lengkap dengan materi dan latihan tertarget.",
    tag: "03 / RECOMMEND",
  },
  {
    title: "Bukti yang transparan",
    desc: "Setiap keputusan punya jejak percobaan, confidence score, dan riwayat yang bisa kamu telusuri kembali.",
    tag: "04 / EVIDENCE",
  },
];

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");
  const [backendStatus, setBackendStatus] = useState("memuat...");
  const homeTarget = homePathFor(user);

  useEffect(() => {
    systemApi
      .getHealth()
      .then((json) => setBackendStatus(json?.status === "ok" ? "online" : "siap"))
      .catch(() => setBackendStatus("offline"));
  }, []);

  return (
    <div className="home-container">
      <section className="home-hero">
        <div className="ui-eyebrow">Platform Pembelajaran Adaptif</div>
        <h1 className="home-hero-title">
          Belajar tanpa
          <span className="home-hero-accent"> menebak </span>
          langkah berikutnya.
        </h1>
        <p className="home-hero-desc">
          Xora memetakan pemahamanmu, menemukan gap yang sebenarnya, lalu menyusun jalur
          belajar yang urut dari fondasi. Setiap rekomendasi didukung bukti.
        </p>

        <div className="home-hero-actions">
          {isAuthenticated ? (
            <Button to={homeTarget} size="lg">
              {isAdmin ? `Buka Kelola (${user?.name})` : `Lanjut Belajar (${user?.name})`}
            </Button>
          ) : (
            <>
              <Button to="/register" size="lg">
                Mulai Belajar
              </Button>
              <Link to="/login" className="ui-btn ui-btn-ghost ui-btn-lg">
                Masuk ke Akun
              </Link>
            </>
          )}
        </div>

        <div className="home-hero-status">
          <span className="ui-mono ui-dim">backend</span>
          <Badge
            variant={backendStatus === "online" ? "success" : backendStatus === "offline" ? "error" : "warning"}
            dot
          >
            {backendStatus}
          </Badge>
        </div>
      </section>

      <section className="home-features">
        {FEATURES.map((f) => (
          <Card key={f.tag} className="home-feature">
            <div className="ui-eyebrow home-feature-tag">{f.tag}</div>
            <h3 className="home-feature-title">{f.title}</h3>
            <p className="home-feature-desc">{f.desc}</p>
          </Card>
        ))}
      </section>
    </div>
  );
}