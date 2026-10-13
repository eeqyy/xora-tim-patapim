# XOLEARN — Editorial System v2 (panduan implementasi halaman)

Sistem visual ini mengikuti bahasa template editorial 21st.dev **#1116**:
tipografi **Manrope**, **sudut pil untuk elemen interaktif**, dan pemisah
berupa **garis horizontal (hairline) + ruang kosong** — tanpa grid kotak 1px.

Referensi hidup: `src/pages/DashboardPage.jsx`.
Primitif bersama: `src/components/ui/index.jsx` dan barrel `src/components/index.js`.

## Prinsip
- **Garis horizontal saja**: pemisah antar-section/baris/sel memakai
  `border-t` (kelas `HAIRLINE`). JANGAN memakai `border-r` / `border-l` /
  `border-b` untuk membentuk grid kotak.
- **Sudut**: elemen interaktif (tombol, chip, badge, pil, avatar, progress)
  memakai `rounded-full`; kontainer/input memakai `rounded-2xl` / `rounded-3xl`.
  Section full-bleed tetap persegi (tanpa radius).
- **Satu font**: Manrope (default via `--font-sans`). Angka memakai
  `tabular-nums` (sans). `font-mono` HANYA untuk blok kode (`<pre>`/`<code>`)
  dan input jawaban kode.
- **Palet (two-tone hangat)**: `brand` = *azure vivid* untuk CTA & pil terisi
  (`bg-brand`, hover `bg-brand-hover`); `accent` = *azure pekat* untuk
  teks/tautan/tab aktif/nomor section (`text-accent`, hover `text-accent-hover`);
  `warning` = *sandy_brown* + `warning-ink` untuk status "perlu perhatian";
  `positive` = *olive hangat* (`bg-positive` + teks putih) untuk status
  positif/berhasil;
  `error` = *brick_red* (`bg-error`, `text-error-strong`) khusus error/destruktif;
  `highlight` = *vanilla_custard* (wash sorotan, mis. `GlassPanel variant="highlight"`).
  Varian lembut: `bg-brand-soft`, `bg-positive-soft`; permukaan netral memakai
  krem hangat. Isi `brand` hanya untuk latar terisi + teks putih — untuk
  teks/tautan selalu `text-accent`.
- **Target sentuh ≥ 44–48px** untuk semua kontrol interaktif (sengaja lebih
  besar dari chip 38px template agar nyaman di mobile).
- **Dual-mode**: tema gelap dikendalikan atribut `[data-theme="dark"]` pada
  `<html>`; `brand` (azure) tetap, `accent`/`brand-soft`/`warning-strong`/
  `error-strong`/`positive-strong`/`highlight` diterangkan otomatis di gelap,
  permukaan/teks/garis bertukar.

## Token kelas
| Peran | Terang | Gelap |
|---|---|---|
| Kanvas | `bg-canvas` | `dark:bg-canvas-dark` |
| Sel / permukaan lembut | `bg-cell` | `dark:bg-cell-dark` |
| Teks utama | `text-ink` | `dark:text-ink-dark` |
| Teks redup | `text-muted` | `dark:text-muted-dark` |
| Garis (baris/item) | `border-hairline` | `dark:border-hairline-dark` |
| Garis section | `border-rule` | `dark:border-rule-dark` |
| Brand (isi) | `bg-brand` / `bg-brand-hover` | idem (azure) |
| Aksen (teks) | `text-accent` / `text-accent-hover` | override tema (lebih terang) |
| Aksen lembut | `bg-brand-soft` | override tema |
| Peringatan | `bg-warning text-warning-ink` | idem |
| Positif | `bg-positive` + teks putih | idem |
| Sorotan | `text-highlight` / `bg-highlight` | override tema (lebih gelap) |
| Error | `bg-error` / `text-error-strong` | override tema (lebih terang) |

Metadata mikro (badge/tag/timestamp/label) memakai `<MicroMeta>`:
sans, uppercase, `tracking` lebar, `tabular-nums`.

