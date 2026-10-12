// ============================================================
// XORA — CSS Question Bank Data (Code-Based & Conceptual)
// database/seeds/questions_data/css_questions.js
// Topics: CSS Basics, Box Model, Flexbox, Responsive Design
// ============================================================

module.exports = [
  // =========================================================================
  // TOPIC 1: CSS Basics (CSS Selector, CSS Property, CSS Value)
  // Current in DB: 24 (15 Easy, 2 Medium, 7 Hard, 0 with code)
  // Target added: 18 questions (mostly Medium & Hard, >= 15 with code) -> Total >= 42
  // =========================================================================
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Selector',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan aturan CSS berikut:

\`\`\`css
.btn-primary {
  background-color: #2563eb;
  color: #ffffff;
}
\`\`\`

Jenis selector CSS apakah yang digunakan pada aturan di atas?`,
    options: [
      'A. Class selector (pemilih kelas)',
      'B. ID selector (pemilih identitas)',
      'C. Type selector (pemilih tipe elemen)',
      'D. Universal selector (pemilih universal)'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Titik di depan nama (.btn-primary) menandakan class selector yang menargetkan semua elemen HTML dengan atribut class="btn-primary".'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Selector',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan deklarasi penargetan elemen berikut:

\`\`\`css
#main-navigation {
  position: sticky;
  top: 0;
}
\`\`\`

Simbol pagar (#) di awal penamaan selector di atas menunjukkan penggunaan:`,
    options: [
      'A. ID selector yang menargetkan elemen unik dengan id="main-navigation"',
      'B. Tag selector yang menargetkan semua elemen navigasi halaman',
      'C. Pseudo-element yang membuat elemen baru secara semu',
      'D. Variabel CSS yang menyimpan nilai posisi tetap'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Simbol pagar (#) adalah sintaks untuk ID selector dalam CSS yang mencocokkan elemen berdasarkan atribut id uniknya.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Selector',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan struktur markup dan aturan CSS berikut:

\`\`\`html
<ul class="nav">
  <li><a href="#">Beranda</a></li>
  <li>
    <div><a href="#">Profil</a></div>
  </li>
</ul>
\`\`\`

\`\`\`css
.nav > li > a {
  color: red;
}
\`\`\`

Tautan mana yang teksnya akan berwarna merah (\`color: red\`)?`,
    options: [
      'A. Hanya tautan "Beranda", karena "Profil" bukan anak langsung (child) dari li',
      'B. Kedua tautan ("Beranda" dan "Profil")',
      'C. Hanya tautan "Profil"',
      'D. Tidak ada tautan yang berubah warna merah'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kombinator child (>) hanya memilih elemen anak langsung. Tautan "Beranda" adalah anak langsung dari <li> (.nav > li > a), sedangkan "Profil" berada di dalam <div> sehingga bukan anak langsung dari <li>.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Selector',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan aturan CSS pemilih atribut (attribute selector) berikut:

\`\`\`css
a[href^="https://"] {
  padding-left: 20px;
  background-image: url("secure-icon.svg");
}
\`\`\`

Tautan (\`<a>\`) manakah yang akan dicocokkan oleh aturan CSS di atas?`,
    options: [
      'A. Semua tautan yang nilai atribut href-nya diawali dengan "https://"',
      'B. Semua tautan yang nilai atribut href-nya diakhiri dengan "https://"',
      'C. Semua tautan yang memuat kata "https://" di posisi mana pun',
      'D. Hanya tautan yang persis bernilai href="https://"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Karakter ^= dalam attribute selector [attr^="value"] mencocokkan elemen yang nilai atributnya diawali dengan string yang ditentukan.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Selector',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan daftar item HTML berikut:

\`\`\`html
<ul>
  <li>Item 1</li>
  <li>Item 2</li>
  <li>Item 3</li>
  <li>Item 4</li>
</ul>
\`\`\`

\`\`\`css
li:nth-child(2n) {
  background-color: #f1f5f9;
}
\`\`\`

Item mana sajakah yang akan mendapatkan latar belakang abu-abu \`#f1f5f9\`?`,
    options: [
      'A. Item 2 dan Item 4 (item dengan indeks bernomor genap)',
      'B. Item 1 dan Item 3 (item dengan indeks bernomor ganjil)',
      'C. Hanya Item 2 saja',
      'D. Semua item dari Item 2 sampai Item 4'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Formula 2n (ekuivalen dengan keyword even) mencocokkan setiap kelipatan 2, yaitu anak ke-2, ke-4, ke-6, dst.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Selector',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan kombinator adjacent sibling (\`+\`) pada CSS berikut:

\`\`\`html
<h2>Judul Bab</h2>
<p>Paragraf Pengantar</p>
<p>Paragraf Isi</p>
\`\`\`

\`\`\`css
h2 + p {
  font-weight: bold;
}
\`\`\`

Paragraf manakah yang akan memiliki teks tebal (\`font-weight: bold\`)?`,
    options: [
      'A. Hanya "Paragraf Pengantar" (paragraf persis pertama setelah h2)',
      'B. Kedua paragraf di bawah h2',
      'C. Hanya "Paragraf Isi"',
      'D. Elemen h2 dan kedua paragraf'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kombinator sibling berdekatan (+) hanya mencocokkan elemen yang berada persis tepat setelah elemen pertama dalam hierarki saudara (sibling).'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Property',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan aturan pewarisan (inheritance) CSS berikut:

\`\`\`css
.container {
  color: #059669;
  border: 2px solid #000;
}
\`\`\`

Properti manakah di antara \`color\` dan \`border\` yang secara default diwariskan (inherited) kepada elemen anak di dalam \`.container\`?`,
    options: [
      'A. color diwariskan, sedangkan border tidak diwariskan',
      'B. Keduanya sama-sama diwariskan secara default',
      'C. border diwariskan, sedangkan color tidak diwariskan',
      'D. Keduanya sama-sama tidak diwariskan'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Properti tipografi seperti color, font-family, dan line-height secara default diwariskan ke elemen turunan, sedangkan properti box model seperti border, margin, dan padding tidak diwariskan.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Property',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan aturan pemotongan teks panjang berikut:

\`\`\`css
.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
\`\`\`

Apa efek visual dari kombinasi ketiga properti di atas saat teks melebihi lebar elemen?`,
    options: [
      'A. Teks dipotong dalam satu baris dan diakhiri dengan tanda elipsis (...)',
      'B. Teks dibungkus otomatis ke baris berikutnya',
      'C. Huruf teks mengecil otomatis agar muat dalam wadah',
      'D. Teks disembunyikan sepenuhnya dari layar'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kombinasi white-space: nowrap, overflow: hidden, dan text-overflow: ellipsis adalah teknik standar CSS untuk memotong teks satu baris dengan tanda (...).'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Property',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan aturan CSS dengan konflik spesifisitas berikut:

\`\`\`css
/* Aturan 1 */
#header .nav-link {
  color: blue;
}

/* Aturan 2 */
nav ul li a.nav-link {
  color: green;
}

/* Aturan 3 */
a.nav-link {
  color: orange;
}
\`\`\`

Jika sebuah elemen dicocokkan oleh ketiga aturan tersebut, warna apakah yang akan diterapkan pada teks elemen tersebut?`,
    options: [
      'A. Blue, karena Aturan 1 memiliki ID selector yang memberikan spesifisitas tertinggi (1, 1, 0)',
      'B. Green, karena Aturan 2 memiliki jumlah elemen selector terbanyak (0, 1, 4)',
      'C. Orange, karena Aturan 3 dideklarasikan paling akhir di dokumen',
      'D. Nilai default peramban (hitam)'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Spesifisitas dihitung berdasarkan [ID, Class/Atribut/Pseudo-class, Elemen/Pseudo-elemen]. Aturan 1 memiliki nilai (1, 1, 0) yang mengalahkan Aturan 2 (0, 1, 4) dan Aturan 3 (0, 1, 1).'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Property',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan aturan CSS yang menggunakan kata kunci \`!important\`:

\`\`\`css
#title {
  color: green;
}

p.highlight {
  color: red !important;
}
\`\`\`

Jika elemen memiliki \`<p id="title" class="highlight">Konten</p>\`, warna apakah yang akan tampil dan mengapa?`,
    options: [
      'A. Red, karena deklarasi dengan !important mengesampingkan deklarasi spesifisitas normal termasuk ID selector',
      'B. Green, karena ID selector #title memiliki level spesifisitas yang tidak dapat dikalahkan',
      'C. Browser akan mengalami crash dan merender warna bawaan peramban',
      'D. Campuran antara warna hijau dan merah'
    ],
    correct: 'A',
    points: 10,
    explanation: '!important meningkatkan deklarasi ke origin spesifisitas tertinggi dalam CSS Cascade, mengalahkan semua aturan normal terlepas dari seberapa tinggi nilai spesifisitas pemilihnya.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Selector',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penggunaan pseudo-class fungsional \`:is()\` dan \`:where()\` berikut:

\`\`\`css
/* Aturan A */
:is(header, footer) p {
  color: red;
}

/* Aturan B */
:where(header, footer) p {
  color: blue;
}
\`\`\`

Apa perbedaan utama dalam penghitungan spesifisitas antara Aturan A dan Aturan B?`,
    options: [
      'A. :is() mengambil spesifisitas tertinggi dari argumen pemilihnya, sedangkan :where() selalu memiliki spesifisitas nol (0, 0, 0)',
      'B. :where() selalu mengalahkan :is() karena dideklarasikan terakhir',
      'C. :is() hanya bekerja pada browser desktop, sedangkan :where() di browser mobile',
      'D. Tidak ada perbedaan spesifisitas, keduanya memiliki bobot yang identik'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pseudo-class :is() mengadopsi spesifisitas tertinggi dari daftar pemilih di dalam parameternya, sedangkan :where() secara eksplisit memiliki spesifisitas nol (0), memudahkan penimpaan gaya tanpa konflik.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Value',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan struktur hierarki font dengan satuan \`em\` dan \`rem\`:

\`\`\`css
html {
  font-size: 16px;
}

.parent {
  font-size: 1.5rem;
}

.child {
  font-size: 2em;
}
\`\`\`

Berapa ukuran font terkomputasi (computed font-size) aktual dalam satuan piksel pada elemen \`.child\`?`,
    options: [
      'A. 48px',
      'B. 32px',
      'C. 24px',
      'D. 64px'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Elemen html adalah 16px. .parent menggunakan 1.5rem = 1.5 * 16px = 24px. Elemen .child menggunakan 2em relatif terhadap font-size induknya (.parent) = 2 * 24px = 48px.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Value',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan deklarasi CSS kustom (CSS Variables) berikut:

\`\`\`css
:root {
  --theme-color: #3b82f6;
}

.card-title {
  color: var(--card-color, var(--theme-color, #1e293b));
}
\`\`\`

Jika variabel \`--card-color\` belum pernah didefinisikan, warna apakah yang akan digunakan oleh \`.card-title\`?`,
    options: [
      'A. #3b82f6 (nilai dari --theme-color sebagai nilai fallback pertama)',
      'B. #1e293b (nilai fallback paling akhir)',
      'C. Nilai transparan',
      'D. Error sintaks CSS dan teks tidak tampil'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Fungsi var(--name, fallback) mendukung fallback bertingkat. Karena --card-color tidak terdefinisi, browser beralih ke argumen fallback kedua var(--theme-color) yang bernilai #3b82f6.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Value',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan deklarasi warna dengan fungsi \`rgba()\`:

\`\`\`css
.overlay {
  background-color: rgba(0, 0, 0, 0.5);
}
\`\`\`

Apa arti dari nilai \`0.5\` pada argumen keempat di atas?`,
    options: [
      'A. Tingkat transparansi (kanal alfa) sebesar 50% (setengah transparan)',
      'B. Tingkat kecerahan saturasi warna hitam sebesar 50 persen',
      'C. Waktu transisi animasi selama 0.5 detik',
      'D. Ketebalan lapisan bayangan di belakang elemen'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Argumen keempat dalam fungsi rgba() merepresentasikan channel alpha (opasitas), dengan rentang 0 (sepenuhnya transparan) hingga 1 (sepenuhnya pekat). Nilai 0.5 berarti 50% opasitas.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Property',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan aturan kalkulasi dinamis berikut:

\`\`\`css
.sidebar {
  width: calc(100% - 250px);
}
\`\`\`

Apa syarat penulisan sintaks operator matematika (seperti \`+\` atau \`-\`) di dalam fungsi \`calc()\`?`,
    options: [
      'A. Operator + dan - wajib diapit spasi di kedua sisinya agar tidak tertukar dengan tanda negatif/positif',
      'B. Operator tidak boleh memiliki spasi sama sekali',
      'C. Hanya satuan piksel yang diperbolehkan di dalam fungsi calc',
      'D. calc() hanya dapat berjalan di dalam file skrip JavaScript'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dalam CSS calc(), operator penambahan (+) dan pengurangan (-) WAJIB dipisahkan oleh spasi di kedua sisinya (misal calc(100% - 20px), bukan calc(100%-20px)), untuk membedakannya dari tanda nilai negatif.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Selector',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pseudo-class \`:has()\` (parent selector) berikut:

\`\`\`css
.card:has(img) {
  padding-top: 0;
}
\`\`\`

Elemen manakah yang akan ditargetkan oleh aturan di atas?`,
    options: [
      'A. Elemen .card yang di dalamnya memuat setidaknya satu elemen <img>',
      'B. Hanya elemen <img> yang berada di dalam .card',
      'C. Semua elemen yang memiliki atribut has="img"',
      'D. Elemen gambar yang berada tepat di sebelah .card'
    ],
    correct: 'A',
    points: 10,
    explanation: ':has() adalah relational pseudo-class yang memilih elemen induk/leluhur jika ia memuat elemen anak yang cocok dengan selektor di dalam kurung (.card yang memiliki <img>).'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Property',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan properti penumpukan \`z-index\` berikut:

\`\`\`css
.modal {
  position: fixed;
  z-index: 1000;
}
\`\`\`

Mengapa \`z-index\` hanya dapat berfungsi efektif jika elemen memiliki nilai properti \`position\` tertentu?`,
    options: [
      'A. z-index hanya berlaku untuk elemen berposisi (positioned elements) yaitu selain position: static',
      'B. z-index hanya dapat digunakan pada elemen yang memiliki float: left',
      'C. z-index membutuhkan display: flex agar dapat dihitung',
      'D. z-index harus selalu bernilai genap'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dalam aliran dokumen standar, z-index hanya berlaku pada elemen yang memiliki posisi eksplisit (relative, absolute, fixed, sticky) atau merupakan flex/grid item.'
  },
  {
    topic_name: 'CSS Basics',
    concept_name: 'CSS Value',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan nilai warna heksadesimal \`#ffffff\`. Warna apakah yang direpresentasikan oleh kode tersebut?`,
    options: [
      'A. Putih',
      'B. Hitam (#000000)',
      'C. Merah (#ff0000)',
      'D. Biru (#0000ff)'
    ],
    correct: 'A',
    points: 10,
    explanation: '#ffffff memiliki nilai kanal Red, Green, dan Blue maksimum (255, 255, 255) yang menghasilkan warna putih sempurna.'
  },

  // =========================================================================
  // TOPIC 2: Box Model (Border, Content Box, Margin, Padding)
  // Current in DB: 11 (7 Easy, 3 Medium, 1 Hard, 0 with code)
  // Target added: 22 questions (all with code, 3 Easy, 8 Medium, 11 Hard) -> Total >= 33
  // =========================================================================
  {
    topic_name: 'Box Model',
    concept_name: 'Content Box',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan aturan CSS elemen kartu berikut dengan model kotak standar (\`box-sizing: content-box\`):

\`\`\`css
.card {
  box-sizing: content-box;
  width: 200px;
  padding: 12px;
  border: 2px solid #000;
}
\`\`\`

Berapa total ruang horizontal yang ditempati oleh elemen tersebut di layar (lebar konten + padding horizontal + border horizontal)?`,
    options: [
      'A. 228px',
      'B. 200px',
      'C. 214px',
      'D. 224px'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dengan content-box, total lebar = width (200px) + padding kiri (12px) + padding kanan (12px) + border kiri (2px) + border kanan (2px) = 200 + 24 + 4 = 228px.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Content Box',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan aturan CSS berikut yang menggunakan \`box-sizing: border-box\`:

\`\`\`css
.box {
  box-sizing: border-box;
  width: 300px;
  padding: 20px;
  border: 5px solid #333;
}
\`\`\`

Berapa lebar bersih area konten (content area width) di dalam elemen tersebut?`,
    options: [
      'A. 250px',
      'B. 300px',
      'C. 350px',
      'D. 275px'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dengan border-box, total width ditetapkan 300px mencakup padding dan border. Lebar konten = total width (300px) - padding horizontal (40px) - border horizontal (10px) = 250px.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Margin',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan dua elemen blok vertikal bertetangga berikut:

\`\`\`html
<div class="box-top"></div>
<div class="box-bottom"></div>
\`\`\`

\`\`\`css
.box-top {
  margin-bottom: 30px;
}

.box-bottom {
  margin-top: 20px;
}
\`\`\`

Berapa jarak vertikal aktual antara kedua elemen tersebut di layar akibat fenomena margin collapsing?`,
    options: [
      'A. 30px (margin vertikal melebur dan mengambil nilai terbesar di antara keduanya)',
      'B. 50px (penjumlahan 30px + 20px)',
      'C. 10px (selisih pengurangan 30px - 20px)',
      'D. 20px (margin terkecil)'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pada aliran dokumen normal (block formatting context), margin vertikal bersebelahan mengalami margin collapsing (peleburan), di mana jarak akhir adalah nilai terbesar dari kedua margin (30px).'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Padding',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penulisan ringkas (shorthand) padding berikut:

\`\`\`css
.box {
  padding: 10px 20px 30px 40px;
}
\`\`\`

Berapa nilai padding untuk sisi kiri (padding-left) elemen tersebut?`,
    options: [
      'A. 40px',
      'B. 10px',
      'C. 20px',
      'D. 30px'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Urutan 4 nilai shorthand padding mengikuti arah jarum jam: Top (10px), Right (20px), Bottom (30px), Left (40px).'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Margin',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan deklarasi pemusatan elemen blok berikut:

\`\`\`css
.card {
  width: 400px;
  margin: 0 auto;
}
\`\`\`

Apa efek dari deklarasi \`margin: 0 auto\` pada elemen di atas?`,
    options: [
      'A. Memusatkan elemen secara horizontal di tengah kontainer induknya',
      'B. Memusatkan elemen secara vertikal di tengah layar browser',
      'C. Menghapus seluruh margin dan padding elemen secara otomatis',
      'D. Menjadikan elemen memiliki posisi fixed di pojok atas'
    ],
    correct: 'A',
    points: 10,
    explanation: 'margin: 0 auto memberikan margin atas-bawah 0 dan membagi sisa ruang kosong kiri-kanan secara seimbang (auto), sehingga elemen blok berlebar tetap berada persis di tengah horizontal.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Border',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan aturan pembulatan sudut elemen:

\`\`\`css
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
}
\`\`\`

Bentuk visual apakah yang dihasilkan oleh deklarasi \`border-radius: 50%\` pada elemen persegi tersebut?`,
    options: [
      'A. Lingkaran sempurna',
      'B. Segitiga siku-siku',
      'C. Persegi panjang dengan sudut tumpul',
      'D. Oval condong horizontal'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pada elemen dengan width dan height yang sama (persegi), nilai border-radius: 50% akan melengkungkan setiap sudut setengah dari dimensinya sehingga menghasilkan lingkaran sempurna.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Border',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perbedaan antara properti \`border\` dan \`outline\`:

\`\`\`css
.button-focus {
  border: 2px solid transparent;
  outline: 3px solid #2563eb;
  outline-offset: 2px;
}
\`\`\`

Mengapa penggunaan \`outline\` lebih disukai untuk indikator fokus keyboard (focus ring) dibandingkan menambah ukuran \`border\`?`,
    options: [
      'A. Outline tidak memakan ruang dalam box model sehingga tidak menyebabkan pergeseran tata letak (layout shift)',
      'B. Outline secara otomatis mengubah font tombol menjadi cetak tebal',
      'C. Border tidak dapat diberi warna biru di browser mobile',
      'D. Outline hanya dapat dibuat menggunakan JavaScript event listener'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Outline digambar di luar batas elemen tanpa memengaruhi dimensi box model atau tata letak elemen di sekitarnya, mencegah layout shift yang mengganggu saat elemen menerima fokus.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Margin',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan elemen dengan margin negatif berikut:

\`\`\`css
.banner-overlay {
  margin-top: -40px;
}
\`\`\`

Apa dampak visual dari deklarasi \`margin-top: -40px\` terhadap elemen tersebut?`,
    options: [
      'A. Elemen akan bergeser ke atas sebesar 40px menimpa elemen di atasnya',
      'B. Elemen akan terdorong ke bawah sebesar 40px menjauhi elemen di atasnya',
      'C. Tinggi elemen berkurang sebesar 40px secara otomatis',
      'D. Nilai margin negatif diabaikan oleh browser karena tidak valid'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Margin negatif pada arah atas (margin-top: -40px) menarik elemen ke atas sebesar 40 piksel dari posisi normalnya dalam aliran dokumen.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Content Box',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan aturan CSS reset yang umum digunakan dalam proyek modern:

\`\`\`css
*, *::before, *::after {
  box-sizing: border-box;
}
\`\`\`

Mengapa aturan reset di atas hampir selalu diterapkan di awal pengembangan antarmuka web?`,
    options: [
      'A. Membuat kalkulasi ukuran komponen intuitif karena padding dan border tidak menambah lebar/tinggi total elemen',
      'B. Memaksa semua elemen di halaman web menjadi bertipe display block',
      'C. Mencegah browser menerapkan warna latar belakang default',
      'D. Meningkatkan kecepatan unduh berkas CSS dari Content Delivery Network'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dengan box-sizing: border-box di seluruh elemen, nilai width dan height yang ditetapkan sudah mencakup padding dan border, membuat tata letak jauh lebih mudah diprediksi dan responsif.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Padding',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan shorthand padding dengan 2 nilai berikut:

\`\`\`css
.alert {
  padding: 16px 24px;
}
\`\`\`

Berapa besar padding untuk sisi vertikal (atas & bawah) dan horizontal (kiri & kanan) elemen tersebut?`,
    options: [
      'A. Vertikal 16px dan Horizontal 24px',
      'B. Vertikal 24px dan Horizontal 16px',
      'C. Atas 16px dan 24px untuk tiga sisi lainnya',
      'D. Kiri 16px dan Kanan 24px'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Ketika padding memiliki dua nilai (padding: Y X), nilai pertama berlaku untuk vertikal (top & bottom: 16px) dan nilai kedua berlaku untuk horizontal (left & right: 24px).'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Margin',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fenomena runtuhnya margin antara elemen induk dan anak pertama (parent-child margin collapse):

\`\`\`html
<div class="parent">
  <p class="child">Teks paragraf pertama</p>
</div>
\`\`\`

\`\`\`css
.parent {
  background-color: lightblue;
}
.child {
  margin-top: 40px;
}
\`\`\`

Jika \`.parent\` tidak memiliki padding atau border atas, apa yang terjadi pada \`margin-top: 40px\` milik \`.child\`?`,
    options: [
      'A. Margin anak "bocor" keluar dan menjadi margin atas dari elemen induk (.parent)',
      'B. Margin anak tetap tertahan rapi di dalam latar belakang biru elemen induk',
      'C. Nilai margin-top diabaikan sepenuhnya oleh browser',
      'D. Latar belakang parent meluas ke atas sebesar 40px'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Ketika elemen induk tidak memiliki border atau padding pemisah, margin vertikal anak pertama akan bergabung (collapse) dengan margin induk dan mendorong induk dari luar.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Border',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan teknik pembuatan bentuk segitiga CSS menggunakan properti border:

\`\`\`css
.triangle {
  width: 0;
  height: 0;
  border-left: 20px solid transparent;
  border-right: 20px solid transparent;
  border-bottom: 30px solid #2563eb;
}
\`\`\`

Bagaimana browser merender elemen dengan dimensi 0x0 di atas?`,
    options: [
      'A. Sebagai segitiga berwarna biru mengarah ke atas berlebar alas 40px dan tinggi 30px',
      'B. Sebagai persegi panjang transparan',
      'C. Elemen tidak terlihat sama sekali karena width dan height bernilai 0',
      'D. Sebagai lingkaran berwarna biru'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Ketika dimensi elemen 0x0, pertemuan antar-border membentuk garis miring diagonal. Mengatur border kiri/kanan transparan dan border bawah berwarna menghasilkan segitiga mengarah ke atas.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Padding',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perilaku padding vertikal pada elemen \`inline\` murni:

\`\`\`css
span.highlight {
  display: inline;
  padding-top: 20px;
  padding-bottom: 20px;
  background-color: yellow;
}
\`\`\`

Bagaimana pengaruh padding vertikal di atas terhadap baris teks di sekitarnya?`,
    options: [
      'A. Latar kuning melebar ke atas dan bawah menimpa baris lain, tetapi jarak antar-baris (line-height) tidak berubah',
      'B. Mendorong baris teks atas dan bawah secara rapi seperti elemen blok',
      'C. Browser secara otomatis mengubah elemen inline menjadi display: block',
      'D. Nilai padding-top dan padding-bottom diabaikan sepenuhnya'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Elemen inline tidak memperhitungkan padding vertikal dalam perhitungan line-box flow, sehingga latar belakangnya dapat meluap dan menimpa baris teks di atas/bawahnya tanpa mendorong baris.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Content Box',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan kotak dengan dimensi persentase di dalam kontainer berukuran \`width: 500px\` dan \`height: 300px\`:

\`\`\`css
.box {
  width: 50%;
  padding-top: 10%;
}
\`\`\`

Berapa nilai terkomputasi (computed value) dari \`padding-top\` dalam satuan piksel?`,
    options: [
      'A. 50px (karena persentase padding selalu dihitung dari lebar/width kontainer induk)',
      'B. 30px (dihitung dari tinggi/height kontainer induk)',
      'C. 25px (dihitung dari lebar elemen itu sendiri)',
      'D. 10px'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dalam CSS Box Model standar, nilai persentase untuk padding (termasuk padding-top dan padding-bottom) SELALU dihitung relatif terhadap lebar (width) kontainer induk (10% dari 500px = 50px).'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Margin',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan elemen dengan shorthand 3 nilai berikut:

\`\`\`css
.container {
  margin: 10px auto 20px;
}
\`\`\`

Berapa nilai margin untuk sisi atas, horizontal (kiri & kanan), dan bawah berturut-turut?`,
    options: [
      'A. Atas 10px, Horizontal auto, Bawah 20px',
      'B. Atas 10px, Kiri auto, Bawah 20px',
      'C. Vertikal 10px, Kanan auto, Bawah 20px',
      'D. Atas 10px, Kanan auto, Kiri 20px'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Shorthand 3 nilai (margin: Top Horizontal Bottom): nilai pertama adalah Top (10px), nilai kedua adalah Left & Right (auto), dan nilai ketiga adalah Bottom (20px).'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Border',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan properti \`box-shadow\` berikut:

\`\`\`css
.card {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
\`\`\`

Nilai keempat (\`-1px\`) pada deklarasi \`box-shadow\` di atas merepresentasikan properti apa?`,
    options: [
      'A. Spread radius (radius sebaran pelebaran/penyusutan bayangan)',
      'B. Blur radius (radius keburaman)',
      'C. Offset vertikal bayangan',
      'D. Opasitas bayangan'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Format box-shadow adalah: [offset-x] [offset-y] [blur-radius] [spread-radius] [color]. Nilai -1px adalah spread-radius yang menyusutkan ukuran fisik bayangan sebelum diburamkan.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Content Box',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan deklarasi properti overflow berikut:

\`\`\`css
.scroll-container {
  width: 300px;
  height: 200px;
  overflow-y: auto;
  overflow-x: hidden;
}
\`\`\`

Bagaimana perilaku elemen jika konten teks di dalamnya memiliki tinggi 400 piksel?`,
    options: [
      'A. Bilah gulir vertikal (scrollbar) akan muncul secara otomatis, sedangkan arah horizontal tidak dapat digulir',
      'B. Konten teks yang melebihi 200 piksel akan terpotong permanen dan tidak dapat dibaca',
      'C. Tinggi kontainer otomatis membesar menjadi 400 piksel',
      'D. Halaman web secara keseluruhan akan terkunci dari scrolling'
    ],
    correct: 'A',
    points: 10,
    explanation: 'overflow-y: auto menampilkan scrollbar vertikal hanya saat konten meluap (overflow), sementara overflow-x: hidden memotong luapan horizontal.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Margin',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Bagaimana cara membuat elemen membuat Block Formatting Context (BFC) baru sehingga mencegah margin collapsing dengan elemen di luarnya?`,
    options: [
      'A. Menambahkan overflow: hidden atau display: flow-root pada elemen kontainer',
      'B. Mengubah color teks menjadi transparan',
      'C. Mengatur font-size menjadi 0',
      'D. Menghapus tag penutup HTML'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Membuat Block Formatting Context (BFC) baru menggunakan display: flow-root atau overflow: hidden/auto mengisolasi tata letak internal dan mencegah peleburan margin vertikal dengan elemen luar.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Padding',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan tombol dengan deklarasi:

\`\`\`css
.btn {
  display: inline-block;
  padding: 0.5rem 1rem;
}
\`\`\`

Mengapa \`display: inline-block\` penting untuk tombol yang menggunakan padding di atas?`,
    options: [
      'A. Memungkinkan tombol duduk sejajar dengan teks lain (inline) sekaligus menghormati margin dan padding vertikal secara penuh',
      'B. Menjadikan tombol memenuhi 100% lebar layar secara paksa',
      'C. Mencegah tombol diklik lebih dari satu kali',
      'D. Mengubah teks tombol menjadi huruf kapital semua'
    ],
    correct: 'A',
    points: 10,
    explanation: 'inline-block mempertahankan sifat flow inline (dapat berdampingan satu baris) tetapi memiliki kemampuan block-level dalam menghitung width, height, padding, dan margin secara presisi.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Border',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan deklarasi garis batas berikut:

\`\`\`css
.divider {
  border-top: 1px solid #e2e8f0;
}
\`\`\`

Sisi manakah dari elemen yang akan memiliki garis batas (border)?`,
    options: [
      'A. Hanya sisi atas elemen',
      'B. Semua keempat sisi elemen',
      'C. Sisi kiri dan sisi kanan',
      'D. Hanya sisi bawah elemen'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Properti border-top secara spesifik hanya memberikan border pada batas sisi atas elemen.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Content Box',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan aturan elemen input yang lebarnya sering meluap dari wadah:

\`\`\`css
.form-group {
  width: 100%;
}
.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ccc;
  box-sizing: border-box;
}
\`\`\`

Mengapa penambahan \`box-sizing: border-box\` mencegah input meluap (overflow) keluar dari \`.form-group\`?`,
    options: [
      'A. Nilai width: 100% sudah menyerap padding 10px dan border 1px ke dalam lebar 100%, sehingga total lebar tidak melebihi 100%',
      'B. Menghapus padding saat browser diperkecil',
      'C. Mengubah lebar input menjadi 50% secara otomatis',
      'D. Membatasi ukuran font agar tidak membesar'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Tanpa border-box, width: 100% + padding 20px + border 2px menghasilkan total lebar lebih dari 100% yang menyebabkan horizontal overflow. border-box menjaga total lebar pas 100%.'
  },
  {
    topic_name: 'Box Model',
    concept_name: 'Margin',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan properti logis (CSS Logical Properties) modern berikut:

\`\`\`css
.article-body {
  margin-block: 2rem;
  margin-inline: auto;
}
\`\`\`

Deklarasi logis di atas setara dengan deklarasi fisik apa pada mode penulisan horizontal standar?`,
    options: [
      'A. margin-top: 2rem; margin-bottom: 2rem; margin-left: auto; margin-right: auto;',
      'B. margin-top: auto; margin-bottom: auto; margin-left: 2rem; margin-right: 2rem;',
      'C. margin: 2rem;',
      'D. margin: auto;'
    ],
    correct: 'A',
    points: 10,
    explanation: 'margin-block mengatur margin pada sumbu blok vertikal (top & bottom), sedangkan margin-inline mengatur margin pada sumbu inline horizontal (left & right).'
  },

  // =========================================================================
  // TOPIC 3: Flexbox (Flex Container, Flex Direction, Flex Items)
  // Current in DB: 7 (3 Easy, 4 Medium, 0 Hard, 0 with code)
  // Target added: 25 questions (all with code, 7 Easy, 7 Medium, 11 Hard) -> Total >= 32
  // =========================================================================
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Container',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan deklarasi wadah berikut:

\`\`\`css
.nav-menu {
  display: flex;
}
\`\`\`

Secara default, ke arah manakah anak-anak elemen (flex items) di dalam \`.nav-menu\` akan disusun?`,
    options: [
      'A. Horizontal ke samping kanan (baris dari kiri ke kanan)',
      'B. Vertikal ke bawah (kolom bertumpuk)',
      'C. Diagonal menyilang dari kiri atas ke kanan bawah',
      'D. Melayang bebas sesuai posisi kursor mouse'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Nilai default properti flex-direction pada flex container adalah row, yang menyusun flex items secara horizontal dalam satu baris dari kiri ke kanan (pada mode penulisan LTR).'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Container',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan aturan perataan flexbox berikut:

\`\`\`css
.toolbar {
  display: flex;
  justify-content: space-between;
}
\`\`\`

Bagaimana posisi item-item anak yang diatur dengan \`justify-content: space-between\`?`,
    options: [
      'A. Item pertama menempel di ujung awal, item terakhir menempel di ujung akhir, dan sisa ruang didistribusikan merata di antara item',
      'B. Semua item berkumpul rapat persis di tengah wadah',
      'C. Semua item memiliki jarak yang sama termasuk di tepi luar kiri dan kanan',
      'D. Item disusun vertikal saling menumpuk satu sama lain'
    ],
    correct: 'A',
    points: 10,
    explanation: 'space-between mendistribusikan item secara merata di sepanjang sumbu utama (main axis) dengan item pertama di tepi awal dan item terakhir di tepi akhir tanpa margin di tepi luar.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Container',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Bagaimana cara paling ringkas dan modern untuk memusatkan sebuah elemen persis di tengah-tengah secara vertikal dan horizontal menggunakan Flexbox?

\`\`\`css
.hero-wrapper {
  display: flex;
  /* Aturan pemusatan di sini */
}
\`\`\` `,
    options: [
      'A. justify-content: center; align-items: center;',
      'B. text-align: center; vertical-align: middle;',
      'C. float: center; margin: 0 auto;',
      'D. flex-direction: center; align-content: middle;'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kombinasi justify-content: center (sumbu utama) dan align-items: center (sumbu silang) adalah cara kanonis untuk memusatkan item secara horizontal dan vertikal sekaligus.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Container',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan deretan tombol navigasi dengan jarak seragam:

\`\`\`css
.button-group {
  display: flex;
  gap: 12px;
}
\`\`\`

Apa keunggulan properti \`gap: 12px\` pada flex container dibandingkan memberikan \`margin-right: 12px\` pada setiap tombol?`,
    options: [
      'A. gap hanya memberikan jarak DI ANTARA tombol, tanpa menambahkan margin yang tidak diinginkan pada tombol terakhir',
      'B. gap bekerja lebih cepat daripada CSS margin',
      'C. gap secara otomatis mengubah warna border tombol',
      'D. margin-right dilarang digunakan di dalam display: flex'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Properti gap hanya membuat gutter di antara flex items dan secara otomatis tidak menambahkan margin pada item terakhir, meniadakan perlunya pseudo-class :last-child margin reset.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Direction',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan deklarasi pembalikan arah baris berikut:

\`\`\`css
.comment-thread {
  display: flex;
  flex-direction: row-reverse;
}
\`\`\`

Bagaimana susunan visual elemen anak dari kiri ke kanan di layar?`,
    options: [
      'A. Elemen disusun horizontal tetapi urutannya dibalik (elemen terakhir di kode HTML berada paling kiri)',
      'B. Elemen disusun vertikal dari bawah ke atas',
      'C. Teks di dalam elemen dicerminkan secara horizontal',
      'D. Elemen disembunyikan dari layar'
    ],
    correct: 'A',
    points: 10,
    explanation: 'flex-direction: row-reverse membalikkan sumbu utama horizontal sehingga item pertama dimulai dari sisi kanan dan bergerak ke kiri (urutan visual terbalik).'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Direction',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan pengaturan flexbox berikut:

\`\`\`css
.sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
}
\`\`\`

Pada konfigurasi \`flex-direction: column\`, sumbu (axis) manakah yang dikontrol oleh properti \`align-items\`?`,
    options: [
      'A. Sumbu horizontal (cross axis tegak lurus terhadap arah kolom)',
      'B. Sumbu vertikal (main axis utama)',
      'C. Sumbu kedalaman z-index',
      'D. Kecepatan transisi animasi flex'
    ],
    correct: 'A',
    points: 10,
    explanation: 'align-items selalu mengontrol perataan pada sumbu silang (cross axis). Karena flex-direction adalah column (main axis = vertikal), maka cross axis-nya adalah sumbu horizontal.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Container',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan deretan kartu produk di dalam flex container:

\`\`\`css
.product-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
\`\`\`

Apa fungsi dari \`flex-wrap: wrap\` dan \`gap: 16px\`?`,
    options: [
      'A. Mengizinkan item berpindah ke baris baru jika ruang tidak cukup, dan memberi jarak 16px antar item tanpa margin manual',
      'B. Memaksa semua item tetap dalam satu baris dengan jarak 16px ke tepi browser',
      'C. Membungkus setiap kartu produk dengan border tebal 16px',
      'D. Mengatur animasi kartu saat kursor diarahkan ke kartu'
    ],
    correct: 'A',
    points: 10,
    explanation: 'flex-wrap: wrap memungkinkan item membungkus ke baris berikutnya saat lebar kontainer tidak cukup, dan properti gap menetapkan jarak gutter antar item secara rapi.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan properti flex item pada layout dua kolom:

\`\`\`css
.sidebar {
  width: 250px;
  flex-shrink: 0;
}

.content {
  flex-grow: 1;
}
\`\`\`

Apa arti dari deklarasi \`flex-shrink: 0\` pada \`.sidebar\` dan \`flex-grow: 1\` pada \`.content\`?`,
    options: [
      'A. Sidebar tidak akan mengecil di bawah 250px saat ruang menyempit, dan content akan membesar memenuhi sisa ruang kosong',
      'B. Sidebar akan menghilang saat layar ponsel, dan content mengecil 1 piksel',
      'C. Content menjadi elemen melayang (floating element) di atas sidebar',
      'D. Keduanya memiliki lebar yang sama secara otomatis'
    ],
    correct: 'A',
    points: 10,
    explanation: 'flex-shrink: 0 mencegah item menyusut dari ukuran dasarnya, sedangkan flex-grow: 1 menginstruksikan item untuk meregang menghabiskan seluruh sisa ruang kosong yang tersedia.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan flex item tunggal yang ingin memiliki perataan silang berbeda dari saudara-saudaranya:

\`\`\`css
.container {
  display: flex;
  align-items: flex-start;
}

.special-item {
  align-self: flex-end;
}
\`\`\`

Apa peran properti \`align-self: flex-end\` pada \`.special-item\`?`,
    options: [
      'A. Menimpa nilai align-items kontainer hanya untuk elemen tersebut dan merapatkannya ke sisi bawah/akhir cross axis',
      'B. Memindahkan item ke akhir dokumen HTML secara fisik',
      'C. Menghapus item dari flex formatting context',
      'D. Mengatur posisi teks di dalam tombol agar berada di kanan bawah'
    ],
    correct: 'A',
    points: 10,
    explanation: 'align-self memungkinkan flex item individual menimpa (override) aturan align-items yang ditetapkan pada kontainer induknya.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Container',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perbedaan perataan multi-baris berikut:

\`\`\`css
.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  align-content: space-between;
  height: 300px;
}
\`\`\`

Kapan properti \`align-content\` memiliki pengaruh visual pada tata letak Flexbox?`,
    options: [
      'A. Hanya ketika flex-wrap: wrap aktif dan terdapat lebih dari satu baris flex items dengan ruang kosong ekstra pada cross axis',
      'B. Selalu aktif pada flex container satu baris (single line)',
      'C. Hanya ketika semua elemen anak memiliki display: inline',
      'D. Ketika peramban dijalankan pada mode layar penuh'
    ],
    correct: 'A',
    points: 10,
    explanation: 'align-content mengontrol distribusi ruang di antara baris-baris flex items pada cross axis, sehingga HANYA bekerja pada kontainer multi-line (flex-wrap: wrap) yang memiliki sisa ruang vertikal.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penulisan ringkas properti flex item:

\`\`\`css
.item {
  flex: 1 1 200px;
}
\`\`\`

Tiga nilai shorthand \`flex\` di atas berturut-turut merepresentasikan properti apa saja?`,
    options: [
      'A. flex-grow, flex-shrink, dan flex-basis',
      'B. flex-basis, flex-grow, dan flex-shrink',
      'C. flex-direction, flex-wrap, dan flex-gap',
      'D. flex-order, flex-span, dan flex-width'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Shorthand flex: 1 1 200px merepresentasikan nilai flex-grow (1), flex-shrink (1), dan flex-basis (200px).'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan flex item dengan properti \`margin-left: auto\` pada menu navigasi:

\`\`\`html
<nav class="navbar">
  <div class="logo">Logo</div>
  <a href="#">Beranda</a>
  <a href="#">Artikel</a>
  <button class="btn-login">Masuk</button>
</nav>
\`\`\`

\`\`\`css
.navbar {
  display: flex;
  align-items: center;
}

.btn-login {
  margin-left: auto;
}
\`\`\`

Apa efek dari \`margin-left: auto\` pada tombol \`.btn-login\`?`,
    options: [
      'A. Mendorong tombol .btn-login ke ujung paling kanan navbar dengan menyerap seluruh sisa ruang kosong di sisi kirinya',
      'B. Memusatkan tombol tepat di tengah-tengah navbar',
      'C. Menyembunyikan tombol dari tampilan visual',
      'D. Mengubah ukuran tombol menjadi sebesar lebar layar'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dalam Flexbox, margin auto menyerap semua sisa ruang kosong pada sumbu terkait. margin-left: auto mendorong elemen ke ujung kanan secara sempurna.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan urutan item dengan properti \`order\`:

\`\`\`html
<div class="container">
  <div class="item-a">A</div>
  <div class="item-b">B</div>
  <div class="item-c">C</div>
</div>
\`\`\`

\`\`\`css
.container {
  display: flex;
}

.item-b {
  order: -1;
}
\`\`\`

Bagaimana urutan tampilan visual dari ketiga item tersebut dari kiri ke kanan di layar?`,
    options: [
      'A. B, A, C',
      'B. A, B, C',
      'C. C, B, A',
      'D. A, C, B'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Nilai default order untuk semua flex item adalah 0. Memberikan order: -1 pada .item-b menjadikannya memiliki nilai terkecil, sehingga tampil paling pertama secara visual (B, A, C).'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan masalah teks panjang di dalam flex item yang sering meluap:

\`\`\`css
.flex-item {
  flex: 1;
  min-width: 0;
}
.text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
\`\`\`

Mengapa deklarasi \`min-width: 0\` krusial agar pemotongan teks (\`text-overflow: ellipsis\`) berfungsi di dalam flex item?`,
    options: [
      'A. Mengesampingkan nilai bawaan min-width: auto pada flex item yang mencegah elemen menyusut lebih kecil dari ukuran konten minimumnya',
      'B. Mengubah tipe font teks menjadi monospace',
      'C. Mencegah flex item membesar melebihi tinggi induknya',
      'D. Menghilangkan margin di sekeliling teks'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Secara default, flex items memiliki min-width: auto yang mencegah item menyusut di bawah lebar konten intrinsiknya. Menetapkan min-width: 0 memungkinkan item menyusut dan mengizinkan text-overflow: ellipsis memotong teks.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan tiga flex items dengan bobot pertambahan \`flex-grow\` berbeda di dalam kontainer berukuran 600px:

\`\`\`css
.item-1 { flex-basis: 100px; flex-grow: 1; }
.item-2 { flex-basis: 100px; flex-grow: 2; }
.item-3 { flex-basis: 100px; flex-grow: 0; }
\`\`\`

Berapa lebar akhir elemen \`.item-2\` setelah sisa ruang kosong didistribusikan?`,
    options: [
      'A. 300px (100px basis + 2/3 dari sisa 300px ruang kosong)',
      'B. 200px',
      'C. 250px',
      'D. 400px'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Total basis = 100 + 100 + 100 = 300px. Sisa ruang = 600 - 300 = 300px. Total grow = 1 + 2 + 0 = 3 bagian. Item-2 mendapat (2/3 * 300px) = 200px tambahan. Lebar akhir = 100px + 200px = 300px.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Direction',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan tata letak mobile-to-desktop yang beralih arah flex:

\`\`\`css
.hero {
  display: flex;
  flex-direction: column;
}
@media (min-width: 768px) {
  .hero {
    flex-direction: row;
  }
}
\`\`\`

Apa konsekuensi transisi \`flex-direction\` dari \`column\` ke \`row\` terhadap properti \`justify-content\`?`,
    options: [
      'A. Sumbu utama yang dikontrol justify-content berpindah dari sumbu vertikal menjadi sumbu horizontal',
      'B. justify-content dinonaktifkan secara otomatis',
      'C. Nilai justify-content direset menjadi flex-start',
      'D. Tidak ada pengaruh apa pun terhadap arah perataan'
    ],
    correct: 'A',
    points: 10,
    explanation: 'justify-content SELALU mengontrol perataan di sepanjang main axis. Pada column, main axis adalah vertikal; pada row, main axis beralih menjadi horizontal.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Container',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perilaku nilai bawaan \`align-items: stretch\`:

\`\`\`css
.card-deck {
  display: flex;
}
.card {
  /* Tidak memiliki deklarasi height */
}
\`\`\`

Mengapa semua kartu di dalam \`.card-deck\` memiliki tinggi yang persis sama meskipun isi konten teksnya berbeda panjang?`,
    options: [
      'A. Nilai default align-items adalah stretch, yang meregangkan semua flex items agar memiliki tinggi sama mengikuti item tertinggi',
      'B. Browser memotong konten kartu yang lebih panjang',
      'C. Flexbox menghitung rata-rata tinggi kata',
      'D. Kartu secara otomatis menggunakan position: absolute'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Nilai default align-items adalah stretch. Selama item tidak memiliki nilai height eksplisit, semua item akan diregangkan memenuhi tinggi kontainer induk (mengikuti item tertinggi).'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan deklarasi pembagian lebar sama rata pada navigasi:

\`\`\`css
.nav-tab {
  flex: 1 1 0;
}
\`\`\`

Mengapa \`flex: 1 1 0\` menghasilkan kolom dengan lebar yang persis sama, sedangkan \`flex: 1 1 auto\` tidak selalu menghasilkan lebar yang sama?`,
    options: [
      'A. flex-basis: 0 mengabaikan ukuran konten awal sehingga seluruh ruang dibagi murni merata berdasarkan rasio grow',
      'B. flex-basis: 0 menyembunyikan konten awal',
      'C. flex: 1 1 auto adalah sintaks usang yang tidak didukung',
      'D. flex-basis: 0 hanya bekerja untuk elemen teks'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dengan basis 0, seluruh lebar wadah dianggap sebagai ruang kosong dan dibagi rata. Dengan basis auto, ruang kosong dihitung setelah dikurangi ukuran awal masing-masing konten, sehingga item dengan teks lebih panjang akan lebih lebar.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Container',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan deklarasi flex perataan akhir:

\`\`\`css
.actions {
  display: flex;
  justify-content: flex-end;
}
\`\`\`

Di manakah kumpulan tombol aksi akan diposisikan?`,
    options: [
      'A. Di ujung kanan (akhir sumbu utama)',
      'B. Di ujung kiri',
      'C. Tepat di tengah-tengah',
      'D. Di sudut kiri bawah'
    ],
    correct: 'A',
    points: 10,
    explanation: 'justify-content: flex-end meratakan seluruh flex items ke tepi akhir sumbu utama (kanan pada mode LTR row).'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perilaku penyusutan \`flex-shrink\` ketika total lebar item melebihi kontainer:

\`\`\`css
.container { width: 500px; display: flex; }
.item-a { width: 300px; flex-shrink: 1; }
.item-b { width: 300px; flex-shrink: 3; }
\`\`\`

Item manakah yang akan mengalami penyusutan lebih banyak saat ruang menyempit?`,
    options: [
      'A. .item-b, karena memiliki bobot flex-shrink yang lebih besar (3x lebih agresif menyusut)',
      'B. .item-a',
      'C. Keduanya menyusut dalam jumlah piksel yang identik',
      'D. Tidak ada yang menyusut karena total lebar melebihi batas'
    ],
    correct: 'A',
    points: 10,
    explanation: 'flex-shrink menentukan rasio penyusutan relatif ketika terjadi luapan (overflow). Semakin tinggi nilai flex-shrink, semakin besar proporsi penyusutan yang dibebankan pada item tersebut.'
  },

  // =========================================================================
  // TOPIC 4: Responsive Design (Breakpoint, Media Query, Viewport)
  // Current in DB: 6 (1 Easy, 2 Medium, 3 Hard, 0 with code)
  // Target added: 26 questions (all with code, 9 Easy, 9 Medium, 8 Hard) -> Total >= 32
  // =========================================================================
  {
    topic_name: 'Responsive Design',
    concept_name: 'Viewport',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan tag meta viewport wajib pada dokumen responsif:

\`\`\`html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
\`\`\`

Apa fungsi utama dari deklarasi \`width=device-width\` pada tag di atas?`,
    options: [
      'A. Menginstruksikan browser seluler untuk menyesuaikan lebar viewport dengan lebar fisik layar perangkat',
      'B. Memaksa browser membuka situs dalam versi desktop berukuran 1280 piksel',
      'C. Mengunci orientasi layar perangkat agar selalu berada dalam mode landscape',
      'D. Mengaktifkan fitur zoom cubit (pinch-to-zoom) tanpa batasan'
    ],
    correct: 'A',
    points: 10,
    explanation: 'width=device-width memberi tahu browser seluler untuk menyamakan lebar viewport virtual dengan lebar layar fisik perangkat (CSS pixels), mencegah zoom-out desktop default.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Media Query',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan aturan media query berikut:

\`\`\`css
@media (min-width: 768px) {
  .sidebar {
    display: block;
  }
}
\`\`\`

Kapan gaya CSS di dalam media query tersebut akan diterapkan?`,
    options: [
      'A. Ketika lebar layar viewport berukuran 768 piksel atau lebih besar',
      'B. Hanya ketika lebar layar viewport kurang dari 768 piksel',
      'C. Tepat pada layar yang lebarnya persis 768 piksel saja',
      'D. Hanya ketika halaman web dicetak menggunakan printer fisik'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kondisi min-width: 768px berarti "mulai dari lebar 768px ke atas", pendekatan dasar dalam perancangan mobile-first responsive design.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Viewport',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan satuan viewport \`100vh\` dan \`100vw\` berikut:

\`\`\`css
.fullscreen-hero {
  width: 100vw;
  height: 100vh;
}
\`\`\`

Berapa dimensi dari elemen \`.fullscreen-hero\` di atas?`,
    options: [
      'A. Lebar 100% dari lebar viewport dan tinggi 100% dari tinggi viewport layar peramban',
      'B. Lebar 100 piksel dan tinggi 100 piksel',
      'C. Lebar setengah layar dan tinggi dua kali tinggi layar',
      'D. Mengikuti ukuran dokumen HTML secara keseluruhan'
    ],
    correct: 'A',
    points: 10,
    explanation: '1vw sama dengan 1% dari lebar viewport, dan 1vh sama dengan 1% dari tinggi viewport. 100vw dan 100vh mencakup 100% area tampak layar peramban.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Breakpoint',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan strategi penulisan CSS dengan pendekatan Mobile-First:

\`\`\`css
/* Gaya Dasar (Mobile Default) */
.layout {
  display: flex;
  flex-direction: column;
}

/* Breakpoint Tablet */
@media (min-width: 768px) {
  .layout {
    flex-direction: row;
  }
}
\`\`\`

Mengapa pendekatan Mobile-First lebih direkomendasikan dalam pengembangan web modern?`,
    options: [
      'A. Memprioritaskan konten esensial dan performa perangkat terbatas sebelum menambahkan kompleksitas tata letak layar lebar',
      'B. Mencegah berkas CSS diunduh oleh komputer desktop',
      'C. Memastikan situs web dapat diunggah ke Google Play Store secara langsung',
      'D. Menghilangkan kebutuhan untuk menguji tampilan pada browser desktop'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Mobile-first memprioritaskan performa dan hierarki konten perangkat dengan keterbatasan layar dan jaringan terlebih dahulu, lalu secara progresif menambahkan gaya untuk layar yang lebih besar via min-width.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Media Query',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan aturan media query dengan rentang terbatas berikut:

\`\`\`css
@media (min-width: 600px) and (max-width: 1024px) {
  .gallery {
    grid-template-columns: repeat(2, 1fr);
  }
}
\`\`\`

Rentang ukuran viewport manakah yang akan mengaktifkan aturan grid 2 kolom di atas?`,
    options: [
      'A. Layar dengan lebar antara 600px hingga 1024px (inklusif)',
      'B. Layar di bawah 600px dan layar di atas 1024px',
      'C. Layar smartphone kecil di bawah 600px saja',
      'D. Layar monitor televisi di atas 1024px saja'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Operator and menggabungkan kondisi: aturan hanya berlaku jika lebar viewport memenuhi kedua syarat sekaligus (antara 600px hingga 1024px).'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Viewport',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan aturan gambar responsif berikut:

\`\`\`css
img.responsive {
  max-width: 100%;
  height: auto;
}
\`\`\`

Apa manfaat dari kombinasi \`max-width: 100%\` dan \`height: auto\` pada gambar?`,
    options: [
      'A. Gambar akan menyusut secara proporsional agar tidak meluap (overflow) dari wadahnya tanpa merusak rasio aspek',
      'B. Memaksa gambar selalu membesar hingga memenuhi layar penuh',
      'C. Mengubah format gambar dari JPEG menjadi format SVG',
      'D. Menghapus latar belakang gambar transparan'
    ],
    correct: 'A',
    points: 10,
    explanation: 'max-width: 100% memastikan gambar tidak pernah melebihi lebar wadah induknya, sementara height: auto menjaga rasio aspek intrinsik gambar agar tidak terdistorsi (gepeng).'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Breakpoint',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penentuan breakpoint pada tata letak grid:

\`\`\`css
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
\`\`\`

Apa keistimewaan dari formula \`repeat(auto-fit, minmax(250px, 1fr))\` di atas?`,
    options: [
      'A. Menciptakan tata letak grid responsif multi-kolom yang menyesuaikan diri otomatis tanpa memerlukan penulisan @media query',
      'B. Membatasi kontainer agar hanya dapat memuat maksimal 2 kartu',
      'C. Memaksa setiap kolom selalu berukuran tepat 250 piksel tanpa dapat meregang',
      'D. Menghilangkan scrollbar horizontal pada tabel data'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kombinasi auto-fit dan minmax(250px, 1fr) membuat grid secara otomatis membungkus kolom baru saat ruang mencukupi dan meregangkannya saat ruang tersisa, menghasilkan responsivitas murni tanpa media query tunggal pun.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Media Query',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fitur media query preferensi sistem operasi berikut:

\`\`\`css
@media (prefers-color-scheme: dark) {
  body {
    background-color: #0f172a;
    color: #f8fafc;
  }
}
\`\`\`

Apa pemicu aktifnya aturan CSS di atas?`,
    options: [
      'A. Ketika pengguna mengaktifkan mode gelap (Dark Mode) pada pengaturan sistem operasi perangkat mereka',
      'B. Ketika waktu setempat pengguna menunjukkan pukul 18.00 ke atas',
      'C. Ketika pengguna mematikan lampu ruangan yang dideteksi oleh kamera perangkat',
      'D. Ketika baterai perangkat berada di bawah 20 persen'
    ],
    correct: 'A',
    points: 10,
    explanation: 'prefers-color-scheme adalah media feature CSS yang mendeteksi preferensi tema terang atau gelap yang dipilih pengguna pada level sistem operasi atau pengaturan browser.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Viewport',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan fungsi kalkulasi tipografi dinamis (fluid typography) berikut:

\`\`\`css
h1 {
  font-size: clamp(1.5rem, 4vw, 3rem);
}
\`\`\`

Bagaimana ukuran \`font-size\` elemen \`h1\` akan berperilaku pada berbagai ukuran layar?`,
    options: [
      'A. Skala ukuran font tumbuh dinamis sesuai lebar layar (4vw), namun tidak pernah lebih kecil dari 1.5rem dan tidak pernah lebih besar dari 3rem',
      'B. Ukuran font berkedip-kedip antara 1.5rem dan 3rem secara acak',
      'C. Font akan otomatis diubah menjadi 4 piksel jika layar lebih kecil dari 1.5rem',
      'D. Ukuran font selalu tetap 3rem di semua ukuran layar'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Fungsi clamp(min, val, max) menetapkan nilai ideal dinamis (4vw) dengan batas bawah minimum absolut (1.5rem) dan batas atas maksimum absolut (3rem).'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Media Query',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan media feature untuk aksesibilitas sensitivitas gerakan berikut:

\`\`\`css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
\`\`\`

Mengapa implementasi \`prefers-reduced-motion\` sangat penting dalam desain web yang inklusif?`,
    options: [
      'A. Menghormati pengguna yang memiliki gangguan vestibular atau mabuk visual dengan meniadakan animasi dan transisi yang berlebihan',
      'B. Mempercepat render video YouTube yang tertanam di halaman web',
      'C. Mengurangi konsumsi memori GPU komputer lama secara otomatis',
      'D. Menghemat kuota internet pengguna dengan menghentikan pemuatan file CSS'
    ],
    correct: 'A',
    points: 10,
    explanation: 'prefers-reduced-motion: reduce adalah standar aksesibilitas bagi pengguna dengan gangguan vestibular (pusing/mual akibat gerakan visual berlebih) agar website tidak memutar animasi besar.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Viewport',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perbedaan unit viewport baru pada perangkat mobile:

\`\`\`css
.modal-overlay {
  height: 100dvh;
}
\`\`\`

Apa keunggulan satuan \`100dvh\` (dynamic viewport height) dibandingkan \`100vh\` tradisional pada browser seluler?`,
    options: [
      'A. dvh secara dinamis menyesuaikan tinggi viewport saat bilah alamat (URL bar) browser seluler muncul atau tersembunyi',
      'B. dvh mengabaikan rotasi layar ponsel',
      'C. dvh hanya bekerja saat ponsel dalam mode hemat daya',
      'D. dvh melipatgandakan resolusi layar menjadi dua kali lipat'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Satuan 100dvh (dynamic viewport height) memperhitungkan dinamisnya pergeseran bilah navigasi (address bar) browser seluler saat pengguna melakukan scroll, mencegah konten terpotong.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Media Query',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan sintaks Media Queries Range Context modern (CSS Media Queries Level 4):

\`\`\`css
@media (width >= 768px) {
  .nav { display: flex; }
}
\`\`\`

Sintaks \`width >= 768px\` di atas setara dengan sintaks klasik apa?`,
    options: [
      'A. @media (min-width: 768px)',
      'B. @media (max-width: 768px)',
      'C. @media (exact-width: 768px)',
      'D. @media (device-width: 768px)'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Sintaks range modern (width >= 768px) adalah ekuivalen matematis yang lebih mudah dibaca daripada sintaks klasik (min-width: 768px).'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Media Query',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan media feature orientasi layar berikut:

\`\`\`css
@media (orientation: landscape) {
  .video-player {
    width: 100vw;
    height: 100vh;
  }
}
\`\`\`

Kapan kondisi \`orientation: landscape\` terpenuhi?`,
    options: [
      'A. Ketika lebar viewport lebih besar daripada tinggi viewport',
      'B. Ketika pengguna menggunakan perangkat GPS',
      'C. Ketika tinggi viewport lebih besar daripada lebar viewport',
      'D. Hanya ketika perangkat diletakkan mendatar di atas meja'
    ],
    correct: 'A',
    points: 10,
    explanation: 'orientation: landscape aktif ketika lebar layar peramban melebihi tingginya (width > height).'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Breakpoint',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Manakah dari nilai breakpoint berikut yang secara umum merepresentasikan ambang batas antara perangkat smartphone dan tablet?`,
    options: [
      'A. 768px',
      'B. 1920px',
      'C. 2560px',
      'D. 120px'
    ],
    correct: 'A',
    points: 10,
    explanation: '768px adalah breakpoint konvensional standar industri (misal iPad portrait / tablet) yang membedakan layout layar ponsel kecil dengan layar tablet.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Viewport',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan wadah rasio aspek video responsif modern:

\`\`\`css
.video-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
}
\`\`\`

Apa keuntungan properti \`aspect-ratio: 16 / 9\` dibandingkan teknik padding-top hack kuno?`,
    options: [
      'A. Mempertahankan rasio aspek 16:9 secara langsung tanpa memerlukan trik elemen bersarang atau kalkulasi padding',
      'B. Mengubah resolusi video secara otomatis menjadi 4K',
      'C. Mengunduh video lebih cepat di jaringan seluler',
      'D. Memaksa video untuk selalu diputar otomatis'
    ],
    correct: 'A',
    points: 10,
    explanation: 'aspect-ratio adalah properti modern CSS untuk mengunci perbandingan lebar dan tinggi secara langsung dan bersih tanpa trik padding-top: 56.25%.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Media Query',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan media query penargetan peranti input sentuh (touchscreen) vs kursor mouse:

\`\`\`css
@media (hover: hover) and (pointer: fine) {
  .btn:hover {
    background-color: #1d4ed8;
  }
}
\`\`\`

Mengapa menempatkan efek hover di dalam \`hover: hover and pointer: fine\` sangat bermanfaat?`,
    options: [
      'A. Mencegah efek "sticky hover" palsu pada layar sentuh ponsel di mana gaya hover tetap tersangkut setelah jari diangkat',
      'B. Mempercepat responsivitas animasi sentuh jari',
      'C. Mengaktifkan fitur klik dua kali pada layar sentuh',
      'D. Mengabaikan event klik dari peranti trackpad laptop'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pada perangkat sentuh murni, event hover tidak ada secara alami dan seringkali "tersangkut" saat di-tap. Membatasi hover hanya pada peranti dengan kursor presisi (mouse) meningkatkan kenyamanan UX seluler.'
  },
  // Additional Flexbox questions (bringing total Flexbox added to 25 -> 7 + 25 = 32 total)
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Container',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan flex container yang memiliki elemen teks dan tombol:

\`\`\`css
.header-actions {
  display: inline-flex;
}
\`\`\`

Apa perbedaan antara \`display: inline-flex\` dan \`display: flex\`?`,
    options: [
      'A. Kontainer inline-flex berperilaku seperti elemen inline terhadap elemen luar, sementara anak-anaknya tetap flex items',
      'B. inline-flex hanya dapat memiliki maksimal 2 elemen anak',
      'C. inline-flex tidak mendukung properti justify-content',
      'D. inline-flex secara otomatis menyembunyikan scrollbar'
    ],
    correct: 'A',
    points: 10,
    explanation: 'display: inline-flex membuat wadah luar mengalir inline bersama teks di sekitarnya, sedangkan tata letak internal di dalamnya tetap menggunakan model flexbox.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Direction',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pembalikan arah kolom berikut:

\`\`\`css
.chat-messages {
  display: flex;
  flex-direction: column-reverse;
}
\`\`\`

Bagaimana pesan obrolan akan ditampilkan secara visual di layar?`,
    options: [
      'A. Pesan pertama di HTML tampil paling bawah, dan pesan terbaru bertambah ke arah atas',
      'B. Pesan ditampilkan horizontal dari kanan ke kiri',
      'C. Teks pesan terbalik secara vertikal (terbalik atas-bawah)',
      'D. Pesan disembunyikan sampai pengguna melakukan klik'
    ],
    correct: 'A',
    points: 10,
    explanation: 'flex-direction: column-reverse membalik sumbu vertikal sehingga item pertama dimulai dari bagian bawah kontainer dan bertumpuk ke atas, pola umum antarmuka ruang obrolan (chat).'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan flex item dengan deklarasi \`flex: initial\`:

\`\`\`css
.item {
  flex: initial;
}
\`\`\`

Nilai properti apakah yang setara dengan kata kunci \`flex: initial\`?`,
    options: [
      'A. flex: 0 1 auto (tidak tumbuh, dapat menyusut, ukuran dasar auto)',
      'B. flex: 1 1 0 (tumbuh dan menyusut merata)',
      'C. flex: 0 0 auto (ukuran kaku tidak berubah)',
      'D. flex: 1 0 auto (hanya dapat tumbuh)'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kata kunci flex: initial ekuivalen dengan flex: 0 1 auto, yang merupakan nilai bawaan standar flex items (tidak tumbuh jika ada ruang sisa, tetapi dapat menyusut jika ruang menyempit).'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Items',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan flex item dengan deklarasi \`flex: none\`:

\`\`\`css
.fixed-badge {
  flex: none;
}
\`\`\`

Apa efek dari deklarasi \`flex: none\` terhadap ukuran elemen tersebut?`,
    options: [
      'A. Elemen kaku sepenuhnya: tidak dapat membesar (flex-grow: 0) dan tidak dapat menyusut (flex-shrink: 0)',
      'B. Elemen disembunyikan dengan display: none',
      'C. Lebar elemen diatur menjadi 0 piksel',
      'D. Elemen diubah menjadi posisi fixed'
    ],
    correct: 'A',
    points: 10,
    explanation: 'flex: none adalah penulisan ringkas untuk flex: 0 0 auto, membuat flex item berukuran kaku sesuai dimensi aslinya tanpa bisa melar maupun menyusut.'
  },
  {
    topic_name: 'Flexbox',
    concept_name: 'Flex Container',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perbedaan nilai \`space-around\` dan \`space-evenly\` pada flex container:

\`\`\`css
.menu-a { display: flex; justify-content: space-around; }
.menu-b { display: flex; justify-content: space-evenly; }
\`\`\`

Bagaimana perbedaan ruang kosong di kedua ujung tepi terluar antara \`.menu-a\` dan \`.menu-b\`?`,
    options: [
      'A. space-around memberi ruang tepi terluar setengah dari ruang antar-item, sedangkan space-evenly memberi jarak yang sama persis di semua celah termasuk tepi terluar',
      'B. space-evenly tidak memberi jarak di tepi terluar sama sekali',
      'C. space-around hanya berlaku pada layar desktop',
      'D. Keduanya menghasilkan jarak spasi yang identik tanpa perbedaan'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pada space-around, setiap item memiliki ruang identik di kiri-kanannya sehingga jarak di tepi luar hanya bernilai setengah dari jarak antar-item. Pada space-evenly, jarak antara setiap item dan kedua tepi terluar benar-benar sama persis.'
  },

  // Additional Responsive Design questions (bringing total Responsive Design added to 26 -> 6 + 26 = 32 total)
  {
    topic_name: 'Responsive Design',
    concept_name: 'Media Query',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan media query penargetan media cetak berikut:

\`\`\`css
@media print {
  .no-print {
    display: none;
  }
}
\`\`\`

Kapan aturan \`.no-print { display: none; }\` di atas akan aktif?`,
    options: [
      'A. Saat halaman web dicetak (print) atau dibuka pada jendela print preview',
      'B. Ketika pengguna menekan tombol screenshot di papan ketik',
      'C. Di semua peramban berbasis printer PDF',
      'D. Saat halaman dibuka pada perangkat e-reader monokrom'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Media type print menargetkan dokumen saat dikirim ke mesin cetak fisik atau saat pengguna membuka mode pratinjau cetak (print preview).'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Breakpoint',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan breakpoint desktop standar:

\`\`\`css
@media (min-width: 1024px) {
  .container {
    max-width: 960px;
  }
}
\`\`\`

Layar peramban berukuran 1280 piksel akan:`,
    options: [
      'A. Menerapkan gaya max-width: 960px karena 1280px lebih besar dari 1024px',
      'B. Mengabaikan aturan karena 1280px bukan persis 1024px',
      'C. Memperkecil layar menjadi 1024px',
      'D. Melempar pesan kesalahan CSS'
    ],
    correct: 'A',
    points: 10,
    explanation: 'min-width: 1024px bersifat inklusif ke atas (>= 1024px), sehingga layar 1280px memenuhi syarat dan menerapkan gaya tersebut.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Breakpoint',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa prinsip penentuan breakpoint yang paling direkomendasikan dalam filosofi desain web responsif modern?`,
    options: [
      'A. Menentukan breakpoint berdasarkan titik di mana konten mulai tampak rusak atau tidak nyaman dibaca, bukan terpaku pada ukuran layar merk ponsel tertentu',
      'B. Membuat breakpoint khusus untuk setiap model ponsel yang baru dirilis',
      'C. Hanya menggunakan tepat satu breakpoint di seluruh proyek',
      'D. Mengandalkan JavaScript user-agent sniffing'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Praktik terbaik CSS responsif adalah menaruh breakpoint di tempat di mana tata letak konten alami mulai "patah" atau canggung (content-driven breakpoints), bukan mengejar dimensi perangkat keras spesifik yang terus bertambah.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Viewport',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi matematis pembatas nilai berikut:

\`\`\`css
.card {
  width: min(100%, 600px);
}
\`\`\`

Bagaimana lebar elemen \`.card\` akan dirender pada layar ponsel selebar 400px dan layar monitor selebar 1200px?`,
    options: [
      'A. 400px pada ponsel (100%), dan 600px pada monitor (karena 600px lebih kecil dari 1200px)',
      'B. 600px pada kedua perangkat',
      'C. 400px pada kedua perangkat',
      'D. 100% pada kedua perangkat tanpa batas'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Fungsi min(A, B) memilih nilai terkecil di antara dua opsi. Pada layar 400px, 100% (400px) < 600px, sehingga lebarnya 400px. Pada layar 1200px, 600px < 100% (1200px), sehingga lebarnya 600px.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Viewport',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan satuan viewport inline \`100vi\` dan \`100vb\`:

\`\`\`css
.section {
  inline-size: 100vi;
}
\`\`\`

Satuan \`100vi\` (viewport inline size) setara dengan satuan viewport apa pada mode baca horizontal standar LTR?`,
    options: [
      'A. 100vw (lebar viewport horizontal)',
      'B. 100vh (tinggi viewport vertikal)',
      'C. 100% piksel layar',
      'D. 100em'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dalam CSS Logical Dimensions, inline-size pada penulisan horizontal mewakili dimensi lebar (width), sehingga 100vi setara dengan 100vw.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Media Query',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan media query penargetan kerapatan piksel layar (Retina Display):

\`\`\`css
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .logo {
    background-image: url("logo@2x.png");
  }
}
\`\`\`

Apa tujuan memuat gambar \`@2x\` pada kondisi media query di atas?`,
    options: [
      'A. Menyajikan aset gambar beresolusi tinggi pada layar berkerapatan piksel ganda agar gambar tampak tajam dan tidak buram',
      'B. Memperbesar ukuran fisik gambar menjadi dua kali lipat di layar',
      'C. Mengurangi kecepatan internet pengguna untuk menghemat RAM',
      'D. Mengubah format warna gambar menjadi grayscale'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Layar berkerapatan tinggi (HiDPI / Retina) memiliki rasio 2 dppx (192 dpi) atau lebih. Menyajikan gambar berdimensi 2x memastikan detail tetap tajam tanpa artefak pixelation.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Breakpoint',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan teknik Container Queries modern (CSS Container Queries Level 3):

\`\`\`css
.card-wrapper {
  container-type: inline-size;
}

@container (min-width: 400px) {
  .card {
    display: flex;
  }
}
\`\`\`

Apa perbedaan mendasar antara \`@container\` query di atas dengan \`@media\` query tradisional?`,
    options: [
      'A. @container merespons perubahan ukuran wadah induknya (.card-wrapper), bukan perubahan ukuran viewport jendela browser secara keseluruhan',
      'B. @container hanya dapat digunakan di browser mobile',
      'C. @container membutuhkan pustaka JavaScript eksternal',
      'D. @container menonaktifkan semua transisi CSS'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Container Queries memungkinkan komponen merespons ukuran wadah induk langsung tempat ia diletakkan, membuat komponen mandiri (truly modular) tanpa bergantung pada ukuran jendela browser.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Viewport',
    material: 'CSS',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan fungsi perbandingan nilai maksimum:

\`\`\`css
.button {
  width: max(150px, 20vw);
}
\`\`\`

Apa jaminan yang diberikan oleh fungsi \`max(150px, 20vw)\` pada elemen tombol tersebut?`,
    options: [
      'A. Lebar tombol tidak akan pernah lebih kecil dari 150px, tetapi dapat membesar jika 20vw bernilai lebih dari 150px',
      'B. Lebar tombol selalu tepat 150px di semua layar',
      'C. Lebar tombol tidak akan pernah lebih besar dari 150px',
      'D. Tombol memenuhi 100% lebar layar'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Fungsi max(A, B) mengembalikan nilai terbesar di antara argumennya. Ini memberikan batas minimum aman (150px) sekaligus mengizinkan tombol tumbuh dinamis dengan 20vw di layar lebar.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Media Query',
    material: 'CSS',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan negasi logika pada media query berikut:

\`\`\`css
@media not all and (min-width: 768px) {
  .mobile-drawer {
    display: block;
  }
}
\`\`\`

Aturan di atas setara dengan kondisi kueri media apa?`,
    options: [
      'A. @media (max-width: 767.98px) (layar di bawah 768px)',
      'B. @media (min-width: 768px)',
      'C. @media (width: 768px)',
      'D. Aturan tidak akan pernah dijalankan di media mana pun'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Operator not membalikkan hasil evaluasi keseluruhan ekspresi media query. Negasi dari (min-width: 768px) adalah layar yang lebarnya kurang dari 768px.'
  },
  {
    topic_name: 'Responsive Design',
    concept_name: 'Viewport',
    material: 'CSS',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Mengapa atribut \`user-scalable=no\` pada tag meta viewport sangat DILARANG dalam panduan aksesibilitas WCAG?`,
    options: [
      'A. Mencegah pengguna dengan gangguan penglihatan memperbesar (zoom in) halaman untuk membaca teks dengan nyaman',
      'B. Menyebabkan baterai ponsel cepat habis',
      'C. Merusak rendering CSS Flexbox pada layar sentuh',
      'D. Mencegah peramban memutar video secara otomatis'
    ],
    correct: 'A',
    points: 10,
    explanation: 'user-scalable=no atau maximum-scale=1.0 menonaktifkan fitur pinch-to-zoom pengguna, yang merupakan pelanggaran serius terhadap pedoman aksesibilitas web (WCAG 1.4.4).'
  }
];
