# XOLEARN — Editorial System v2 (panduan implementasi halaman)

Sistem visual ini mengikuti bahasa template editorial 21st.dev **#1116**:
tipografi **SUSE** (teks) + **SUSE Mono** (judul/display), **sudut pil untuk
elemen interaktif**, dan pemisah berupa **garis horizontal + ruang kosong** —
tanpa grid kotak 1px.

Referensi hidup: `src/pages/DashboardPage.jsx`.
Primitif bersama: `src/components/ui/index.jsx` dan barrel `src/components/index.js`.

## Prinsip
- **Garis horizontal saja**: pemisah antar-section/baris/sel memakai
  `border-t` (kelas `HAIRLINE`). JANGAN memakai `border-r` / `border-l` /
  `border-b` untuk membentuk grid kotak. Satu pengecualian: garis penutup
  `PageHeader` (`border-b`) yang memang menjadi batas atas halaman.
- **Panjang garis**: `PageHeader` dan `SectionHeader` memakai `RULE` dan
  sama-sama **full-bleed** ke tepi `PageContainer` (kelas
  `-mx-5 px-5 md:-mx-8 md:px-8 xl:-mx-10 xl:px-10`), jadi kedua garis yang
  berurutan di satu halaman selalu sama panjang + sama warna. Garis
  baris/item (`HAIRLINE`: `GridCell`, `MetricCell`, baris daftar) tetap
  masuk ke kolom konten. Jangan menambah padding horizontal lain di dalam
  `PageContainer` — pakai kelas negatif-margin di atas bila perlu full-bleed.
- **Sudut**: elemen interaktif (tombol, chip, badge, pil, avatar, progress)
  memakai `rounded-full`; kontainer/input memakai `rounded-2xl` / `rounded-3xl`.
  Section full-bleed tetap persegi (tanpa radius).
- **Dua font**: `--font-sans` = **SUSE** (teks/UI), `--font-display` =
  **SUSE Mono** untuk `h1`–`h4` (judul halaman & section). Angka memakai
  `tabular-nums`. `font-mono` HANYA untuk blok kode (`<pre>`/`<code>`) dan
  input jawaban kode.
- **Palet (brand kit SUSE Mono + SUSE)**: `brand` = *azure* untuk CTA & pil
  terisi (`bg-brand`, hover `bg-brand-hover`, teks putih); `accent` = *indigo
  pekat* untuk teks/tautan/tab aktif/nomor section (`text-accent`);
  `ink` = indigo gelap `#040063` untuk teks utama; `warning` = pastel hangat
  (`bg-warning-soft` + `text-warning-ink`) untuk "perlu perhatian";
  `positive` (`bg-positive-soft` + `text-positive-strong`) untuk berhasil;
  `error` (`bg-error-soft` + `text-error-ink`) khusus error/destruktif;
  `highlight` = wash sorotan (`bg-highlight`).
  Varian lembut: `bg-brand-soft`, `bg-positive-soft`, `bg-warning-soft`,
  `bg-error-soft` — semua bertumpu pada pastel, bukan warna pekat.
  Isi `brand` hanya untuk latar terisi + teks putih — untuk teks/tautan selalu
  `text-accent`. Jangan memakai warna pekat sebagai latar blok besar.
- **Target sentuh ≥ 44–48px** untuk semua kontrol interaktif (sengaja lebih
  besar dari chip 38px template agar nyaman di mobile).
- **Dual-mode**: tema gelap dikendalikan atribut `[data-theme="dark"]` pada
  `<html>`; `brand` (azure) tetap, `accent`/`brand-soft`/`warning-strong`/
  `error-strong`/`positive-strong`/`highlight` diterangkan otomatis di gelap,
  permukaan/teks/garis bertukar.
- **Mode gelap diredam**: kanvas/sel/garis gelap memakai hue indigo yang sama
  tetapi saturasi rendah (`canvas-dark #0c0c22`, `cell-dark #1b1c44`,
  `hairline-dark #3b3d75`, `rule-dark #5a5da6`, `brand-soft #202253`). Bidang
  luas tidak boleh memakai biru pekat (mis. `#040063` penuh) karena menyilaukan;
  garis tetap ≥1.8:1 dan teks tetap ≥4.5:1 di atas kanvas baru.

