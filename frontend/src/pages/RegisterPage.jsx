// ============================================================
// XORA — Register Page (Editorial Grid System)
// frontend/src/pages/RegisterPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth, homePathFor } from "../context/AuthContext";
import { useRouter, Link } from "../context/RouterContext";
import {
  PageContainer,
  GlassPanel,
  Field,
  Input,
  PrimaryButton,
  Alert,
  INK,
  MUTED,
  cx,
} from "../components";

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
    <PageContainer maxWidth="narrow" className="flex min-h-[70vh] flex-col justify-center">
      <GlassPanel variant="elevated" className="p-8 md:p-10">
        <h1 className={cx("text-2xl font-extrabold leading-tight tracking-tight md:text-3xl", INK)}>
          Daftar Akun Xora
        </h1>
        <p className={cx("mt-2 text-[13px] leading-relaxed", MUTED)}>
          Mulai perjalanan belajar terarah Anda hari ini
        </p>

        {error ? (
          <Alert tone="error" className="mt-6">
            {error}
          </Alert>
        ) : null}
        {success ? (
          <Alert tone="success" className="mt-6">
            {success}
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <Field label="Nama Lengkap" htmlFor="reg-name">
            <Input
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
          </Field>

          <Field label="Alamat Email" htmlFor="reg-email">
            <Input
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
          </Field>

          <Field label="Password" htmlFor="reg-password">
            <Input
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
          </Field>

          <Field label="Konfirmasi Password" htmlFor="reg-confirm-password">
            <Input
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
          </Field>

          <PrimaryButton type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Mendaftarkan..." : "Daftar Akun"}
          </PrimaryButton>
        </form>

        <p className={cx("mt-6 flex flex-wrap items-center gap-2 text-[12px] leading-relaxed", MUTED)}>
          <span>Sudah memiliki akun?</span>
          <Link
            to="/login"
            className="inline-flex min-h-[44px] items-center font-bold text-brand underline underline-offset-2 hover:text-brand-hover"
          >
            Masuk di sini
          </Link>
        </p>
      </GlassPanel>
    </PageContainer>
  );
}
