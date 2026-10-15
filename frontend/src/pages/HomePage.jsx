// ============================================================
// XOLEARN — Home Page (Editorial Grid System)
// frontend/src/pages/HomePage.jsx
// ------------------------------------------------------------
// Halaman publik: hero + penjelasan platform ("web apa ini"),
// alur kerja (keterangan di atas, foto di bawahnya), kelebihan
// & keterbatasan, lalu ajakan mulai.
// Untuk pengguna yang sudah masuk, halaman ini tetap menjadi
// pintu masuk cepat ke menu utama.
// Pemisah = garis horizontal + ruang kosong (tanpa grid kotak).
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Link, useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  SectionLede,
  GlassPanel,
  PrimaryButton,
  OutlineButton,
  Grid,
  GridCell,
  MicroMeta,
  Reveal,
  Alert,
  HAIRLINE,
  INK,
  MUTED,
  cx,
} from "../components";
import {
  IconBook,
  IconCompass,
  IconChart,
  IconTarget,
  IconUser,
  IconArrowRight,
  IconClipboard,
  IconDiagnose,
  IconCheck,
  IconAlertTriangle,
  IconInfo,
} from "../components/Icons";

/* Ikhtisar: apa itu Xolearn (tiga gagasan inti). */
const OVERVIEW = [
  {
    icon: <IconDiagnose size={20} />,
    title: "Diagnosis, bukan sekadar nilai",
    desc: "Asesmen memetakan konsep mana yang sudah kokoh dan mana yang masih rapuh — bukan hanya memberi satu angka akhir.",
  },
  {
    icon: <IconBook size={20} />,
    title: "Jawaban sebagai bukti",
    desc: "Setiap respons dibaca sebagai bukti penguasaan konsep, sehingga gambaran kemampuan menjadi lebih jujur dan terukur.",
  },
  {
    icon: <IconCompass size={20} />,
    title: "Remedi yang terarah",
    desc: "Kesenjangan ditelusuri sampai konsep prasyaratnya, lalu disusun menjadi langkah belajar yang konkret.",
  },
];

/* Alur kerja pengguna, dari asesmen sampai verifikasi ulang.
   Tiap langkah punya dua foto di `public/alur/` (format WebP):
   `light` untuk mode terang dan `dark` untuk mode gelap.
   `w`/`h` ditulis agar tidak ada pergeseran tata letak saat foto dimuat. */
const WORKFLOW = [
  {
    marker: "1",
    icon: <IconClipboard size={18} />,
    title: "Kerjakan asesmen",
    desc: "Pilih asesmen diagnostik dan jawab soal sesuai kemampuan sebenarnya.",
    alt: "Tampilan memilih dan mengerjakan asesmen diagnostik",
    light: { src: "/alur/kerjakan-asesmen.webp", w: 1039, h: 616 },
    dark: { src: "/alur/kerjakan-asesmen-dark.webp", w: 895, h: 592 },
  },
  {
    marker: "2",
    icon: <IconDiagnose size={18} />,
    title: "Analisis bukti",
    desc: "Sistem membaca pola jawaban untuk menilai penguasaan tiap konsep.",
    alt: "Tampilan analisis pola jawaban dan penguasaan konsep",
    light: { src: "/alur/analisis-bukti.webp", w: 1004, h: 625 },
    dark: { src: "/alur/analisis-bukti-dark.webp", w: 938, h: 594 },
  },
  {
    marker: "3",
    icon: <IconTarget size={18} />,
    title: "Terima peta kesenjangan",
    desc: "Lihat konsep yang perlu diperkuat sampai ke prasyaratnya, lengkap dengan saran langkah.",
    alt: "Tampilan peta kesenjangan konsep dan konsep prasyarat",
    light: { src: "/alur/peta-kesenjangan.webp", w: 800, h: 529 },
    dark: { src: "/alur/peta-kesenjangan-dark.webp", w: 896, h: 521 },
  },
  {
    marker: "4",
    icon: <IconChart size={18} />,
    title: "Latih & verifikasi",
    desc: "Kerjakan latihan terarah, verifikasi ulang, lalu pantau pertumbuhannya.",
    alt: "Tampilan latihan terarah dan pemantauan pertumbuhan",
    light: { src: "/alur/latih-verifikasi.webp", w: 929, h: 607 },
    dark: { src: "/alur/latih-verifikasi-dark.webp", w: 892, h: 591 },
  },
];

