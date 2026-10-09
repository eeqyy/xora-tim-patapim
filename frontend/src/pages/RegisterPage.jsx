// ============================================================
// XORA — Register Page
// frontend/src/pages/RegisterPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth, homePathFor } from "../context/AuthContext";
import { useRouter, Link } from "../context/RouterContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register, isAuthenticated, user } = useAuth();
  const { navigate } = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sudah login -> keluar dari halaman registrasi (redirect di effect,
  // bukan saat render), tujuan mengikuti role.
  useEffect(() => {
    if (isAuthenticated) {
      navigate(homePathFor(user));
    }
  }, [isAuthenticated, user, navigate]);

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
    setSuccess(null);

    const { name, email, password, confirmPassword } = formData;

    // Frontend validations
    if (!name || !name.trim()) {
      setError("Nama lengkap wajib diisi dan tidak boleh hanya spasi.");
      return;
    }

    if (!email || !email.trim()) {
      setError("Email wajib diisi.");
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Format alamat email tidak valid.");
      return;
    }

    if (!password) {
      setError("Password wajib diisi.");
      return;
    }

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setIsSubmitting(true);

    try {
      await register(name.trim(), email.trim(), password);
      setSuccess("Registrasi berhasil! Mengalihkan ke halaman login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(err.message || "Gagal melakukan registrasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Daftar Akun Xora</h2>
        <p className="auth-subtitle">Mulai perjalanan belajar terarah Anda hari ini</p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="reg-name">Nama Lengkap</label>
            <input
              id="reg-name"
              name="name"
              type="text"
              placeholder="Contoh: Budi Santoso"
              value={formData.name}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">Alamat Email</label>
            <input
              id="reg-email"
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
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              placeholder="Minimal 8 karakter"
              value={formData.password}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-confirm-password">Konfirmasi Password</label>
            <input
              id="reg-confirm-password"
              name="confirmPassword"
              type="password"
              placeholder="Ulangi password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isSubmitting}
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Mendaftarkan..." : "Daftar Akun"}
          </button>
        </form>

        <p className="auth-footer">
          Sudah memiliki akun? <Link to="/login" className="text-link">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
}
