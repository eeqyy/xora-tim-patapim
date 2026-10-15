// ============================================================
// XOLEARN — Login Page (Editorial Grid System)
// frontend/src/pages/LoginPage.jsx
// ------------------------------------------------------------
// Dua kolom di layar lebar: sisi kiri menjelaskan nilai masuk
// ke Xolearn, sisi kanan berisi panel formulir. Di layar kecil
// formulir tampil lebih dulu, penjelasan menyusul di bawahnya.
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
  MicroMeta,
  DisplayHeading,
  HAIRLINE,
  INK,
  MUTED,
  cx,
} from "../components";
import { IconChart, IconCompass, IconLock, IconTarget } from "../components/Icons";

const HIGHLIGHTS = [
  {
    icon: <IconTarget size={18} />,
    title: "Lanjutkan yang sudah dimulai",
    desc: "Asesmen, peta kesenjangan, dan riwayat belajar Anda tersimpan di akun.",
  },
  {
    icon: <IconChart size={18} />,
    title: "Progres yang terbaca",
    desc: "Pantau pertumbuhan kompetensi dari waktu ke waktu, bukan sekadar nilai sekali uji.",
  },
  {
    icon: <IconCompass size={18} />,
    title: "Langkah berikutnya jelas",
    desc: "Rekomendasi belajar menyesuaikan kesenjangan yang sedang Anda hadapi.",
  },
  {
    icon: <IconLock size={18} />,
    title: "Aman",
    desc: "Sesi masuk Anda dilindungi dan disimpan hanya di perangkat ini.",
  },
];

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const { navigate } = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    <PageContainer maxWidth="normal">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_minmax(0,1fr)] lg:items-center lg:gap-16">
        {/* Penjelasan (layar lebar: kiri; layar kecil: bawah formulir) */}
        <aside className="order-2 lg:order-1">
          <MicroMeta>XOLEARN</MicroMeta>
          <DisplayHeading as="h2" className="mt-4 max-w-xl text-display-sm">
            Setiap jawaban adalah bukti belajar.
          </DisplayHeading>
          <p className={cx("mt-5 max-w-xl text-[14px] leading-relaxed", MUTED)}>
            Masuk untuk melanjutkan asesmen, melihat peta kesenjangan konsep, dan memantau
            pertumbuhan kompetensi Anda.
          </p>

          <ul className="mt-8 max-w-xl">
            {HIGHLIGHTS.map((item, i) => (
              <li
                key={item.title}
                className={cx("flex items-start gap-4 py-5", i > 0 && cx("border-t", HAIRLINE))}
              >
                <span className="mt-0.5 shrink-0 text-accent">{item.icon}</span>
                <span className="min-w-0">
                  <strong className={cx("block text-[14px] font-bold", INK)}>{item.title}</strong>
                  <span className={cx("mt-1 block text-[13px] leading-relaxed", MUTED)}>
                    {item.desc}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </aside>

        {/* Formulir */}
        <GlassPanel
          variant="elevated"
          className="order-1 w-full p-7 sm:p-8 lg:order-2 lg:p-9"
        >
          <div className="flex items-center gap-3">
            <img
              src="/logo-mark.png"
              alt=""
              aria-hidden="true"
              className="logo-mark h-10 w-10 shrink-0 object-contain dark:hidden"
            />
            <img
              src="/logo-mark-light.png"
              alt=""
              aria-hidden="true"
              className="logo-mark hidden h-10 w-10 shrink-0 object-contain dark:block"
            />
            <span className={cx("text-[19px] font-extrabold tracking-[-0.02em]", INK)}>
              Xolearn
            </span>
          </div>
          <h1 className={cx("mt-5 text-2xl font-extrabold leading-tight tracking-tight md:text-3xl", INK)}>
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
              <div className="relative">
                <Input
                  id="login-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Masukkan password Anda"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="current-password"
                  className="pr-28"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-pressed={showPassword}
                  aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  className="absolute right-1.5 top-1/2 inline-flex min-h-[44px] -translate-y-1/2 items-center rounded-full px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-accent transition-colors hover:text-accent-hover"
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </Field>

            <PrimaryButton type="submit" size="lg" fullWidth loading={isSubmitting}>
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
      </div>
    </PageContainer>
  );
}
