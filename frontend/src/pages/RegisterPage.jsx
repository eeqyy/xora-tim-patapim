// ============================================================
// XOLEARN — Register Page (Editorial Grid System)
// frontend/src/pages/RegisterPage.jsx
// ------------------------------------------------------------
// Susunan sama seperti halaman masuk: penjelasan di satu sisi,
// panel formulir di sisi lain. Di layar kecil formulir tampil
// lebih dulu agar pendaftaran langsung terlihat.
// ============================================================

import { useEffect, useState } from "react";
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
import { IconBook, IconCompass, IconDiagnose, IconChart } from "../components/Icons";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HIGHLIGHTS = [
  {
    icon: <IconDiagnose size={18} />,
    title: "Mulai dari diagnosis",
    desc: "Asesmen pertama memetakan konsep yang sudah kuat dan yang masih perlu diperkuat.",
  },
  {
    icon: <IconCompass size={18} />,
    title: "Belajar lebih terarah",
    desc: "Dapatkan urutan materi dan langkah remediasi sesuai kesiapan Anda.",
  },
  {
    icon: <IconBook size={18} />,
    title: "Latihan sesuai kebutuhan",
    desc: "Kerjakan latihan pada konsep yang memang jadi penghambat, bukan mengulang semuanya.",
  },
  {
    icon: <IconChart size={18} />,
    title: "Progres transparan",
    desc: "Lihat pertumbuhan penguasaan materi setiap kali Anda menyelesaikan sesi.",
  },
];

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
  const [showPassword, setShowPassword] = useState(false);

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
    <PageContainer maxWidth="normal">
      <div className="grid gap-12 lg:grid-cols-[1.05fr_minmax(0,1fr)] lg:items-center lg:gap-16">
        {/* Penjelasan (layar lebar: kiri; layar kecil: bawah formulir) */}
        <aside className="order-2 lg:order-1">
          <MicroMeta>XOLEARN</MicroMeta>
          <DisplayHeading as="h2" className="mt-4 max-w-xl text-display-sm">
            Mulai dari yang belum terkuasai.
          </DisplayHeading>
          <p className={cx("mt-5 max-w-xl text-[14px] leading-relaxed", MUTED)}>
            Buat akun untuk mengerjakan asesmen diagnostik dan mendapatkan rekomendasi
            belajar yang disesuaikan dengan hasil Anda.
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
            Daftar Akun Xolearn
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

            <Field label="Password" htmlFor="reg-password" hint="Minimal 8 karakter.">
              <div className="relative">
                <Input
                  id="reg-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  autoComplete="new-password"
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

            <Field label="Konfirmasi Password" htmlFor="reg-confirm-password">
              <Input
                id="reg-confirm-password"
                name="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Ulangi password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isSubmitting}
                autoComplete="new-password"
                required
              />
            </Field>

            <PrimaryButton type="submit" size="lg" fullWidth loading={isSubmitting}>
              {isSubmitting ? "Mendaftarkan..." : "Daftar Akun"}
            </PrimaryButton>
          </form>

          <p className={cx("mt-6 flex flex-wrap items-center gap-2 text-[12px] leading-relaxed", MUTED)}>
            <span>Sudah memiliki akun?</span>
            <Link
              to="/login"
              className="inline-flex min-h-[44px] items-center font-bold text-accent underline underline-offset-2 hover:text-accent-hover"
            >
              Masuk di sini
            </Link>
          </p>
        </GlassPanel>
      </div>
    </PageContainer>
  );
}