## Primitif bersama (impor dari `../components`)
- `PageContainer` — bingkai halaman (`{ maxWidth: "narrow" | "normal" | "wide", className }`).
  Tak ada `border-l`; sudah menyediakan padding horizontal + max-width.
  Lebar responsif: `1200px` → `xl:1340px` → `2xl:1480px` (`narrow` tetap `720px`).
  Header `Navbar` dan baris filter dashboard memakai lebar yang sama agar sejajar.
- `PageHeader` — `{ badge, title, description, actions }`. Eyebrow + display
  heading + garis bawah.
- `SectionHeader` — `{ index, title, meta, id, sticky, className }`. Memakai garis
  section `RULE` (lebih tegas dari `HAIRLINE` baris/item). Jangan tambah margin
  atas lagi. `sticky` (default `true`) membuat judul section menempel di bawah
  Navbar sebagai bar ringkas (padding lebih kecil + satu baris) di semua halaman;
  offset memakai CSS var `--header-h` yang di-set `Navbar` (tinggi header nyata,
  termasuk ContextPicker), fallback `68px`. Set `sticky={false}` bila tidak
  diinginkan.
- `Grid` — `{ cols }` (1, 2, 3, 4, 6), `grid gap-x-8 gap-y-10`. Tambahkan
  `className="mt-8"` bila langsung setelah `SectionHeader`.
- `GridCell` — `min-w-0 border-t pt-5` (sudah bergaris atas). JANGAN tambah
  `border-r/-b/-l`. Hindari latar kondisional; pakai `opacity` bila perlu.
- `MetricCell` — `{ label, value, hint }`.
- `StatCard` — `{ label, value, secondary, variant }`.
- `GlassPanel` — nama dipertahankan. `variant="default"` = transparan tanpa
  border (untuk baris daftar → tambahkan `cx("border-t pt-5", HAIRLINE)`).
  `variant="subtle"`/`"elevated"` = `rounded-3xl bg-cell dark:bg-cell-dark`.
  `variant="highlight"` = `rounded-3xl bg-brand-soft`. `variant="interactive"`
  = pil + hover.
- `Button` / `PrimaryButton` / `SecondaryButton` / `OutlineButton` / `GhostButton`
  — `{ variant, size, icon, iconRight, fullWidth, loading }` (pil, ≥44px).
- `ProgressBar` (standalone) — `{ value, max, label, showPercent, variant, size, className }`.
- `StatusBadge` — `{ status | label, variant, dot }` (pil).
- `SeverityBadge` — `{ tone: "high" | "medium" | "low" | "neutral" }` (pil).
- `Field`, `Input`, `Select`, `Textarea` — kontrol form berlabel (`INPUT_CLASS`, `rounded-2xl`).
- `Alert` — `{ tone: "success" | "error" | "info" | "neutral" }`.
- `EmptyState`, `LoadingState`, `ErrorState`, `Avatar`, `AccordionRow`,
  `ChecklistRow`, `DataRow`, `FilterChips`, `Reveal` (`{ delay }`, animasi CSS).
- Konstanta: `INPUT_CLASS`, `TH_CLASS`, `TD_CLASS`, `TABLE_CLASS`,
  `CHIP_CLASS`, `CHIP_ACTIVE`, `CHIP_INACTIVE`, `cx`, `HAIRLINE`, `RULE`,
  `SURFACE`,
  `CELL`, `INK`, `MUTED`.

## Ikon
- **Sumber**: set **Core Line** (Streamline, free tier) — bentuk asli viewBox
  `0 0 14 14`, stroke `currentColor`, ujung rounded. Semua ikon diekspor dari
  `src/components/Icons.jsx`; **jangan** menulis `<svg>` inline di halaman.
  Atribusi: Streamline (streamlinehq.com), lisensi free tier.
- **Ukuran**: wrapper menambah padding (`viewBox="-0.8 -0.8 15.6 15.6"`) dan
  `strokeWidth="1.3"` supaya glyph terisi ~92% kotak — menyamai ukuran & bobot
  garis ikon lama, sehingga tidak menabrak teks di sebelahnya. `size` tetap
  mengatur sisi kotak (layout), bukan besar glyph.
