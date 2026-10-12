// ============================================================
// XORA — HTML Question Bank Data (Code-Based & Conceptual)
// database/seeds/questions_data/html_questions.js
// Topics: HTML Basics, Semantic HTML, Forms & Validation
// ============================================================

module.exports = [
  // =========================================================================
  // TOPIC: HTML Basics (Document Structure, HTML Attribute, HTML Element)
  // Target: >= 10 new questions with code (balancing Medium & Hard)
  // =========================================================================
  {
    topic_name: 'HTML Basics',
    concept_name: 'Document Structure',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan struktur dokumen HTML5 berikut:

\`\`\`html
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Portal Pembelajaran</title>
</head>
<body>
  <h1>Selamat Datang</h1>
</body>
</html>
\`\`\`

Apa fungsi utama deklarasi \`<!DOCTYPE html>\` di baris pertama?`,
    options: [
      'A. Memberitahu peramban untuk merender dokumen dalam mode standar HTML5',
      'B. Menghubungkan berkas HTML dengan peladen web secara asinkron',
      'C. Mengunduh pustaka JavaScript eksternal yang dibutuhkan',
      'D. Menentukan bahasa pemrograman skrip yang aktif di browser'
    ],
    correct: 'A',
    points: 10,
    explanation: '<!DOCTYPE html> adalah deklarasi tipe dokumen yang menginstruksikan web browser untuk merender halaman dalam mode standar (standards mode) sesuai spesifikasi HTML5.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'Document Structure',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Sebuah dokumen HTML memiliki tag \`<head>\` dengan konfigurasi berikut:

\`\`\`html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
  <script src="app.js" defer></script>
</head>
\`\`\`

Apa efek dari atribut \`defer\` pada tag \`<script>\` di atas?`,
    options: [
      'A. Skrip diunduh secara asinkron dan baru dieksekusi setelah parsing dokumen HTML selesai',
      'B. Skrip langsung memblokir proses parsing HTML sampai berkas selesai dieksekusi',
      'C. Skrip hanya akan dijalankan jika dokumen dibuka di perangkat seluler',
      'D. Skrip dieksekusi berulang kali setiap kali pengguna melakukan scroll'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Atribut defer membuat browser mengunduh skrip di latar belakang secara paralel tanpa menghentikan parsing HTML, lalu menjalankannya secara berurutan tepat setelah parsing DOM selesai.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'HTML Element',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan cuplikan markup dokumen berikut:

\`\`\`html
<div>
  <span>Teks satu</span>
  <p>Paragraf teks</p>
  <span>Teks dua</span>
</div>
\`\`\`

Manakah pernyataan yang benar mengenai perilaku default elemen \`<span>\` dan \`<p>\`?`,
    options: [
      'A. <span> adalah elemen inline, sedangkan <p> adalah elemen block-level',
      'B. Keduanya merupakan elemen inline yang tidak membuat baris baru',
      'C. <span> adalah elemen block-level, sedangkan <p> adalah elemen inline',
      'D. Keduanya merupakan elemen void yang tidak memerlukan penutup tag'
    ],
    correct: 'A',
    points: 10,
    explanation: '<span> adalah elemen inline yang hanya memakan lebar sesuai kontennya, sedangkan <p> adalah elemen block-level yang otomatis menempati satu baris penuh dan membuat baris baru.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'HTML Attribute',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan tautan berikut:

\`\`\`html
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  Kunjungi Situs
</a>
\`\`\`

Mengapa penambahan \`rel="noopener noreferrer"\` sangat disarankan saat menggunakan \`target="_blank"\`?`,
    options: [
      'A. Mencegah tab baru mengakses objek window.opener demi keamanan dan performa',
      'B. Mempercepat waktu unduh gambar pada halaman tujuan secara signifikan',
      'C. Memastikan tautan dapat dibuka secara offline tanpa koneksi internet',
      'D. Menghilangkan garis bawah dekoratif biru pada elemen tautan tersebut'
    ],
    correct: 'A',
    points: 10,
    explanation: 'rel="noopener" mencegah halaman eksternal yang dibuka pada tab baru mengontrol tab asal melalui window.opener (reverse tabnabbing), sedangkan noreferrer mencegah pengiriman header Referer.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'HTML Attribute',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan elemen gambar berikut yang menggunakan atribut modern:

\`\`\`html
<img src="banner.jpg" alt="Pemandangan gunung" loading="lazy" width="800" height="400">
\`\`\`

Apa manfaat dari kombinasi atribut \`loading="lazy"\` serta atribut eksplisit \`width\` dan \`height\`?`,
    options: [
      'A. Menunda pemuatan gambar hingga mendekati viewport dan mencegah Cumulative Layout Shift (CLS)',
      'B. Mengubah format gambar menjadi format WebP beresolusi tinggi di sisi klien',
      'C. Memaksa browser mengunduh gambar sebelum seluruh kode CSS dan JS di-parse',
      'D. Menyembunyikan gambar sepenuhnya jika koneksi internet pengguna di bawah 3G'
    ],
    correct: 'A',
    points: 10,
    explanation: 'loading="lazy" menunda pemuatan gambar offscreen sampai dibutuhkan, sedangkan dimensi eksplisit width dan height memungkinkan browser memesan rasio aspek wadah sehingga mencegah lonjakan tata letak (CLS).'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'HTML Element',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan markup tabel data keuangan berikut:

\`\`\`html
<table>
  <caption>Ringkasan Pendapatan Q1</caption>
  <thead>
    <tr>
      <th scope="col">Bulan</th>
      <th scope="col">Total</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Januari</td>
      <td>Rp 10.000.000</td>
    </tr>
  </tbody>
</table>
\`\`\`

Apa peran atribut \`scope="col"\` pada elemen \`<th>\` dalam tabel di atas?`,
    options: [
      'A. Mengindikasikan secara semantik bagi teknologi bantu (screen reader) bahwa sel header berlaku untuk seluruh kolom di bawahnya',
      'B. Mengatur lebar kolom secara otomatis agar berukuran persis 100 piksel',
      'C. Mengubah warna latar belakang header kolom menjadi warna primer CSS',
      'D. Membatasi tabel agar hanya dapat diurutkan berdasarkan kolom pertama'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Atribut scope="col" secara eksplisit menghubungkan sel header <th> dengan seluruh sel data pada kolom tersebut, sangat krusial bagi aksesibilitas pembaca layar (screen reader).'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'Document Structure',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Manakah dari struktur nesting elemen berikut yang VALID menurut spesifikasi standar HTML5?`,
    options: [
      'A. <a href="/post"><h2>Judul Artikel</h2><p>Ringkasan konten artikel...</p></a>',
      'B. <p>Paragraf pembuka <div>Blok konten tengah</div> Paragraf penutup</p>',
      'C. <ul><p>Deskripsi daftar</p><li>Item pertama</li></ul>',
      'D. <button><a href="/link">Klik Tombol</a></button>'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Di HTML5, elemen <a> diperbolehkan membungkus elemen flow content (termasuk <h2> dan <p>). Namun, <p> tidak boleh memuat <div>, <ul> hanya boleh memiliki anak langsung <li>, dan <button> dilarang memuat tautan interactive <a>.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'HTML Element',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan potongan markup teks berikut:

\`\`\`html
<p>
  Untuk menyalin teks, tekan kombinasi tombol <kbd>Ctrl</kbd> + <kbd>C</kbd>.
</p>
\`\`\`

Apa tujuan semantik dari penggunaan elemen \`<kbd>\` pada kalimat di atas?`,
    options: [
      'A. Menandai masukan teks dari pengguna seperti tombol keyboard atau perintah suara',
      'B. Mengubah font menjadi cetak tebal dan miring secara bersamaan',
      'C. Mencegah pengguna menyalin teks pintasan tersebut ke clipboard',
      'D. Menjalankan event handler otomatis saat tombol tersebut ditekan'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Elemen <kbd> (keyboard input) merepresentasikan input pengguna dari peranti seperti keyboard, input suara, atau kontrol interaktif lainnya.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'HTML Attribute',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan elemen kustom berikut:

\`\`\`html
<article data-category="teknologi" data-article-id="1042">
  <h3>Inovasi Web Terbaru</h3>
</article>
\`\`\`

Bagaimana cara yang benar untuk membaca nilai \`data-category\` melalui JavaScript DOM?`,
    options: [
      'A. articleElement.dataset.category',
      'B. articleElement.data.category',
      'C. articleElement.attributes.category.val',
      'D. articleElement.getData("category")'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Atribut kustom berawalan data-* diakses melalui properti elemen .dataset (misalnya dataset.category atau getAttribute("data-category")).'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'Document Structure',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan elemen \`<script>\` dengan atribut \`async\` berikut:

\`\`\`html
<script src="tracker.js" async></script>
\`\`\`

Bagaimana urutan eksekusi berkas \`tracker.js\` dibandingkan dengan proses rendering HTML?`,
    options: [
      'A. Berkas diunduh secara asinkron dan langsung dieksekusi begitu selesai unduh, berpotensi menyela parsing HTML',
      'B. Berkas selalu dieksekusi tepat sebelum event DOMContentLoaded terjadi',
      'C. Berkas dieksekusi secara berurutan sesuai urutan deklarasi skrip di dokumen',
      'D. Berkas tidak akan pernah dieksekusi jika DOM selesai diparse lebih dulu'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Atribut async mengunduh berkas secara independen tanpa memblokir parsing, namun begitu selesai diunduh, eksekusi skrip langsung berjalan seketika dan dapat menyela parsing HTML.'
  },

  // =========================================================================
  // TOPIC: Semantic HTML (Semantic Elements, Accessibility)
  // Target: >= 15 new questions with code (11 Easy, 12 Medium, 12 Hard)
  // =========================================================================
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Semantic Elements',
    material: 'HTML',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan struktur kerangka halaman berikut:

\`\`\`html
<header>
  <h1>Logo Perusahaan</h1>
  <!-- Bagian menu tautan utama halaman diletakkan di sini -->
</header>
\`\`\`

Elemen semantik manakah yang paling tepat digunakan untuk membungkus daftar navigasi utama halaman?`,
    options: [
      'A. <nav>',
      'B. <section>',
      'C. <aside>',
      'D. <menu-bar>'
    ],
    correct: 'A',
    points: 10,
    explanation: '<nav> adalah elemen semantik standar HTML5 yang dirancang khusus untuk memuat kelompok tautan navigasi utama situs atau halaman.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Semantic Elements',
    material: 'HTML',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan cuplikan artikel blog berikut:

\`\`\`html
<article>
  <h2>Panduan Memulai CSS Grid</h2>
  <p>CSS Grid adalah sistem tata letak dua dimensi...</p>
  <!-- Bagian tanggal publikasi -->
  <p>Diterbitkan pada: <time datetime="2026-05-12">12 Mei 2026</time></p>
</article>
\`\`\`

Apa tujuan penggunaan elemen \`<time>\` beserta atribut \`datetime\`?`,
    options: [
      'A. Menyediakan format tanggal dan waktu yang dapat dipahami oleh mesin dan mesin pencari',
      'B. Menghitung otomatis durasi membaca artikel secara waktu nyata',
      'C. Mengubah tampilan tanggal menjadi jam digital animasi berkedip',
      'D. Menghubungkan artikel ke kalender Google pengguna secara langsung'
    ],
    correct: 'A',
    points: 10,
    explanation: '<time> dengan atribut datetime menyediakan data temporal yang dapat diparsing mesin (machine-readable) secara terstandarisasi untuk kalender dan mesin pencari.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Semantic Elements',
    material: 'HTML',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Elemen semantik manakah yang paling sesuai untuk membungkus konten pelengkap sampingan seperti daftar artikel terkait atau profil penulis?

\`\`\`html
<main>
  <article>Konten Berita Utama</article>
  <!-- Konten pelengkap seperti artikel terkait -->
</main>
\`\`\` `,
    options: [
      'A. <aside>',
      'B. <footer>',
      'C. <header>',
      'D. <sidebar>'
    ],
    correct: 'A',
    points: 10,
    explanation: '<aside> merepresentasikan konten yang secara tidak langsung berkaitan dengan konten utama di sekitarnya, seperti sidebar, kutipan tambahan, atau tautan terkait.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Semantic Elements',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan markup halaman portal berita berikut:

\`\`\`html
<body>
  <header>Header Situs</header>
  <main>
    <article>
      <h2>Gempa Berkekuatan 5.4 SR</h2>
      <p>Badan Meteorologi mengumumkan...</p>
    </article>
  </main>
</body>
\`\`\`

Berapa kali elemen \`<main>\` yang tidak tersembunyi boleh muncul di dalam satu dokumen HTML?`,
    options: [
      'A. Tepat satu kali per dokumen',
      'B. Bebas tanpa batasan jumlah',
      'C. Maksimal dua kali jika menggunakan multi-kolom',
      'D. Harus muncul di dalam setiap tag <article>'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Sebuah dokumen HTML hanya boleh memiliki satu elemen <main> yang terlihat (tidak memiliki atribut hidden), karena <main> mewakili konten unik inti dokumen.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Accessibility',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Sebuah tombol ikon interaktif dibuat dengan markup berikut:

\`\`\`html
<button type="button" aria-label="Tutup Menu Navigasi">
  <svg width="24" height="24" aria-hidden="true" viewBox="0 0 24 24">
    <path d="M6 18L18 6M6 6l12 12"></path>
  </svg>
</button>
\`\`\`

Apa fungsi dari \`aria-label\` pada \`<button>\` dan \`aria-hidden="true"\` pada elemen \`<svg>\`?`,
    options: [
      'A. Memberi nama aksesibel bagi pembaca layar pada tombol dan menyembunyikan ikon visual murni agar tidak dibaca ganda',
      'B. Memastikan ikon SVG berubah warna secara otomatis saat mouse diarahkan ke tombol',
      'C. Mencegah tombol diklik sebelum seluruh aset halaman selesai dimuat',
      'D. Menentukan animasi penutupan modal saat pengguna menekan tombol escape'
    ],
    correct: 'A',
    points: 10,
    explanation: 'aria-label menyediakan teks deskriptif untuk tombol tanpa teks kasat mata, sedangkan aria-hidden="true" menyembunyikan ikon dekoratif SVG dari pohon aksesibilitas agar tidak mengacaukan screen reader.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Accessibility',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan elemen gambar ilustrasi dekoratif pada kartu profil:

\`\`\`html
<div class="user-card">
  <img src="pattern-bg.svg" alt="" role="presentation">
  <h2>Ahmad Fauzi</h2>
</div>
\`\`\`

Mengapa penggunaan \`alt=""\` (teks alt kosong) tepat untuk gambar dekorasi latar belakang tersebut?`,
    options: [
      'A. Menginstruksikan screen reader untuk melewati gambar karena tidak membawa informasi substantif',
      'B. Memaksa browser mengunduh gambar dengan resolusi retina secara otomatis',
      'C. Mencegah browser menampilkan gambar jika koneksi lambat',
      'D. Menandakan bahwa gambar tersebut adalah berkas vektor SVG'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Gambar dekoratif murni yang tidak membawa makna bagi pemahaman konten harus diberi atribut alt="" agar diabaikan oleh teknologi bantu (screen reader).'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Semantic Elements',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan cuplikan penyisipan gambar teknis beserta keterangannya:

\`\`\`html
<figure>
  <img src="diagram-arsitektur.png" alt="Diagram alur sistem autentikasi JWT">
  <figcaption>Gambar 1.1: Alur autentikasi token JWT antara klien dan server.</figcaption>
</figure>
\`\`\`

Apa peran elemen \`<figcaption>\` dalam struktur di atas?`,
    options: [
      'A. Menghubungkan secara semantik deskripsi atau teks keterangan dengan konten yang ada di dalam <figure>',
      'B. Mengubah ukuran gambar agar proporsional dengan lebar paragraf artikel',
      'C. Memuat hak cipta foto yang wajib diverifikasi oleh sistem perayap web',
      'D. Mengatur tata letak teks agar melayang (float) di sebelah kanan gambar'
    ],
    correct: 'A',
    points: 10,
    explanation: '<figcaption> adalah caption atau keterangan yang terikat secara semantik dengan elemen induk <figure>, memperjelas konteks diagram, ilustrasi, atau cuplikan kode.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Accessibility',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan implementasi accordion interaktif berikut:

\`\`\`html
<button aria-expanded="false" aria-controls="faq-answer-1" id="faq-btn-1">
  Bagaimana cara melakukan pembayaran?
</button>
<div id="faq-answer-1" role="region" aria-labelledby="faq-btn-1" hidden>
  <p>Pembayaran dapat dilakukan melalui transfer bank atau e-wallet.</p>
</div>
\`\`\`

Ketika tombol diklik dan panel jawaban terbuka, atribut ARIA manakah yang harus diperbarui melalui JavaScript?`,
    options: [
      'A. Mengubah aria-expanded="false" menjadi aria-expanded="true" dan menghapus atribut hidden pada div',
      'B. Mengubah role="region" menjadi role="alert" dan memicu event focus',
      'C. Menghapus atribut id="faq-answer-1" dari elemen div',
      'D. Mengubah aria-controls menjadi aria-describedby secara dinamis'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Untuk aksesibilitas accordion, saat panel terbuka atribut aria-expanded harus bernilai "true" dan atribut hidden (atau display: none) pada wadah konten target dihapus.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Semantic Elements',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Manakah perbedaan konseptual paling mendasar antara elemen \`<article>\` dan \`<section>\` dalam HTML5?`,
    options: [
      'A. <article> merepresentasikan konten mandiri yang dapat didistribusikan secara independen, sedangkan <section> adalah pengelompokan tematik konten',
      'B. <article> hanya boleh digunakan di blog, sedangkan <section> hanya boleh digunakan di e-commerce',
      'C. <section> wajib memiliki penutup tag, sedangkan <article> adalah void tag',
      'D. <article> tidak boleh memiliki heading (h1-h6), sedangkan <section> wajib memiliki heading'
    ],
    correct: 'A',
    points: 10,
    explanation: '<article> dirancang untuk konten mandiri dan dapat berdiri sendiri (seperti postingan blog, berita, komentar), sedangkan <section> adalah pengelompokan tematik dari suatu dokumen umum.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Accessibility',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan tautan pintasan aksesibilitas di awal elemen \`<body>\`:

\`\`\`html
<body>
  <a href="#konten-utama" class="skip-link">Lompat ke konten utama</a>
  <header>...</header>
  <nav>...</nav>
  <main id="konten-utama">...</main>
</body>
\`\`\`

Apa tujuan utama dari implementasi pola "Skip Link" di atas?`,
    options: [
      'A. Memungkinkan pengguna keyboard dan screen reader melompati navigasi berulang langsung ke konten utama',
      'B. Mempercepat proses perayapan (crawling) oleh robot Google menuju artikel utama',
      'C. Mencegah browser menampilkan header situs saat halaman dibuka di layar kecil',
      'D. Mengaktifkan fitur pencarian cepat pada peramban web modern'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Skip Link adalah teknik aksesibilitas WCAG yang memberikan jalan pintas bagi pengguna keyboard dan screen reader untuk melewati blok header/menu yang panjang dan langsung menuju konten utama.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Semantic Elements',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan markup dialog konfirmasi modern berikut:

\`\`\`html
<dialog id="modalHapus">
  <form method="dialog">
    <p>Apakah Anda yakin ingin menghapus data ini?</p>
    <button value="cancel">Batal</button>
    <button value="confirm">Ya, Hapus</button>
  </form>
</dialog>
\`\`\`

Metode JavaScript bawaan manakah yang tepat untuk membuka elemen \`<dialog>\` di atas sebagai modal jendela (backdrop overlay)?`,
    options: [
      'A. modalHapus.showModal()',
      'B. modalHapus.open()',
      'C. modalHapus.show()',
      'D. modalHapus.displayModal()'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Metode .showModal() membuka <dialog> sebagai modal bawaan browser lengkap dengan pseudo-elemen ::backdrop dan penguncian fokus interaktif di dalam dialog.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Accessibility',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Sebuah formulir memiliki area notifikasi pesan kesalahan dinamis:

\`\`\`html
<div id="error-message" role="alert" aria-live="assertive">
  Email yang Anda masukkan tidak valid!
</div>
\`\`\`

Apa dampak penggunaan \`role="alert"\` dan \`aria-live="assertive"\` terhadap pengguna pembaca layar?`,
    options: [
      'A. Pesan kesalahan akan segera diumumkan seketika oleh screen reader menyela pembacaan saat ini',
      'B. Pesan kesalahan hanya dibaca setelah pengguna menyentuh area layar tersebut dengan mouse',
      'C. Pembaca layar akan mengabaikan pesan hingga pengguna menekan tombol refresh',
      'D. Layar perangkat akan otomatis berkedip merah tanpa suara apa pun'
    ],
    correct: 'A',
    points: 10,
    explanation: 'role="alert" dengan aria-live="assertive" memberitahukan teknologi bantu untuk segera membacakan perubahan pesan kritis secara instan dengan memotong antrean pembacaan lain.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Semantic Elements',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan struktur footer berikut:

\`\`\`html
<footer>
  <p>&copy; 2026 Tim Edukasi XORA</p>
  <address>
    Email: <a href="mailto:support@xora.id">support@xora.id</a><br>
    Jakarta, Indonesia
  </address>
</footer>
\`\`\`

Apa tujuan semantik dari elemen \`<address>\` di dalam footer tersebut?`,
    options: [
      'A. Menyediakan informasi kontak bagi penulis atau pemilik dokumen/artikel',
      'B. Mengarahkan koordinat GPS ke aplikasi peta secara otomatis',
      'C. Memvalidasi format alamat pengiriman barang belanjaan pengguna',
      'D. Mengatur format font teks agar otomatis bergaris miring (italic)'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Elemen <address> dalam HTML digunakan untuk menyajikan informasi kontak bagi orang atau entitas yang bertanggung jawab atas dokumen atau artikel terkait.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Accessibility',
    material: 'HTML',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan hierarki heading berikut pada sebuah halaman artikel:

\`\`\`html
<h1>Panduan JavaScript Modern</h1>
<p>Pengantar singkat...</p>
<h4>Variabel dan Tipe Data</h4>
\`\`\`

Mengapa lompatan langsung dari \`<h1>\` ke \`<h4>\` dianggap sebagai pelanggaran praktik terbaik aksesibilitas (accessibility)?`,
    options: [
      'A. Membingungkan pengguna pembaca layar yang mengandalkan hierarki heading berurutan (h1 -> h2 -> h3)',
      'B. Menyebabkan browser gagal merender gaya CSS pada elemen h4',
      'C. Mengakibatkan tautan internal halaman terputus secara otomatis',
      'D. Melanggar sintaks validasi XHTML 1.0 Strict'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Hierarki heading harus logis dan berurutan (h1 diikuti h2, bukan melompat ke h4) agar pengguna pembaca layar dapat menjelajahi dan memahami garis besar struktur dokumen secara akurat.'
  },
  {
    topic_name: 'Semantic HTML',
    concept_name: 'Semantic Elements',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penggunaan elemen interaktif bawaan berikut:

\`\`\`html
<details>
  <summary>Lihat Rincian Spesifikasi</summary>
  <ul>
    <li>RAM: 16 GB</li>
    <li>SSD: 512 GB</li>
  </ul>
</details>
\`\`\`

Apa keuntungan utama menggunakan elemen \`<details>\` dan \`<summary>\` dibandingkan membuat widget collapse menggunakan div dan JavaScript biasa?`,
    options: [
      'A. Memiliki perilaku interaktif buka-tutup bawaan peramban dan aksesibilitas keyboard tanpa skrip tambahan',
      'B. Secara otomatis mengenkripsi data rincian spesifikasi di sisi klien',
      'C. Mengunduh data rincian dari server menggunakan AJAX saat diklik',
      'D. Menjamin konten tidak dapat diindeks oleh bot mesin pencari'
    ],
    correct: 'A',
    points: 10,
    explanation: '<details> dan <summary> adalah elemen bawaan HTML5 untuk widget disclosure yang secara otomatis mendukung interaksi klik/keyboard (Enter/Spasi) dan state aksesibilitas tanpa baris JavaScript.'
  },

  // =========================================================================
  // TOPIC: Forms & Validation (Form Controls, Form Validation)
  // Target: >= 20 new questions with code (10 Easy, 12 Medium, 11 Hard)
  // =========================================================================
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan potongan formulir pendaftaran berikut:

\`\`\`html
<form>
  <label for="user-email">Alamat Email:</label>
  <input type="email" id="user-email" name="email">
</form>
\`\`\`

Apa manfaat menghubungkan atribut \`for\` pada elemen \`<label>\` dengan \`id\` pada \`<input>\`?`,
    options: [
      'A. Saat teks label diklik, kursor secara otomatis fokus pada input terkait, dan pembaca layar dapat membacakan nama kontrol',
      'B. Nilai input akan otomatis dienkripsi sebelum dikirimkan ke server',
      'C. Mencegah pengguna memasukkan alamat email yang sudah terdaftar',
      'D. Mengatur posisi input agar berada persis di sebelah kanan label'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Menghubungkan <label for="id"> dengan <input id="id"> memperluas area klik (focus target) dan memberikan accessible name bagi teknologi pembaca layar.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Validation',
    material: 'HTML',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan formulir berikut:

\`\`\`html
<form action="/submit" method="POST">
  <input type="text" name="username" required>
  <button type="submit">Kirim</button>
</form>
\`\`\`

Apa yang terjadi saat pengguna menekan tombol "Kirim" ketika input \`username\` masih kosong?`,
    options: [
      'A. Browser mencegah pengiriman formulir dan menampilkan pesan peringatan validasi bawaan',
      'B. Formulir tetap terkirim ke server dengan payload nilai null',
      'C. Halaman web secara otomatis memuat ulang (reload) halaman awal',
      'D. Browser memicu prompt alert dialog kustom JavaScript'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Atribut boolean required mengaktifkan validasi HTML5 bawaan di sisi klien, mencegah form submit dan memunculkan bubble peringatan jika field kosong.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan kelompok kontrol radio button berikut:

\`\`\`html
<fieldset>
  <legend>Pilih Metode Pembayaran</legend>
  <input type="radio" id="tf" name="metode" value="transfer">
  <label for="tf">Transfer Bank</label>
  <input type="radio" id="ew" name="metode" value="ewallet">
  <label for="ew">E-Wallet</label>
</fieldset>
\`\`\`

Atribut manakah yang memastikan kedua radio button di atas berada dalam satu kelompok pilihan eksklusif (hanya salah satu yang dapat dipilih)?`,
    options: [
      'A. Atribut name yang memiliki nilai identik ("metode")',
      'B. Atribut id yang berawalan huruf sama',
      'C. Pembungkus elemen <fieldset>',
      'D. Atribut value yang didefinisikan pada setiap input'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Radio button dikelompokkan berdasarkan kesamaan nilai atribut name. Radio dengan name yang sama bersifat mutually exclusive.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Validation',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan input formulir dengan validasi ekspresi reguler berikut:

\`\`\`html
<input 
  type="text" 
  name="kode_pos" 
  pattern="[0-9]{5}" 
  title="Kode pos harus terdiri dari tepat 5 digit angka">
\`\`\`

Kapan nilai atribut \`title\` di atas akan ditampilkan kepada pengguna?`,
    options: [
      'A. Sebagai bagian dari pesan kesalahan validasi peramban ketika input tidak cocok dengan pola pattern',
      'B. Selalu tampil permanen di bawah kotak input sebagai teks bantuan abu-abu',
      'C. Hanya saat formulir berhasil dikirimkan ke server tujuan',
      'D. Ketika pengguna menekan tombol tab dua kali berturut-turut'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Saat menggunakan atribut pattern, browser menampilkan nilai atribut title di dalam pesan tooltip validasi kesalahan jika masukan pengguna tidak memenuhi ekspresi reguler.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan formulir input angka berikut:

\`\`\`html
<input type="number" name="kuantitas" min="1" max="10" step="2" value="1">
\`\`\`

Manakah dari nilai berikut yang VALID dan tidak memicu galat validasi \`stepMismatch\`?`,
    options: [
      'A. 5',
      'B. 4',
      'C. 0',
      'D. 12'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dengan min="1" dan step="2", nilai yang valid adalah 1, 3, 5, 7, 9 (rentang min ke max dengan kenaikan 2). Nilai 4 memicu stepMismatch, sedangkan 0 dan 12 melanggar min/max.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan implementasi dropdown pilihan dan autocomplete berikut:

\`\`\`html
<input list="daftar-kota" name="kota">
<datalist id="daftar-kota">
  <option value="Jakarta">
  <option value="Bandung">
  <option value="Surabaya">
</datalist>
\`\`\`

Apa keunggulan elemen \`<datalist>\` dibandingkan elemen \`<select>\` biasa?`,
    options: [
      'A. Pengguna dapat mengetik teks bebas sekaligus mendapatkan rekomendasi saran yang dapat disaring',
      'B. Mengirimkan data formulir tanpa memerlukan koneksi internet',
      'C. Pilihan pada datalist tidak dapat diubah oleh script JavaScript',
      'D. Menjamin hanya satu opsi yang dapat dipilih tanpa kemungkinan salah ketik'
    ],
    correct: 'A',
    points: 10,
    explanation: '<datalist> menyediakan daftar saran otomatis (autocomplete) untuk elemen <input>, namun tetap mengizinkan pengguna memasukkan nilai kustom di luar daftar.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Sebuah formulir web dirancang untuk mengunggah dokumen PDF dan gambar:

\`\`\`html
<form action="/upload" method="POST" enctype="multipart/form-data">
  <input type="file" name="dokumen" accept=".pdf,image/png,image/jpeg" multiple>
  <button type="submit">Unggah Berkas</button>
</form>
\`\`\`

Mengapa atribut \`enctype="multipart/form-data"\` WAJIB disertakan pada tag \`<form>\` di atas?`,
    options: [
      'A. Memungkinkan pengiriman data berkas biner (binary data) secara utuh dalam payload HTTP POST',
      'B. Mengompresi ukuran berkas PDF hingga 50% sebelum meninggalkan browser',
      'C. Mengubah berkas biner menjadi string URL-encoded biasa',
      'D. Mengabaikan batas maksimum ukuran berkas yang diatur pada peladen'
    ],
    correct: 'A',
    points: 10,
    explanation: 'enctype="multipart/form-data" diperlukan saat mengirimkan input type="file" melalui POST agar browser tidak mengkodekan berkas sebagai teks biasa (application/x-www-form-urlencoded), melainkan sebagai payload multipart biner.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Validation',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pemeriksaan Constraint Validation API di JavaScript berikut:

\`\`\`javascript
const inputEmail = document.getElementById('email');

if (inputEmail.validity.typeMismatch) {
  console.log('Format masukan salah!');
}
\`\`\`

Kondisi \`validity.typeMismatch\` bernilai \`true\` pada elemen \`<input type="email">\` ketika:`,
    options: [
      'A. Teks yang dimasukkan pengguna bukan merupakan format sintaks email yang valid',
      'B. Kotak input dibiarkan kosong padahal memiliki atribut required',
      'C. Jumlah karakter melebihi batas yang diatur pada atribut maxlength',
      'D. Nilai tidak cocok dengan pola yang ditentukan pada atribut pattern'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Properti validity.typeMismatch bernilai true ketika nilai input tidak sesuai dengan tipe kontrol yang ditentukan (misalnya string "budi" pada input type="email" atau type="url").'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Validation',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan potongan skrip kustomisasi validasi formulir:

\`\`\`javascript
const inputPassConfirm = document.getElementById('confirm-pass');

inputPassConfirm.setCustomValidity('Konfirmasi kata sandi tidak cocok.');
\`\`\`

Apa efek dari pemanggilan \`input.setCustomValidity(pesan)\` dengan string non-kosong?`,
    options: [
      'A. Menandai kontrol input sebagai tidak valid (invalid) dan menetapkan pesan galat kustom saat validasi diperiksa',
      'B. Menghapus pesan kesalahan dan menandai input sebagai valid secara otomatis',
      'C. Memaksa form untuk segera melakukan submit ke server tujuan',
      'D. Mengubah tipe input dari type="password" menjadi type="text"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Memberikan string non-kosong pada setCustomValidity() membuat kontrol menjadi invalid (validity.customError = true) dan menampilkan pesan tersebut saat formulir dicek. Untuk mengembalikan status valid, panggil setCustomValidity("").'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan formulir berikut dengan atribut \`novalidate\`:

\`\`\`html
<form action="/api/checkout" method="POST" novalidate>
  <input type="email" name="email" required>
  <button type="submit">Lanjutkan</button>
</form>
\`\`\`

Apa dampak dari atribut \`novalidate\` pada elemen \`<form>\` tersebut?`,
    options: [
      'A. Menonaktifkan validasi bawaan browser saat submit, sehingga penanganan validasi dapat dikontrol penuh oleh JavaScript',
      'B. Menghapus semua data yang diketikkan pengguna saat tombol diklik',
      'C. Mencegah browser mengirimkan cookie sesi ke server tujuan',
      'D. Membatasi pengiriman formulir hanya melalui metode HTTP GET'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Atribut novalidate menonaktifkan validasi HTML5 bawaan browser saat form disubmit, sangat umum digunakan ketika pengembang ingin mengelola seluruh validasi dan pesan error kustom melalui JavaScript.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan tombol submit ganda pada formulir berikut:

\`\`\`html
<form action="/draft" method="POST">
  <input type="text" name="judul" required>
  
  <button type="submit">Simpan Draf</button>
  <button type="submit" formaction="/publish" formmethod="POST">Publikasikan</button>
</form>
\`\`\`

Apa yang terjadi jika pengguna menekan tombol "Publikasikan"?`,
    options: [
      'A. Formulir akan dikirimkan ke endpoint "/publish" menggantikan nilai atribut action pada tag form',
      'B. Formulir dikirimkan ke kedua endpoint (/draft dan /publish) secara bersamaan',
      'C. Browser menampilkan dialog galat karena satu form dilarang memiliki dua tombol submit',
      'D. Formulir tetap terkirim ke "/draft" karena atribut form selalu memiliki prioritas tertinggi'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Atribut formaction pada tombol bertipe submit menimpa (override) atribut action yang dideklarasikan pada tag <form> induk untuk aksi penyerahan tersebut.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Elemen manakah yang tepat digunakan untuk membuat area masukan teks multibaris (multiline text)?`,
    options: [
      'A. <textarea name="komentar" rows="4" cols="50"></textarea>',
      'B. <input type="multiline" name="komentar">',
      'C. <input type="textarea" name="komentar">',
      'D. <text-box multiline="true"></text-box>'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Elemen <textarea> adalah kontrol bawaan HTML untuk input teks panjang lebih dari satu baris.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan kontrol masukan kata sandi berikut:

\`\`\`html
<input 
  type="password" 
  name="pin" 
  inputmode="numeric" 
  autocomplete="one-time-code"
  maxlength="6">
\`\`\`

Apa manfaat atribut \`inputmode="numeric"\` pada perangkat telepon seluler pintar (smartphone)?`,
    options: [
      'A. Memunculkan papan ketik virtual (onscreen keyboard) khusus numerik secara langsung saat kotak input aktif',
      'B. Mengubah tipe font teks menjadi angka Romawi secara otomatis',
      'C. Mencegah karakter teks dikirimkan sebelum mencapai 6 karakter',
      'D. Mengabaikan validasi keamanan kata sandi pada sistem operasi'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Atribut inputmode="numeric" memberi petunjuk kepada browser seluler untuk menampilkan keyboard numerik virtual yang memudahkan input angka/OTP oleh pengguna.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Validation',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pemilih CSS pseudo-class untuk status validasi formulir:

\`\`\`css
input:user-invalid {
  border-color: #ef4444;
}
\`\`\`

Apa keunggulan pseudo-class \`:user-invalid\` dibandingkan pseudo-class \`:invalid\` standar?`,
    options: [
      'A. Hanya aktif setelah pengguna berinteraksi (mengetik atau blur), sehingga tidak langsung memerah saat halaman pertama kali dibuka',
      'B. Bekerja secara eksklusif hanya pada browser Safari dan perangkat iOS',
      'C. Mampu memvalidasi data langsung ke server database secara otomatis',
      'D. Mengabaikan atribut pattern dan hanya memeriksa atribut required'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pseudo-class :user-invalid hanya cocok ketika pengguna telah berinteraksi dengan kontrol dan meninggalkan nilai tidak valid, mencegah form langsung tampak merah penuh galat sebelum pengguna sempat mengisi apa pun.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan elemen formulir yang ditempatkan di luar hierarki tag \`<form>\`:

\`\`\`html
<form id="order-form" action="/checkout" method="POST">
  <input type="text" name="pembeli" required>
</form>

<!-- Di bagian lain halaman -->
<button type="submit" form="order-form">Bayar Sekarang</button>
\`\`\`

Bagaimana perilaku tombol "Bayar Sekarang" di atas saat ditekan?`,
    options: [
      'A. Berhasil mensubmit formulir ber-id "order-form" berkat atribut form="order-form"',
      'B. Gagal berfungsi karena tombol submit wajib berada di dalam anak langsung tag <form>',
      'C. Membuka jendela pop-up baru tanpa membawa payload input pembeli',
      'D. Memicu event reload halaman tanpa mengirimkan data POST'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Atribut form="form-id" memungkinkan elemen kontrol formulir (seperti tombol, input, select) dikaitkan ke suatu form meskipun diletakkan di luar tag <form> tersebut dalam DOM.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan pemilih opsi (dropdown) dengan opsi pertama dinonaktifkan:

\`\`\`html
<select name="pekerjaan" required>
  <option value="" disabled selected>Pilih pekerjaan Anda...</option>
  <option value="frontend">Frontend Developer</option>
  <option value="backend">Backend Developer</option>
</select>
\`\`\`

Mengapa kombinasi \`required\` pada \`<select>\` dan \`value=""\` pada opsi placeholder pertama di atas sangat efektif?`,
    options: [
      'A. Memaksa pengguna memilih opsi nyata (frontend/backend) karena opsi bernilai string kosong akan dianggap tidak valid saat submit',
      'B. Menyembunyikan seluruh dropdown dari pengguna sebelum halaman selesai dimuat',
      'C. Mengubah dropdown menjadi daftar radio button secara dinamis',
      'D. Mencegah browser menyimpan riwayat pilihan pengguna di sesi sebelumnya'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pada elemen <select required>, opsi dengan value="" dianggap bernilai kosong. Jika pengguna tidak memilih opsi lain, validasi form required akan menggagalkan submit.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Validation',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan input teks dengan batasan panjang karakter:

\`\`\`html
<input type="text" name="username" minlength="4" maxlength="12" required>
\`\`\`

Jika pengguna mengetikkan string "abc" (3 karakter) lalu menekan tombol submit, kondisi \`validity\` manakah yang bernilai \`true\`?`,
    options: [
      'A. validity.tooShort',
      'B. validity.tooLong',
      'C. validity.valueMissing',
      'D. validity.badInput'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Jika panjang karakter masukan kurang dari nilai minlength yang ditetapkan, browser menandai objek validity.tooShort bernilai true.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan elemen input pencarian:

\`\`\`html
<input type="search" name="q" placeholder="Cari artikel...">
\`\`\`

Apa fitur khas peramban yang umumnya tersedia pada \`type="search"\` dibandingkan \`type="text"\` biasa?`,
    options: [
      'A. Tombol silang pembersih teks bawaan (clear button) dan penyesuaian gaya tombol keyboard seluler',
      'B. Kemampuan pencarian semantik menggunakan kecerdasan buatan secara otomatis',
      'C. Penyimpanan otomatis kata kunci pencarian ke basis data server secara waktu nyata',
      'D. Enkripsi teks pencarian saat pengguna mengetik di papan ketik'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Elemen input type="search" dioptimalkan untuk kueri pencarian, seringkali menyertakan tombol "x" pembersih teks instan di dalam kolom pada browser modern.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Controls',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pengaturan status kontrol formulir berikut:

\`\`\`html
<input type="text" name="kode_ref" value="PROMO2026" readonly>
<input type="text" name="diskon" value="10%" disabled>
\`\`\`

Bagaimana perbedaan utama pengiriman data antara input \`readonly\` dan \`disabled\` saat formulir disubmit ke server?`,
    options: [
      'A. Nilai input readonly tetap dikirimkan ke server, sedangkan input disabled tidak diikutsertakan dalam payload',
      'B. Nilai input disabled tetap dikirimkan ke server, sedangkan input readonly tidak dikirimkan',
      'C. Kedua input sama-sama tidak dikirimkan ke server',
      'D. Kedua input sama-sama dikirimkan tetapi dienkripsi terlebih dahulu'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Input dengan atribut readonly tidak dapat diubah oleh pengguna namun nilainya tetap berhasil dikirim (successful form control) saat submit. Sebaliknya, kontrol disabled tidak pernah dikirimkan dalam payload form.'
  },
  {
    topic_name: 'Forms & Validation',
    concept_name: 'Form Validation',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan cuplikan JavaScript yang menangani pengiriman form:

\`\`\`javascript
const form = document.querySelector('form');

form.addEventListener('submit', (e) => {
  if (!form.checkValidity()) {
    e.preventDefault();
    console.log('Formulir tidak valid!');
  }
});
\`\`\`

Apa yang dilakukan oleh metode bawaan \`form.checkValidity()\`?`,
    options: [
      'A. Memeriksa apakah semua elemen form memenuhi batasan validasi dan mengembalikan true/false serta memicu event invalid pada field yang bermasalah',
      'B. Mengirimkan data form ke server secara asinkron tanpa memuat ulang halaman',
      'C. Menghapus semua nilai input dan mereset form ke kondisi default',
      'D. Memperbaiki kesalahan penulisan email secara otomatis di latar belakang'
    ],
    correct: 'A',
    points: 10,
    explanation: 'checkValidity() mengevaluasi semua kontrol form terhadap aturan validasi Constraint Validation. Metode ini mengembalikan true jika valid, atau false sambil memicu event invalid pada elemen terkait jika ditemukan pelanggaran.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'HTML Element',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan markup tabel data berikut:

\`\`\`html
<table>
  <thead>
    <tr>
      <th scope="col">Nama Produk</th>
      <th scope="col">Harga</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Laptop Ultrabook</td>
      <td>Rp15.000.000</td>
    </tr>
  </tbody>
</table>
\`\`\`

Apa fungsi atribut \`scope="col"\` pada elemen \`<th>\` di atas?`,
    options: [
      'A. Menentukan secara eksplisit bahwa sel header tersebut berlaku untuk seluruh sel di kolom vertikal di bawahnya demi aksesibilitas screen reader',
      'B. Mengatur lebar kolom agar otomatis menyesuaikan dengan isi konten sel',
      'C. Mengubah warna latar belakang seluruh kolom menjadi abu-abu secara otomatis',
      'D. Mengurutkan data dalam kolom dari nilai terkecil ke terbesar'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Atribut scope="col" menginformasikan kepada teknologi bantu (seperti screen reader) bahwa header ini merepresentasikan judul untuk seluruh sel dalam kolom vertikal tersebut.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'HTML Attribute',
    material: 'HTML',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Sebuah tautan eksternal ditulis dengan kode markup berikut:

\`\`\`html
<a href="https://partner-portal.com" target="_blank" rel="noopener noreferrer">
  Kunjungi Portal Partner
</a>
\`\`\`

Mengapa praktik penggunaan \`rel="noopener noreferrer"\` sangat direkomendasikan ketika membuka tautan di tab baru (\`target="_blank"\`)?`,
    options: [
      'A. Mencegah halaman tujuan mengakses objek window.opener milik halaman asal sehingga mencegah eksploitasi keamanan reverse tabnabbing',
      'B. Mempercepat proses rendering gambar di halaman tujuan sebesar dua kali lipat',
      'C. Memaksa tab baru terbuka dalam jendela penyamaran (incognito mode)',
      'D. Menghilangkan scrollbar pada tab peramban yang baru dibuka'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Tanpa rel="noopener", halaman eksternal yang dibuka via window baru dapat mengakses window.opener dan memanipulasi lokasi dokumen asal (reverse tabnabbing). "noopener" memutus referensi tersebut, dan "noreferrer" mencegah pengiriman HTTP referer header.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'Document Structure',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Sebuah dokumen HTML memuat meta tag viewport berikut di dalam elemen \`<head>\`:

\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

Apa akibat langsung jika meta tag ini TIDAK disertakan pada sebuah halaman web ketika diakses dari peramban ponsel pintar?`,
    options: [
      'A. Peramban seluler akan merender halaman pada viewport virtual lebar bawaan desktop (sekitar 980px) lalu mengecilkan tampilannya sehingga teks tampak sangat kecil',
      'B. Halaman web sama sekali tidak dapat dibuka dan menampilkan pesan kesalahan 404',
      'C. Peramban seluler menonaktifkan semua fungsi JavaScript yang ada di halaman',
      'D. Semua format warna CSS akan berubah menjadi mode grayscale hitam-putih'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Tanpa viewport meta tag, browser seluler berasumsi situs belum responsif dan merender halaman pada canvas virtual desktop (~980px), menyebabkan tampilan mengecil dan mengharuskan pengguna melakukan zoom secara manual.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'HTML Element',
    material: 'HTML',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Manakah dari struktur penulisan daftar bersarang (nested list) berikut yang valid sesuai dengan spesifikasi standar W3C / WHATWG HTML?

\`\`\`html
<!-- Pilihan A -->
<ul>
  <li>Menu Utama
    <ul>
      <li>Submenu A</li>
    </ul>
  </li>
</ul>

<!-- Pilihan B -->
<ul>
  <li>Menu Utama</li>
  <ul>
    <li>Submenu A</li>
  </ul>
</ul>
\`\`\``,
    options: [
      'A. Struktur A valid, karena elemen <ul> bersarang wajib diletakkan di dalam elemen <li>',
      'B. Struktur B valid, karena elemen <ul> bersarang harus diletakkan sejajar langsung di bawah parent <ul>',
      'C. Kedua struktur di atas sama-sama tidak valid dalam standar HTML5',
      'D. Struktur B hanya valid jika menggunakan atribut type="circle"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Menurut spesifikasi HTML, elemen <ul> hanya boleh memiliki anak langsung berupa elemen <li>. Oleh karena itu, sub-list <ul> bersarang harus berada di dalam salah satu elemen <li>.'
  },
  {
    topic_name: 'HTML Basics',
    concept_name: 'HTML Attribute',
    material: 'HTML',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan elemen gambar berikut:

\`\`\`html
<img src="banner-promo.jpg" alt="Banner Promo" loading="lazy">
\`\`\`

Apa pengaruh penambahan atribut \`loading="lazy"\` pada elemen gambar tersebut?`,
    options: [
      'A. Browser menunda pemuatan gambar sampai gambar tersebut mendekati viewport layar pengguna',
      'B. Mengurangi resolusi gambar sebesar 50% secara permanen untuk menghemat ruang penyimpanan',
      'C. Mengubah format berkas gambar dari JPEG menjadi WebP secara otomatis di sisi peramban',
      'D. Memutar efek animasi memudar (fade-in) selama 5 detik setiap kali gambar muncul'
    ],
    correct: 'A',
    points: 10,
    explanation: 'loading="lazy" adalah fitur native browser lazy-loading yang menunda pengunduhan sumber daya gambar hingga posisi gambar hampir terlihat di layar viewport pengguna.'
  }
];

