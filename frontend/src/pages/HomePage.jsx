// ============================================================
// XORA — Home Page
// frontend/src/pages/HomePage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { systemApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "../context/RouterContext";

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [backendStatus, setBackendStatus] = useState("memuat...");

  useEffect(() => {
    systemApi
      .getHealth()
      .then((data) => setBackendStatus(JSON.stringify(data)))
      .catch((err) => setBackendStatus(`gagal: ${err.message}`));
  }, []);

  return (
    <div className="home-container">
      <div className="hero-card card">
        <h1 className="hero-title">Platform Pembelajaran Adaptif Xora</h1>
        <p className="hero-description">
          Sistem asesmen diagnostik dan kurikulum berbasis kompetensi yang dipersonalisasi
          untuk setiap pembelajar.
        </p>

        <div className="hero-actions">
          {isAuthenticated ? (
            <Link to="/profile" className="btn btn-primary btn-lg">
              Buka Profil Pembelajar ({user?.name})
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary btn-lg">
                Masuk ke Akun
              </Link>
              <Link to="/register" className="btn btn-secondary btn-lg">
                Daftar Pembelajar Baru
              </Link>
            </>
          )}
        </div>

        <div className="status-box">
          <p className="status-label">Status Lingkungan Sistem:</p>
          <div className="status-content">
            <div>Frontend: <code>http://localhost:5173</code></div>
            <div>Status backend: <code>{backendStatus}</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
