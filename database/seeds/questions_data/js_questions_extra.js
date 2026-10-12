// ============================================================
// XORA — JavaScript Additional Question Bank Data
// database/seeds/questions_data/js_questions_extra.js
// Topics: Control Flow, Functions, Arrays & Objects, DOM Manipulation, Async JS, Promises
// ============================================================

module.exports = [
  // =========================================================================
  // CONTROL FLOW (+6 questions -> total added: 26)
  // =========================================================================
  {
    topic_name: 'Control Flow',
    concept_name: 'Conditional Statement',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa hasil evaluasi ekspresi kondisi berikut?

\`\`\`javascript
const isLoggedIn = true;
const hasRole = false;

if (isLoggedIn && !hasRole) {
  console.log("Akses terbatas");
} else {
  console.log("Akses penuh");
}
\`\`\` `,
    options: [
      'A. "Akses terbatas"',
      'B. "Akses penuh"',
      'C. undefined',
      'D. TypeError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'isLoggedIn adalah true dan !hasRole (!false) adalah true. Karena kedua sisi bernilai true, blok if dieksekusi dan mencetak "Akses terbatas".'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perulangan pencarian nilai dalam array:

\`\`\`javascript
const list = [10, 20, 30, 40];
let foundIndex = -1;

for (let i = 0; i < list.length; i++) {
  if (list[i] === 30) {
    foundIndex = i;
    break;
  }
}
console.log(foundIndex);
\`\`\`

Berapa nilai \`foundIndex\` yang dicetak ke konsol?`,
    options: [
      'A. 2 (indeks ke-2)',
      'B. 3',
      'C. 30',
      'D. -1'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Elemen 30 berada pada indeks ke-2 (0-indexed: 10 di 0, 20 di 1, 30 di 2). Saat list[2] === 30, foundIndex diisi 2 dan loop dihentikan dengan break.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Switch',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa kegunaan klausa \`default\` di dalam blok \`switch\`?`,
    options: [
      'A. Dijalankan ketika tidak ada satu pun klausa case yang cocok dengan nilai ekspresi',
      'B. Wajib diletakkan paling atas sebelum case 1',
      'C. Menghentikan program dari crash secara otomatis',
      'D. Menghapus variabel switch dari memori'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Klausa default bertindak sebagai fallback cadangan yang dieksekusi ketika tidak ada kecocokan pada semua case sebelumnya.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Conditional Statement',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan evaluasi perbandingan nilai \`null\` dan \`undefined\`:

\`\`\`javascript
console.log(null == undefined);
console.log(null === undefined);
\`\`\`

Apa output dari kedua baris tersebut?`,
    options: [
      'A. true lalu false',
      'B. false lalu false',
      'C. true lalu true',
      'D. false lalu true'
    ],
    correct: 'A',
    points: 10,
    explanation: 'null == undefined bernilai true menurut aturan type coercion khusus ECMAScript, tetapi pada strict equality (===) bernilai false karena tipe datanya berbeda.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perulangan mundur (reverse loop) berikut:

\`\`\`javascript
let out = "";
for (let i = 3; i > 0; i--) {
  out += i + "-";
}
console.log(out);
\`\`\`

Apa string yang dihasilkan oleh kode di atas?`,
    options: [
      'A. "3-2-1-"',
      'B. "3-2-1-0-"',
      'C. "1-2-3-"',
      'D. "3-2-"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Perulangan dimulai dari i = 3, lalu 2, lalu 1. Saat i mencapai 0, kondisi (0 > 0) false dan loop selesai. String yang dihasilkan adalah "3-2-1-".'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pemecahan perulangan bersarang berikut:

\`\`\`javascript
let sum = 0;
for (let i = 0; i < 2; i++) {
  for (let j = 0; j < 3; j++) {
    sum += 1;
  }
}
console.log(sum);
\`\`\`

Berapa nilai \`sum\` yang dicetak ke konsol?`,
    options: [
      'A. 6 (2 kali 3 iterasi)',
      'B. 5',
      'C. 8',
      'D. 4'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Outer loop berjalan 2 kali, dan setiap iterasi menjalankan inner loop 3 kali. Total eksekusi adalah 2 * 3 = 6 kali penambahan 1.'
  },

  // =========================================================================
  // FUNCTIONS (+12 questions -> total added: 28)
  // =========================================================================
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Manakah dari potongan kode berikut yang merupakan contoh Function Expression?`,
    options: [
      'A. const greet = function(name) { return "Halo " + name; };',
      'B. function greet(name) { return "Halo " + name; }',
      'C. greet(name) => { return "Halo " + name; };',
      'D. def greet(name): return "Halo " + name'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Function Expression adalah fungsi yang didefinisikan sebagai bagian dari ekspresi penugasan variabel (const fn = function() {...}).'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Parameter',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari fungsi berikut jika parameter default ditimpa dengan argumen \`undefined\`?

\`\`\`javascript
function tes(a = 10) {
  return a;
}

console.log(tes(undefined));
console.log(tes(null));
\`\`\` `,
    options: [
      'A. 10 lalu null',
      'B. 10 lalu 10',
      'C. undefined lalu null',
      'D. null lalu null'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Default parameter hanya dipicu saat argumen tidak diberikan atau bernilai undefined eksplisit. Memberikan null dianggap sebagai nilai valid, sehingga tes(null) mengembalikan null.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Return Value',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa yang terjadi pada baris kode setelah pernyataan \`return\` di dalam fungsi dieksekusi?

\`\`\`javascript
function hitung() {
  return 100;
  console.log("Kode ini tidak pernah dijalankan");
}
\`\`\` `,
    options: [
      'A. Baris setelah return tidak akan pernah dieksekusi (unreachable code)',
      'B. Tetap dijalankan di latar belakang secara asinkron',
      'C. Melempar UnreachableCodeError saat kompilasi',
      'D. Mengubah nilai return menjadi string'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pernyataan return langsung menghentikan eksekusi fungsi dan mengembalikan nilai ke pemanggil, sehingga kode setelahnya tidak pernah dijalankan.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi murni (pure function) berikut:

\`\`\`javascript
function add(a, b) {
  return a + b;
}
\`\`\`

Apa ciri utama yang menjadikan fungsi \`add\` di atas disebut sebagai "Pure Function"?`,
    options: [
      'A. Selalu menghasilkan output yang sama untuk input yang sama dan tidak menimbulkan efek samping (side effects)',
      'B. Hanya dapat menerima tipe data angka',
      'C. Berjalan tanpa memakan memori CPU',
      'D. Dideklarasikan menggunakan arrow function'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pure Function adalah fungsi yang deterministik (output identik untuk input yang sama) dan tidak memiliki efek samping (tidak mengubah variabel global atau DOM).'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Parameter',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan destructuring langsung pada parameter fungsi berikut:

\`\`\`javascript
function printUser({ name, role = "learner" }) {
  return \`\${name} (\${role})\`;
}

console.log(printUser({ name: "Suci" }));
\`\`\`

Apa hasil kembalian dari fungsi di atas?`,
    options: [
      'A. "Suci (learner)"',
      'B. "Suci (undefined)"',
      'C. "{ name: Suci }"',
      'D. TypeError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Parameter destructuring langsung mengekstrak properti name ("Suci") dan mengisi role dengan nilai default "learner" karena tidak ada di objek argumen.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Return Value',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pemanggilan fungsi yang mengembalikan fungsi lain:

\`\`\`javascript
function createMultiplier(multiplier) {
  return (num) => num * multiplier;
}

const triple = createMultiplier(3);
console.log(triple(10));
\`\`\`

Berapa output yang dicetak ke konsol?`,
    options: [
      'A. 30',
      'B. 13',
      'C. 3',
      'D. NaN'
    ],
    correct: 'A',
    points: 10,
    explanation: 'createMultiplier(3) mengembalikan arrow function (num) => num * 3. Saat dipanggil dengan triple(10), hasilnya adalah 10 * 3 = 30.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan implementasi debounce fungsi sederhana berikut:

\`\`\`javascript
function debounce(fn, delay) {
  let timer;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
\`\`\`

Apa tujuan utama dari teknik Debounce pada penanganan event (seperti input pencarian)?`,
    options: [
      'A. Menunda eksekusi fungsi hingga pengguna berhenti memicu event selama durasi delay tertentu',
      'B. Mempercepat eksekusi fungsi menjadi instan',
      'C. Menjalankan fungsi tepat 1 kali di awal dan mengabaikan sisa event',
      'D. Mengubah event menjadi sinkron'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Debounce mengelompokkan pemanggilan beruntun yang cepat (misal ketikan keyboard) dan hanya mengeksekusi fungsi target setelah periode jeda tenang tercapai.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan throttle fungsi berikut:

\`\`\`javascript
function throttle(fn, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
\`\`\`

Apa perbedaan utama Throttle dibandingkan Debounce?`,
    options: [
      'A. Throttle menjamin fungsi dieksekusi secara teratur pada interval waktu maksimum tertentu selama event terus dipicu',
      'B. Throttle hanya bekerja pada tombol form',
      'C. Throttle menunda eksekusi selamanya',
      'D. Throttle menghapus event listener dari DOM'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Throttle memastikan fungsi dieksekusi tidak lebih dari sekali setiap X milidetik (misal scroll/resize), sedangkan debounce menunggu hingga pemicu berhenti sejenak.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Parameter',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan urutan parameter wajib dan rest parameter berikut:

\`\`\`javascript
function logTeam(lead, ...members) {
  return \`Lead: \${lead}, Anggota: \${members.length}\`;
}

console.log(logTeam("Budi", "Siti", "Andi", "Rian"));
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. "Lead: Budi, Anggota: 3"',
      'B. "Lead: Budi, Anggota: 4"',
      'C. "Lead: undefined, Anggota: 4"',
      'D. SyntaxError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Parameter lead menerima "Budi", dan sisa argumen ["Siti", "Andi", "Rian"] ditampung oleh rest parameter members (panjang array = 3).'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Return Value',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pengembalian objek method chaining (fluent interface) berikut:

\`\`\`javascript
class Calculator {
  constructor(val = 0) { this.val = val; }
  add(n) { this.val += n; return this; }
  multiply(n) { this.val *= n; return this; }
}

const res = new Calculator(2).add(3).multiply(2).val;
console.log(res);
\`\`\`

Berapa nilai \`res\` yang dihasilkan?`,
    options: [
      'A. 10 ((2 + 3) * 2)',
      'B. 8',
      'C. 12',
      'D. undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dengan mengembalikan return this dari setiap metode, pemanggil dapat merantai metode (chaining): (2 + 3 = 5), lalu (5 * 2 = 10).'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi komposisi (function composition):

\`\`\`javascript
const double = x => x * 2;
const square = x => x * x;

const result = square(double(3));
console.log(result);
\`\`\`

Berapa nilai \`result\` yang dicetak ke konsol?`,
    options: [
      'A. 36 (double(3)=6, square(6)=36)',
      'B. 18',
      'C. 12',
      'D. 24'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Fungsi bersarang dieksekusi dari dalam ke luar: double(3) menghasilkan 6, kemudian square(6) mengalikan 6 * 6 = 36.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Return Value',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi rekursif pembalik string:

\`\`\`javascript
function reverseStr(str) {
  if (str === "") return "";
  return reverseStr(str.substr(1)) + str.charAt(0);
}

console.log(reverseStr("abc"));
\`\`\`

Apa hasil kembalian dari fungsi di atas?`,
    options: [
      'A. "cba"',
      'B. "abc"',
      'C. "bca"',
      'D. RangeError: Maximum call stack size exceeded'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Fungsi membalik string dengan rekursi: reverseStr("bc") + "a" -> (reverseStr("c") + "b") + "a" -> ("c" + "b") + "a" = "cba".'
  },

  // =========================================================================
  // ARRAYS & OBJECTS (+6 questions -> total added: 19)
  // =========================================================================
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Array Methods',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Metode array manakah yang memeriksa apakah sebuah nilai ada di dalam array dan mengembalikan boolean?

\`\`\`javascript
const roles = ["admin", "editor", "viewer"];
console.log(roles.includes("editor"));
\`\`\` `,
    options: [
      'A. array.includes()',
      'B. array.has()',
      'C. array.contains()',
      'D. array.exists()'
    ],
    correct: 'A',
    points: 10,
    explanation: 'array.includes(element) mengembalikan true jika elemen ditemukan di dalam array, dan false jika tidak ada.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Object Literal',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan shorthand penulisan nama properti objek ES6 berikut:

\`\`\`javascript
const title = "XORA";
const year = 2026;

const app = { title, year };
console.log(app);
\`\`\`

Apa bentuk objek yang dihasilkan oleh penulisan di atas?`,
    options: [
      'A. { title: "XORA", year: 2026 }',
      'B. { "title": undefined, "year": undefined }',
      'C. ["XORA", 2026]',
      'D. SyntaxError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'ES6 property shorthand memungkinkan kita menulis { title, year } yang otomatis setara dengan { title: title, year: year } ketika nama variabel sama dengan nama kunci.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Array Methods',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan metode \`.flat()\` pada array bersarang:

\`\`\`javascript
const matrix = [1, [2, [3, 4]]];
console.log(matrix.flat(2));
\`\`\`

Apa output array yang dihasilkan setelah diratakan dengan kedalaman 2?`,
    options: [
      'A. [1, 2, 3, 4]',
      'B. [1, 2, [3, 4]]',
      'C. [1, [2, 3, 4]]',
      'D. [[1, 2, 3, 4]]'
    ],
    correct: 'A',
    points: 10,
    explanation: 'array.flat(depth) meratakan sub-array bersarang. Dengan depth=2, kedua lapisan array bersarang diurai menjadi satu array datar [1, 2, 3, 4].'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Object Literal',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan metode \`Object.entries()\` dan \`Object.fromEntries()\`:

\`\`\`javascript
const prices = { apel: 10, jeruk: 15 };
const updated = Object.fromEntries(
  Object.entries(prices).map(([k, v]) => [k, v * 2])
);
console.log(updated);
\`\`\`

Apa output dari objek \`updated\`?`,
    options: [
      'A. { apel: 20, jeruk: 30 }',
      'B. [["apel", 20], ["jeruk", 30]]',
      'C. { apel: 10, jeruk: 15 }',
      'D. TypeError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Object.entries() mengubah objek menjadi pasangan [key, value], map melipatgandakan nilainya, dan Object.fromEntries() mengembalikan pasangan array tersebut menjadi objek utuh kembali.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Array Methods',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan operasi deduplikasi array menggunakan objek \`Set\`:

\`\`\`javascript
const nums = [1, 2, 2, 3, 4, 4, 5];
const unique = [...new Set(nums)];
console.log(unique);
\`\`\`

Apa isi dari array \`unique\`?`,
    options: [
      'A. [1, 2, 3, 4, 5]',
      'B. [2, 4]',
      'C. Set { 1, 2, 3, 4, 5 }',
      'D. [1, 2, 2, 3, 4, 4, 5]'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Set hanya menyimpan nilai unik. Menyebarkan (...new Set(nums)) ke dalam array literal mengembalikan array bersih tanpa nilai duplikat [1, 2, 3, 4, 5].'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Destructuring',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan destructuring properti bersarang (nested destructuring):

\`\`\`javascript
const company = {
  address: {
    city: "Jakarta"
  }
};
const { address: { city } } = company;
console.log(city);
\`\`\`

Berapa nilai \`city\` yang dicetak ke konsol?`,
    options: [
      'A. "Jakarta"',
      'B. { city: "Jakarta" }',
      'C. undefined',
      'D. ReferenceError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Nested destructuring mengekstrak properti city langsung dari properti bersarang address, menghasilkan variabel city bernilai "Jakarta".'
  },

  // =========================================================================
  // DOM MANIPULATION (+14 questions -> total added: 28)
  // =========================================================================
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Selection',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Metode DOM manakah yang mengambil elemen secara spesifik berdasarkan nilai atribut \`id\`-nya?`,
    options: [
      'A. document.getElementById("header")',
      'B. document.selectId("header")',
      'C. document.getElement("header")',
      'D. document.fetchId("header")'
    ],
    correct: 'A',
    points: 10,
    explanation: 'document.getElementById() adalah metode DOM tertua dan paling cepat untuk mengambil satu elemen unik berdasarkan atribut ID-nya.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Bagaimana cara menghapus elemen DOM dari dokumen secara langsung di browser modern?`,
    options: [
      'A. element.remove()',
      'B. element.delete()',
      'C. document.destroy(element)',
      'D. element.clear()'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Metode element.remove() adalah API DOM modern yang langsung menghapus elemen node itu sendiri dari pohon DOM.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Kode manakah yang tepat untuk mengubah warna teks suatu elemen menjadi merah melalui properti inline style?`,
    options: [
      'A. element.style.color = "red";',
      'B. element.css.color = "red";',
      'C. element.setAttribute("color", "red");',
      'D. element.styles("color", "red");'
    ],
    correct: 'A',
    points: 10,
    explanation: 'element.style.propertyName digunakan untuk memanipulasi deklarasi gaya CSS inline secara langsung pada elemen DOM.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Event mouse manakah yang dipicu saat kursor diarahkan masuk ke dalam batas elemen visual?`,
    options: [
      'A. mouseenter (atau mouseover)',
      'B. mouseout',
      'C. mouseup',
      'D. mousedown'
    ],
    correct: 'A',
    points: 10,
    explanation: 'mouseenter atau mouseover dipicu ketika penunjuk mouse pertama kali bergerak memasuki batas visual suatu elemen.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Selection',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan iterasi pada \`NodeList\` hasil \`document.querySelectorAll\`:

\`\`\`javascript
const buttons = document.querySelectorAll(".btn");
buttons.forEach(btn => {
  btn.disabled = true;
});
\`\`\`

Mengapa \`NodeList\` modern mendukung metode \`.forEach()\` secara langsung?`,
    options: [
      'A. Karena antarmuka NodeList modern mengimplementasikan metode bawaan .forEach() untuk mempermudah iterasi',
      'B. Karena NodeList adalah array JavaScript asli',
      'C. Hanya dapat berjalan jika jQuery diimpor',
      'D. Karena tombol diubah menjadi string'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Spesifikasi DOM modern menambahkan NodeList.prototype.forEach(), memungkinkan iterasi langsung tanpa harus mengonversi NodeList ke Array terlebih dahulu.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan manipulasi atribut menggunakan \`setAttribute\` dan \`getAttribute\`:

\`\`\`javascript
const link = document.querySelector("a");
link.setAttribute("target", "_blank");
console.log(link.getAttribute("target"));
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. "_blank"',
      'B. null',
      'C. undefined',
      'D. true'
    ],
    correct: 'A',
    points: 10,
    explanation: 'setAttribute menetapkan nilai atribut target="_blank", dan getAttribute("target") membaca kembali nilai string atribut tersebut.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa perbedaan antara properti \`event.target\` dan \`event.currentTarget\` pada event listener?`,
    options: [
      'A. event.target adalah elemen yang memicu event (asal klik), sedangkan event.currentTarget adalah elemen yang mengikat event listener tersebut',
      'B. event.target selalu berupa tag <body>',
      'C. Keduanya selalu identik tanpa pernah berbeda',
      'D. event.currentTarget hanya ada di event keyboard'
    ],
    correct: 'A',
    points: 10,
    explanation: 'target adalah elemen terdalam tempat event pertama kali terjadi (origin), sedangkan currentTarget adalah elemen tempat listener saat ini sedang mengeksekusi callback.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan kloning elemen DOM menggunakan \`cloneNode()\`:

\`\`\`javascript
const original = document.querySelector("#template-card");
const clone = original.cloneNode(true);
\`\`\`

Apa fungsi dari argumen boolean \`true\` pada pemanggilan \`original.cloneNode(true)\`?`,
    options: [
      'A. Melakukan deep clone menyalin elemen beserta seluruh elemen anak dan teks di dalamnya',
      'B. Kloning shallow yang hanya menyalin tag luarnya saja',
      'C. Menyalin event listener JavaScript yang terpasang',
      'D. Menghapus elemen asli setelah dikloning'
    ],
    correct: 'A',
    points: 10,
    explanation: 'cloneNode(true) melakukan deep clone terhadap subtree elemen termasuk semua node anak dan teks di dalamnya (namun tidak menyalin event listener yang dipasang via addEventListener).'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan 3 fase perambatan event (event propagation) di DOM:`,
    options: [
      'A. Capturing Phase -> Target Phase -> Bubbling Phase',
      'B. Bubbling Phase -> Target Phase -> Capturing Phase',
      'C. Target Phase -> Bubbling Phase -> Capturing Phase',
      'D. Loading Phase -> Active Phase -> Finished Phase'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Urutan standar propagasi event W3C adalah: 1) Capturing phase (turun dari window ke target), 2) Target phase (pada elemen target), dan 3) Bubbling phase (naik kembali dari target ke window).'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penanganan scroll dinamis menggunakan \`scrollIntoView\`:

\`\`\`javascript
document.querySelector("#section-2").scrollIntoView({
  behavior: "smooth",
  block: "start"
});
\`\`\`

Apa efek dari opsi \`behavior: "smooth"\`?`,
    options: [
      'A. Menggulir layar dengan animasi transisi halus menuju elemen target',
      'B. Melompat seketika ke elemen tanpa animasi',
      'C. Mengunci posisi layar agar tidak bisa digeser lagi',
      'D. Memperkecil zoom halaman menjadi 50%'
    ],
    correct: 'A',
    points: 10,
    explanation: 'behavior: "smooth" menginstruksikan peramban untuk menggulir viewport dengan animasi halus (smooth scrolling) alih-alih melompat seketika (instant).'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Selection',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan properti penjelajahan saudara (sibling) di DOM:

\`\`\`javascript
const next = currentElement.nextElementSibling;
\`\`\`

Apa perbedaan antara \`nextElementSibling\` dan \`nextSibling\`?`,
    options: [
      'A. nextElementSibling hanya mengembalikan node yang bertipe Elemen HTML, sedangkan nextSibling dapat berupa teks spasi (TextNode) atau komentar',
      'B. nextSibling mengabaikan elemen div',
      'C. nextElementSibling hanya bekerja pada elemen list',
      'D. Keduanya identik'
    ],
    correct: 'A',
    points: 10,
    explanation: 'nextSibling mengembalikan node berikutnya yang seringkali berupa TextNode kosong (whitespace/baris baru), sedangkan nextElementSibling secara spesifik mencari Element Node berikutnya.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pelepasan event listener menggunakan \`removeEventListener\`:

\`\`\`javascript
function onClick() { console.log("Klik!"); }
button.addEventListener("click", onClick);
button.removeEventListener("click", onClick);
\`\`\`

Mengapa pelepasan event listener di atas berhasil, sedangkan \`button.removeEventListener("click", () => console.log("Klik!"))\` gagal?`,
    options: [
      'A. Karena removeEventListener membutuhkan referensi fungsi yang persis sama di memori',
      'B. Karena removeEventListener tidak mendukung arrow function',
      'C. Karena tombol otomatis dihapus',
      'D. Karena string "Klik!" berbeda'
    ],
    correct: 'A',
    points: 10,
    explanation: 'removeEventListener membandingkan kesamaan referensi fungsi di memori. Anonymous function baru () => ... membuat objek referensi berbeda sehingga tidak akan pernah cocok dengan listener lama.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan operasi penggantian anak elemen DOM:

\`\`\`javascript
parent.replaceChild(newElement, oldElement);
\`\`\`

Apa yang dilakukan oleh metode \`replaceChild()\` di atas?`,
    options: [
      'A. Mengganti elemen anak oldElement dengan newElement di dalam parent',
      'B. Menghapus kedua elemen dari dokumen',
      'C. Menukar posisi oldElement dan newElement',
      'D. Menggabungkan teks kedua elemen'
    ],
    correct: 'A',
    points: 10,
    explanation: 'parent.replaceChild(newChild, oldChild) menggantikan node anak yang ada (oldChild) dengan node anak baru (newChild).'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pembuatan event kustom menggunakan \`CustomEvent\`:

\`\`\`javascript
const customEvt = new CustomEvent("userLogin", {
  detail: { username: "Suci" },
  bubbles: true
});
element.dispatchEvent(customEvt);
\`\`\`

Bagaimana cara pendengar event (event listener) mengakses payload \`{ username: "Suci" }\`?`,
    options: [
      'A. Melalui properti event.detail',
      'B. Melalui properti event.payload',
      'C. Melalui event.data',
      'D. Melalui event.params'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pada API CustomEvent standar, data kustom yang dilewatkan dalam opsi detail diakses melalui event.detail.'
  },

  // =========================================================================
  // ASYNC JAVASCRIPT (+19 questions -> total added: 31)
  // =========================================================================
  {
    topic_name: 'Async JavaScript',
    concept_name: 'setTimeout/setInterval',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Berapa durasi penundaan minimum bawaan peramban (clamped timer minimum) pada pemanggilan bersarang \`setTimeout\` berturut-turut?`,
    options: [
      'A. 4 milidetik',
      'B. 100 milidetik',
      'C. 0 milidetik',
      'D. 1000 milidetik'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Sesuai spesifikasi HTML5, setelah 5 level timer bersarang berturut-turut, browser memberlakukan batas minimum penjadwalan (clamping) sebesar 4 milidetik.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Callback',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa pengertian dari sebuah "Callback Function" di JavaScript?`,
    options: [
      'A. Fungsi yang dilewatkan sebagai argumen ke fungsi lain untuk dieksekusi di kemudian waktu',
      'B. Fungsi yang memanggil dirinya sendiri secara rekursif',
      'C. Fungsi yang tidak memiliki nilai kembalian',
      'D. Fungsi yang hanya berjalan di server'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Callback adalah fungsi yang diberikan sebagai parameter ke fungsi lain untuk dipanggil kembali (called back) saat suatu operasi selesai.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Bagian runtime manakah di browser yang bertanggung jawab mengawasi Call Stack dan memindahkan tugas dari Callback Queue saat Call Stack kosong?`,
    options: [
      'A. Event Loop',
      'B. Memory Garbage Collector',
      'C. CSS Parser',
      'D. WebAssembly Engine'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Event Loop terus-menerus memeriksa Call Stack; jika Call Stack kosong, ia mengambil tugas pertama dari antrean (queue) dan mendorongnya ke Call Stack.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'setTimeout/setInterval',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pelepasan argumen tambahan pada pemanggilan \`setTimeout\`:

\`\`\`javascript
setTimeout((greeting, name) => {
  console.log(greeting + " " + name);
}, 100, "Halo", "Dian");
\`\`\`

Apa output yang dicetak ke konsol setelah 100ms?`,
    options: [
      'A. "Halo Dian"',
      'B. "undefined undefined"',
      'C. "Halo undefined"',
      'D. TypeError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Argumen setelah waktu delay pada setTimeout(fn, delay, arg1, arg2...) secara otomatis diteruskan sebagai argumen ke fungsi callback ("Halo", "Dian").'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pemanggilan metode optimasi render animasi \`requestAnimationFrame\`:

\`\`\`javascript
requestAnimationFrame(() => {
  console.log("Frame di-render");
});
\`\`\`

Kapan callback di dalam \`requestAnimationFrame\` akan dijalankan oleh peramban?`,
    options: [
      'A. Tepat sebelum proses repaint layar berikutnya (biasanya sinkron dengan refresh rate 60Hz/120Hz layar)',
      'B. Tepat setelah 1000 milidetik',
      'C. Di dalam Web Worker terpisah',
      'D. Hanya ketika pengguna melakukan klik tombol'
    ],
    correct: 'A',
    points: 10,
    explanation: 'requestAnimationFrame menjadwalkan eksekusi tepat sebelum browser melakukan repaint berikutnya, menghasilkan animasi visual 60fps/120fps yang mulus.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Callback',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan masalah Inversion of Control pada callback tradisional:`,
    options: [
      'A. Kita menyerahkan kendali eksekusi fungsi kita ke pihak ketiga (third-party), tanpa jaminan apakah fungsi akan dipanggil 0 kali, 1 kali, atau berkali-kali',
      'B. Fungsi tidak dapat menerima argumen string',
      'C. Memori komputer bocor seketika',
      'D. Variabel lokal diubah menjadi konstanta'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Inversion of Control terjadi saat kita mempercayakan callback ke library/layanan eksternal tanpa kepastian jaminan pemanggilan tepat waktu atau penanganan galat.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan urutan eksekusi campuran berikut:

\`\`\`javascript
console.log("Start");

setTimeout(() => console.log("Timeout"), 0);

Promise.resolve().then(() => console.log("Promise"));

console.log("End");
\`\`\`

Apa urutan output yang dicetak ke konsol?`,
    options: [
      'A. "Start", "End", "Promise", "Timeout"',
      'B. "Start", "End", "Timeout", "Promise"',
      'C. "Start", "Promise", "Timeout", "End"',
      'D. "Timeout", "Promise", "Start", "End"'
    ],
    correct: 'A',
    points: 10,
    explanation: '1) Kode sinkron berjalan ("Start", "End"). 2) Microtask Queue (Promise.then) dikosongkan terlebih dahulu ("Promise"). 3) Macrotask Queue (setTimeout) dijalankan ("Timeout").'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'setTimeout/setInterval',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Mengapa \`setInterval\` berpotensi menumpuk (stacking) jika eksekusi tugas asynchronous di dalamnya membutuhkan waktu lebih lama daripada intervalnya?`,
    options: [
      'A. Karena setInterval menjadwalkan eksekusi baru tanpa mempedulikan apakah tugas sebelumnya sudah selesai atau masih berjalan',
      'B. Karena browser menghapus antrean memori',
      'C. Karena Call Stack berjalan mundur',
      'D. Karena interval otomatis terlipat ganda'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Jika fungsi di setInterval membutuhkan waktu 1000ms padahal interval diset 500ms, tugas berikutnya akan antre bertumpuk. Solusi yang lebih aman adalah rekursif setTimeout berantai.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa perbedaan utama antara \`MutationObserver\` callback dan \`setTimeout\` callback pada Event Loop?`,
    options: [
      'A. MutationObserver berjalan di Microtask Queue (sebelum render), sedangkan setTimeout berjalan di Macrotask Queue',
      'B. MutationObserver hanya berjalan di sisi server',
      'C. setTimeout memiliki prioritas lebih tinggi daripada MutationObserver',
      'D. MutationObserver berjalan secara multithreading'
    ],
    correct: 'A',
    points: 10,
    explanation: 'MutationObserver didesain untuk merespons mutasi DOM secara instan di dalam siklus microtask sebelum peramban melakukan repaint pada frame saat itu.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Callback',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi yang secara inkonsisten memanggil callback secara sinkron dan asinkron:

\`\`\`javascript
function loadData(cache, cb) {
  if (cache) cb(cache); // Sinkron
  else fetchData(cb);   // Asinkron
}
\`\`\`

Mengapa pola inkonsistensi sinkron/asinkron di atas (dikenal sebagai "Releasing Zalgo") sangat berbahaya dalam arsitektur software?`,
    options: [
      'A. Membuat alur eksekusi tidak dapat diprediksi karena urutan kode berikutnya terkadang berjalan sebelum atau sesudah callback',
      'B. Melempar SyntaxError otomatis',
      'C. Mencegah penggunaan try/catch',
      'D. Menghapus data cache secara permanen'
    ],
    correct: 'A',
    points: 10,
    explanation: '"Releasing Zalgo" mengacaukan ekspektasi pemanggil karena fungsi terkadang sinkron dan terkadang asinkron. Praktik terbaik adalah selalu membuat callback konsisten asinkron (misal dengan queueMicrotask).'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'setTimeout/setInterval',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pemanggilan rekursif \`setTimeout\` berikut:

\`\`\`javascript
function poll() {
  setTimeout(() => {
    console.log("Cek status...");
    poll();
  }, 1000);
}
poll();
\`\`\`

Apa keunggulan pola rekursif \`setTimeout\` di atas dibandingkan menggunakan \`setInterval(..., 1000)\`?`,
    options: [
      'A. Menjamin jeda tepat 1000ms terjadi SETELAH eksekusi tugas sebelumnya benar-benar selesai, mencegah penumpukan tugas',
      'B. Mematikan CPU saat jeda',
      'C. Berjalan tanpa memakan memori call stack',
      'D. Tidak memerlukan pemanggilan fungsi'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pola recursive setTimeout memastikan bahwa jeda berikutnya baru mulai dihitung setelah tugas saat ini selesai diproses, meniadakan risiko tumpukan tugas (task crowding).'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Manakah API di bawah ini yang tugasnya dimasukkan ke dalam Macrotask (Task) Queue?`,
    options: [
      'A. setTimeout dan setInterval',
      'B. Promise.then dan Promise.catch',
      'C. queueMicrotask()',
      'D. MutationObserver'
    ],
    correct: 'A',
    points: 10,
    explanation: 'setTimeout, setInterval, setImmediate, dan event I/O adalah contoh Macrotask. Sedangkan Promise handlers, queueMicrotask, dan MutationObserver adalah Microtask.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Callback',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Bagaimana cara mengonversi fungsi berbasis error-first callback \`fs.readFile(path, cb)\` menjadi fungsi berbasis Promise di Node.js secara bawaan?`,
    options: [
      'A. util.promisify(fs.readFile)',
      'B. Promise.fromCallback(fs.readFile)',
      'C. fs.readFile.toPromise()',
      'D. async(fs.readFile)'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Modul util di Node.js menyediakan fungsi util.promisify(original) yang secara otomatis membungkus fungsi berformat error-first callback menjadi fungsi yang mengembalikan Promise.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa yang terjadi jika Microtask Queue terus-menerus menambahkan microtask baru tanpa henti (microtask starvation)?

\`\`\`javascript
function loop() {
  Promise.resolve().then(loop);
}
loop();
\`\`\` `,
    options: [
      'A. Event Loop kelaparan (starvation) dan Macrotask Queue (seperti click event atau render UI) tidak pernah mendapat giliran dieksekusi',
      'B. Browser otomatis mengalihkan tugas ke macrotask',
      'C. Terjadi Stack Overflow seketika',
      'D. Komputer restart otomatis'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Event Loop wajib mengosongkan seluruh antrean Microtask sebelum beralih ke tugas lain. Microtask yang berulang tanpa henti membuat peramban membeku karena Macrotask dan Render phase tidak pernah dieksekusi.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'setTimeout/setInterval',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan kode berikut:

\`\`\`javascript
const id = setTimeout(() => {
  console.log("Teks");
}, 5000);

clearTimeout(id);
\`\`\`

Apa output yang dicetak ke konsol setelah 5 detik berlalu?`,
    options: [
      'A. Tidak ada apa pun yang dicetak (timer berhasil dibatalkan sebelum sempat berjalan)',
      'B. "Teks"',
      'C. undefined',
      'D. TypeError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'clearTimeout(id) langsung membatalkan timer yang dijadwalkan, sehingga callback tidak akan pernah dieksekusi.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Callback',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan implementasi fungsi asinkron serial sederhana menggunakan callback:

\`\`\`javascript
function runSeries(tasks, cb) {
  let i = 0;
  function next() {
    if (i === tasks.length) return cb();
    tasks[i++](next);
  }
  next();
}
\`\`\`

Apa tujuan dari fungsi pembantu \`next()\` di atas?`,
    options: [
      'A. Berfungsi sebagai iterator callback yang memicu tugas berikutnya tepat setelah tugas saat ini selesai secara berurutan',
      'B. Menjalankan semua tugas secara paralel',
      'C. Membatalkan tugas yang gagal',
      'D. Mengabaikan tugas genap'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pola ini adalah cikal bakal kontrol alur serial sebelum adanya Promise/async-await: fungsi next dipanggil saat tugas selesai untuk melanjutkan ke indeks berikutnya.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Di manakah variabel lokal fungsi disimpan saat fungsi sedang dieksekusi di Call Stack?`,
    options: [
      'A. Di dalam Stack Frame fungsi tersebut di Call Stack',
      'B. Di dalam Event Queue',
      'C. Di dalam DOM Tree',
      'D. Di dalam LocalStorage'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Ketika fungsi dipanggil, stack frame baru dialokasikan di Call Stack untuk menampung argumen dan variabel lokal primitifnya.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'setTimeout/setInterval',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan batas nilai integer 32-bit bertanda pada \`setTimeout\`: jika waktu delay melebihi \`2147483647\` milidetik (~24.8 hari), apa yang dilakukan oleh engine browser?`,
    options: [
      'A. Mengalami overflow integer 32-bit dan menganggap delay sebagai 0 milidetik (dieksekusi seketika)',
      'B. Melempar RangeError: Timeout too large',
      'C. Mengunci aplikasi hingga 24 hari',
      'D. Membulatkan nilai menjadi 1000 milidetik'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dalam spesifikasi HTML5, delay setTimeout disimpan sebagai signed 32-bit integer (maks 2147483647). Nilai yang lebih besar menyebabkan overflow menjadi negatif/0 dan dieksekusi seketika.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Operasi manakah di bawah ini yang berjalan secara SINKRON (memblokir eksekusi baris berikutnya hingga selesai)?`,
    options: [
      'A. Perulangan for (let i = 0; i < 1000000; i++) {}',
      'B. fetch("https://api.example.com")',
      'C. setTimeout(() => {}, 1000)',
      'D. addEventListener("click", () => {})'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Perulangan loop murni di JavaScript dieksekusi langsung di Call Stack secara sinkron dan memblokir baris berikutnya hingga seluruh iterasi selesai.'
  },

  // =========================================================================
  // PROMISES (+15 questions -> total added: 30)
  // =========================================================================
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Bagaimana cara membuat Promise baru secara manual menggunakan konstruktor \`Promise\`?`,
    options: [
      'A. const p = new Promise((resolve, reject) => { /* logika */ });',
      'B. const p = Promise.create((resolve, reject) => {});',
      'C. const p = new Promise(resolve, reject);',
      'D. const p = makePromise();'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Konstruktor new Promise menerima fungsi executor dengan dua argumen bawaan: resolve (untuk memenuhi janji) dan reject (untuk menolak dengan galat).'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Async Await',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi async penjemput data berikut:

\`\`\`javascript
async function getUserName() {
  const res = await Promise.resolve({ name: "Aulia" });
  return res.name;
}

getUserName().then(name => console.log(name));
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. "Aulia"',
      'B. { name: "Aulia" }',
      'C. undefined',
      'D. Promise { "Aulia" }'
    ],
    correct: 'A',
    points: 10,
    explanation: 'await mengekstrak nilai resolve { name: "Aulia" }. Fungsi mengembalikan res.name yang diakses melalui handler .then() sehingga mencetak "Aulia".'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Error Handling',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Metode manakah pada rantai Promise yang digunakan untuk menangani rejection atau galat yang terjadi di tahap sebelumnya?`,
    options: [
      'A. .catch()',
      'B. .error()',
      'C. .failed()',
      'D. .reject()'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Metode .catch(errorHandler) menangkap rejection atau exception yang terjadi di mana pun pada rantai Promise sebelumnya.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perilaku mutasi status Promise:

\`\`\`javascript
const p = new Promise((resolve, reject) => {
  resolve("Sukses pertama");
  reject("Galat kedua");
  resolve("Sukses ketiga");
});

p.then(res => console.log(res)).catch(err => console.log(err));
\`\`\`

Apa output yang dicetak ke konsol dan mengapa?`,
    options: [
      'A. "Sukses pertama", karena status Promise tidak dapat diubah lagi setelah diselesaikan (settled)',
      'B. "Galat kedua"',
      'C. "Sukses ketiga"',
      'D. Ketiganya dicetak berurutan'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Status Promise bersifat immutable setelah settled: pemanggilan resolve/reject berikutnya di dalam executor yang sama akan diabaikan tanpa efek apa pun.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Async Await',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perulangan \`forEach\` yang memuat \`await\`:

\`\`\`javascript
const ids = [1, 2, 3];
ids.forEach(async (id) => {
  await uploadId(id);
});
console.log("Selesai");
\`\`\`

Mengapa teks "Selesai" langsung tercetak SEBELUM semua proses upload selesai?`,
    options: [
      'A. array.forEach tidak menunggu penyelesaian promise dari fungsi callback async',
      'B. Karena uploadId berjalan di thread background',
      'C. forEach membatalkan fungsi async',
      'D. ids bukan array murni'
    ],
    correct: 'A',
    points: 10,
    explanation: 'array.forEach() tidak peduli dengan Promise yang dikembalikan oleh callbacknya dan mengeksekusi iterasi berikutnya tanpa await. Untuk menunggu secara berurutan, gunakan loop for...of biasa.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Error Handling',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan re-throwing error di dalam blok \`catch\`:

\`\`\`javascript
async function execute() {
  try {
    await fetchApi();
  } catch (err) {
    console.log("Log error lokal");
    throw err;
  }
}
\`\`\`

Apa efek dari pernyataan \`throw err\` di dalam blok catch di atas?`,
    options: [
      'A. Meneruskan kembali galat ke pemanggil fungsi execute() agar dapat ditangani di level yang lebih tinggi',
      'B. Menghapus pesan error dari memori',
      'C. Memaksa fungsi mengembalikan status fulfilled',
      'D. Mengabaikan error dan melanjutkan eksekusi'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Re-throwing error (throw err) memungkinkan kita mencatat log kesalahan secara lokal sambil tetap membiarkan promise berstatus rejected agar pemanggil utama dapat meresponsnya.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan rantai handler yang mengembalikan Promise baru (Promise Chaining):

\`\`\`javascript
Promise.resolve(1)
  .then(val => {
    return new Promise(resolve => setTimeout(() => resolve(val + 2), 50));
  })
  .then(val => console.log(val));
\`\`\`

Apa nilai yang dicetak ke konsol?`,
    options: [
      'A. 3',
      'B. 1',
      'C. Promise { <pending> }',
      'D. undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Jika handler .then() mengembalikan objek Promise baru, rantai Promise luar akan otomatis "membuka" (unwrap) dan menunggu penyelesaian Promise dalam tersebut sebelum meneruskan nilai 3 ke .then() berikutnya.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Async Await',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penanganan pembatalan request menggunakan \`AbortController\` bersama fungsi \`fetch\`:

\`\`\`javascript
const controller = new AbortController();
setTimeout(() => controller.abort(), 100);

try {
  await fetch("https://api.example.com", { signal: controller.signal });
} catch (err) {
  if (err.name === "AbortError") {
    console.log("Request dibatalkan karena timeout");
  }
}
\`\`\`

Apa keunggulan menggunakan \`AbortController\` untuk membatalkan Promise jaringan?`,
    options: [
      'A. Menghentikan request HTTP langsung di level soket jaringan browser dan menghemat bandwidth pengguna',
      'B. Menghapus cookie browser',
      'C. Mengabaikan respon server tanpa menutup koneksi',
      'D. Mengubah fetch menjadi synchronous'
    ],
    correct: 'A',
    points: 10,
    explanation: 'AbortController adalah standar web API untuk membatalkan operasi asynchronous seperti fetch, melepaskan sumber daya jaringan seketika dengan melempar AbortError.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Error Handling',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Event global manakah yang dipicu di browser ketika ada Promise yang rejected namun tidak memiliki penangan \`.catch()\`?`,
    options: [
      'A. window.addEventListener("unhandledrejection", ...)',
      'B. window.addEventListener("promiseerror", ...)',
      'C. window.addEventListener("error", ...)',
      'D. window.addEventListener("rejected", ...)'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Event unhandledrejection dipicu pada objek global (window di browser, process di Node.js) saat sebuah Promise mengalami rejection tanpa adanya catch handler terpasang.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan metode penyelesaian Promise \`Promise.resolve()\`: apa yang terjadi jika argumen yang diberikan ke \`Promise.resolve(val)\` sudah merupakan objek Promise asli?`,
    options: [
      'A. Mengembalikan objek Promise asli tersebut secara langsung tanpa membungkus ulang (idempotent)',
      'B. Membungkusnya menjadi Promise ganda (Promise di dalam Promise)',
      'C. Melempar TypeError',
      'D. Mereset status Promise menjadi pending'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Promise.resolve() bersifat idempoten: jika dilewati objek Promise asli, ia langsung mengembalikan Promise tersebut apa adanya tanpa pembungkusan ganda.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Async Await',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penggunaan kata kunci \`await\` pada nilai non-Promise:

\`\`\`javascript
async function getAnswer() {
  const answer = await 42;
  return answer;
}
getAnswer().then(console.log);
\`\`\`

Bagaimana peramban menangani \`await 42\`?`,
    options: [
      'A. Membungkus angka 42 menjadi Promise.resolve(42) secara implisit dan mengekstrak nilainya',
      'B. Melempar TypeError: 42 is not a Promise',
      'C. Menunggu selama 42 milidetik',
      'D. Mengembalikan undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Jika ekspresi setelah await bukan berupa Promise, engine secara otomatis mengonversinya menjadi Promise.resolve(value) dan menangguhkan eksekusi ke microtask berikutnya.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Error Handling',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan fungsi pembantu penanganan error tanpa blok \`try/catch\`:

\`\`\`javascript
const to = (promise) =>
  promise.then(data => [null, data]).catch(err => [err, null]);

const [err, user] = await to(fetchUser());
\`\`\`

Pola penanganan error apakah yang diadopsi oleh kode di atas?`,
    options: [
      'A. Golang-style tuple error handling ([error, result])',
      'B. Java-style Exception handling',
      'C. Monad Option pattern',
      'D. Event Driven pattern'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pola ini mengadaptasi gaya return multi-value Golang ([err, result]), menghindari blok try/catch yang berlapis-lapis.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan objek "Thenable" kustom berikut:

\`\`\`javascript
const customThenable = {
  then: function(resolve) {
    resolve("Berhasil unwrap!");
  }
};

Promise.resolve(customThenable).then(res => console.log(res));
\`\`\`

Mengapa \`Promise.resolve\` dapat bekerja dengan objek \`customThenable\` di atas?`,
    options: [
      'A. Karena JavaScript mengimplementasikan konsep Thenable (objek apa pun yang memiliki metode .then() dianggap kompatibel dengan Promise)',
      'B. Karena customThenable mewarisi Promise.prototype',
      'C. Karena JavaScript mengonversi objek menjadi string',
      'D. Itu adalah bug engine JavaScript'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dalam spesifikasi Promises/A+, sebuah objek disebut "thenable" jika mendefinisikan metode .then(). Engine Promise mengenali dan memperlakukan thenable seperti Promise sejati.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Async Await',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan eksekusi async generator menggunakan \`for await...of\`:

\`\`\`javascript
async function* generateData() {
  yield await Promise.resolve(10);
  yield await Promise.resolve(20);
}

async function run() {
  for await (const val of generateData()) {
    console.log(val);
  }
}
run();
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. 10 lalu 20',
      'B. Promise { 10 } lalu Promise { 20 }',
      'C. [10, 20]',
      'D. TypeError: generateData is not iterable'
    ],
    correct: 'A',
    points: 10,
    explanation: 'for await...of adalah sintaks modern untuk mengonsumsi Async Iterable / Async Generator, secara otomatis menunggu setiap Promise yang dihasilkan oleh yield selesai.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Error Handling',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan eksekusi blok \`finally\` pada fungsi async:

\`\`\`javascript
async function testFinally() {
  try {
    return "Nilai Return";
  } finally {
    console.log("Pembersihan selesai");
  }
}
testFinally().then(console.log);
\`\`\`

Apa urutan pencetakan teks ke konsol?`,
    options: [
      'A. "Pembersihan selesai" terlebih dahulu, baru kemudian "Nilai Return"',
      'B. "Nilai Return" terlebih dahulu, baru kemudian "Pembersihan selesai"',
      'C. Hanya mencetak "Nilai Return"',
      'D. Hanya mencetak "Pembersihan selesai"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Blok finally dijamin dieksekusi sebelum fungsi benar-benar mengembalikan kontrol ke pemanggilnya, sehingga "Pembersihan selesai" dicetak sebelum nilai resolved return ditangani oleh .then().'
  }
];