const STRENGTHS = [
  "Menemukan akar masalah sampai konsep prasyarat, bukan berhenti di nilai total.",
  "Rekomendasi belajar menyesuaikan kesenjangan tiap pengguna.",
  "Progres dinilai dari bukti jawaban nyata dan riwayat sesi, jadi lebih objektif.",
  "Peta pembelajaran menunjukkan urutan materi sesuai kesiapan kognitif.",
  "Pengajar dan pengelola punya ruang untuk mengatur bank soal dan memantau siswa.",
];

const LIMITATIONS = [
  "Kualitas diagnosis bergantung pada mutu soal yang disusun pengajar.",
  "Bukan pengganti penilaian resmi atau ujian akhir.",
  "Saran belajar bersifat rekomendasi — keputusan akhir tetap pada pengajar.",
  "Materi yang bisa didiagnosis sebatas yang tersedia di bank soal.",
  "Memerlukan koneksi internet; belum tersedia mode luring.",
];

/* Daftar poin dengan ikon + garis pemisah antar-baris. */
function PointList({ items, icon, tone }) {
  return (
    <ul className="mt-2">
      {items.map((text, i) => (
        <li
          key={text}
          className={cx("flex items-start gap-3 py-4", i > 0 && cx("border-t", HAIRLINE))}
        >
          <span className={cx("mt-0.5 shrink-0", tone)}>{icon}</span>
          <span className={cx("min-w-0 text-[13px] leading-relaxed", INK)}>{text}</span>
        </li>
      ))}
    </ul>
  );
}

/* Satu foto langkah. Sumbernya dipilih sesuai tema (`useTheme`), jadi
   hanya satu berkas yang diunduh. Pergantian tema terjadi saat layar
   sudah tertutup overlay pixel, sehingga tukar foto ini tidak terlihat. */