## Token kelas
| Peran | Terang | Gelap |
|---|---|---|
| Kanvas | `bg-canvas` | `dark:bg-canvas-dark` |
| Sel / permukaan lembut | `bg-cell` | `dark:bg-cell-dark` |
| Teks utama | `text-ink` | `dark:text-ink-dark` |
| Teks redup | `text-muted` | `dark:text-muted-dark` |
| Garis (baris/item) | `border-hairline` | `dark:border-hairline-dark` |
| Garis section & PageHeader | `border-rule` (full-bleed) | `dark:border-rule-dark` |
| Brand (isi) | `bg-brand` / `bg-brand-hover` | idem (azure) |
| Aksen (teks) | `text-accent` / `text-accent-hover` | override tema (lebih terang) |
| Band pesan inti / aksen lembut | `bg-brand-soft` | override tema (indigo gelap) |
| Peringatan | `bg-warning-soft` + `text-warning-ink` | override tema |
| Positif | `bg-positive-soft` + `text-positive-strong` | override tema |
| Sorotan | `text-highlight` / `bg-highlight` | override tema (lebih gelap) |
| Error | `bg-error-soft` + `text-error-ink` | override tema |

Metadata mikro (badge/tag/timestamp/label) memakai `<MicroMeta>`:
sans, uppercase, `tracking` lebar, `tabular-nums`.

## Primitif bersama (impor dari `../components`)
- `PageContainer` — bingkai halaman (`{ maxWidth: "narrow" | "normal" | "wide", className }`).
  Tak ada `border-l`; sudah menyediakan padding horizontal + max-width.
  Lebar responsif: `1200px` → `xl:1340px` → `2xl:1480px` (`narrow` tetap `720px`).
  Header `Navbar` dan baris filter dashboard memakai lebar yang sama agar sejajar.
- `PageHeader` — `{ badge, title, description, actions }`. Eyebrow + display
  heading + garis bawah `RULE` **full-bleed** (lihat "Panjang garis"); jarak
  judul→konten pertama sudah dijaga `SectionHeader` (`mt-14 md:mt-20`), jadi
  jangan menambah margin atas pada blok pertama setelah `PageHeader`.
- `GlassPanel` — nama dipertahankan. `variant="default"` = transparan tanpa
  border (untuk baris daftar → tambahkan `cx("border-t pt-5", HAIRLINE)`).
  `variant="subtle"`/`"elevated"` = `rounded-3xl bg-cell dark:bg-cell-dark`.
  `variant="brand"` = `rounded-3xl bg-brand-soft` (band pesan inti, mis. saran
  AI). `variant="highlight"` = `rounded-3xl bg-highlight`. `variant="interactive"`
  = pil + hover.
- `AiRecommendation` — band sorotan pesan inti aplikasi (saran belajar dari AI).
  `{ label, title, reason, meta, actionLabel, onAction, iconRight, className }`,
  memakai `GlassPanel variant="brand"` + `p-5 md:p-6`.
  **Aturan penempatan**: tampilkan di dalam bagian **Ringkasan** (blok pertama,
  sebelum metrik) atau di atas tab — jangan disembunyikan di dalam tab/langkah
  lanjutan. Bila satu halaman menampilkan saran yang sama di tab, sembunyikan
  band-nya saat tab itu aktif (`activeTab !== "insights" && ...`) agar tidak dobel.
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
- `Button` / `PrimaryButton` / `SecondaryButton` / `OutlineButton` / `GhostButton`
  — `{ variant, size, icon, iconRight, fullWidth, loading }` (pil, ≥44px).
- `ProgressBar` (standalone) — `{ value, max, label, showPercent, variant, size, className }`.
- `StatusBadge` — `{ status | label, variant, dot }` (pil).
- `SeverityBadge` — `{ tone: "high" | "medium" | "low" | "neutral" }` (pil).
- `Field`, `Input`, `Select`, `Textarea` — kontrol form berlabel (`INPUT_CLASS`, `rounded-2xl`).
- `Alert` — `{ tone: "success" | "error" | "info" | "neutral" }`.
- `EmptyState`, `LoadingState`, `ErrorState`, `Avatar`, `AccordionRow`,
  `ChecklistRow`, `DataRow`, `FilterChips`, `Reveal` (`{ delay }`, animasi CSS).
