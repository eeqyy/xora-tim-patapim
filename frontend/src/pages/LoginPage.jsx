// ============================================================
// XORA — Login Page
// frontend/src/pages/LoginPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth, homePathFor } from "../context/AuthContext";
import { useRouter, Link } from "../context/RouterContext";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const { navigate } = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sudah terautentikasi (baik dari sesi tersimpan maupun baru saja login)
  // -> arahkan sesuai role. Dilakukan di effect, bukan saat render.
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    navigate(homePathFor(user));
  }, [isLoading, isAuthenticated, user, navigate]);

  if (isAuthenticated) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { email, password } = formData;

    if (!email || !email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      // Redirect-nya ditangani oleh useEffect di atas (role-aware),
      // berdasarkan user yang sudah berisi roles.
    } catch (err) {
      setError(err.message || "Email atau password tidak sesuai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Masuk ke Xora</h2>
        <p className="auth-subtitle">Akses profil belajar dan progres kompetensi Anda</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="login-email">Alamat Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="nama@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Masukkan password Anda"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sedang Memeriksa..." : "Masuk"}
          </button>
        </form>

        <p className="auth-footer">
          Belum memiliki akun? <Link to="/register" className="text-link">Daftar sekarang</Link>
        </p>
      </div>
    </div>
  );
}