function StepPhoto({ step, isDark }) {
  const photo = isDark ? step.dark : step.light;
  return (
    <img
      src={photo.src}
      width={photo.w}
      height={photo.h}
      alt={step.alt}
      loading="lazy"
      decoding="async"
      className="block h-auto w-full"
    />
  );
}

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const { navigate } = useRouter();
  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

  const quickAccessClass = cx(
    "flex min-h-[72px] items-center gap-4 rounded-3xl bg-cell p-5 transition-colors",
    "dark:bg-cell-dark hover:bg-brand-soft"
  );

  return (
    <PageContainer maxWidth="normal">
      {/* Hero */}
      <PageHeader
        badge="Evidence-Based Learning Platform"
        title="Navigasi Presisi untuk Penguasaan Konsep Belajar"
        description="Xolearn adalah platform asesmen diagnostik berbasis bukti. Setiap jawaban dianalisis untuk memetakan kesenjangan pemahaman, menemukan konsep prasyarat yang jadi akar masalah, lalu menyusun langkah remediasi yang tepat sasaran."
        actions={
          isAuthenticated ? (
            isAdmin ? (
              <PrimaryButton
                size="lg"
                onClick={() => navigate("/admin/assessments")}
                iconRight={<IconArrowRight size={16} />}
              >
                Kelola Konten &amp; Bank Soal
              </PrimaryButton>
            ) : (
              <>
                <span className={cx("w-full text-[12px] leading-relaxed", MUTED)}>
                  Selamat datang kembali, <strong className={INK}>{user?.name}</strong>
                </span>
                <PrimaryButton
                  size="lg"
                  onClick={() => navigate("/assessments")}
                  iconRight={<IconArrowRight size={16} />}
                >
                  Mulai Asesmen
                </PrimaryButton>
                <OutlineButton
                  size="lg"
                  onClick={() => navigate("/learning-path")}
                  icon={<IconCompass size={16} />}
                >
                  Peta Pembelajaran
                </OutlineButton>
                <OutlineButton
                  size="lg"
                  onClick={() => navigate("/progress")}
                  icon={<IconChart size={16} />}
                >
                  Progres Belajar
                </OutlineButton>
              </>
            )
          ) : (
            <>
              <PrimaryButton
                size="lg"
                onClick={() => navigate("/register")}
                iconRight={<IconArrowRight size={16} />}
              >
                Mulai Sekarang
              </PrimaryButton>
              <OutlineButton size="lg" onClick={() => navigate("/login")}>
                Masuk ke Akun
              </OutlineButton>
            </>
          )
        }
      />

      {/* ------------------------------------------------------
          Paparan publik (pengunjung)
          ------------------------------------------------------ */}
      {!isAuthenticated && (
        <>
          {/* 1 — Apa itu Xolearn */}
          <SectionHeader index="1" title="Apa Itu Xolearn" meta="Ikhtisar" />
          <Reveal>
            <SectionLede>
              Xolearn membantu pengajar dan siswa memahami <em>bukan hanya seberapa
              tinggi nilainya</em>, tetapi konsep mana yang belum terkuasai dan mengapa.
              Dari situ, belajar bisa diarahkan tepat pada titik yang paling menghambat.
            </SectionLede>
            <Grid cols={3} className="mt-2">
              {OVERVIEW.map((item, i) => (
                <GridCell key={item.title}>
                  <Reveal delay={i}>
                    <span className={cx("block", INK)}>{item.icon}</span>
                    <h3 className={cx("mt-3 text-[15px] font-bold leading-snug", INK)}>
                      {item.title}
                    </h3>
                    <p className={cx("mt-2 text-[13px] leading-relaxed", MUTED)}>
                      {item.desc}
                    </p>
                  </Reveal>
                </GridCell>
              ))}
            </Grid>
          </Reveal>

          {/* 2 — Alur kerja: keterangan dulu, foto di bawahnya */}
          <SectionHeader index="2" title="Alur Kerja" meta="4 Langkah" />
          <Reveal>
            <SectionLede>
              Satu putaran belajar berjalan berurutan. Setelah verifikasi, siklusnya
              bisa berulang untuk konsep berikutnya sampai pemahaman benar-benar mantap.
            </SectionLede>
          </Reveal>

          <Grid cols={2} className="mt-2">
            {WORKFLOW.map((step) => (
              <GridCell key={step.marker} className="flex flex-col">
                {/* Keterangan langkah — tumbuh, jadi foto selalu rata bawah */}
                <Reveal className="flex flex-1 flex-col">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-bold tabular-nums text-accent">
                      {step.marker}
                    </span>
                    <span className={cx("shrink-0", MUTED)}>{step.icon}</span>
                  </div>
                  <h3 className={cx("mt-4 text-[18px] font-bold leading-snug md:text-[20px]", INK)}>
                    {step.title}
                  </h3>
                  <p className={cx("mt-2 max-w-xl text-[14px] leading-relaxed", MUTED)}>
                    {step.desc}
                  </p>
                </Reveal>

                {/* Foto langkah — rasio asli dipertahankan (tanpa crop) */}
                <Reveal delay={1} className="mt-6">
                  <div className="overflow-hidden rounded-3xl bg-cell dark:bg-cell-dark">
                    <StepPhoto step={step} isDark={isDark} />
                  </div>
                </Reveal>
              </GridCell>
            ))}
          </Grid>

          <Reveal>
            <Alert tone="info" className="mt-8">
              <span className="shrink-0 text-accent">
                <IconInfo size={18} />
              </span>
              <span>
                Siklus ini berulang: hasil verifikasi membuka rekomendasi baru, sehingga
                setiap sesi menutup satu celah pemahaman sebelum lanjut ke materi berikutnya.
              </span>
            </Alert>
          </Reveal>

          {/* 3 — Kelebihan & keterbatasan */}
          <SectionHeader index="3" title="Kelebihan & Keterbatasan" meta="Penilaian Objektif" />
          <Reveal>
            <SectionLede>
              Xolearn dipakai sebagai alat bantu diagnostik, bukan penentu tunggal.
              Berikut hal yang jadi kekuatannya sekaligus batas yang perlu diketahui.
            </SectionLede>
            <Grid cols={2} className="mt-2">
              <GridCell>
                <h3 className={cx("flex items-center gap-2 text-[15px] font-bold", INK)}>
                  <span className="text-positive-strong">
                    <IconCheck size={18} />
                  </span>
                  Kelebihan
                </h3>
                <PointList
                  items={STRENGTHS}
                  icon={<IconCheck size={16} />}
                  tone="text-positive-strong"
                />
              </GridCell>

              <GridCell>
                <h3 className={cx("flex items-center gap-2 text-[15px] font-bold", INK)}>
                  <span className="text-warning-strong">
                    <IconAlertTriangle size={18} />
                  </span>
                  Keterbatasan
                </h3>
                <PointList
                  items={LIMITATIONS}
                  icon={<IconAlertTriangle size={16} />}
                  tone="text-warning-strong"
                />
              </GridCell>
            </Grid>
          </Reveal>

          {/* 4 — Mulai */}
          <SectionHeader index="4" title="Mulai" meta="Gratis untuk Siswa" />
          <Reveal>
            <GlassPanel variant="brand" className="p-6 md:p-10">
              <MicroMeta>Langkah pertama</MicroMeta>
              <h3 className={cx("mt-3 max-w-2xl text-[24px] font-extrabold leading-tight tracking-tight md:text-[30px]", INK)}>
                Buat akun, kerjakan satu asesmen, dan lihat peta kesenjangan Anda.
              </h3>
              <p className={cx("mt-4 max-w-2xl text-[14px] leading-relaxed", INK)}>
                Tidak perlu menyiapkan apa pun. Setelah masuk, Anda langsung diarahkan
                ke asesmen pertama dan mendapatkan rekomendasi belajar dari hasilnya.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <PrimaryButton
                  size="lg"
                  onClick={() => navigate("/register")}
                  iconRight={<IconArrowRight size={16} />}
                >
                  Buat Akun
                </PrimaryButton>
                <OutlineButton size="lg" onClick={() => navigate("/login")}>
                  Masuk ke Akun
                </OutlineButton>
              </div>
            </GlassPanel>
          </Reveal>
        </>
      )}

      {/* ------------------------------------------------------
          Tampilan pengguna yang sudah masuk
          ------------------------------------------------------ */}
      {isAuthenticated && !isAdmin && (
        <>
          <SectionHeader index="1" title="Akses Cepat" meta="Pintasan" />
          <Grid cols={2} className="mt-2">
            <Link to="/assessments" className={quickAccessClass}>
              <span className={cx("shrink-0", INK)}>
                <IconBook size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className={cx("block text-sm font-bold", INK)}>
                  Asesmen Diagnostik
                </strong>
                <span className={cx("mt-0.5 block text-[12px] leading-relaxed", MUTED)}>
                  Kerjakan soal dan kumpulkan bukti penguasaan konsep
                </span>
              </span>
              <IconArrowRight size={16} className={cx("shrink-0", MUTED)} />
            </Link>

            <Link to="/learning-path" className={quickAccessClass}>
              <span className={cx("shrink-0", INK)}>
                <IconCompass size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className={cx("block text-sm font-bold", INK)}>
                  Peta Pembelajaran
                </strong>
                <span className={cx("mt-0.5 block text-[12px] leading-relaxed", MUTED)}>
                  Lihat status kompetensi kurikulum dan prasyarat materi
                </span>
              </span>
              <IconArrowRight size={16} className={cx("shrink-0", MUTED)} />
            </Link>

            <Link to="/progress" className={quickAccessClass}>
              <span className={cx("shrink-0", INK)}>
                <IconChart size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className={cx("block text-sm font-bold", INK)}>
                  Progres &amp; Riwayat
                </strong>
                <span className={cx("mt-0.5 block text-[12px] leading-relaxed", MUTED)}>
                  Telusuri pertumbuhan penguasaan materi dan histori sesi
                </span>
              </span>
              <IconArrowRight size={16} className={cx("shrink-0", MUTED)} />
            </Link>

            <Link to="/profile" className={quickAccessClass}>
              <span className={cx("shrink-0", INK)}>
                <IconUser size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className={cx("block text-sm font-bold", INK)}>Profil Saya</strong>
                <span className={cx("mt-0.5 block text-[12px] leading-relaxed", MUTED)}>
                  Kelola identitas akun dan preferensi pembelajaran
                </span>
              </span>
              <IconArrowRight size={16} className={cx("shrink-0", MUTED)} />
            </Link>
          </Grid>
        </>
      )}
    </PageContainer>
  );
}