- `Skeleton` (`SkeletonBar`, `SkeletonLines`, `SkeletonTable`, `SkeletonSummary`,
  `SkeletonPage`) — kerangka muat pengganti spinner supaya tata letak tidak
  melompat. **Pakai skeleton saat memuat data**, bukan `LoadingState`, kecuali
  untuk blok kecil yang tidak punya bentuk tetap. Bungkus dengan `role="status"`
  + `aria-live="polite"` (sudah dilakukan komponen) dan sembunyikan isinya dari
  pembaca layar (`aria-hidden`) karena ini hiasan.
- `Dialog` — kerangka modal bertema (`<dialog>` native + `showModal()`). Pemakaian
  sehari-hari lewat hook `useDialog()`:
  - `await confirm({ title, description, confirmLabel, cancelLabel, tone })`
    → `true`/`false`. Ganti **semua** `window.confirm`.
  - `await prompt({ title, description, label, placeholder, minLength, ... })`
    → `string` atau `null` (dibatalkan). Ganti **semua** `window.prompt`.
  Karena berbasis Promise, handler pemanggil harus `async` dan `await` hasilnya
  sebelum melanjutkan aksi. **Jangan** pakai `window.alert`; pakai `useToast()`.
- `useToast()` — `{ show, success, error, info }` untuk umpan balik singkat
  (mis. "Laporan disiapkan untuk dicetak"). Jangan pakai toast untuk kesalahan
  yang butuh tindakan pengguna — pakai `Alert` di dekat penyebabnya.
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
  {/* Pesan inti: saran AI selalu di blok pertama bagian Ringkasan. */}
  <AiRecommendation
    title="…"
    reason="…"
    actionLabel="Lanjutkan Belajar"
    onAction={() => navigate("…")}
    iconRight={<IconArrowRight size={16} />}
  />
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

## Halaman publik (Beranda)
- `HomePage` melayani dua audiens: **pengunjung** (belum masuk) melihat paparan
  platform, dan **pengguna yang sudah masuk** melihat pintasan menu.
- Bagian pengunjung memakai `SectionHeader` bernomor: `1 Apa Itu Xolearn`
  (ikhtisar), `2 Alur Kerja` (4 langkah), `3 Kelebihan & Keterbatasan`
  (dua kolom, `IconCheck` positif vs `IconAlertTriangle` perhatian),
  `4 Mulai` (band `GlassPanel variant="brand"`).
- **Alur Kerja berfoto**: grid 2 kolom (`Grid cols={2}`) — tiap langkah satu
  `GridCell` (`border-t`/`HAIRLINE`) berisi **keterangan dulu, foto di
  bawahnya**. Keterangan dibungkus `Reveal` ber-`flex-1` di dalam sel
  `flex flex-col`, jadi foto selalu **rata bawah** sebaris dan jarak
  teks→foto tetap seimbang (tidak ada kolom teks kosong di samping foto).
  Di layar kecil otomatis jadi 1 kolom dengan urutan sama: nomor + judul +
  deskripsi, lalu foto.
- Fotonya di `public/alur/` dengan format **WebP** (jauh lebih ringan dari
  JPEG: 8 berkas total ~152 KB, dari aslinya ~800 KB). Tiap langkah punya
  dua versi: `*.webp` untuk mode terang dan `*-dark.webp` untuk mode gelap
  (`kerjakan-asesmen`, `analisis-bukti`, `peta-kesenjangan`,
  `latih-verifikasi`). Dirujuk sebagai `/alur/<nama>.webp`.
- **Foto ikut ganti tema.** Sumbernya dipilih lewat `useTheme()` di
  `StepPhoto` (bukan dua `<img>` dengan `dark:hidden`/`dark:block`), supaya
  hanya satu berkas yang terunduh per tema. Karena `TransitionContext`
  menjalankan perubahan tema setelah fase `cover` selesai, tukar foto ini
  terjadi di balik overlay pixel dan tidak terlihat.
