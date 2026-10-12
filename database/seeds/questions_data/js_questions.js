// ============================================================
// XORA — JavaScript Question Bank Data (Code-Based & Conceptual)
// database/seeds/questions_data/js_questions.js
// Topics:
//   1. Variables & Data Types (18 new -> 34 total)
//   2. Control Flow (25 new -> 32 total)
//   3. Functions (27 new -> 32 total)
//   4. Arrays & Objects (20 new -> 34 total)
//   5. DOM Manipulation (27 new -> 32 total)
//   6. Async JavaScript (30 new -> 32 total)
//   7. Promises (29 new -> 32 total)
// ============================================================

module.exports = [
  // =========================================================================
  // TOPIC 1: Variables & Data Types (Variable Declaration, Primitive Data Type, Scope)
  // Current in DB: 16 (12 Easy, 2 Medium, 2 Hard, 0 with code)
  // Target added: 18 questions (mostly Medium & Hard, >= 15 with code) -> Total: 34
  // =========================================================================
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Variable Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari kode JavaScript berikut?

\`\`\`javascript
const score = 100;
score = 200;

console.log(score);
\`\`\` `,
    options: [
      'A. TypeError: Assignment to constant variable',
      'B. 200',
      'C. 100',
      'D. undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Variabel yang dideklarasikan dengan const tidak dapat di-reassign (diberi nilai baru). Mencoba menetapkan nilai baru akan melempar TypeError.'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Primitive Data Type',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa hasil evaluasi operator \`typeof\` pada kode berikut?

\`\`\`javascript
console.log(typeof null);
console.log(typeof undefined);
\`\`\` `,
    options: [
      'A. "object" dan "undefined"',
      'B. "null" dan "undefined"',
      'C. "object" dan "null"',
      'D. "undefined" dan "undefined"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Di JavaScript, typeof null menghasilkan "object" (kebiasaan historis/bug awal bahasa yang dipertahankan untuk kompatibilitas), sedangkan typeof undefined menghasilkan "undefined".'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Scope',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari eksekusi kode berikut terkait block scope?

\`\`\`javascript
function testScope() {
  if (true) {
    var a = 10;
    let b = 20;
  }
  console.log(a);
  console.log(b);
}

testScope();
\`\`\` `,
    options: [
      'A. Mencetak 10 lalu melempar ReferenceError: b is not defined',
      'B. Mencetak 10 lalu mencetak 20',
      'C. ReferenceError: a is not defined',
      'D. undefined lalu 20'
    ],
    correct: 'A',
    points: 10,
    explanation: 'var memiliki function scope sehingga a tetap dapat diakses di luar blok if di dalam fungsi. Namun let memiliki block scope sehingga b tidak dapat diakses di luar blok if.'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Scope',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perilaku hoisting dan Temporal Dead Zone (TDZ) berikut:

\`\`\`javascript
console.log(x);
console.log(y);

var x = 5;
let y = 10;
\`\`\`

Apa yang terjadi saat baris pertama dan kedua dijalankan?`,
    options: [
      'A. Baris pertama mencetak undefined, baris kedua melempar ReferenceError (karena TDZ pada let)',
      'B. Keduanya mencetak undefined',
      'C. Keduanya melempar ReferenceError',
      'D. Baris pertama mencetak 5, baris kedua mencetak 10'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Deklarasi var x di-hoist dan diinisialisasi dengan undefined. Variabel let y juga di-hoist tetapi berada dalam Temporal Dead Zone (TDZ) hingga deklarasinya dieksekusi, memicu ReferenceError.'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Primitive Data Type',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari operasi konversi tipe (type coercion) berikut?

\`\`\`javascript
console.log("5" + 2);
console.log("5" - 2);
\`\`\` `,
    options: [
      'A. "52" (string) dan 3 (number)',
      'B. 7 dan 3',
      'C. "52" dan NaN',
      'D. 7 dan NaN'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Operator + dengan operand string melakukan penggabungan teks ("5" + 2 = "52"). Operator - memicu konversi numerik implisit ("5" dikonversi menjadi angka 5, 5 - 2 = 3).'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Primitive Data Type',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perbandingan kesetaraan berikut:

\`\`\`javascript
console.log([] == false);
console.log([] === false);
\`\`\`

Apa output yang dihasilkan di konsol?`,
    options: [
      'A. true lalu false',
      'B. false lalu false',
      'C. true lalu true',
      'D. false lalu true'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Dengan loose equality (==), [] dikonversi ke primitif string "" yang dikonversi ke angka 0, dan false dikonversi ke 0 (0 == 0 -> true). Pada strict equality (===), tipe berbeda (object vs boolean) langsung menghasilkan false.'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Variable Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan mutasi properti objek pada variabel \`const\`:

\`\`\`javascript
const user = { name: "Suci" };
user.name = "Aulia";
user.age = 22;

console.log(user);
\`\`\`

Apa hasil eksekusi kode di atas?`,
    options: [
      'A. { name: "Aulia", age: 22 } berhasil diperbarui',
      'B. TypeError karena objek dideklarasikan dengan const',
      'C. { name: "Suci" } tanpa perubahan',
      'D. undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'const mencegah penugasan ulang (reassignment) referensi memori variabel user. Namun isi internal dari objek yang dapat dimutasi (mutable) tetap dapat diubah atau ditambah propertinya.'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Primitive Data Type',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan operasi aritmatika dengan tipe khusus \`NaN\`:

\`\`\`javascript
console.log(NaN === NaN);
console.log(Number.isNaN("hello"));
console.log(Number.isNaN(Number("hello")));
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. false, false, true',
      'B. true, true, true',
      'C. false, true, true',
      'D. true, false, true'
    ],
    correct: 'A',
    points: 10,
    explanation: 'NaN tidak pernah sama dengan nilai apa pun termasuk dirinya sendiri (NaN === NaN adalah false). Number.isNaN("hello") bernilai false karena "hello" bertipe string (tidak dipaksa konversi), sedangkan Number("hello") menghasilkan NaN asli sehingga Number.isNaN(...) bernilai true.'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Scope',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan shadowing variabel pada nested scope berikut:

\`\`\`javascript
let a = 1;

function outer() {
  let a = 2;
  function inner() {
    let a = 3;
    console.log(a);
  }
  inner();
  console.log(a);
}

outer();
console.log(a);
\`\`\`

Apa urutan pencetakan nilai \`a\` ke konsol?`,
    options: [
      'A. 3, 2, 1',
      'B. 1, 2, 3',
      'C. 3, 3, 3',
      'D. 2, 2, 1'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Variable shadowing terjadi ketika variabel lokal membayangi variabel di scope luarnya. inner() mencetak a lokalnya (3), outer() mencetak a lokalnya (2), dan console.log global mencetak a global (1).'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Primitive Data Type',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penyalinan nilai primitif vs referensi berikut:

\`\`\`javascript
let num1 = 10;
let num2 = num1;
num2 = 20;

let arr1 = [1, 2];
let arr2 = arr1;
arr2.push(3);

console.log(num1, arr1);
\`\`\`

Apa output dari kode di atas?`,
    options: [
      'A. 10 dan [1, 2, 3]',
      'B. 20 dan [1, 2, 3]',
      'C. 10 dan [1, 2]',
      'D. 20 dan [1, 2]'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Tipe primitif (number) disalin berdasarkan nilainya (pass-by-value), sehingga perubahan num2 tidak memengaruhi num1. Array adalah objek referensi (pass-by-reference), sehingga arr1 dan arr2 menunjuk ke memori yang sama.'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Primitive Data Type',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan tipe data primitif modern \`Symbol\` dan \`BigInt\`:

\`\`\`javascript
const s1 = Symbol("id");
const s2 = Symbol("id");

console.log(s1 === s2);
console.log(typeof 9007199254740991n);
\`\`\`

Apa hasil pencetakan kedua baris tersebut?`,
    options: [
      'A. false dan "bigint"',
      'B. true dan "bigint"',
      'C. false dan "number"',
      'D. true dan "symbol"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Setiap pemanggilan Symbol() selalu menghasilkan identifier unik yang dijamin tidak akan pernah sama (s1 === s2 bernilai false). Angka dengan akhiran n merepresentasikan tipe primitif "bigint".'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Variable Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan deklarasi variabel tanpa kata kunci (implicit global) di dalam fungsi:

\`\`\`javascript
function setup() {
  leaked = "Terbocor ke global";
}
setup();
console.log(globalThis.leaked);
\`\`\`

Apa yang terjadi pada mode non-strict dan bagaimana cara mencegah kebocoran variabel tersebut?`,
    options: [
      'A. Variabel menjadi properti objek global; dapat dicegah dengan mengaktifkan "use strict" atau menggunakan let/const',
      'B. Melempar SyntaxError seketika di semua mode',
      'C. Variabel otomatis dihapus setelah fungsi selesai',
      'D. Variabel hanya dapat diakses melalui callback'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pada non-strict mode, assignment tanpa var/let/const membuat variabel global implisit (kebocoran memori). Mengaktifkan "use strict" akan mengubah perilaku ini menjadi ReferenceError.'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Scope',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penutupan leksikal pada perulangan:

\`\`\`javascript
var funcs = [];
for (let i = 0; i < 3; i++) {
  funcs.push(() => i);
}

console.log(funcs[0](), funcs[1](), funcs[2]());
\`\`\`

Apa output yang dicetak ke konsol dan mengapa?`,
    options: [
      'A. 0 1 2, karena let membuat binding variabel i baru untuk setiap iterasi loop',
      'B. 3 3 3, karena variabel i di-share bersama',
      'C. undefined undefined undefined',
      'D. 0 0 0'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Di ES6, deklarasi let di header for loop membuat lexical scope baru per iterasi, sehingga closure fungsi di dalamnya menangkap nilai i masing-masing (0, 1, 2).'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Primitive Data Type',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan metode pembekuan objek menggunakan \`Object.freeze()\`:

\`\`\`javascript
const config = Object.freeze({
  port: 3000,
  db: { name: "xora_db" }
});

config.port = 8080;
config.db.name = "prod_db";

console.log(config.port, config.db.name);
\`\`\`

Apa nilai dari \`config.port\` dan \`config.db.name\`?`,
    options: [
      'A. 3000 dan "prod_db" (Object.freeze bersifat dangkal/shallow freeze)',
      'B. 8080 dan "prod_db"',
      'C. 3000 dan "xora_db"',
      'D. TypeError dilempar di baris pertama'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Object.freeze() bersifat dangkal (shallow). Properti tingkat pertama (port) dibekukan dan tidak berubah, tetapi objek bersarang di dalamnya (db) tetap dapat dimutasi.'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Variable Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perilaku parameter default yang merujuk parameter sebelumnya:

\`\`\`javascript
function calculate(x = 1, y = x * 2) {
  return [x, y];
}

console.log(calculate(5));
console.log(calculate(undefined, 4));
\`\`\`

Apa hasil kembalian dari kedua pemanggilan fungsi di atas?`,
    options: [
      'A. [5, 10] dan [1, 4]',
      'B. [5, 10] dan [NaN, 4]',
      'C. [5, 2] dan [1, 4]',
      'D. [5, 10] dan [undefined, 4]'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pada calculate(5), x=5 dan y=5*2=10. Pada calculate(undefined, 4), argumen pertama undefined sehingga memicu default x=1, sedangkan y secara eksplisit diisi 4.'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Primitive Data Type',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan evaluasi nilai truthy dan falsy di JavaScript:

\`\`\`javascript
const items = [Boolean(0), Boolean(""), Boolean("0"), Boolean([]), Boolean({})];
console.log(items);
\`\`\`

Manakah nilai yang menghasilkan \`true\`?`,
    options: [
      'A. Boolean("0"), Boolean([]), dan Boolean({})',
      'B. Hanya Boolean("0")',
      'C. Semua bernilai false',
      'D. Semua bernilai true'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Nilai falsy di JavaScript adalah false, 0, -0, 0n, "", null, undefined, dan NaN. String tidak kosong ("0") serta objek/array apa pun ([] dan {}) selalu bernilai truthy (true).'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Scope',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perilaku hoisting pada deklarasi fungsi vs variabel dengan nama sama:

\`\`\`javascript
var foo = 10;
function foo() {}

console.log(typeof foo);
\`\`\`

Apa tipe data dari \`foo\` yang dicetak ke konsol?`,
    options: [
      'A. "number"',
      'B. "function"',
      'C. "undefined"',
      'D. TypeError: duplicate identifier'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Deklarasi function foo di-hoist terlebih dahulu. Namun assignment var foo = 10 dieksekusi secara berurutan saat runtime dan menimpa fungsi tersebut dengan angka 10, sehingga typeof foo adalah "number".'
  },
  {
    topic_name: 'Variables & Data Types',
    concept_name: 'Variable Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Manakah cara mendeklarasikan variabel yang nilainya tidak dapat diubah (konstan) sejak awal inisialisasi?`,
    options: [
      'A. const API_URL = "https://api.xora.id";',
      'B. let API_URL = "https://api.xora.id";',
      'C. var API_URL = "https://api.xora.id";',
      'D. static API_URL = "https://api.xora.id";'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kata kunci const digunakan untuk mendeklarasikan konstanta bertipe block scope yang nilainya tidak dapat di-reassign setelah inisialisasi awal.'
  },

  // =========================================================================
  // TOPIC 2: Control Flow (Conditional Statement, Loop, Switch)
  // Current in DB: 7 (6 Easy, 1 Medium, 0 Hard, 0 with code)
  // Target added: 25 questions (all with code, 4 Easy, 10 Medium, 11 Hard) -> Total: 32
  // =========================================================================
  {
    topic_name: 'Control Flow',
    concept_name: 'Conditional Statement',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari operator ternary berikut?

\`\`\`javascript
const score = 75;
const status = score >= 70 ? "Lulus" : "Remedial";

console.log(status);
\`\`\` `,
    options: [
      'A. "Lulus"',
      'B. "Remedial"',
      'C. true',
      'D. undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kondisi 75 >= 70 bernilai true, sehingga ekspresi ternary mengembalikan nilai bagian pertama yaitu "Lulus".'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Switch',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari blok switch berikut yang tidak memiliki pernyataan \`break\`?

\`\`\`javascript
let level = 2;
let message = "";

switch (level) {
  case 1:
    message += "Dasar ";
  case 2:
    message += "Menengah ";
  case 3:
    message += "Lanjut ";
  default:
    message += "Selesai";
}

console.log(message.trim());
\`\`\` `,
    options: [
      'A. "Menengah Lanjut Selesai"',
      'B. "Menengah"',
      'C. "Dasar Menengah Lanjut Selesai"',
      'D. "Selesai"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Karena tidak ada break pada case 2, eksekusi kode mengalami fall-through dan terus mengeksekusi case 3 dan default ("Menengah " + "Lanjut " + "Selesai").'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Berapa kali perulangan berikut akan mengeksekusi \`console.log\`?

\`\`\`javascript
for (let i = 0; i < 5; i++) {
  if (i === 3) break;
  console.log(i);
}
\`\`\` `,
    options: [
      'A. 3 kali (mencetak 0, 1, 2)',
      'B. 5 kali (mencetak 0, 1, 2, 3, 4)',
      'C. 4 kali (mencetak 0, 1, 2, 3)',
      'D. 2 kali (mencetak 0, 1)'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pernyataan break menghentikan perulangan seketika saat i === 3, sehingga console.log hanya dieksekusi saat i bernilai 0, 1, dan 2 (total 3 kali).'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari perulangan yang menggunakan pernyataan \`continue\` berikut?

\`\`\`javascript
let sum = 0;
for (let i = 1; i <= 5; i++) {
  if (i % 2 === 0) continue;
  sum += i;
}

console.log(sum);
\`\`\` `,
    options: [
      'A. 9 (1 + 3 + 5)',
      'B. 15 (1 + 2 + 3 + 4 + 5)',
      'C. 6 (2 + 4)',
      'D. 0'
    ],
    correct: 'A',
    points: 10,
    explanation: 'continue melompati iterasi saat i adalah angka genap (2 dan 4). Maka yang dijumlahkan ke sum hanyalah angka ganjil: 1 + 3 + 5 = 9.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perbedaan antara \`for...of\` dan \`for...in\` pada array berikut:

\`\`\`javascript
const fruits = ["Apel", "Jeruk"];

let resOf = "";
for (const item of fruits) resOf += item;

let resIn = "";
for (const key in fruits) resIn += key;

console.log(resOf, resIn);
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. "ApelJeruk" "01"',
      'B. "ApelJeruk" "ApelJeruk"',
      'C. "01" "ApelJeruk"',
      'D. "01" "01"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'for...of mengiterasi nilai elemen (values) dari iterable ("Apel", "Jeruk"), sedangkan for...in mengiterasi nama properti atau indeks kunci yang dapat dihitung ("0", "1").'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Conditional Statement',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan evaluasi short-circuit logic menggunakan operator \`&&\` dan \`||\` berikut:

\`\`\`javascript
const val1 = false || "Default";
const val2 = "" || "Fallback";
const val3 = 0 ?? 100;

console.log(val1, val2, val3);
\`\`\`

Apa nilai dari \`val1\`, \`val2\`, dan \`val3\` berturut-turut?`,
    options: [
      'A. "Default", "Fallback", 0',
      'B. "Default", "Fallback", 100',
      'C. false, "", 0',
      'D. "Default", "", 100'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Operator || mengembalikan operand kanan jika operand kiri falsy (false dan "" adalah falsy). Operator nullish coalescing (??) hanya mengembalikan operand kanan jika operand kiri bernilai null atau undefined (0 bukan null/undefined sehingga dipertahankan).'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perulangan \`do...while\` berikut:

\`\`\`javascript
let x = 10;
do {
  x += 5;
} while (x < 10);

console.log(x);
\`\`\`

Berapa nilai \`x\` setelah perulangan selesai?`,
    options: [
      'A. 15 (blok dieksekusi minimal 1 kali sebelum kondisi dievaluasi)',
      'B. 10',
      'C. 20',
      'D. Terjadi infinite loop'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Perulangan do...while selalu mengeksekusi blok kodenya setidaknya satu kali sebelum memeriksa kondisi while. Maka x bertambah menjadi 15, lalu kondisi (15 < 10) bernilai false dan loop berhenti.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Switch',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perbandingan tipe data pada pernyataan \`switch\`:

\`\`\`javascript
const code = "2";
let res = "N/A";

switch (code) {
  case 2:
    res = "Angka dua";
    break;
  case "2":
    res = "String dua";
    break;
}

console.log(res);
\`\`\`

Apa output dari kode di atas?`,
    options: [
      'A. "String dua" (switch menggunakan perbandingan strict equality ===)',
      'B. "Angka dua"',
      'C. "N/A"',
      'D. TypeError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pernyataan switch mengevaluasi nilai case menggunakan perbandingan strict equality (===), sehingga string "2" hanya cocok dengan case "2" dan tidak cocok dengan case 2.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Conditional Statement',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan optional chaining (\`?.\`) pada akses properti:

\`\`\`javascript
const user = { profile: null };
const city = user.profile?.address?.city;

console.log(city);
\`\`\`

Apa hasil evaluasi variabel \`city\`?`,
    options: [
      'A. undefined tanpa melempar galat',
      'B. TypeError: Cannot read property "address" of null',
      'C. null',
      'D. ""'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Operator optional chaining (?.) melakukan short-circuit dan mengembalikan undefined jika referensi bernilai null atau undefined, mencegah terjadinya TypeError.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan labeled statement pada nested loop berikut:

\`\`\`javascript
let result = "";
outerLoop: for (let i = 1; i <= 3; i++) {
  for (let j = 1; j <= 3; j++) {
    if (i === 2 && j === 2) {
      break outerLoop;
    }
    result += \`\${i}\${j} \`;
  }
}
console.log(result.trim());
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. "11 12 13 21"',
      'B. "11 12 13 21 23 31 32 33"',
      'C. "11 12 13"',
      'D. "11 12 13 21 22 23"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'break outerLoop menghentikan loop terluar (outerLoop) seketika saat i === 2 dan j === 2. Hasil yang sempat tercatat adalah 11, 12, 13, dan 21.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Conditional Statement',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan logical assignment operator (\`&&=\`, \`||=\`, \`??=\`) berikut:

\`\`\`javascript
let a = 0;
let b = null;
let c = "XORA";

a ||= 10;
b ??= "Default";
c &&= "Aktif";

console.log(a, b, c);
\`\`\`

Apa output nilai dari \`a\`, \`b\`, dan \`c\`?`,
    options: [
      'A. 10 "Default" "Aktif"',
      'B. 0 "Default" "Aktif"',
      'C. 10 null "Aktif"',
      'D. 0 "Default" "XORA"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'a ||= 10 memberi nilai 10 karena 0 falsy. b ??= "Default" memberi nilai "Default" karena b null. c &&= "Aktif" memberi nilai "Aktif" karena c sebelumnya bernilai truthy.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan mutasi array saat proses perulangan sedang berlangsung:

\`\`\`javascript
const arr = [1, 2, 3, 4];
for (let i = 0; i < arr.length; i++) {
  if (arr[i] === 2) {
    arr.splice(i, 1);
  }
}
console.log(arr);
\`\`\`

Mengapa elemen \`3\` tidak terperiksa dan tetap berada di dalam array?`,
    options: [
      'A. Karena splice menggeser indeks elemen ke kiri sehingga indeks i berikutnya melompati elemen 3',
      'B. Karena splice membuat array baru',
      'C. Karena perulangan for langsung berhenti saat array dimutasi',
      'D. Karena elemen 3 bertipe number'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Menghapus elemen di indeks 1 menggeser elemen berikutnya (3) ke indeks 1. Saat i bertambah menjadi 2 pada iterasi berikutnya, elemen di indeks 1 (angka 3) terlewatkan tanpa pernah diperiksa.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Switch',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan teknik pencocokan rentang ekspresi menggunakan \`switch (true)\`:

\`\`\`javascript
const age = 17;
let category = "";

switch (true) {
  case age < 13:
    category = "Anak";
    break;
  case age < 20:
    category = "Remaja";
    break;
  default:
    category = "Dewasa";
}

console.log(category);
\`\`\`

Apa hasil evaluasi dari struktur switch di atas?`,
    options: [
      'A. "Remaja"',
      'B. "Anak"',
      'C. "Dewasa"',
      'D. TypeError: switch argument must be primitive variable'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Pola switch (true) mengevaluasi setiap ekspresi case dan memilih case pertama yang menghasilkan nilai boolean true. Karena 17 < 20 adalah true, category bernilai "Remaja".'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Conditional Statement',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Kapan blok \`else\` pada struktur \`if...else\` akan dieksekusi?`,
    options: [
      'A. Ketika kondisi pada blok if menghasilkan nilai falsy',
      'B. Ketika kondisi pada blok if menghasilkan nilai truthy',
      'C. Selalu dieksekusi setelah blok if selesai',
      'D. Hanya ketika terjadi galat runtime di blok if'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Blok else adalah cabang alternatif yang dieksekusi ketika ekspresi kondisi if bernilai false (atau nilai falsy lainnya).'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan generator loop dan iterator protocol:

\`\`\`javascript
function* numberGen() {
  yield 1;
  yield 2;
  yield 3;
}

let sum = 0;
for (const n of numberGen()) {
  sum += n;
}

console.log(sum);
\`\`\`

Berapa nilai \`sum\` yang dihasilkan dari iterasi generator di atas?`,
    options: [
      'A. 6',
      'B. 3',
      'C. NaN',
      'D. 0'
    ],
    correct: 'A',
    points: 10,
    explanation: 'for...of secara otomatis mengonsumsi generator object yang mengimplementasikan iterable protocol, menghasilkan nilai yield 1, 2, dan 3 (total 1 + 2 + 3 = 6).'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Conditional Statement',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan nested ternary berikut:

\`\`\`javascript
const score = 85;
const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : "D";

console.log(grade);
\`\`\`

Apa nilai \`grade\` yang dicetak ke konsol?`,
    options: [
      'A. "B"',
      'B. "A"',
      'C. "C"',
      'D. "D"'
    ],
    correct: 'A',
    points: 10,
    explanation: '85 >= 90 bernilai false, sehingga evaluasi beralih ke cabang kedua: 85 >= 80 bernilai true, menghasilkan "B".'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa yang terjadi pada perulangan \`while\` jika kondisinya tidak pernah berubah menjadi \`false\`?

\`\`\`javascript
let i = 0;
while (i < 5) {
  // Tanpa increment i++
}
\`\`\` `,
    options: [
      'A. Terjadi perulangan tak terbatas (infinite loop) yang membekukan thread utama browser',
      'B. Browser secara otomatis menghentikan loop setelah 100 iterasi',
      'C. Browser melemparkan InfiniteLoopException',
      'D. Kode langsung melanjutkan ke baris berikutnya'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Jika variabel kondisi loop tidak pernah dimodifikasi agar bernilai false, perulangan tak terbatas (infinite loop) akan memonopoli single thread JavaScript dan membekukan halaman.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Conditional Statement',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perilaku negasi ganda (\`!!\`) berikut:

\`\`\`javascript
const val1 = !!"Hello";
const val2 = !!0;
const val3 = !![];

console.log(val1, val2, val3);
\`\`\`

Apa output yang dihasilkan?`,
    options: [
      'A. true false true',
      'B. true false false',
      'C. false true false',
      'D. true true true'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Negasi ganda (!!) mengonversi nilai menjadi tipe boolean murni. "Hello" adalah truthy (true), 0 adalah falsy (false), dan array objek [] adalah truthy (true).'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Switch',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan cakupan variabel (scoping) di dalam blok \`switch\`:

\`\`\`javascript
switch (1) {
  case 1: {
    const x = "Satu";
    console.log(x);
    break;
  }
  case 2: {
    const x = "Dua";
    console.log(x);
    break;
  }
}
\`\`\`

Mengapa penggunaan kurung kurawal \`{ }\` pada setiap klausa \`case\` diperlukan saat mendeklarasikan variabel dengan \`const\`?`,
    options: [
      'A. Untuk membuat block scope terisolasi dan menghindari SyntaxError: Identifier "x" has already been declared',
      'B. Untuk membuat case dieksekusi secara asinkron',
      'C. Karena kurung kurawal diwajibkan oleh sintaks ES2022',
      'D. Agar klausa break tidak diperlukan lagi'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Seluruh blok switch berbagi lexical scope tunggal. Tanpa blok kurung kurawal { }, mendeklarasikan variabel dengan nama yang sama (const x) pada case berbeda akan memicu SyntaxError redéklarasi.'
  },
  {
    topic_name: 'Control Flow',
    concept_name: 'Loop',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perulangan string menggunakan \`for...of\`:

\`\`\`javascript
let count = 0;
for (const char of "XORA") {
  count++;
}
console.log(count);
\`\`\`

Berapa nilai \`count\` yang dicetak ke konsol?`,
    options: [
      'A. 4',
      'B. 1',
      'C. undefined',
      'D. TypeError: string is not iterable'
    ],
    correct: 'A',
    points: 10,
    explanation: 'String di JavaScript adalah iterable. Perulangan for...of mengiterasi setiap karakter satu per satu ("X", "O", "R", "A"), sehingga count bernilai 4.'
  },

  // =========================================================================
  // TOPIC 3: Functions (Function Declaration, Parameter, Return Value)
  // Current in DB: 5 (4 Easy, 0 Medium, 1 Hard, 0 with code)
  // Target added: 27 questions (all with code, 6 Easy, 11 Medium, 10 Hard) -> Total: 32
  // =========================================================================
  {
    topic_name: 'Functions',
    concept_name: 'Parameter',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari fungsi dengan default parameter berikut?

\`\`\`javascript
function hitungTotal(harga, pajak = 0.1) {
  return harga + harga * pajak;
}

console.log(hitungTotal(100));
\`\`\` `,
    options: [
      'A. 110',
      'B. 100',
      'C. NaN',
      'D. undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Karena argumen kedua tidak diberikan, parameter pajak menggunakan nilai default 0.1. Total = 100 + (100 * 0.1) = 110.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Return Value',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa nilai kembalian dari fungsi yang tidak memiliki pernyataan \`return\` eksplisit?

\`\`\`javascript
function sapa(nama) {
  console.log("Halo, " + nama);
}

const hasil = sapa("Budi");
console.log(hasil);
\`\`\` `,
    options: [
      'A. undefined',
      'B. null',
      'C. "Halo, Budi"',
      'D. 0'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Fungsi JavaScript yang tidak memiliki pernyataan return mengembalikan nilai default undefined secara otomatis.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perbedaan pemanggilan fungsi sebelum deklarasi berikut:

\`\`\`javascript
console.log(tambah(2, 3));
console.log(kali(2, 3));

function tambah(a, b) {
  return a + b;
}

const kali = (a, b) => a * b;
\`\`\`

Apa yang terjadi saat baris kedua (\`kali(2, 3)\`) dieksekusi?`,
    options: [
      'A. ReferenceError: Cannot access "kali" before initialization',
      'B. Berhasil mencetak 6',
      'C. TypeError: kali is not a function',
      'D. undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Function declaration tambah di-hoist seutuhnya beserta badannya. Namun arrow function yang ditampung dalam const kali berada dalam TDZ dan tidak dapat dipanggil sebelum baris inisialisasinya.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Parameter',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari fungsi yang menggunakan rest parameters (\`...args\`) berikut?

\`\`\`javascript
function jumlahkan(...angka) {
  return angka.reduce((acc, curr) => acc + curr, 0);
}

console.log(jumlahkan(1, 2, 3, 4));
\`\`\` `,
    options: [
      'A. 10',
      'B. [1, 2, 3, 4]',
      'C. NaN',
      'D. 4'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Rest parameters (...angka) mengumpulkan seluruh argumen menjadi array [1, 2, 3, 4]. Operasi reduce kemudian menjumlahkannya menjadi 10.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan konsep closure dan enkapsulasi state berikut:

\`\`\`javascript
function buatPenghitung() {
  let count = 0;
  return function() {
    count++;
    return count;
  };
}

const counterA = buatPenghitung();
const counterB = buatPenghitung();

counterA();
console.log(counterA());
console.log(counterB());
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. 2 lalu 1',
      'B. 2 lalu 2',
      'C. 1 lalu 1',
      'D. 3 lalu 1'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Setiap pemanggilan buatPenghitung() membuat lexical environment baru yang terisolasi. counterA dipanggil dua kali (count = 2), sedangkan counterB baru dipanggil satu kali (count = 1).'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perilaku kata kunci \`this\` pada arrow function di dalam objek:

\`\`\`javascript
const user = {
  nama: "Rian",
  sapaBiasa: function() {
    return "Halo " + this.nama;
  },
  sapaPanah: () => {
    return "Halo " + this.nama;
  }
};

console.log(user.sapaBiasa());
console.log(user.sapaPanah());
\`\`\`

Apa perbedaan hasil dari kedua pemanggilan metode di atas?`,
    options: [
      'A. sapaBiasa mencetak "Halo Rian", sedangkan sapaPanah mencetak "Halo undefined" (karena arrow function tidak mengikat this sendiri)',
      'B. Keduanya mencetak "Halo Rian"',
      'C. Keduanya mencetak "Halo undefined"',
      'D. sapaPanah melempar SyntaxError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Arrow function tidak memiliki binding this sendiri; ia mewarisi this dari scope leksikal luarnya (dalam hal ini objek global / window / module exports), sehingga this.nama bernilai undefined.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan IIFE (Immediately Invoked Function Expression) berikut:

\`\`\`javascript
const result = (function(x, y) {
  return x * y;
})(4, 5);

console.log(result);
\`\`\`

Berapa nilai \`result\` yang dihasilkan?`,
    options: [
      'A. 20',
      'B. undefined',
      'C. [Function: anonymous]',
      'D. NaN'
    ],
    correct: 'A',
    points: 10,
    explanation: 'IIFE adalah ekspresi fungsi yang langsung dieksekusi seketika setelah didefinisikan, mengembalikan hasil perkalian 4 * 5 = 20.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Parameter',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi yang memodifikasi argumen objek yang diterima:

\`\`\`javascript
function updateItem(obj) {
  obj.price = 500;
  obj = { price: 999 };
}

const item = { price: 100 };
updateItem(item);
console.log(item.price);
\`\`\`

Berapa nilai \`item.price\` setelah pemanggilan fungsi?`,
    options: [
      'A. 500',
      'B. 999',
      'C. 100',
      'D. undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Di JavaScript, parameter objek dilewatkan dengan pass-by-reference-value. Mengubah properti (obj.price = 500) mengubah objek asli. Tetapi me-reassign parameter (obj = {...}) hanya mengalihkan variabel lokal fungsi tanpa memengaruhi objek asli.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan konsep Higher-Order Function (Currying) berikut:

\`\`\`javascript
function multiply(a) {
  return function(b) {
    return a * b;
  };
}

const double = multiply(2);
console.log(double(5));
console.log(multiply(3)(4));
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. 10 lalu 12',
      'B. 10 lalu 7',
      'C. 7 lalu 12',
      'D. undefined lalu undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'multiply(a) mengembalikan fungsi yang mengingat nilai a melalui closure. double(5) mengalikan 2 * 5 = 10, dan multiply(3)(4) mengalikan 3 * 4 = 12.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Return Value',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi dengan pola Early Return berikut:

\`\`\`javascript
function processAge(age) {
  if (age < 0) return "Tidak valid";
  if (age < 18) return "Di bawah umur";
  return "Dewasa";
}

console.log(processAge(-5));
\`\`\`

Apa keuntungan utama menerapkan pola "Early Return" di atas?`,
    options: [
      'A. Mengurangi kedalaman bersarang (nesting) dari blok if/else dan membuat kode lebih bersih serta mudah dibaca',
      'B. Mengubah eksekusi fungsi menjadi multi-threaded',
      'C. Mengompresi ukuran berkas JavaScript',
      'D. Menghilangkan kebutuhan untuk memvalidasi tipe data'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Early Return menangani kasus tepi (edge cases) atau kondisi gagal di awal fungsi dan langsung keluar, mencegah hierarki if/else bersarang yang dalam (arrow anti-pattern).'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pemanggilan fungsi dengan metode \`.call()\` dan \`.apply()\`:

\`\`\`javascript
function info(greeting, punct) {
  return \`\${greeting}, \${this.name}\${punct}\`;
}

const person = { name: "Budi" };
console.log(info.call(person, "Halo", "!"));
console.log(info.apply(person, ["Hai", "?"]));
\`\`\`

Apa perbedaan sintaks parameter antara \`.call()\` dan \`.apply()\`?`,
    options: [
      'A. .call() menerima argumen tambahan satu per satu secara terpisah, sedangkan .apply() menerima argumen tambahan dalam bentuk array',
      'B. .call() hanya bekerja pada fungsi sinkron, .apply() pada asinkron',
      'C. .apply() tidak mengubah konteks this',
      'D. Tidak ada perbedaan sintaks'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kedua metode menetapkan nilai this eksplisit. Perbedaannya: call menerima daftar argumen terpisah (arg1, arg2), sedangkan apply menerima argumen dalam satu array ([arg1, arg2]).'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan metode \`.bind()\` dalam pengikatan konteks fungsi:

\`\`\`javascript
const moduleObj = {
  x: 42,
  getX: function() {
    return this.x;
  }
};

const unboundGetX = moduleObj.getX;
const boundGetX = unboundGetX.bind(moduleObj);

console.log(unboundGetX());
console.log(boundGetX());
\`\`\`

Apa output dari pemanggilan kedua baris di atas?`,
    options: [
      'A. undefined lalu 42',
      'B. 42 lalu 42',
      'C. 42 lalu undefined',
      'D. TypeError: unboundGetX is not a function'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Ketika moduleObj.getX ditugaskan ke variabel unboundGetX, binding this terlepas dan mengarah ke scope global (di mana x bernilai undefined). Metode .bind(moduleObj) membuat fungsi baru yang mengikat this secara permanen ke moduleObj.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Parameter',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa yang terjadi jika suatu fungsi dipanggil dengan jumlah argumen lebih sedikit daripada parameter yang dideklarasikan?

\`\`\`javascript
function greet(firstName, lastName) {
  return firstName + " " + lastName;
}

console.log(greet("Budi"));
\`\`\` `,
    options: [
      'A. Parameter lastName bernilai undefined ("Budi undefined")',
      'B. Melempar ArgumentMissingError',
      'C. Otomatis mengembalikan nilai null',
      'D. Parameter lastName bernilai string kosong'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Di JavaScript, parameter yang tidak diberi nilai argumen saat pemanggilan akan otomatis berstatus undefined tanpa melempar error sintaks.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Return Value',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi rekursif sederhana untuk faktorial berikut:

\`\`\`javascript
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

console.log(factorial(4));
\`\`\`

Berapa nilai kembalian dari \`factorial(4)\`?`,
    options: [
      'A. 24 (4 * 3 * 2 * 1)',
      'B. 10',
      'C. 16',
      'D. 12'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Fungsi menghitung secara rekursif: 4 * factorial(3) = 4 * 6 = 24. Base case (n <= 1) mengembalikan 1.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Function Declaration',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Manakah dari penulisan arrow function berikut yang mengembalikan objek literal secara implisit dengan benar?`,
    options: [
      'A. const makeUser = (name) => ({ name: name });',
      'B. const makeUser = (name) => { name: name };',
      'C. const makeUser = (name) => return { name: name };',
      'D. const makeUser = (name) => <name: name>;'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Untuk mengembalikan object literal secara ringkas dari arrow function tanpa kata kunci return, kurung kurawal objek wajib dibungkus dalam tanda kurung biasa ({ ... }), jika tidak browser akan menganggap kurung kurawal sebagai blok kode fungsi.'
  },
  {
    topic_name: 'Functions',
    concept_name: 'Parameter',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan objek \`arguments\` pada fungsi tradisional vs arrow function:

\`\`\`javascript
function testArguments() {
  return arguments.length;
}

const arrowArguments = () => {
  return arguments.length;
};

console.log(testArguments(1, 2, 3));
\`\`\`

Mengapa arrow function tidak direkomendasikan untuk mengakses objek \`arguments\`?`,
    options: [
      'A. Arrow function tidak memiliki objek "arguments" sendiri; ia merujuk ke scope luarnya (atau melempar ReferenceError)',
      'B. arguments selalu bernilai 0 pada arrow function',
      'C. arguments adalah array murni pada arrow function',
      'D. arguments hanya bekerja untuk string'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Arrow function tidak mengikat objek arguments. Disarankan menggunakan rest parameter modern (...args) yang bekerja secara universal di semua jenis fungsi.'
  },

  // =========================================================================
  // TOPIC 4: Arrays & Objects (Array Methods, Destructuring, Object Literal)
  // Current in DB: 14 (5 Easy, 6 Medium, 3 Hard, 0 with code)
  // Target added: 20 questions (all with code, 5 Easy, 6 Medium, 9 Hard) -> Total: 34
  // =========================================================================
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Array Methods',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari operasi transformasi array menggunakan metode \`.map()\` berikut?

\`\`\`javascript
const numbers = [2, 4, 6];
const result = numbers.map(number => number * 2);

console.log(result);
\`\`\` `,
    options: [
      'A. [4, 8, 12]',
      'B. [2, 4, 6]',
      'C. [4, 6, 8]',
      'D. undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Metode .map() membuat array baru berisi hasil pemanggilan fungsi yang disediakan untuk setiap elemen array ([2*2, 4*2, 6*2] = [4, 8, 12]).'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Array Methods',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari penyaringan array menggunakan metode \`.filter()\` berikut?

\`\`\`javascript
const scores = [65, 80, 55, 90, 70];
const passed = scores.filter(score => score >= 70);

console.log(passed);
\`\`\` `,
    options: [
      'A. [80, 90, 70]',
      'B. [65, 80, 90, 70]',
      'C. [65, 55]',
      'D. [80, 90]'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Metode .filter() mengembalikan array baru yang hanya memuat elemen-elemen yang menghasilkan nilai true pada predikat (>= 70), yaitu 80, 90, dan 70.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Array Methods',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari akumulasi nilai menggunakan \`.reduce()\` berikut?

\`\`\`javascript
const cart = [
  { price: 100, qty: 2 },
  { price: 50, qty: 1 }
];

const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

console.log(total);
\`\`\` `,
    options: [
      'A. 250',
      'B. 150',
      'C. 200',
      'D. 300'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Akumulasi dimulai dari initialValue 0: (0 + 100*2) = 200, lalu (200 + 50*1) = 250.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Destructuring',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan operasi destructuring objek dengan alias dan default value berikut:

\`\`\`javascript
const profile = { username: "alex99" };
const { username: akun, role = "learner" } = profile;

console.log(akun, role);
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. "alex99" "learner"',
      'B. "alex99" undefined',
      'C. undefined "learner"',
      'D. ReferenceError: username is not defined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Sintaks username: akun merename properti username menjadi variabel akun. Karena role tidak ada pada objek profile, variabel role mengambil nilai default "learner".'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Object Literal',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari penggabungan objek menggunakan spread operator (\`...\`) berikut?

\`\`\`javascript
const baseConfig = { theme: "light", debug: false };
const userConfig = { theme: "dark", language: "id" };

const finalConfig = { ...baseConfig, ...userConfig };

console.log(finalConfig);
\`\`\` `,
    options: [
      'A. { theme: "dark", debug: false, language: "id" }',
      'B. { theme: "light", debug: false, language: "id" }',
      'C. { theme: ["light", "dark"], debug: false, language: "id" }',
      'D. SyntaxError: duplicate key'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Spread operator menyalin properti secara berurutan. Properti dengan nama yang sama (theme) pada objek userConfig akan menimpa (override) nilai dari baseConfig.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Array Methods',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan chaining metode array modern berikut:

\`\`\`javascript
const users = [
  { id: 1, name: "Ani", active: true },
  { id: 2, name: "Budi", active: false },
  { id: 3, name: "Citra", active: true }
];

const result = users
  .filter(u => u.active)
  .map(u => u.name)
  .join(", ");

console.log(result);
\`\`\`

Apa output yang dihasilkan?`,
    options: [
      'A. "Ani, Citra"',
      'B. ["Ani", "Citra"]',
      'C. "Ani, Budi, Citra"',
      'D. "Citra, Ani"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Metode .filter() menghasilkan [{id:1}, {id:3}], .map() menghasilkan array nama ["Ani", "Citra"], dan .join(", ") menggabungkannya menjadi string "Ani, Citra".'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Destructuring',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan operasi array destructuring dengan rest syntax:

\`\`\`javascript
const colors = ["Merah", "Hijau", "Biru", "Kuning"];
const [primary, , ...others] = colors;

console.log(primary);
console.log(others);
\`\`\`

Apa nilai dari \`primary\` dan \`others\`?`,
    options: [
      'A. primary = "Merah" dan others = ["Biru", "Kuning"]',
      'B. primary = "Merah" dan others = ["Hijau", "Biru", "Kuning"]',
      'C. primary = "Merah" dan others = "Biru"',
      'D. primary = "Merah" dan others = ["Kuning"]'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Koma kosong (, ,) melompati elemen kedua ("Hijau"). Maka primary mengambil "Merah", dan rest parameter ...others menampung sisa elemen ["Biru", "Kuning"].'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Array Methods',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perbedaan antara \`.find()\` dan \`.filter()\` berikut:

\`\`\`javascript
const numbers = [10, 25, 30, 45];
const found = numbers.find(n => n > 20);

console.log(found);
\`\`\`

Apa nilai dari variabel \`found\`?`,
    options: [
      'A. 25 (elemen pertama yang cocok)',
      'B. [25, 30, 45]',
      'C. 30',
      'D. true'
    ],
    correct: 'A',
    points: 10,
    explanation: '.find() mengembalikan SATU elemen pertama yang memenuhi kondisi predikat, bukan array seperti .filter(). Elemen pertama > 20 adalah 25.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Array Methods',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Metode array manakah yang menguji apakah SETIDAKNYA SATU elemen dalam array memenuhi kondisi predikat?`,
    options: [
      'A. array.some()',
      'B. array.every()',
      'C. array.includes()',
      'D. array.indexOf()'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Metode .some() menguji apakah setidaknya ada satu elemen yang lulus pengujian fungsi dan mengembalikan nilai boolean true/false.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Array Methods',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan mutasi array menggunakan \`.sort()\` tanpa comparator:

\`\`\`javascript
const nums = [10, 5, 100, 2];
nums.sort();

console.log(nums);
\`\`\`

Apa urutan array setelah \`.sort()\` dijalankan?`,
    options: [
      'A. [10, 100, 2, 5] (karena diurutkan secara leksikografis/string)',
      'B. [2, 5, 10, 100]',
      'C. [100, 10, 5, 2]',
      'D. [5, 2, 10, 100]'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Secara default, array.sort() mengonversi elemen menjadi string dan mengurutkannya berdasarkan urutan kode UTF-16. Untuk mengurutkan angka numerik dengan benar, wajib menggunakan pembanding (a, b) => a - b.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Object Literal',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan metode ekstraksi kunci dan nilai objek berikut:

\`\`\`javascript
const scores = { html: 90, css: 85 };
console.log(Object.keys(scores));
console.log(Object.values(scores));
\`\`\`

Apa output yang dihasilkan oleh kedua pemanggilan fungsi di atas?`,
    options: [
      'A. ["html", "css"] dan [90, 85]',
      'B. [90, 85] dan ["html", "css"]',
      'C. [["html", 90], ["css", 85]]',
      'D. { keys: 2, values: 2 }'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Object.keys() mengembalikan array string nama properti objek, sedangkan Object.values() mengembalikan array nilai-nilai properti tersebut.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Object Literal',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penyalinan mendalam (deep copy) menggunakan fitur modern \`structuredClone()\`:

\`\`\`javascript
const original = { details: { role: "admin" } };
const copy = structuredClone(original);

copy.details.role = "member";

console.log(original.details.role);
\`\`\`

Berapa nilai \`original.details.role\`?`,
    options: [
      'A. "admin" (structuredClone membuat deep clone mandiri)',
      'B. "member"',
      'C. undefined',
      'D. TypeError'
    ],
    correct: 'A',
    points: 10,
    explanation: 'structuredClone() adalah API bawaan web modern untuk membuat klon mendalam (deep clone) dari objek kompleks, sehingga perubahan pada objek bersarang di copy tidak memengaruhi original.'
  },
  {
    topic_name: 'Arrays & Objects',
    concept_name: 'Destructuring',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pertukaran nilai dua variabel tanpa variabel pembantu (swap variables):

\`\`\`javascript
let a = 1;
let b = 2;

[a, b] = [b, a];

console.log(a, b);
\`\`\`

Apa nilai \`a\` dan \`b\` setelah baris penugasan di atas?`,
    options: [
      'A. a = 2 dan b = 1',
      'B. a = 1 dan b = 2',
      'C. a = 2 dan b = 2',
      'D. a = 1 dan b = 1'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Array destructuring assignment ([a, b] = [b, a]) adalah teknik idiomatis JavaScript modern untuk menukar (swap) nilai dua variabel dalam satu baris ekspresi.'
  },

  // =========================================================================
  // TOPIC 5: DOM Manipulation (DOM Selection, DOM Modification, DOM Events)
  // Current in DB: 5 (2 Easy, 2 Medium, 1 Hard, 0 with code)
  // Target added: 27 questions (all with code, 8 Easy, 9 Medium, 10 Hard) -> Total: 32
  // =========================================================================
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Selection',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Metode DOM manakah yang mengembalikan elemen PERTAMA yang cocok dengan pemilih CSS yang diberikan?`,
    options: [
      'A. document.querySelector(".btn-submit")',
      'B. document.querySelectorAll(".btn-submit")',
      'C. document.getElementsByClassName("btn-submit")',
      'D. document.findFirst(".btn-submit")'
    ],
    correct: 'A',
    points: 10,
    explanation: 'document.querySelector() mengembalikan elemen pertama yang cocok dengan pemilih CSS, atau null jika tidak ditemukan. querySelectorAll mengembalikan kumpulan NodeList.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan elemen paragraf \`<p id="status">Memuat...</p>\`. Kode manakah yang paling aman untuk memperbarui teksnya tanpa merender tag HTML berbahaya?`,
    options: [
      'A. document.getElementById("status").textContent = "Berhasil!";',
      'B. document.getElementById("status").innerHTML = "Berhasil!";',
      'C. document.getElementById("status").value = "Berhasil!";',
      'D. document.getElementById("status").outerHTML = "Berhasil!";'
    ],
    correct: 'A',
    points: 10,
    explanation: '.textContent hanya menetapkan teks murni dan secara otomatis meng-escape karakter khusus, mencegah celah keamanan injeksi XSS yang dapat terjadi pada .innerHTML.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan manipulasi class CSS pada elemen DOM berikut:

\`\`\`javascript
const card = document.querySelector(".card");

card.classList.add("active");
card.classList.toggle("hidden");
card.classList.remove("loading");
\`\`\`

Apa yang dilakukan oleh metode \`card.classList.toggle("hidden")\`?`,
    options: [
      'A. Menghapus kelas "hidden" jika sudah ada, atau menambahkannya jika belum ada',
      'B. Menghapus semua kelas lain dan hanya menyisakan "hidden"',
      'C. Menyembunyikan elemen secara permanen dari memori DOM',
      'D. Memeriksa apakah kelas "hidden" ada dan mengembalikan true/false tanpa mengubah class'
    ],
    correct: 'A',
    points: 10,
    explanation: '.classList.toggle("class") berfungsi seperti sakelar: jika kelas sudah ada maka dihapus, jika belum ada maka ditambahkan ke daftar kelas elemen.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penanganan event form berikut:

\`\`\`javascript
const form = document.querySelector("#login-form");

form.addEventListener("submit", function(event) {
  event.preventDefault();
  console.log("Form divalidasi via JavaScript");
});
\`\`\`

Apa fungsi pemanggilan \`event.preventDefault()\` pada event submit di atas?`,
    options: [
      'A. Mencegah aksi bawaan peramban yang memuat ulang halaman (page reload)',
      'B. Menghapus semua event listener lain yang terpasang pada formulir',
      'C. Mencegah event merambat (bubbling) ke elemen induk',
      'D. Mengosongkan nilai input kata sandi seketika'
    ],
    correct: 'A',
    points: 10,
    explanation: 'event.preventDefault() membatalkan perilaku default browser, yang pada form submit biasanya memicu refresh halaman dan pengiriman synchronous HTTP.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan konsep Event Delegation pada daftar elemen dinamis:

\`\`\`html
<ul id="todo-list">
  <li data-id="1">Tugas 1</li>
  <li data-id="2">Tugas 2</li>
</ul>
\`\`\`

\`\`\`javascript
const list = document.querySelector("#todo-list");

list.addEventListener("click", function(event) {
  if (event.target.tagName === "LI") {
    console.log("Klik pada item:", event.target.textContent);
  }
});
\`\`\`

Mengapa pola Event Delegation di atas lebih efisien daripada memasang event listener ke setiap elemen \`<li>\` secara terpisah?`,
    options: [
      'A. Mengurangi konsumsi memori dengan hanya satu listener pada induk dan otomatis menangani item <li> baru yang ditambahkan kemudian',
      'B. Mencegah tombol mouse kanan mengklik item daftar',
      'C. Mempercepat render CSS animasi pada daftar todo',
      'D. Menjamin urutan klik dieksekusi secara multithreading'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Event Delegation memanfaatkan event bubbling: satu listener pada kontainer induk mengelola semua anak elemen saat ini dan yang akan dibuat di masa depan, menghemat alokasi memori.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan dua elemen bersarang dengan event listener berikut:

\`\`\`html
<div id="parent">
  <button id="child">Klik Saya</button>
</div>
\`\`\`

\`\`\`javascript
document.querySelector("#child").addEventListener("click", function(e) {
  e.stopPropagation();
  console.log("Child diklik");
});

document.querySelector("#parent").addEventListener("click", function() {
  console.log("Parent diklik");
});
\`\`\`

Apa output di konsol saat tombol \`#child\` diklik?`,
    options: [
      'A. Hanya mencetak "Child diklik"',
      'B. Mencetak "Child diklik" lalu "Parent diklik"',
      'C. Mencetak "Parent diklik" lalu "Child diklik"',
      'D. Hanya mencetak "Parent diklik"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'e.stopPropagation() menghentikan perambatan event (event bubbling) ke atas pohon DOM, sehingga listener pada elemen induk (#parent) tidak akan pernah dipicu.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Kode manakah yang tepat untuk membuat elemen baru \`<div>\` dan menyisipkannya ke dalam \`document.body\`?`,
    options: [
      'A. const el = document.createElement("div"); document.body.appendChild(el);',
      'B. const el = document.newElement("div"); document.body.add(el);',
      'C. document.body.insertTag("div");',
      'D. const el = new HTMLElement("div");'
    ],
    correct: 'A',
    points: 10,
    explanation: 'document.createElement("tagName") membuat node elemen baru di memori, dan parent.appendChild(node) menyisipkannya sebagai anak terakhir ke dalam DOM.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Selection',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perbedaan antara \`NodeList\` dan \`HTMLCollection\`:

\`\`\`javascript
const list1 = document.querySelectorAll(".item");
const list2 = document.getElementsByClassName("item");
\`\`\`

Apa perbedaan utama mengenai sifat keterbaruan (live vs static) antara kedua kumpulan node di atas?`,
    options: [
      'A. list1 (NodeList dari querySelectorAll) bersifat static snapshot, sedangkan list2 (HTMLCollection) bersifat live collection yang otomatis terupdate saat DOM berubah',
      'B. Keduanya sama-sama live collection',
      'C. Keduanya sama-sama static snapshot',
      'D. list1 adalah array asli sedangkan list2 adalah objek biasa'
    ],
    correct: 'A',
    points: 10,
    explanation: 'querySelectorAll mengembalikan static NodeList yang tidak terpengaruh oleh penambahan/penghapusan elemen setelahnya. Sebaliknya, getElementsByClassName mengembalikan live HTMLCollection.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Kapan event \`DOMContentLoaded\` dipicu pada peramban web?`,
    options: [
      'A. Tepat setelah struktur pohon dokumen HTML selesai diparse tanpa harus menunggu gambar atau stylesheet selesai dimuat',
      'B. Setelah semua gambar, video, dan stylesheet selesai diunduh penuh',
      'C. Tepat saat pengguna menutup tab browser',
      'D. Saat pengguna pertama kali mengklik tombol mouse'
    ],
    correct: 'A',
    points: 10,
    explanation: 'DOMContentLoaded dipicu saat struktur dokumen HTML telah selesai diparse menjadi pohon DOM secara lengkap, tanpa menunggu aset eksternal seperti gambar atau CSS (berbeda dengan window.load).'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penggunaan \`DocumentFragment\` untuk optimasi performa render:

\`\`\`javascript
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
  const li = document.createElement("li");
  li.textContent = "Item " + i;
  fragment.appendChild(li);
}
document.querySelector("#list").appendChild(fragment);
\`\`\`

Mengapa menggunakan \`DocumentFragment\` jauh lebih efisien daripada menyisipkan setiap elemen \`<li>\` langsung ke DOM di dalam perulangan?`,
    options: [
      'A. Meminimalkan reflow dan repaint peramban dengan hanya memicu satu kali perubahan layout saat fragment disisipkan',
      'B. Fragment berjalan di thread terpisah (Web Worker)',
      'C. Fragment otomatis mengompresi memori DOM',
      'D. Fragment mencegah event bubbling'
    ],
    correct: 'A',
    points: 10,
    explanation: 'DocumentFragment adalah wadah DOM virtual di memori. Menggabungkan 1000 mutasi ke dalam satu append tunggal mencegah 1000 kali reflow/repaint yang membebani kinerja rendering browser.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan argumen opsi pada pemanggilan \`addEventListener\`:

\`\`\`javascript
button.addEventListener("click", handleClick, { once: true, capture: false });
\`\`\`

Apa efek dari opsi \`{ once: true }\`?`,
    options: [
      'A. Event listener hanya akan dijalankan tepat satu kali dan setelah itu otomatis dilepas (removed) dari elemen',
      'B. Mencegah pengguna mengklik tombol dua kali dalam 1 detik',
      'C. Mengunci tombol agar tidak dapat diklik lagi selamanya',
      'D. Membatasi agar hanya satu fungsi yang boleh mendengar event tersebut'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Opsi once: true menginstruksikan peramban untuk menghapus event listener secara otomatis seketika setelah eksekusi pertamanya selesai.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Selection',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Metode DOM modern manakah yang digunakan untuk mencari leluhur terdekat (closest ancestor) yang cocok dengan pemilih CSS?`,
    options: [
      'A. element.closest(".card-container")',
      'B. element.parentElement(".card-container")',
      'C. element.findAncestor(".card-container")',
      'D. element.lookupParent(".card-container")'
    ],
    correct: 'A',
    points: 10,
    explanation: 'element.closest(selector) menjelajahi elemen itu sendiri dan rantai leluhurnya ke atas hingga menemukan elemen pertama yang cocok dengan pemilih CSS.'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Modification',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan metode penyisipan posisi fleksibel:

\`\`\`javascript
targetElement.insertAdjacentHTML("afterend", "<p>Konten Baru</p>");
\`\`\`

Di posisi manakah string HTML \`<p>Konten Baru</p>\` akan disisipkan?`,
    options: [
      'A. Tepat setelah elemen targetElement (sebagai saudara setelahnya di luar targetElement)',
      'B. Di dalam targetElement sebelum anak pertamanya',
      'C. Di dalam targetElement setelah anak terakhirnya',
      'D. Tepat sebelum elemen targetElement'
    ],
    correct: 'A',
    points: 10,
    explanation: 'insertAdjacentHTML memiliki 4 posisi: "beforebegin" (sebelum elemen), "afterbegin" (di dalam, anak pertama), "beforeend" (di dalam, anak terakhir), dan "afterend" (setelah elemen di luar).'
  },
  {
    topic_name: 'DOM Manipulation',
    concept_name: 'DOM Events',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan event keyboard berikut:

\`\`\`javascript
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    console.log("Tombol Enter ditekan!");
  }
});
\`\`\`

Mengapa menggunakan properti \`e.key\` lebih disarankan daripada \`e.keyCode\` yang lama?`,
    options: [
      'A. e.keyCode telah deprecated dan e.key memberikan nilai string nama tombol yang terstandarisasi serta independen dari tata letak keyboard fisik',
      'B. e.keyCode hanya mendukung angka',
      'C. e.key secara otomatis mencegah event submit',
      'D. e.key lebih hemat alokasi memori'
    ],
    correct: 'A',
    points: 10,
    explanation: 'e.keyCode adalah properti usang (deprecated). Standar modern merekomendasikan e.key yang mengembalikan string nama karakter ("Enter", "Escape", "a") secara konsisten lintas sistem operasi.'
  },

  // =========================================================================
  // TOPIC 6: Async JavaScript (Callback, Event Loop, setTimeout/setInterval)
  // Current in DB: 2 (0 Easy, 1 Medium, 1 Hard, 0 with code)
  // Target added: 30 questions (all with code, 10 Easy, 10 Medium, 10 Hard) -> Total: 32
  // =========================================================================
  {
    topic_name: 'Async JavaScript',
    concept_name: 'setTimeout/setInterval',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi penunda waktu berikut:

\`\`\`javascript
console.log("Mulai");

setTimeout(() => {
  console.log("Selesai");
}, 1000);
\`\`\`

Kapan callback di dalam \`setTimeout\` akan dieksekusi?`,
    options: [
      'A. Minimal setelah jeda waktu 1000 milidetik (1 detik) berlalu dan Call Stack kosong',
      'B. Seketika sebelum teks "Mulai" dicetak',
      'C. Persis di detik ke-1 tanpa toleransi jeda event loop apa pun',
      'D. Berulang kali setiap 1 detik tanpa henti'
    ],
    correct: 'A',
    points: 10,
    explanation: 'setTimeout menjadwalkan eksekusi callback setelah durasi waktu minimum yang ditentukan (1000ms) dan Call Stack selesai memproses eksekusi kode sinkron.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa karakteristik utama dari sifat single-threaded pada JavaScript runtime?`,
    options: [
      'A. Hanya memiliki satu Call Stack utama sehingga mengeksekusi satu baris instruksi kode dalam satu waktu',
      'B. Hanya dapat dijalankan pada komputer dengan prosesor satu inti',
      'C. Tidak mampu menangani request jaringan HTTP',
      'D. Mewajibkan seluruh kode ditulis dalam satu berkas berkas'
    ],
    correct: 'A',
    points: 10,
    explanation: 'JavaScript di engine peramban adalah single-threaded, artinya ia hanya memiliki satu Call Stack tunggal yang memproses instruksi secara berurutan, memanfaatkan Event Loop untuk operasi asynchronous.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa urutan output dari kode berikut dengan \`setTimeout\` bernilai 0ms?

\`\`\`javascript
console.log("1");

setTimeout(() => {
  console.log("2");
}, 0);

console.log("3");
\`\`\` `,
    options: [
      'A. "1", "3", "2"',
      'B. "1", "2", "3"',
      'C. "2", "1", "3"',
      'D. "3", "1", "2"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Meskipun delay 0ms, callback dimasukkan ke Macrotask Queue dan baru dieksekusi oleh Event Loop setelah seluruh kode sinkron pada Call Stack ("1" lalu "3") selesai berjalan.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'setTimeout/setInterval',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan interval berulang berikut:

\`\`\`javascript
let count = 0;
const intervalId = setInterval(() => {
  count++;
  if (count === 3) {
    clearInterval(intervalId);
  }
}, 500);
\`\`\`

Apa peran dari fungsi \`clearInterval(intervalId)\`?`,
    options: [
      'A. Menghentikan perulangan timer setInterval agar tidak berjalan lagi',
      'B. Mereset nilai variabel count kembali menjadi 0',
      'C. Mempercepat interval menjadi dua kali lebih cepat',
      'D. Menghapus fungsi dari memori browser secara paksa'
    ],
    correct: 'A',
    points: 10,
    explanation: 'clearInterval() membatalkan timer berulang yang sebelumnya dibuat oleh setInterval() menggunakan ID unik pengenal timer tersebut.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Callback',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Diberikan pola callback asynchronous berikut:

\`\`\`javascript
function ambilData(id, callback) {
  setTimeout(() => {
    const data = { id: id, nama: "Produk " + id };
    callback(null, data);
  }, 100);
}

ambilData(10, (err, res) => {
  if (!err) console.log(res.nama);
});
\`\`\`

Konvensi penanganan error apakah yang digunakan pada callback di atas?`,
    options: [
      'A. Error-First Callback (argumen pertama dicadangkan untuk objek galat/null)',
      'B. Promise Reject Handler',
      'C. Async Await Try Catch Pattern',
      'D. Event Emitter Pattern'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Konvensi Error-First Callback (standar Node.js/JS klasik) selalu menempatkan error sebagai parameter pertama callback, dan payload data sebagai parameter kedua.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan perulangan \`var\` versus \`let\` di dalam fungsi asynchronous berikut:

\`\`\`javascript
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i);
  }, 100);
}
\`\`\`

Apa output yang dicetak ke konsol setelah 100ms?`,
    options: [
      'A. 3, 3, 3 (karena var memiliki function scope tunggal yang telah selesai berulang hingga 3)',
      'B. 0, 1, 2',
      'C. 0, 0, 0',
      'D. undefined, undefined, undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Variabel var tidak memiliki block scope. Ketika callback setTimeout dijalankan setelah 100ms, loop sinkron telah selesai dan nilai variabel i bersama adalah 3, sehingga mencetak 3 tiga kali. Jika menggunakan let, akan mencetak 0, 1, 2.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan urutan prioritas antara Microtask Queue dan Macrotask Queue:

\`\`\`javascript
console.log("A");

setTimeout(() => {
  console.log("B");
}, 0);

queueMicrotask(() => {
  console.log("C");
});

console.log("D");
\`\`\`

Apa urutan pencetakan huruf ke konsol yang tepat?`,
    options: [
      'A. "A", "D", "C", "B"',
      'B. "A", "B", "C", "D"',
      'C. "A", "D", "B", "C"',
      'D. "C", "A", "D", "B"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kode sinkron ("A", "D") dieksekusi terlebih dahulu. Setelah Call Stack kosong, seluruh antrean Microtask (C) diselesaikan sebelum Event Loop mengambil tugas dari Macrotask Queue (B).'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Callback',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Istilah apakah yang menggambarkan masalah arsitektur kode saat fungsi callback asynchronous bertingkat-tingkat ke dalam membentuk piramida horizontal yang sulit dipelihara?`,
    options: [
      'A. Callback Hell (Pyramid of Doom)',
      'B. Stack Overflow',
      'C. Memory Leak',
      'D. Deadlock Condition'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Callback Hell (atau Pyramid of Doom) adalah kondisi di mana banyak callback bersarang di dalam callback lain secara berlebihan, membuat kode sulit dibaca dan ditangani error-nya.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'setTimeout/setInterval',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Fungsi bawaan manakah yang digunakan untuk membatalkan timer yang sebelumnya dijadwalkan dengan \`setTimeout\`?`,
    options: [
      'A. clearTimeout(timeoutId)',
      'B. stopTimeout(timeoutId)',
      'C. cancelTimeout(timeoutId)',
      'D. removeTimeout(timeoutId)'
    ],
    correct: 'A',
    points: 10,
    explanation: 'clearTimeout(id) membatalkan timer eksekusi tertunda yang dibuat oleh fungsi setTimeout().'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa yang terjadi pada browser jika sebuah perulangan \`while(true)\` sinkron dieksekusi di Call Stack utama?`,
    options: [
      'A. Call Stack terblokir permanen, Event Loop tidak dapat memproses antrean tugas, dan antarmuka web menjadi tidak responsif (freeze)',
      'B. Browser secara otomatis memindahkan perulangan ke thread latar belakang',
      'C. Perulangan otomatis diakhiri setelah 5 detik',
      'D. Timer setTimeout tetap berjalan normal tanpa gangguan'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Karena Event Loop hanya dapat mengambil tugas baru saat Call Stack kosong, loop sinkron tanpa henti memblokir thread utama secara total sehingga peramban tidak dapat merender ulang UI atau menerima input pengguna.'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Callback',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan fungsi utilitas penundaan berbasis Promise (promisify):

\`\`\`javascript
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function run() {
  console.log("Mulai");
  await sleep(1000);
  console.log("Selesai setelah 1 detik");
}
run();
\`\`\`

Mengapa membungkus \`setTimeout\` ke dalam Promise di atas sangat berguna?`,
    options: [
      'A. Memungkinkan penundaan waktu ditulis secara linear dan bersih menggunakan sintaks async/await',
      'B. Menghilangkan kebutuhan alokasi memori timer',
      'C. Memastikan timer berjalan tepat 0 milidetik',
      'D. Menjadikan fungsi berjalan di server secara otomatis'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Membungkus callback setTimeout ke dalam Promise (promisification) memungkinkan kode asynchronous ditulis secara deklaratif dan mudah dibaca menggunakan await sleep(ms).'
  },
  {
    topic_name: 'Async JavaScript',
    concept_name: 'Event Loop',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Di manakah callback yang didaftarkan melalui \`Promise.then()\` akan ditempatkan oleh engine JavaScript?`,
    options: [
      'A. Microtask Queue',
      'B. Macrotask (Task) Queue',
      'C. Call Stack langsung seketika',
      'D. Memory Heap'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Callback penyelesaian Promise (.then, .catch, .finally) ditempatkan di dalam Microtask Queue yang memiliki prioritas eksekusi lebih tinggi daripada Macrotask Queue (seperti timer).'
  },

  // =========================================================================
  // TOPIC 7: Promises (Promise Object, Async Await, Error Handling)
  // Current in DB: 3 (0 Easy, 0 Medium, 3 Hard, 0 with code)
  // Target added: 29 questions (all with code, 10 Easy, 11 Medium, 8 Hard) -> Total: 32
  // =========================================================================
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Manakah 3 status (states) yang mungkin dimiliki oleh sebuah objek \`Promise\` di JavaScript?`,
    options: [
      'A. pending, fulfilled, dan rejected',
      'B. waiting, success, dan failed',
      'C. start, running, dan completed',
      'D. open, loading, dan closed'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Sesuai spesifikasi ECMAScript, Promise memiliki tiga status pasti: pending (sedang berjalan), fulfilled (berhasil diselesaikan), atau rejected (gagal/ditolak).'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa output dari rantai Promise berikut?

\`\`\`javascript
Promise.resolve(5)
  .then(val => val * 2)
  .then(val => console.log(val));
\`\`\` `,
    options: [
      'A. 10',
      'B. 5',
      'C. undefined',
      'D. Promise { 10 }'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Promise.resolve(5) menghasilkan 5. Handler .then() pertama melipatgandakan nilai menjadi 10 dan mengembalikannya ke handler .then() kedua yang mencetak 10.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Async Await',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa nilai yang selalu dikembalikan oleh sebuah fungsi yang dideklarasikan dengan kata kunci \`async\`?

\`\`\`javascript
async function ambilPesan() {
  return "Halo Pembelajar!";
}

const hasil = ambilPesan();
console.log(hasil);
\`\`\` `,
    options: [
      'A. Objek Promise yang me-resolve string "Halo Pembelajar!"',
      'B. String murni "Halo Pembelajar!" secara langsung',
      'C. null',
      'D. Objek Generator'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Fungsi async selalu membungkus nilai kembaliannya secara otomatis di dalam sebuah Promise (Promise.resolve("Halo Pembelajar!")).'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Error Handling',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan penanganan galat pada fungsi \`async/await\` berikut:

\`\`\`javascript
async function muatData() {
  try {
    throw new Error("Gagal mengambil data");
  } catch (err) {
    console.log("Tertangkap:", err.message);
  }
}

muatData();
\`\`\`

Apa yang terjadi saat baris \`throw new Error\` dieksekusi?`,
    options: [
      'A. Alur eksekusi langsung berpindah ke blok catch dan mencetak "Tertangkap: Gagal mengambil data"',
      'B. Aplikasi langsung berhenti dengan UnhandledPromiseRejection',
      'C. Browser menampilkan alert window bawaan peramban',
      'D. Fungsi mengembalikan nilai null secara otomatis'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Blok try/catch di dalam fungsi async mampu menangkap exception sinkron maupun rejected promise dari ekspresi await secara elegan.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan eksekusi beberapa Promise secara paralel menggunakan \`Promise.all()\`:

\`\`\`javascript
const p1 = Promise.resolve(10);
const p2 = Promise.reject("Koneksi gagal");
const p3 = Promise.resolve(30);

Promise.all([p1, p2, p3])
  .then(res => console.log("Sukses:", res))
  .catch(err => console.log("Galat:", err));
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. "Galat: Koneksi gagal" (Promise.all langsung reject begitu ada satu promise yang reject)',
      'B. "Sukses: [10, 30]"',
      'C. "Sukses: [10, null, 30]"',
      'D. Tidak ada output apa pun'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Promise.all bersifat fail-fast: jika salah satu promise di dalam array mengalami rejection, Promise.all seketika me-reject dengan alasan error tersebut tanpa menunggu promise lainnya selesai.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Async Await',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan urutan eksekusi \`async/await\` dan \`console.log\` berikut:

\`\`\`javascript
async function demo() {
  console.log("1");
  await null;
  console.log("2");
}

console.log("3");
demo();
console.log("4");
\`\`\`

Apa urutan angka yang dicetak ke konsol?`,
    options: [
      'A. "3", "1", "4", "2"',
      'B. "1", "2", "3", "4"',
      'C. "3", "1", "2", "4"',
      'D. "1", "3", "4", "2"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'console.log("3") berjalan pertama. Saat demo() dipanggil, ia mencetak "1" secara sinkron hingga mencapai await. await menangguhkan kelanjutan fungsi dan mendaftarkannya ke microtask queue. console.log("4") dieksekusi sinkron. Terakhir, microtask mengeksekusi baris setelah await ("2"). Hasil: 3, 1, 4, 2.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Apa perbedaan utama antara \`Promise.all()\` dan \`Promise.allSettled()\`?`,
    options: [
      'A. Promise.allSettled menunggu semua promise selesai (baik fulfilled maupun rejected) dan mengembalikan array status lengkap setiap promise',
      'B. Promise.allSettled langsung melempar error jika ada promise yang reject',
      'C. Promise.all hanya dapat menerima satu buah promise',
      'D. Promise.allSettled hanya dapat digunakan di sisi backend Node.js'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Promise.allSettled() tidak pernah me-reject; ia selalu menunggu hingga semua promise selesai dan mengembalikan array objek dengan format { status: "fulfilled", value } atau { status: "rejected", reason }.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Metode manakah pada objek Promise yang SELALU dieksekusi baik saat Promise sukses (fulfilled) maupun gagal (rejected)?`,
    options: [
      'A. .finally()',
      'B. .catch()',
      'C. .then()',
      'D. .always()'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Metode .finally(callback) dipanggil ketika Promise telah diselesaikan (baik resolved maupun rejected), sangat berguna untuk aksi pembersihan (clean up) seperti mematikan indikator loading.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan metode kompetisi \`Promise.race()\` berikut:

\`\`\`javascript
const pSlow = new Promise(res => setTimeout(() => res("Lambat"), 200));
const pFast = new Promise(res => setTimeout(() => res("Cepat"), 50));

Promise.race([pSlow, pFast]).then(winner => {
  console.log(winner);
});
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. "Cepat"',
      'B. "Lambat"',
      'C. ["Lambat", "Cepat"]',
      'D. undefined'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Promise.race() menyelesaikan dengan hasil dari promise pertama yang berhasil menyelesaikan statusnya (baik resolve maupun reject tercepat).'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Error Handling',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pemulihan error (error recovery) pada Promise chain:

\`\`\`javascript
Promise.reject("Koneksi terputus")
  .catch(err => {
    console.log("Tertangkap:", err);
    return "Data Cadangan";
  })
  .then(data => {
    console.log("Hasil:", data);
  });
\`\`\`

Apa output yang dicetak ke konsol?`,
    options: [
      'A. "Tertangkap: Koneksi terputus" lalu "Hasil: Data Cadangan"',
      'B. Hanya "Tertangkap: Koneksi terputus"',
      'C. UnhandledPromiseRejection',
      'D. "Hasil: undefined"'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Blok .catch() yang mengembalikan nilai normal (tanpa melempar error baru) akan mengubah status rantai Promise kembali menjadi fulfilled, sehingga .then() berikutnya menerima nilai "Data Cadangan".'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Async Await',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan pengambilan data serial vs paralel dengan \`await\`:

\`\`\`javascript
// Opsi A (Serial)
const user = await fetchUser();
const posts = await fetchPosts();

// Opsi B (Paralel)
const [userRes, postsRes] = await Promise.all([fetchUser(), fetchPosts()]);
\`\`\`

Mengapa Opsi B lebih cepat dibandingkan Opsi A jika kedua request independen satu sama lain?`,
    options: [
      'A. Opsi B memulai kedua request jaringan secara simultan di saat bersamaan tanpa saling menunggu',
      'B. Opsi B menonaktifkan validasi SSL',
      'C. Opsi A membutuhkan koneksi WebSocket',
      'D. Opsi B mengompresi payload respons'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Opsi A mengeksekusi request secara serial (total waktu = waktu request 1 + waktu request 2). Opsi B dengan Promise.all mengeksekusi kedua request secara paralel sehingga total waktu mendekati durasi request yang paling lama.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Bagaimana cara membuat sebuah Promise baru yang langsung berada dalam status gagal (rejected)?`,
    options: [
      'A. Promise.reject(new Error("Gagal"));',
      'B. new Promise.rejected("Gagal");',
      'C. Promise.failed("Gagal");',
      'D. Promise.error("Gagal");'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Promise.reject(reason) adalah metode statis praktis untuk membuat Promise yang langsung berstatus rejected dengan alasan error yang diberikan.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Async Await',
    material: 'JAVASCRIPT',
    difficulty: 'EASY',
    type: 'MULTIPLE_CHOICE',
    question_text: `Di manakah kata kunci \`await\` diperbolehkan untuk digunakan?`,
    options: [
      'A. Di dalam fungsi yang dideklarasikan dengan kata kunci async atau di top-level ES Module',
      'B. Di mana saja di dalam fungsi reguler apa pun',
      'C. Hanya di dalam blok catch',
      'D. Hanya di dalam konstruktor class'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Kata kunci await hanya sah digunakan di dalam async function atau di top-level konteks ES Module (Top-Level Await).'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Error Handling',
    material: 'JAVASCRIPT',
    difficulty: 'HARD',
    type: 'MULTIPLE_CHOICE',
    question_text: `Perhatikan Promise handler dengan argumen kedua pada \`.then()\`:

\`\`\`javascript
promise.then(onFulfilled, onRejected);
\`\`\`

Apa perbedaan antara menangani error dengan argumen kedua \`.then(..., onRejected)\` dibandingkan menggunakan rantai \`.then(...).catch(...)\`?`,
    options: [
      'A. onRejected pada .then() tidak dapat menangkap error yang dilempar dari dalam onFulfilled di baris yang sama, sedangkan .catch() dapat menangkapnya',
      'B. Tidak ada perbedaan perilaku sama sekali',
      'C. .catch() hanya menangkap error sintaks',
      'D. onRejected menghentikan eksekusi thread'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Jika error dilempar di dalam fungsi onFulfilled, onRejected pada pemanggilan .then() yang sama tidak akan menangkapnya. Menggunakan .catch() di akhir rantai memastikan error di tahap mana pun tertangkap.'
  },
  {
    topic_name: 'Promises',
    concept_name: 'Promise Object',
    material: 'JAVASCRIPT',
    difficulty: 'MEDIUM',
    type: 'MULTIPLE_CHOICE',
    question_text: `Metode statis \`Promise.any()\` akan menghasilkan status \`fulfilled\` jika:`,
    options: [
      'A. Setidaknya ada satu Promise yang berhasil fulfilled (mengabaikan rejection hingga semua gagal)',
      'B. Semua Promise berhasil fulfilled tanpa terkecuali',
      'C. Promise pertama yang selesai berstatus rejected',
      'D. Ada minimal dua Promise yang fulfilled'
    ],
    correct: 'A',
    points: 10,
    explanation: 'Promise.any() menyelesaikan begitu ada satu promise pertama yang fulfilled. Jika semua promise rejected, ia me-reject dengan AggregateError.'
  }
];
