// ============================================================
// XOLEARN — Login Page (Editorial Grid System)
// frontend/src/pages/LoginPage.jsx
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
    <PageContainer maxWidth="narrow" className="flex min-h-[70vh] flex-col justify-center">
      <GlassPanel variant="elevated" className="p-8 md:p-10">
        <h1 className={cx("text-2xl font-extrabold leading-tight tracking-tight md:text-3xl", INK)}>
          Masuk ke Xolearn
        </h1>
        <p className={cx("mt-2 text-[13px] leading-relaxed", MUTED)}>
          Akses profil belajar dan progres kompetensi Anda
        </p>

        {error ? (
          <Alert tone="error" className="mt-6">
            {error}
          </Alert>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <Field label="Alamat Email" htmlFor="login-email">
            <Input
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
          </Field>

          <Field label="Password" htmlFor="login-password">
            <Input
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
          </Field>

          <PrimaryButton type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? "Sedang Memeriksa..." : "Masuk"}
          </PrimaryButton>
        </form>

        <p className={cx("mt-6 flex flex-wrap items-center gap-2 text-[12px] leading-relaxed", MUTED)}>
          <span>Belum memiliki akun?</span>
          <Link
            to="/register"
            className="inline-flex min-h-[44px] items-center font-bold text-accent underline underline-offset-2 hover:text-accent-hover"
          >
            Daftar sekarang
          </Link>
        </p>
      </GlassPanel>
    </PageContainer>
  );
}