- **Warna**: ikon memakai `currentColor`, jadi cukup set kelas teks pada
  induknya (`text-accent`, `text-muted`, `text-positive-strong`, dll.) —
  otomatis mengikuti tema terang/gelap.
- **API**: `<IconNama size={18} />` (default `18`); `className`/`style`
  diteruskan seperti sebelumnya.
- **Interaksi**: default ikon **tidak bergerak** — `index.css` (blok "Interaksi
  ikon") hanya menyediakan transisi halus. Gerak diberikan lewat kelas yang
  menyatu di komponen, hanya pada affordance bermakna arah/aksi:
  `icon-go-right` / `icon-go-left` (panah & chevron, geser 2px),
  `icon-rotate-180` (refresh, glyph bulat), `icon-rotate-90` (matahari / toggle
  tema), `icon-zoom` (bulan, cog, pencarian — membesar 1.08). Ikon nav aktif
  (`aria-current="page"`) membesar 1.05. Semua dimatikan saat
  `prefers-reduced-motion`.
- **Padanan makna**: `IconClipboard` = Asesmen, `IconSettings` = Sistem,
  `IconBandage` = Remediasi, `IconDiagnose` = event diagnostik.

## Kerangka halaman standar
```jsx
<PageContainer>
  <PageHeader badge="ADMIN" title="Kelola Asesmen" description="..." actions={<PrimaryButton .../>} />
  <Alert tone="error">...</Alert>
  <LoadingState /> | <ErrorState onRetry={...} /> | <EmptyState ... />

  <SectionHeader index="1" title="Ringkasan" meta="…" />
  <Grid cols={3} className="mt-8">
    <StatCard label="…" value="…" />
    <StatCard label="…" value="…" />
    <StatCard label="…" value="…" />
  </Grid>

  <SectionHeader index="2" title="Daftar" />
  <GlassPanel className={cx("flex items-center justify-between gap-4 border-t pt-5", HAIRLINE)}>
    ...
  </GlassPanel>
</PageContainer>
```

## Chip / filter (pil)
```jsx
import { CHIP_CLASS, CHIP_ACTIVE, CHIP_INACTIVE, cx } from "../components";
<button className={cx(CHIP_CLASS, active ? CHIP_ACTIVE : CHIP_INACTIVE)}>…</button>
```

## Tabel
```jsx
<div className={cx("overflow-x-auto rounded-2xl border", HAIRLINE)}>
  <table className={TABLE_CLASS}>
    <thead>
      <tr><th scope="col" className={TH_CLASS}>Judul</th></tr>
    </thead>
    <tbody>
      <tr><td className={TD_CLASS}>...</td></tr>
    </tbody>
  </table>
</div>
```

## Grid form
```jsx
<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
  <Field label="Email" htmlFor="x" error={errors.x}>
    <Input id="x" ... />
  </Field>
</div>
```

## Aturan wajib
1. **JANGAN ubah logika data**: state, `useEffect`, pemanggilan API, handler,
   validasi, `aria-*`, teks/`copy`, dan aturan bisnis harus tetap identik.
   Hanya ubah markup/`className`/struktur visual.
2. **Tanpa kotak**: hapus `border-r`/`border-l`/`border-b` grid, `rounded-none`,
   `shadow`, blur, dan gradient. Ganti dengan `border-t` + ruang kosong.
3. **Angka**: ganti `font-mono` (kecuali kode) dengan `tabular-nums`.
4. **Warna inline** (`var(--color-*)`, hex) → token kelas. `style={{...}}` hanya
   untuk nilai dinamis (mis. `width`).
5. Target sentuh **≥ 44×44px** untuk semua kontrol interaktif.
6. Mobile-first: `grid-cols-1` lalu `sm:`/`md:`/`lg:`.
7. Motion hanya CSS + `IntersectionObserver` (`Reveal` / kelas `.reveal`);
   tanpa dependency runtime baru (no framer-motion/GSAP).
8. Setelah selesai: jalankan `cd frontend && npm run build` dan pastikan sukses.
