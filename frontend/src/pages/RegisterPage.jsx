// ============================================================
// XORA — Register Page
// frontend/src/pages/RegisterPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth, homePathFor } from "../context/AuthContext";
import { useRouter, Link } from "../context/RouterContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register, isAuthenticated, user } = useAuth();
  const { navigate } = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const { name, email, password, confirmPassword } = formData;

    if (!name || !name.trim()) {
      setError("Nama lengkap wajib diisi.");
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
      toast({ title: "Akun dibuat", message: "Silakan masuk untuk memulai onboarding.", tone: "success" });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Gagal melakukan registrasi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <Card surface className="ui-auth-card">
        <div className="ui-eyebrow">Mulai perjalanan belajar</div>
        <h2 className="auth-title">Daftar Akun Xora</h2>
        <p className="auth-subtitle">Gratis — cukup nama, email, dan satu password.</p>

        {error && (
          <div className="ui-form-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="ui-stack">
          <Input
            id="reg-name"
            name="name"
            label="Nama Lengkap"
            type="text"
            placeholder="Contoh: Budi Santoso"
            value={formData.name}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="name"
            required
          />
          <Input
            id="reg-email"
            name="email"
            label="Alamat Email"
            type="email"
            placeholder="nama@email.com"
            value={formData.email}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="email"
            required
          />
          <Input
            id="reg-password"
            name="password"
            label="Password"
            type="password"
            placeholder="Minimal 8 karakter"
            value={formData.password}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="new-password"
            required
          />
          <Input
            id="reg-confirm-password"
            name="confirmPassword"
            label="Konfirmasi Password"
            type="password"
            placeholder="Ulangi password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="new-password"
            required
          />

          <Button type="submit" block size="lg" loading={isSubmitting}>
            Daftar Akun
          </Button>
        </form>

        <p className="auth-footer">
          Sudah memiliki akun?{" "}
          <Link to="/login" className="text-link">
            Masuk di sini
          </Link>
        </p>
      </Card>
    </div>
  );
}