- Foto **tidak di-crop**: pembungkusnya `rounded-3xl overflow-hidden`
  dengan `<img className="block h-auto w-full">`, ditambah atribut
  `width`/`height` agar tidak ada pergeseran tata letak saat dimuat.
  Pakai `loading="lazy"` + `decoding="async"` dan `alt` deskriptif.
  Kalau mengganti foto, jaga nama berkasnya agar tidak perlu ubah kode.
  Konversi dari JPEG memakai `cwebp -q 80 -m 6 -mt -metadata none
  asal.jpg -o tujuan.webp` (tanpa menambah dependency proyek).
- Blok baru dibungkus `Reveal` (`{ delay }`) agar muncul halus; karena
  `Reveal` tidak pernah menyembunyikan konten (`opacity` tetap 1), aman untuk
  tangkapan layar penuh.
- Jangan menambah angka/klaim yang tidak ada di aplikasi; tulis fitur apa
  adanya (diagnosis, peta kesenjangan, remediasi, progres, kelola bank soal).

## Halaman masuk & daftar (auth)
- Susunan dua kolom: `lg:grid-cols-[1.05fr_minmax(0,1fr)]` +
  `lg:items-center`. Sisi penjelasan (`<aside>`) memakai `order-2 lg:order-1`;
  panel formulir (`GlassPanel variant="elevated"`) memakai `order-1 lg:order-2`
  supaya di layar kecil formulir tampil lebih dulu.
- Kedua halaman memakai `PageContainer maxWidth="normal"` — jangan `narrow`,
  karena akan menjejalkan dua kolom.
- Isi `<aside>` = `MicroMeta` + `DisplayHeading` + satu paragraf + daftar poin
  bergaris `border-t` (`HAIRLINE`), mengikuti bahasa editorial biasa.
- **Tombol lihat password**: tombol teks "Lihat" / "Sembunyikan" di dalam
  pembungkus `relative` (`aria-pressed` + `aria-label`, target ≥44px); input
  password diberi `className="pr-28"` agar teks tidak menabrak tombol. Hanya
  `type` input yang berubah — validasi & alur data tidak disentuh.
- Tombol kirim memakai `size="lg" fullWidth` + `loading={isSubmitting}`;
  labelnya tetap berubah ("Sedang Memeriksa..." / "Mendaftarkan...").

## Aturan wajib
1. **JANGAN ubah logika data**: state, `useEffect`, pemanggilan API, handler,
   validasi, `aria-*`, teks/`copy`, dan aturan bisnis harus tetap identik.
   Hanya ubah markup/`className`/struktur visual.
2. **Tanpa kotak**: hapus `border-r`/`border-l`/`border-b` grid, `rounded-none`,
   `shadow`, blur, dan gradient. Ganti dengan `border-t` + ruang kosong.
   Pengecualian: garis penutup `PageHeader` (`border-b`, kelas `RULE`).
3. **Angka**: ganti `font-mono` (kecuali kode) dengan `tabular-nums`.
4. **Warna inline** (`var(--color-*)`, hex) → token kelas. `style={{...}}` hanya
   untuk nilai dinamis (mis. `width`).
