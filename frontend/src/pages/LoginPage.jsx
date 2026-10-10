// ============================================================
// XORA — Login Page
// frontend/src/pages/LoginPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth, homePathFor } from "../context/AuthContext";
import { useRouter, Link } from "../context/RouterContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { useToast } from "../components/ui/Toast";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const { navigate } = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      toast({ title: "Berhasil masuk", tone: "success" });
    } catch (err) {
      setError(err.message || "Email atau password tidak sesuai.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-container">
      <Card surface className="ui-auth-card">
        <div className="ui-eyebrow">Selamat datang kembali</div>
        <h2 className="auth-title">Masuk ke Xora</h2>
        <p className="auth-subtitle">Lanjutkan dari posisi terakhir belajar Anda</p>

        {error && (
          <div className="ui-form-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="ui-stack">
          <Input
            id="login-email"
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
            id="login-password"
            name="password"
            label="Password"
            type="password"
            placeholder="Masukkan password Anda"
            value={formData.password}
            onChange={handleChange}
            disabled={isSubmitting}
            autoComplete="current-password"
            required
          />

          <Button type="submit" block size="lg" loading={isSubmitting}>
            Masuk
          </Button>
        </form>

        <p className="auth-footer">
          Belum memiliki akun?{" "}
          <Link to="/register" className="text-link">
            Daftar sekarang
          </Link>
        </p>
      </Card>
    </div>
  );
}