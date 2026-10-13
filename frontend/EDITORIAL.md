# XORA — Editorial System v2 (panduan implementasi halaman)

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
- **Aksen `#1E3FFD`** (`bg-brand` / `text-brand`, hover `bg-brand-hover`) untuk
  CTA, tautan, tab aktif, indikator tingkat keparahan, dan penanda error.
  Varian lembut: `bg-brand-soft text-brand`. Tidak untuk dekorasi.
- **Target sentuh ≥ 44–48px** untuk semua kontrol interaktif (sengaja lebih
  besar dari chip 38px template agar nyaman di mobile).
- **Dual-mode**: tema gelap dikendalikan atribut `[data-theme="dark"]` pada
  `<html>`; aksen brand tidak berubah, hanya token permukaan/teks yang
  bertukar.

## Token kelas
| Peran | Terang | Gelap |
|---|---|---|
| Kanvas | `bg-canvas` | `dark:bg-canvas-dark` |
| Sel / permukaan lembut | `bg-cell` | `dark:bg-cell-dark` |
| Teks utama | `text-ink` | `dark:text-ink-dark` |
| Teks redup | `text-muted` | `dark:text-muted-dark` |
| Garis | `border-hairline` | `dark:border-hairline-dark` |
| Aksen | `bg-brand` / `text-brand` | idem |
| Aksen lembut | `bg-brand-soft` | override tema |

Metadata mikro (badge/tag/timestamp/label) memakai `<MicroMeta>`:
sans, uppercase, `tracking` lebar, `tabular-nums`.

## Primitif bersama (impor dari `../components`)
- `PageContainer` — bingkai halaman (`{ maxWidth: "narrow" | "normal" | "wide", className }`).
  Tak ada `border-l`; sudah menyediakan padding horizontal + max-width.
- `PageHeader` — `{ badge, title, description, actions }`. Eyebrow + display
  heading + garis bawah.
- `SectionHeader` — `{ index, title, meta, id, className }`. Sudah membawa
  `mt-12 border-t pt-6 md:mt-16 md:pt-7`. Jangan tambah margin atas lagi.
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
  `CHIP_CLASS`, `CHIP_ACTIVE`, `CHIP_INACTIVE`, `cx`, `HAIRLINE`, `SURFACE`,
  `CELL`, `INK`, `MUTED`.

## Kerangka halaman standar
```jsx
<PageContainer>
  <PageHeader badge="ADMIN" title="Kelola Asesmen" description="..." actions={<PrimaryButton .../>} />
  <Alert tone="error">...</Alert>
  <LoadingState /> | <ErrorState onRetry={...} /> | <EmptyState ... />

  <SectionHeader index="01" title="Ringkasan" meta="…" />
  <Grid cols={3} className="mt-8">
    <StatCard label="…" value="…" />
    <StatCard label="…" value="…" />
    <StatCard label="…" value="…" />
  </Grid>

  <SectionHeader index="02" title="Daftar" />
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