5. Target sentuh **≥ 44×44px** untuk semua kontrol interaktif.
6. Mobile-first: `grid-cols-1` lalu `sm:`/`md:`/`lg:`.
7. Motion hanya CSS + `IntersectionObserver` (`Reveal` / kelas `.reveal`);
   tanpa dependency runtime baru (no framer-motion/GSAP).
   - **Teks masuk**: kelas `.enter-rise` (geser 9px + opacity `.45 → 1`, ±440ms)
     sudah dipasang di `PageHeader` (badge → judul → lede) dan `SectionHeader`
     (index/judul → meta). Stagger lewat `style={{ "--i": n }}` (kelipatan 55ms).
   - **Ganti tema (terang ⇄ gelap)**: transisi "pixel swap" lewat
     `usePixelTransition().run(fn, { targetTheme })` — overlay pixel menutup
     layar, `fn` dijalankan saat layar tertutup, lalu dibuka lagi. Palet pixel
     memakai warna **tema tujuan** (`targetTheme`), jadi panel penutupnya sudah
     sewarna dengan tema yang akan muncul: gelap → terang berarti panel putih,
     terang → gelap berarti panel gelap.
     **Perpindahan halaman sengaja TIDAK memakai animasi ini** — navigasi harus
     terasa instan. Jangan menambahkan `run(...)` di `RouterContext`, cukup
     reset scroll di `commitLocation`.
     Durasi `TransitionContext.jsx`: cover 900ms + jeda 40ms + reveal 900ms.
     Jeda itu yang menjamin layar sudah tertutup penuh sebelum tema berganti.
     Aturan penting: `run` **tidak pernah** membatalkan `fn`; jika animasi tidak
     memungkinkan (prefers-reduced-motion / transisi lain sedang jalan), `fn`
     langsung dijalankan — tema tetap berganti.
   - **Overlay pixel** memakai komponen "PixelSwap" (ReactBits, registry
     `@react-bits/PixelSwap-JS-CSS`) di `PixelSwap.jsx` + `PixelSwap.css`.
     Matematika grid, pattern, easing, dan animasinya (Web Animations API, satu
     elemen DOM per pixel) dipertahankan sama seperti aslinya.
     Angka yang dipakai: sisi pixel **88px**, skala awal **0,35**, `duration`
     (total) **900ms**, `pixelDuration` **450ms**.
     Selisih `duration - pixelDuration` = **spread**, dan spread itulah yang
     jadi jatah delay acak per pixel (`pattern: 'random'` → offset pseudo-acak).
     **Itu sebabnya kotak-kotak muncul berserakan seperti ReactBits.** Kalau
     spread = 0 (kedua durasi sama), semua pixel mulai bersamaan dan hasilnya
     jadi grid rapi yang seragam — hindari kecuali memang ingin efek itu.
     Grid dibatasi `MAX_PIXELS = 220` seperti aslinya, jadi di layar besar sisi
     pixel otomatis membesar (mis. 1920×1080 → 101px) dan jumlah elemen DOM
     tetap aman.
     Penyesuaian wajib dari versi asli: ReactBits PixelSwap adalah KOTAK
     (`aspectRatio` bawaan `16 / 10`) yang menukar dua isi dan meng-clone konten
     masuk ke tiap pixel; setelah pixel menutup penuh gridnya langsung dibuang,
     jadi tidak ada fase membuka. Di sini dipakai sebagai overlay layar penuh
     (`phase`: `cover` → `reveal` → `idle`), pixelnya berisi dua warna penutup
     (bukan clone konten, supaya aplikasi tidak ter-clone ratusan kali), dan fase
     `reveal` menjalankan animasi yang sama secara `direction: 'reverse'`.
     **Palet dua warna** (`TONE_MIX = 0.08`), diambil dari **tema tujuan**
     (`targetTheme`): warna dasar `--color-canvas` (tema terang) atau
     `--color-canvas-dark` (tema gelap), plus variannya yang digeser `TONE_MIX`
     ke arah `--color-ink` / `--color-ink-dark`. Tiap pixel dipilih acak 50/50,
     jadi penutupnya berbutir dan tidak rata satu warna — pola ini disalin dari
     transisi pixel sebelumnya. Karena dasarnya warna latar tema tujuan, layar
     yang tertutup penuh sudah sama dengan latar tema baru, sehingga saat tema
     berganti tidak ada kedipan. Naikkan `TONE_MIX` kalau ingin beda dua
     warnanya lebih kuat. Palet disusun sekali per transisi (disimpan di ref,
     termasuk `targetTheme`-nya) supaya butirannya tidak berkedip saat layout
     berubah. Kalau `targetTheme` tidak dikirim, yang dipakai adalah palet tema
     gelap sebagai cadangan.
     Pixel digambar `BLEED = 1.02` lebih besar dari selnya agar tidak ada celah
     rambut saat layar wajib tertutup penuh. Jangan menyalin komponennya
     mentah-mentah sebagai overlay.
   - **Perpindahan halaman**: seketika (tanpa overlay), lalu reset scroll ke atas
     di `commitLocation` dan `.enter-rise` bermain di halaman baru.
   - **Akordeon** (`AccordionRow`): tinggi dianimasikan dengan trik grid
     `0fr → 1fr`; isinya tetap ter-mount dan ditandai `aria-hidden` saat tertutup.
   - Semua animasi berhenti saat `prefers-reduced-motion: reduce`, dan tidak ada
     konten yang disembunyikan dengan `opacity: 0` (aman untuk tangkapan layar).
8. Setelah selesai: jalankan `cd frontend && npm run build` dan pastikan sukses.
