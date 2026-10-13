// ============================================================
// XOLEARN — Seed Script: Question Bank & Mixed Assessments
// database/seeds/seed_mixed_question_bank.js
// ============================================================
// Idempoten: Aman dijalankan berulang kali tanpa menambah duplikat.
// ============================================================

const pool = require('../../backend/db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Ambil ID subject, levels, topics, concepts
    const subRes = await client.query("SELECT id FROM subjects WHERE name = 'Web Development' LIMIT 1");
    if (subRes.rows.length === 0) throw new Error("Subject Web Development tidak ditemukan");
    const subjectId = subRes.rows[0].id;

    const levelsRes = await client.query("SELECT id, name, difficulty, order_index FROM levels");
    const levelMap = {};
    for (const l of levelsRes.rows) {
      levelMap[l.name] = l.id;
      if (l.difficulty) levelMap[l.difficulty] = l.id;
    }

    const topicsRes = await client.query("SELECT id, name FROM topics");
    const topicMap = {};
    for (const t of topicsRes.rows) {
      topicMap[t.name] = t.id;
    }

    const conceptsRes = await client.query("SELECT id, name FROM concepts");
    const conceptMap = {};
    for (const c of conceptsRes.rows) {
      conceptMap[c.name] = c.id;
    }

    console.log(`Loaded ${conceptsRes.rows.length} concepts, ${topicsRes.rows.length} topics, ${levelsRes.rows.length} levels.`);

    // 2. Definisi Asesmen Kanonis Formal (Mixed & Remedial)
    const canonicalAssessments = [
      {
        canonicalKey: 'MIXED_EASY',
        title: 'Asesmen Diagnostik Campuran — Tingkat Dasar',
        type: 'MIXED',
        difficulty: 'EASY',
        passing_score: 70.0,
        duration_minutes: 45,
        level_id: levelMap['HTML & Web Fundamentals'] || null,
        legacyTitles: ['Asesmen Campuran: Tingkat Mudah (HTML, CSS, JavaScript)', 'Asesmen Campuran (Tingkat Mudah)', 'Asesmen Diagnostik Campuran (HTML, CSS, JS)'],
      },
      {
        canonicalKey: 'MIXED_MEDIUM',
        title: 'Asesmen Campuran — Tingkat Menengah',
        type: 'MIXED',
        difficulty: 'MEDIUM',
        passing_score: 70.0,
        duration_minutes: 45,
        level_id: levelMap['CSS Fundamentals'] || null,
        legacyTitles: ['Asesmen Campuran: Tingkat Menengah (HTML, CSS, JavaScript)', 'Asesmen Campuran (Tingkat Menengah)'],
      },
      {
        canonicalKey: 'MIXED_HARD',
        title: 'Asesmen Campuran — Tingkat Lanjut',
        type: 'MIXED',
        difficulty: 'HARD',
        passing_score: 70.0,
        duration_minutes: 50,
        level_id: levelMap['JavaScript Fundamentals'] || null,
        legacyTitles: ['Asesmen Campuran: Tingkat Lanjut (HTML, CSS, JavaScript)', 'Asesmen Campuran (Tingkat Lanjut)', 'Asesmen Campuran Sulit'],
      },
      {
        canonicalKey: 'PRACTICE_HTML',
        title: 'Asesmen Penguatan HTML',
        type: 'PRACTICE',
        difficulty: 'EASY',
        passing_score: 60.0,
        duration_minutes: 20,
        topic_id: topicMap['HTML Basics'] || null,
        level_id: levelMap['HTML & Web Fundamentals'] || null,
        legacyTitles: ['Practice: HTML Elements & Semantics'],
      },
      {
        canonicalKey: 'PRACTICE_CSS',
        title: 'Asesmen Penguatan CSS',
        type: 'PRACTICE',
        difficulty: 'EASY',
        passing_score: 60.0,
        duration_minutes: 20,
        topic_id: topicMap['CSS Basics'] || null,
        level_id: levelMap['CSS Fundamentals'] || null,
        legacyTitles: ['Practice: CSS Fundamentals'],
      },
      {
        canonicalKey: 'PRACTICE_JS',
        title: 'Asesmen Penguatan JavaScript',
        type: 'PRACTICE',
        difficulty: 'MEDIUM',
        passing_score: 60.0,
        duration_minutes: 20,
        topic_id: topicMap['Variables & Data Types'] || null,
        level_id: levelMap['JavaScript Fundamentals'] || null,
        legacyTitles: ['Practice: JavaScript Variables'],
      },
    ];

    const assessmentIds = {};
    for (const ca of canonicalAssessments) {
      // Cari apakah sudah ada asesmen dengan title baru, type+diff, atau legacy titles
      const existing = await client.query(`
        SELECT id FROM assessments 
        WHERE title = $1 
           OR (type = $2 AND difficulty = $3)
           OR title = ANY($4::text[])
        ORDER BY created_at ASC
        LIMIT 1
      `, [ca.title, ca.type, ca.difficulty, ca.legacyTitles]);

      if (existing.rows.length > 0) {
        const id = existing.rows[0].id;
        assessmentIds[ca.title] = id;
        await client.query(`
          UPDATE assessments
             SET title = $1,
                 type = $2,
                 difficulty = $3,
                 passing_score = $4,
                 duration_minutes = $5,
                 level_id = COALESCE(level_id, $6),
                 topic_id = COALESCE(topic_id, $7)
           WHERE id = $8
        `, [ca.title, ca.type, ca.difficulty, ca.passing_score, ca.duration_minutes, ca.level_id, ca.topic_id || null, id]);
      } else {
        const ins = await client.query(`
          INSERT INTO assessments (subject_id, level_id, topic_id, type, title, duration_minutes, passing_score, difficulty)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id
        `, [subjectId, ca.level_id, ca.topic_id || null, ca.type, ca.title, ca.duration_minutes, ca.passing_score, ca.difficulty]);
        assessmentIds[ca.title] = ins.rows[0].id;
      }
    }
    console.log('Canonical assessments verified:', Object.keys(assessmentIds));

    // 3. Konsep Referensi
    const easyHtmlConcept = conceptMap['HTML Element'] || Object.values(conceptMap)[0];
    const docStructureConcept = conceptMap['Document Structure'] || easyHtmlConcept;
    const htmlAttrConcept = conceptMap['HTML Attribute'] || easyHtmlConcept;
    const semanticConcept = conceptMap['Semantic Elements'] || easyHtmlConcept;
    const formControlConcept = conceptMap['Form Controls'] || easyHtmlConcept;
    const formValidConcept = conceptMap['Form Validation'] || easyHtmlConcept;
    const accessConcept = conceptMap['Accessibility'] || easyHtmlConcept;

    const cssSelectorConcept = conceptMap['CSS Selector'] || Object.values(conceptMap)[1];
    const cssPropConcept = conceptMap['CSS Property'] || cssSelectorConcept;
    const cssValConcept = conceptMap['CSS Value'] || cssSelectorConcept;
    const marginConcept = conceptMap['Margin'] || cssSelectorConcept;
    const paddingConcept = conceptMap['Padding'] || cssSelectorConcept;
    const borderConcept = conceptMap['Border'] || cssSelectorConcept;
    const contentBoxConcept = conceptMap['Content Box'] || cssSelectorConcept;
    const flexContainerConcept = conceptMap['Flex Container'] || cssSelectorConcept;
    const flexDirConcept = conceptMap['Flex Direction'] || cssSelectorConcept;
    const flexItemsConcept = conceptMap['Flex Items'] || cssSelectorConcept;
    const mediaQueryConcept = conceptMap['Media Query'] || cssSelectorConcept;
    const breakpointConcept = conceptMap['Breakpoint'] || cssSelectorConcept;
    const viewportConcept = conceptMap['Viewport'] || cssSelectorConcept;

    const varDeclConcept = conceptMap['Variable Declaration'] || Object.values(conceptMap)[2];
    const primDataConcept = conceptMap['Primitive Data Type'] || varDeclConcept;
    const scopeConcept = conceptMap['Scope'] || varDeclConcept;
    const funcDeclConcept = conceptMap['Function Declaration'] || varDeclConcept;
    const paramConcept = conceptMap['Parameter'] || varDeclConcept;
    const returnValConcept = conceptMap['Return Value'] || varDeclConcept;
    const condStmtConcept = conceptMap['Conditional Statement'] || varDeclConcept;
    const loopConcept = conceptMap['Loop'] || varDeclConcept;
    const switchConcept = conceptMap['Switch'] || varDeclConcept;
    const arrayMethConcept = conceptMap['Array Methods'] || varDeclConcept;
    const destructureConcept = conceptMap['Destructuring'] || varDeclConcept;
    const objLiteralConcept = conceptMap['Object Literal'] || varDeclConcept;
    const domSelectConcept = conceptMap['DOM Selection'] || varDeclConcept;
    const domEventsConcept = conceptMap['DOM Events'] || varDeclConcept;
    const callbackConcept = conceptMap['Callback'] || varDeclConcept;
    const eventLoopConcept = conceptMap['Event Loop'] || varDeclConcept;
    const promiseConcept = conceptMap['Promise Object'] || varDeclConcept;
    const asyncAwaitConcept = conceptMap['Async Await'] || varDeclConcept;
    const errorHandlingConcept = conceptMap['Error Handling'] || varDeclConcept;

    // 4. Daftar Bank Soal Terstruktur
    const questionsToSeed = [
      // =========================================================================
      // HTML - EASY (15+ Soal)
      // =========================================================================
      {
        question_text: 'Tag HTML manakah yang digunakan untuk mendefinisikan heading tingkat tertinggi pada sebuah halaman web?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: easyHtmlConcept,
        options: ['<h1>', '<h6>', '<header>', '<head>'], correct: 'A', points: 10,
        explanation: 'Tag <h1> adalah elemen heading utama dengan hierarki kepentingan tertinggi dalam dokumen HTML.',
      },
      {
        question_text: 'Atribut manakah yang wajib disertakan pada elemen <img> untuk memberikan deskripsi tekstual ketika gambar gagal dimuat?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: htmlAttrConcept,
        options: ['alt', 'src', 'title', 'description'], correct: 'A', points: 10,
        explanation: 'Atribut alt menyediakan alternatif teks untuk aksesibilitas dan ketika gambar gagal dimuat.',
      },
      {
        question_text: 'Elemen HTML manakah yang digunakan untuk membuat daftar berbutir (bulleted list/tanpa nomor urut)?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: easyHtmlConcept,
        options: ['<ul>', '<ol>', '<li>', '<dl>'], correct: 'A', points: 10,
        explanation: '<ul> merepresentasikan unordered list yang ditandai dengan butir atau simbol (bullet).',
      },
      {
        question_text: 'Tag manakah yang digunakan untuk membuat hyperlink ke halaman web atau dokumen lain?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: easyHtmlConcept,
        options: ['<a>', '<link>', '<href>', '<nav>'], correct: 'A', points: 10,
        explanation: 'Tag <a> (anchor) dengan atribut href digunakan untuk mendefinisikan hyperlink.',
      },
      {
        question_text: 'Elemen HTML semantik manakah yang paling tepat untuk membungkus navigasi utama sebuah situs web?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: semanticConcept,
        options: ['<nav>', '<header>', '<menu>', '<section>'], correct: 'A', points: 10,
        explanation: '<nav> merepresentasikan bagian halaman yang berisi tautan-tautan navigasi utama.',
      },
      {
        question_text: 'Elemen manakah yang benar untuk menyisipkan pemisah baris tunggal (line break) tanpa membuat paragraf baru?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: easyHtmlConcept,
        options: ['<br>', '<hr>', '<p>', '<break>'], correct: 'A', points: 10,
        explanation: '<br> menyisipkan jeda baris (line break) dalam konten teks.',
      },
      {
        question_text: 'Atribut manakah yang digunakan pada elemen <a> untuk membuka halaman tautan di tab atau jendela baru browser?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: htmlAttrConcept,
        options: ['target="_blank"', 'rel="external"', 'href="_new"', 'window="new"'], correct: 'A', points: 10,
        explanation: 'target="_blank" memerintahkan browser membuka tautan di konteks perambanan baru (tab/window baru).',
      },
      {
        question_text: 'Elemen semantik manakah yang paling sesuai untuk bagian catatan kaki atau informasi hak cipta di bagian bawah halaman?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: semanticConcept,
        options: ['<footer>', '<bottom>', '<aside>', '<section>'], correct: 'A', points: 10,
        explanation: '<footer> merepresentasikan catatan kaki dokumen, berisi metadata, copyright, atau tautan terkait.',
      },
      {
        question_text: 'Tag HTML manakah yang digunakan untuk membuat paragraf teks biasa?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: easyHtmlConcept,
        options: ['<p>', '<text>', '<paragraph>', '<span>'], correct: 'A', points: 10,
        explanation: 'Tag <p> merepresentasikan blok paragraf teks.',
      },
      {
        question_text: 'Elemen HTML manakah yang digunakan untuk menampilkan teks dengan penekanan penting (secara default dicetak tebal dan bermakna semantik)?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: semanticConcept,
        options: ['<strong>', '<b>', '<bold>', '<em>'], correct: 'A', points: 10,
        explanation: '<strong> memberikan penekanan tingkat kepentingan tinggi (strong importance) secara semantik.',
      },
      {
        question_text: 'Apa fungsi utama dari deklarasi <!DOCTYPE html> pada awal dokumen HTML5?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: docStructureConcept,
        options: ['Memberi tahu browser bahwa dokumen ditulis menggunakan standar HTML5', 'Mengunduh font web secara otomatis', 'Mengenkripsi konten halaman web', 'Menautkan file stylesheet eksternal'], correct: 'A', points: 10,
        explanation: '<!DOCTYPE html> memastikan browser merender halaman dalam mode standar (standards mode) HTML5.',
      },
      {
        question_text: 'Elemen manakah yang membungkus seluruh konten visual yang tampil di jendela peramban pengguna?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: docStructureConcept,
        options: ['<body>', '<head>', '<html>', '<main>'], correct: 'A', points: 10,
        explanation: '<body> membungkus seluruh elemen yang dapat dilihat dan diinteraksikan langsung oleh pengguna di browser.',
      },
      {
        question_text: 'Tag manakah yang digunakan untuk memuat metadata seperti judul tab, encoding karakter, dan link stylesheet?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: docStructureConcept,
        options: ['<head>', '<header>', '<meta>', '<title>'], correct: 'A', points: 10,
        explanation: '<head> berisi metadata dokumen yang tidak ditampilkan langsung di kanvas halaman web.',
      },
      {
        question_text: 'Elemen input form manakah yang digunakan untuk menerima masukan kata sandi dengan karakter tersamarkan (titik/bintang)?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: formControlConcept,
        options: ['<input type="password">', '<input type="secret">', '<input type="hidden">', '<input type="text">'], correct: 'A', points: 10,
        explanation: '<input type="password"> menyamarkan karakter input untuk keamanan privasi kata sandi.',
      },
      {
        question_text: 'Atribut manakah yang digunakan untuk menghubungkan elemen <label> dengan elemen <input> yang bersangkutan demi aksesibilitas?',
        material: 'HTML', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: accessConcept,
        options: ['for (yang nilainya cocok dengan id input)', 'name', 'connect', 'target'], correct: 'A', points: 10,
        explanation: 'Atribut for pada <label> yang merujuk ke id elemen input meningkatkan area klik dan aksesibilitas screen reader.',
      },

      // =========================================================================
      // CSS - EASY (15+ Soal)
      // =========================================================================
      {
        question_text: 'Properti CSS manakah yang digunakan untuk mengubah warna teks pada suatu elemen?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: cssPropConcept,
        options: ['color', 'text-color', 'font-color', 'background-color'], correct: 'A', points: 10,
        explanation: 'Properti color mengatur warna teks pada elemen.',
      },
      {
        question_text: 'Selektor CSS manakah yang digunakan untuk menargetkan elemen dengan atribut class bernama "card"?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: cssSelectorConcept,
        options: ['.card', '#card', '*card', 'card'], correct: 'A', points: 10,
        explanation: 'Tanda titik (.) digunakan untuk memilih elemen berdasarkan nama kelasnya (class selector).',
      },
      {
        question_text: 'Selektor CSS manakah yang digunakan untuk memilih elemen dengan atribut id bernilai "header"?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: cssSelectorConcept,
        options: ['#header', '.header', '@header', 'id(header)'], correct: 'A', points: 10,
        explanation: 'Tanda pagar (#) digunakan untuk memilih elemen berdasarkan nilai atribut id-nya.',
      },
      {
        question_text: 'Properti CSS manakah yang digunakan untuk mengubah ukuran font sebuah teks?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: cssPropConcept,
        options: ['font-size', 'text-size', 'font-style', 'size'], correct: 'A', points: 10,
        explanation: 'font-size menetapkan ukuran font teks (misal: 16px, 1.25rem).',
      },
      {
        question_text: 'Pada model kotak CSS (Box Model), bagian manakah yang berada tepat di antara konten teks dan garis border?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: paddingConcept,
        options: ['padding', 'margin', 'outline', 'box-shadow'], correct: 'A', points: 10,
        explanation: 'Padding adalah ruang di antara konten elemen dan batas bordernya.',
      },
      {
        question_text: 'Properti manakah yang digunakan untuk mengatur jarak luar di sekeliling garis border suatu elemen?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: marginConcept,
        options: ['margin', 'padding', 'spacing', 'outer-space'], correct: 'A', points: 10,
        explanation: 'Margin adalah jarak kosong di luar batas border elemen yang memisahkannya dari elemen tetangga.',
      },
      {
        question_text: 'Nilai properti text-align manakah yang digunakan untuk meletakkan teks tepat di tengah kontainer secara horizontal?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: cssValConcept,
        options: ['center', 'middle', 'justify', 'auto'], correct: 'A', points: 10,
        explanation: 'text-align: center meratakan teks ke tengah secara horizontal.',
      },
      {
        question_text: 'Properti CSS manakah yang digunakan untuk mengubah warna latar belakang (background) dari sebuah elemen?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: cssPropConcept,
        options: ['background-color', 'color-background', 'bgcolor', 'bg-color'], correct: 'A', points: 10,
        explanation: 'background-color menetapkan warna latar belakang elemen.',
      },
      {
        question_text: 'Bagaimana sintaks CSS yang benar untuk mengatur border setebal 2px berwarna biru pekat dengan garis lurus padat?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: borderConcept,
        options: ['border: 2px solid blue;', 'border-width: 2px blue solid;', 'border: solid 2px;', 'border-color: 2px solid blue;'], correct: 'A', points: 10,
        explanation: 'Shorthand border: [width] [style] [color] adalah format penulisan standar CSS.',
      },
      {
        question_text: 'Nilai properti display manakah yang mengubah elemen menjadi kontainer flexibel satu dimensi?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: flexContainerConcept,
        options: ['flex', 'inline-block', 'grid', 'table'], correct: 'A', points: 10,
        explanation: 'display: flex mengaktifkan mode tata letak Flexbox pada elemen kontainer.',
      },
      {
        question_text: 'Properti CSS manakah yang digunakan untuk mengubah ketebalan font teks (seperti membuat teks bold)?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: cssPropConcept,
        options: ['font-weight', 'font-bold', 'text-weight', 'font-thickness'], correct: 'A', points: 10,
        explanation: 'font-weight mengatur ketebalan teks (misal: normal, bold, 600, 700).',
      },
      {
        question_text: 'Di manakah deklarasi CSS eksternal sebaiknya ditautkan pada dokumen HTML?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: cssPropConcept,
        options: ['Di dalam tag <head> menggunakan tag <link>', 'Di akhir tag <body> menggunakan tag <script>', 'Di dalam tag <p>', 'Di dalam file package.json'], correct: 'A', points: 10,
        explanation: 'Stylesheet eksternal dihubungkan menggunakan tag <link rel="stylesheet" href="..."> di dalam <head>.',
      },
      {
        question_text: 'Properti manakah yang digunakan untuk menghilangkan garis bawah (underline) bawaan pada hyperlink?',
        material: 'CSS', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: cssPropConcept,
        options: ['text-decoration: none;', 'text-underline: none;', 'font-style: normal;', 'text-style: none;'], correct: 'A', points: 10,
        explanation: 'text-decoration: none menghilangkan dekorasi garis bawah pada tautan.',
      },

      // =========================================================================
      // JAVASCRIPT - EASY (15+ Soal)
      // =========================================================================
      {
        question_text: 'Kata kunci JavaScript manakah yang digunakan untuk mendeklarasikan variabel yang nilainya tidak dapat diubah kembali (konstan)?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: varDeclConcept,
        options: ['const', 'let', 'var', 'static'], correct: 'A', points: 10,
        explanation: 'const mendeklarasikan variabel konstan yang nilainya tidak dapat di-reassign setelah inisialisasi.',
      },
      {
        question_text: 'Metode bawaan JavaScript manakah yang digunakan untuk menampilkan pesan atau debugging di konsol peramban?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: funcDeclConcept,
        options: ['console.log()', 'print()', 'system.out.println()', 'window.write()'], correct: 'A', points: 10,
        explanation: 'console.log() mencetak pesan atau data variabel ke developer tools console.',
      },
      {
        question_text: 'Tipe data primitif JavaScript manakah yang hanya memiliki dua kemungkinan nilai: true atau false?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: primDataConcept,
        options: ['boolean', 'string', 'number', 'undefined'], correct: 'A', points: 10,
        explanation: 'Tipe boolean merepresentasikan nilai kebenaran logika (true atau false).',
      },
      {
        question_text: 'Operator pembanding manakah yang memeriksa kesamaan nilai sekaligus kesamaan tipe data (strict equality)?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: condStmtConcept,
        options: ['===', '==', '=', '!=='], correct: 'A', points: 10,
        explanation: 'Operator === memeriksa kesetaraan nilai dan tipe data tanpa melakukan type coercion.',
      },
      {
        question_text: 'Bagaimana cara memeriksa panjang (jumlah elemen) dari sebuah array dalam JavaScript?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: arrayMethConcept,
        options: ['array.length', 'array.size()', 'array.count', 'len(array)'], correct: 'A', points: 10,
        explanation: 'Properti .length mengembalikan jumlah elemen di dalam array.',
      },
      {
        question_text: 'Metode array manakah yang digunakan untuk menambahkan elemen baru di akhir array?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: arrayMethConcept,
        options: ['push()', 'pop()', 'shift()', 'append()'], correct: 'A', points: 10,
        explanation: 'push() menambahkan satu atau beberapa elemen ke akhir array dan mengembalikan panjang barunya.',
      },
      {
        question_text: 'Metode DOM manakah yang digunakan untuk mencari elemen berdasarkan nilai atribut id-nya?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: domSelectConcept,
        options: ['document.getElementById()', 'document.querySelectorId()', 'document.findId()', 'document.elements.id()'], correct: 'A', points: 10,
        explanation: 'document.getElementById("id") mengembalikan referensi elemen pertama dengan ID yang sesuai.',
      },
      {
        question_text: 'Apa nilai kembalian dari ekspresi JavaScript: typeof "Halo Dunia"?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: primDataConcept,
        options: ['"string"', '"text"', '"char"', '"object"'], correct: 'A', points: 10,
        explanation: 'Operator typeof untuk nilai teks diapit tanda petik mengembalikan string "string".',
      },
      {
        question_text: 'Pernyataan kondisional manakah yang digunakan untuk mengeksekusi blok kode jika suatu kondisi bernilai benar (true)?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: condStmtConcept,
        options: ['if', 'while', 'for', 'switch'], correct: 'A', points: 10,
        explanation: 'Struktur kontrol if mengeksekusi blok pernyataan jika kondisi logika bernilai truthy.',
      },
      {
        question_text: 'Metode array manakah yang digunakan untuk menghapus dan mengembalikan elemen terakhir dari sebuah array?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: arrayMethConcept,
        options: ['pop()', 'shift()', 'slice()', 'splice()'], correct: 'A', points: 10,
        explanation: 'pop() menghapus elemen terakhir dari array dan mengembalikan elemen yang dihapus tersebut.',
      },
      {
        question_text: 'Struktur perulangan manakah yang ideal digunakan ketika jumlah iterasi telah diketahui secara pasti sebelumnya?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: loopConcept,
        options: ['for', 'while', 'do...while', 'if'], correct: 'A', points: 10,
        explanation: 'Loop for dengan inisialisasi, kondisi, dan inkremen dirancang untuk iterasi terhitung.',
      },
      {
        question_text: 'Bagaimana cara mendefinisikan sebuah fungsi sederhana bernama "sapa" tanpa parameter di JavaScript?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: funcDeclConcept,
        options: ['function sapa() { }', 'def sapa():', 'func sapa = ()', 'create sapa() { }'], correct: 'A', points: 10,
        explanation: 'Kata kunci function diikuti nama fungsi dan tanda kurung () adalah sintaks deklarasi fungsi standar.',
      },
      {
        question_text: 'Apa hasil evaluasi ekspresi: Boolean(0) dalam JavaScript?',
        material: 'JAVASCRIPT', difficulty: 'EASY', type: 'MULTIPLE_CHOICE', concept_id: primDataConcept,
        options: ['false', 'true', 'null', 'undefined'], correct: 'A', points: 10,
        explanation: 'Angka 0 adalah falsy value di JavaScript, sehingga Boolean(0) bernilai false.',
      },

      // =========================================================================
      // CSS - MEDIUM (10 Soal Lengkap)
      // =========================================================================
      {
        question_text: 'Secara default, bagaimana browser menghitung lebar elemen jika properti box-sizing: content-box digunakan?',
        material: 'CSS', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: contentBoxConcept,
        options: ['Lebar total = width yang ditentukan + padding + border', 'Lebar total = width yang ditentukan saja, padding dan border dikurangi dari dalam', 'Lebar total = width dikurangi margin dan outline', 'Lebar total = width ditambah margin saja tanpa menghitung border'], correct: 'A', points: 10,
        explanation: 'Pada content-box (default CSS), nilai width hanya diterapkan pada area konten. Padding dan border ditambahkan di luar nilai width tersebut.',
      },
      {
        question_text: 'Properti Flexbox manakah yang digunakan untuk mengatur perataan elemen-elemen anak di sepanjang sumbu utama (main axis)?',
        material: 'CSS', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: flexContainerConcept,
        options: ['justify-content', 'align-items', 'align-content', 'flex-direction'], correct: 'A', points: 10,
        explanation: 'justify-content mengatur distribusi ruang dan perataan flex item di sepanjang main axis (horizontal jika row, vertikal jika column).',
      },
      {
        question_text: 'Pada Flexbox, apa fungsi dari nilai properti flex-grow: 1 pada sebuah flex item?',
        material: 'CSS', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: flexItemsConcept,
        options: ['Mengizinkan item untuk membesar dan mengisi sisa ruang kosong pada container', 'Memaksa item berukuran tepat 100% dari lebar container', 'Mengunci ukuran item agar tidak pernah menyusut saat viewport mengecil', 'Menentukan urutan visual item agar selalu berada di posisi pertama'], correct: 'A', points: 10,
        explanation: 'flex-grow menentukan rasio pertumbuhan item relatif terhadap item lain untuk mengonsumsi sisa ruang kosong dalam container.',
      },
      {
        question_text: 'Kapan fenomena "margin collapsing" terjadi dalam CSS layout normal flow?',
        material: 'CSS', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: marginConcept,
        options: ['Ketika margin vertikal (top dan bottom) dari dua elemen blok yang bersebelahan saling bertemu', 'Ketika margin horizontal (left dan right) pada elemen inline bertabrakan', 'Ketika dua elemen flex berada dalam satu baris dengan margin horizontal', 'Ketika elemen memiliki properti position: absolute'], correct: 'A', points: 10,
        explanation: 'Margin collapsing terjadi pada margin vertikal elemen block-level dalam normal flow, di mana margin yang lebih besar menggabungkan margin yang lebih kecil.',
      },
      {
        question_text: 'Apa perbedaan antara selektor "div p" (descendant) dan "div > p" (child) dalam CSS?',
        material: 'CSS', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: cssSelectorConcept,
        options: ['"div > p" hanya memilih <p> yang merupakan anak langsung dari <div>, sedangkan "div p" memilih semua <p> di dalam <div> tanpa memandang kedalaman', '"div > p" memilih semua <p> di dalam <div>, sedangkan "div p" hanya memilih <p> pertama', '"div > p" memiliki spesifisitas lebih rendah dibanding "div p"', '"div > p" hanya berlaku jika <p> memiliki class yang sama dengan <div>'], correct: 'A', points: 10,
        explanation: 'Child combinator (>) menargetkan direct children, sedangkan descendant combinator (spasi) menargetkan seluruh turunan pada semua tingkat nesting.',
      },
      {
        question_text: 'Mengapa properti z-index: 10 seringkali tidak berpengaruh pada elemen HTML standar?',
        material: 'CSS', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: cssPropConcept,
        options: ['Elemen tersebut masih memiliki nilai default position: static', 'Nilai z-index harus selalu lebih besar dari 100 agar dapat diterapkan', 'Elemen tersebut harus memiliki properti display: inline', 'z-index hanya dapat digunakan bersamaan dengan flexbox'], correct: 'A', points: 10,
        explanation: 'z-index hanya berlaku pada positioned elements (elemen dengan nilai position selain static, seperti relative, absolute, fixed, sticky) atau flex/grid items.',
      },
      {
        question_text: 'Dalam paradigma desain responsif "mobile-first", media query manakah yang menjadi standar praktik penulisan CSS?',
        material: 'CSS', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: mediaQueryConcept,
        options: ['@media (min-width: ...)', '@media (max-width: ...)', '@media (device-width: ...)', '@media (orientation: portrait)'], correct: 'A', points: 10,
        explanation: 'Mobile-first menulis gaya default untuk layar kecil, kemudian menambahkan aturan layout yang lebih kompleks menggunakan @media (min-width: ...) seiring bertambahnya lebar layar.',
      },
      {
        question_text: 'Apa yang dimaksud dengan "breakpoint" dalam perancangan CSS responsif?',
        material: 'CSS', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: breakpointConcept,
        options: ['Titik batas ukuran layar tertentu di mana tata letak (layout) halaman diubah melalui media query', 'Kondisi saat browser mengalami error rendering CSS', 'Batas maksimal jumlah baris kode CSS yang diizinkan dalam satu file stylesheet', 'Titik di mana elemen HTML berhenti menerima animasi CSS'], correct: 'A', points: 10,
        explanation: 'Breakpoint adalah ambang lebar viewport di mana aturan media query diterapkan untuk menyesuaikan tata letak dengan ukuran layar perangkat.',
      },
      {
        question_text: 'Jika sebuah tombol membutuhkan area klik yang lebih luas tanpa mengubah jarak luar terhadap elemen sekitarnya, properti apa yang harus diperbesar?',
        material: 'CSS', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: paddingConcept,
        options: ['padding', 'margin', 'outline-offset', 'border-spacing'], correct: 'A', points: 10,
        explanation: 'Padding berada di dalam border elemen dan merupakan bagian dari area interaksi/klik serta latar belakang elemen, sedangkan margin berada di luar border.',
      },
      {
        question_text: 'Properti Flexbox manakah yang mengatur arah aliran item apakah mendatar (baris) atau menurun (kolom)?',
        material: 'CSS', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: flexDirConcept,
        options: ['flex-direction', 'flex-wrap', 'flex-flow', 'justify-content'], correct: 'A', points: 10,
        explanation: 'flex-direction menetapkan main axis dari flex container (row, row-reverse, column, column-reverse).',
      },

      // =========================================================================
      // JAVASCRIPT - MEDIUM (10 Soal Lengkap)
      // =========================================================================
      {
        question_text: 'Apa perbedaan perilaku deklarasi variabel menggunakan let dibanding var terkait scope?',
        material: 'JAVASCRIPT', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: scopeConcept,
        options: ['let memiliki block scope sedangkan var memiliki function scope', 'let memiliki global scope sedangkan var memiliki block scope', 'let dapat dideklarasikan ulang dalam scope yang sama sedangkan var tidak', 'let terikat pada window object sedangkan var tidak'], correct: 'A', points: 10,
        explanation: 'Variabel dengan let dan const dibatasi oleh blok kurung kurawal ({}) terdekat (block scope), sedangkan var hanya dibatasi oleh fungsi (function scope).',
      },
      {
        question_text: 'Apa perbedaan fundamental antara metode array map() dan forEach() dalam JavaScript?',
        material: 'JAVASCRIPT', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: arrayMethConcept,
        options: ['map() mengembalikan array baru berisi hasil transformasi, sedangkan forEach() mengembalikan undefined', 'map() memutasi array asli, sedangkan forEach() membuat array baru', 'forEach() hanya dapat digunakan untuk array numerik, sedangkan map() untuk string', 'map() berjalan secara asinkron, sedangkan forEach() berjalan sinkron'], correct: 'A', points: 10,
        explanation: 'map() memetakan setiap elemen dan menghasilkan array baru dengan panjang yang sama, sedangkan forEach() hanya mengeksekusi callback tanpa nilai kembalian (undefined).',
      },
      {
        question_text: 'Diberikan array [5, 12, 8, 130, 44]. Ekspresi manakah yang mengembalikan array hanya berisi angka yang lebih besar dari 10?',
        material: 'JAVASCRIPT', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: arrayMethConcept,
        options: ['numbers.filter(num => num > 10)', 'numbers.find(num => num > 10)', 'numbers.map(num => num > 10)', 'numbers.some(num => num > 10)'], correct: 'A', points: 10,
        explanation: 'filter() membuat shallow copy dari elemen-elemen array yang memenuhi kondisi boolean yang diberikan pada callback function.',
      },
      {
        question_text: 'Metode array manakah yang dirancang untuk mengagregasi seluruh elemen array menjadi satu nilai tunggal (seperti total penjumlahan atau objek rangkuman)?',
        material: 'JAVASCRIPT', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: arrayMethConcept,
        options: ['reduce()', 'concat()', 'slice()', 'flat()'], correct: 'A', points: 10,
        explanation: 'reduce() mengeksekusi reducer function pada setiap elemen array dan meneruskan nilai akumulator hingga menghasilkan nilai tunggal.',
      },
      {
        question_text: 'Bagaimana sintaks destructuring yang benar untuk mengambil properti name dan age dari objek const user = { name: "Ayu", age: 22 }?',
        material: 'JAVASCRIPT', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: destructureConcept,
        options: ['const { name, age } = user;', 'const [ name, age ] = user;', 'const { name, age } : user;', 'const user(name, age);'], correct: 'A', points: 10,
        explanation: 'Object destructuring menggunakan kurung kurawal const { prop1, prop2 } = object untuk mengekstrak properti berdasarkan nama kuncinya.',
      },
      {
        question_text: 'Mengapa penggunaan element.addEventListener("click", handler) lebih disarankan dibanding element.onclick = handler?',
        material: 'JAVASCRIPT', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: domEventsConcept,
        options: ['addEventListener memungkinkan penambahan beberapa event listener untuk tipe event yang sama tanpa menimpa handler sebelumnya', 'element.onclick hanya bekerja pada browser berbasis Internet Explorer', 'addEventListener mengeksekusi kode secara otomatis saat halaman pertama kali dimuat', 'element.onclick tidak dapat menerima parameter event'], correct: 'A', points: 10,
        explanation: 'addEventListener mendukung multiple listener untuk event yang sama, mendukung opsi capturing/bubbling, dan tidak menimpa callback listener lain yang sudah terpasang.',
      },
      {
        question_text: 'Fungsi apakah yang digunakan pada objek event untuk menghentikan perambatan event ke elemen induk (event bubbling)?',
        material: 'JAVASCRIPT', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: domEventsConcept,
        options: ['event.stopPropagation()', 'event.preventDefault()', 'event.stopImmediate()', 'event.cancelBubble = false'], correct: 'A', points: 10,
        explanation: 'event.stopPropagation() mencegah event merambat lebih jauh ke atas rantai DOM (bubbling phase), sedangkan preventDefault() mencegah aksi bawaan browser.',
      },
      {
        question_text: 'Dalam JavaScript, apa yang dimaksud dengan istilah "Callback Function"?',
        material: 'JAVASCRIPT', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: callbackConcept,
        options: ['Fungsi yang diteruskan sebagai argumen ke fungsi lain untuk dieksekusi kemudian', 'Fungsi yang memanggil dirinya sendiri secara rekursif hingga batas memori', 'Fungsi bawaan browser yang hanya dijalankan saat koneksi internet terputus', 'Fungsi yang dideklarasikan tanpa nama (anonymous function) pada scope global'], correct: 'A', points: 10,
        explanation: 'Callback adalah fungsi yang dipassing sebagai parameter ke fungsi lain untuk dijalankan kembali (called back) pada waktu tertentu, seperti setelah operasi I/O selesai.',
      },
      {
        question_text: 'Diberikan objek const a = { x: 1 }; const b = { y: 2 };. Cara paling modern dan bersih untuk menggabungkan keduanya menjadi objek baru adalah:',
        material: 'JAVASCRIPT', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: objLiteralConcept,
        options: ['const c = { ...a, ...b };', 'const c = a + b;', 'const c = Object.combine(a, b);', 'const c = [a, b].toObject();'], correct: 'A', points: 10,
        explanation: 'Object spread syntax ({ ...a, ...b }) menyalin enumerable own properties dari objek sumber ke objek baru secara ringkas.',
      },
      {
        question_text: 'Klausul switch manakah yang dijalankan jika tidak ada satu pun nilai case yang cocok dengan ekspresi pembanding?',
        material: 'JAVASCRIPT', difficulty: 'MEDIUM', type: 'MULTIPLE_CHOICE', concept_id: switchConcept,
        options: ['default:', 'else:', 'catch:', 'fallback:'], correct: 'A', points: 10,
        explanation: 'Klausul default di dalam blok switch dieksekusi ketika tidak ada case value yang cocok dengan nilai ekspresi.',
      },

      // =========================================================================
      // HTML - HARD (10 Soal Lengkap)
      // =========================================================================
      {
        question_text: 'Apa perbedaan perilaku antara atribut <script async> dan <script defer> pada HTML5?',
        material: 'HTML', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: docStructureConcept,
        options: ['defer mengunduh skrip secara asinkron tetapi mengeksekusinya secara berurutan setelah parsing HTML selesai, sedangkan async mengeksekusinya langsung begitu unduhan selesai', 'async menjamin urutan eksekusi skrip, sedangkan defer tidak menjamin urutan', 'defer memblokir penguraian (parsing) HTML di browser, sedangkan async tidak', 'async hanya berlaku untuk skrip inline, sedangkan defer untuk skrip eksternal'], correct: 'A', points: 10,
        explanation: 'defer mengunduh di latar belakang dan menunda eksekusi hingga DOM selesai di-parse dengan tetap menjaga urutan file. async langsung mengeksekusi segera setelah file selesai diunduh tanpa jaminan urutan.',
      },
      {
        question_text: 'Elemen semantik HTML5 manakah yang paling tepat digunakan untuk membungkus konten mandiri yang dapat didistribusikan atau digunakan kembali secara independen (seperti postingan blog atau kartu produk)?',
        material: 'HTML', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: semanticConcept,
        options: ['<article>', '<section>', '<div>', '<aside>'], correct: 'A', points: 10,
        explanation: '<article> merepresentasikan komposisi mandiri yang dapat berdiri sendiri secara independen, sedangkan <section> adalah pengelompokan tematik yang biasanya memiliki heading.',
      },
      {
        question_text: 'Atribut accessibility manakah yang digunakan untuk memberi tahu pembaca layar (screen reader) bahwa konten di dalam kontainer telah diperbarui secara dinamis tanpa memerlukan fokus pengguna?',
        material: 'HTML', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: accessConcept,
        options: ['aria-live="polite"', 'aria-hidden="false"', 'role="presentation"', 'aria-expanded="true"'], correct: 'A', points: 10,
        explanation: 'aria-live="polite" memberitahu screen reader untuk mengumumkan perubahan konten dinamis setelah tugas suara saat ini selesai tanpa menginterupsi pengguna.',
      },
      {
        question_text: 'Berdasarkan pedoman W3C WAI-ARIA, apa aturan pertama penggunaan ARIA (First Rule of ARIA)?',
        material: 'HTML', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: accessConcept,
        options: ['Gunakan elemen semantik bawaan HTML jika elemen tersebut sudah memiliki fungsi dan perilaku yang dibutuhkan sebelum menambahkan atribut ARIA', 'Selalu tambahkan atribut role pada setiap tag <div> dan <span>', 'Semua elemen form wajib memiliki atribut aria-label', 'Gunakan ARIA hanya jika kode CSS gagal dimuat oleh browser'], correct: 'A', points: 10,
        explanation: 'First Rule of ARIA menyatakan: Jangan gunakan ARIA jika Anda dapat menggunakan elemen HTML bawaan yang sudah memiliki semantik dan aksesibilitas yang dibutuhkan.',
      },
      {
        question_text: 'Bagaimana cara penulisan atribut alt yang benar pada tag <img> untuk gambar yang murni berfungsi sebagai dekorasi visual?',
        material: 'HTML', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: accessConcept,
        options: ['alt="" (string kosong) agar pembaca layar mengabaikannya', 'alt="dekorasi"', 'Menghapus atribut alt sepenuhnya dari tag img', 'alt="null"'], correct: 'A', points: 10,
        explanation: 'alt="" (empty string) menandakan bahwa gambar bersifat presentasional/dekoratif sehingga assistive technology akan melewatinya. Menghilangkan atribut alt justru membuat screen reader membacakan URL file.',
      },
      {
        question_text: 'Atribut enctype apakah yang wajib disertakan pada elemen <form method="POST"> ketika formulir menyertakan input unggah berkas (<input type="file">)?',
        material: 'HTML', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: formControlConcept,
        options: ['multipart/form-data', 'application/x-www-form-urlencoded', 'text/plain', 'application/json'], correct: 'A', points: 10,
        explanation: 'multipart/form-data diperlukan agar browser mengirimkan file biner dalam bagian-bagian payload terpisah (multipart), bukan mengonversinya menjadi URL encoding biasa.',
      },
      {
        question_text: 'Pada HTML5 form validation, metode JavaScript manakah yang digunakan untuk menetapkan pesan kesalahan validasi kustom pada elemen input?',
        material: 'HTML', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: formValidConcept,
        options: ['inputElement.setCustomValidity("Pesan kesalahan")', 'inputElement.setErrorMessage("Pesan kesalahan")', 'inputElement.validationMessage = "Pesan kesalahan"', 'inputElement.setError("Pesan kesalahan")'], correct: 'A', points: 10,
        explanation: 'setCustomValidity() menetapkan pesan error kustom. Jika string tidak kosong, input dianggap tidak valid (validity.customError = true) dan browser akan menampilkan pesan tersebut.',
      },
      {
        question_text: 'Elemen HTML5 manakah yang dirancang khusus untuk menangani "Art Direction" (menyajikan rasio dan komposisi gambar berbeda pada berbagai ukuran layar)?',
        material: 'HTML', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: easyHtmlConcept,
        options: ['<picture> yang berisi elemen <source> dan <img>', '<img> dengan atribut srcset saja tanpa picture', '<figure> dengan atribut responsive="true"', '<canvas> dengan binding media query'], correct: 'A', points: 10,
        explanation: '<picture> membungkus satu atau lebih tag <source media="..."> dan satu tag <img> cadangan, memungkinkan browser memilih resource gambar yang berbeda berdasarkan kondisi media query.',
      },
      {
        question_text: 'Apa tujuan penulisan tag <link rel="canonical" href="..."> di dalam bagian <head> halaman web?',
        material: 'HTML', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: docStructureConcept,
        options: ['Mencegah masalah konten duplikat dengan memberi tahu mesin pencari URL utama dari halaman tersebut', 'Mempercepat proses download font Google Fonts', 'Mengunci halaman web agar tidak dapat dibuka di tab browser lain', 'Menyambungkan stylesheet CSS utama ke dokumen HTML'], correct: 'A', points: 10,
        explanation: 'Canonical link memberitahu search engine URL kanonis preferensi pemilik situs untuk menghindari penalti ranking akibat URL duplikat (seperti dengan query parameter berbeda).',
      },
      {
        question_text: 'Elemen HTML5 manakah yang digunakan untuk menampilkan teks yang diformat sebelumnya dengan spasi dan jeda baris apa adanya?',
        material: 'HTML', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: easyHtmlConcept,
        options: ['<pre>', '<code>', '<samp>', '<kbd>'], correct: 'A', points: 10,
        explanation: '<pre> mempertahankan format spasi putih dan line break persis seperti yang tertulis di kode sumber.',
      },

      // =========================================================================
      // CSS - HARD (10 Soal Lengkap)
      // =========================================================================
      {
        question_text: 'Urutan kekuatan spesifisitas CSS dari yang tertinggi hingga terendah adalah:',
        material: 'CSS', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: cssSelectorConcept,
        options: ['Inline styles > ID selector > Class/Attribute/Pseudo-class > Element/Pseudo-element', 'ID selector > Inline styles > Class selector > Element selector', 'Class selector > ID selector > Inline styles > Element selector', 'Inline styles > Element selector > Class selector > ID selector'], correct: 'A', points: 10,
        explanation: 'Spesifisitas dihitung dalam 4 tingkat: inline styles (1,0,0,0) > ID (0,1,0,0) > class, atribut, dan pseudo-class (0,0,1,0) > elemen dan pseudo-elemen (0,0,0,1).',
      },
      {
        question_text: 'Manakah dari kombinasi properti CSS berikut yang secara otomatis menciptakan Stacking Context baru pada elemen?',
        material: 'CSS', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: cssPropConcept,
        options: ['opacity: 0.9 atau transform: scale(1.05)', 'color: blue atau font-weight: bold', 'margin: 0 auto atau padding: 20px', 'display: block atau float: none'], correct: 'A', points: 10,
        explanation: 'Stacking context baru diinisiasi oleh kondisi seperti opacity < 1, transform selain none, filter selain none, clip-path, atau properti isolation: isolate.',
      },
      {
        question_text: 'Apa keunggulan utama CSS Custom Properties (Variabel CSS) dibanding variabel pra-pemroses seperti SASS/LESS?',
        material: 'CSS', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: cssValConcept,
        options: ['Dapat diakses dan dimanipulasi secara dinamis saat runtime melalui JavaScript dan mewarisi nilai melalui DOM hierarchy', 'Hanya dapat dikompilasi sebelum halaman dikirimkan oleh server', 'Memiliki spesifisitas yang lebih tinggi daripada selektor ID', 'Otomatis mengompresi ukuran file CSS saat browser memuat halaman'], correct: 'A', points: 10,
        explanation: 'CSS custom properties (--nama-variabel) bersifat dinamis di browser, memiliki scope bertingkat, dan dapat diubah runtime via CSS media queries maupun JavaScript (element.style.setProperty).',
      },
      {
        question_text: 'Properti CSS manakah yang paling optimal dianimasikan untuk mencapai performa 60 FPS tanpa memicu reflow (layout) dan repaint berlebih?',
        material: 'CSS', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: cssPropConcept,
        options: ['transform dan opacity', 'width dan height', 'top dan left', 'margin dan padding'], correct: 'A', points: 10,
        explanation: 'transform dan opacity dapat diproses langsung oleh GPU pada layer komposit (compositor thread) tanpa memaksa browser menghitung ulang geometri layout (reflow) atau menggambar ulang piksel (repaint).',
      },
      {
        question_text: 'Mengapa unit viewport baru 100dvh (Dynamic Viewport Height) diperkenalkan di CSS modern?',
        material: 'CSS', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: viewportConcept,
        options: ['Menyesuaikan tinggi viewport dinamis pada browser mobile saat toolbar/address bar muncul atau tersembunyi', 'Menghitung tinggi viewport hanya jika pengguna menggunakan perangkat desktop beresolusi 4K', 'Mengunci tinggi layar agar keyboard virtual mobile tidak pernah menggeser konten', 'Menggantikan seluruh penggunaan unit persen (%) dalam layout HTML'], correct: 'A', points: 10,
        explanation: 'dvh (dynamic viewport height) secara otomatis beradaptasi dengan perubahan ukuran antarmuka browser mobile (seperti saat address bar menyusut ketika discroll).',
      },
      {
        question_text: 'Kueri CSS manakah yang digunakan untuk menguji apakah browser klien mendukung fitur properti CSS tertentu sebelum menerapkannya?',
        material: 'CSS', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: mediaQueryConcept,
        options: ['@supports (display: grid) { ... }', '@media (feature: grid) { ... }', '@feature (grid: true) { ... }', '@check (css: grid) { ... }'], correct: 'A', points: 10,
        explanation: 'Feature query @supports menguji dukungan browser terhadap deklarasi CSS pasangan properti-nilai tertentu untuk menerapkan progressive enhancement.',
      },
      {
        question_text: 'Apa kegunaan dari pseudo-class modern :has() dalam selektor figure:has(figcaption)?',
        material: 'CSS', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: cssSelectorConcept,
        options: ['Memilih elemen <figure> yang memiliki anak atau turunan <figcaption> (sering disebut sebagai "parent selector")', 'Memilih <figcaption> yang berada di luar elemen <figure>', 'Menghapus elemen <figure> jika tidak ada <figcaption>', 'Menghitung jumlah <figcaption> di dalam dokumen secara otomatis'], correct: 'A', points: 10,
        explanation: 'Pseudo-class :has() berfungsi sebagai parent selector di CSS, mencocokkan elemen induk jika ada turunan yang memenuhi kondisi parameter selektor.',
      },
      {
        question_text: 'Apa perbedaan krusial antara pseudo-class :is() dan :where() dalam penghitungan spesifisitas CSS?',
        material: 'CSS', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: cssSelectorConcept,
        options: [':where() selalu memiliki nilai spesifisitas nol (0,0,0,0), sedangkan :is() mengambil spesifisitas tertinggi dari daftar argumennya', ':where() memiliki spesifisitas setara inline style, sedangkan :is() setara class', ':where() hanya dapat memuat elemen teks, sedangkan :is() untuk elemen block', ':where() tidak didukung oleh browser modern saat ini'], correct: 'A', points: 10,
        explanation: ':where() mempermudah reset/default styling karena spesifisitasnya selalu 0, memudahkan pengembang menimpanya (override) di mana saja tanpa konflik spesifisitas.',
      },
      {
        question_text: 'Bagaimana cara menghasilkan bayangan yang tampak sangat halus, realistis, dan berkedalaman tinggi dalam CSS modern?',
        material: 'CSS', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: borderConcept,
        options: ['Menggabungkan beberapa lapisan box-shadow yang dipisahkan oleh tanda koma dengan blur dan spread bertahap', 'Menggunakan properti filter: blur(50px) pada seluruh kontainer', 'Mengatur satu box-shadow dengan nilai blur 100px dan opasitas 100%', 'Menggunakan tag <canvas> untuk menggambar bayangan piksel demi piksel'], correct: 'A', points: 10,
        explanation: 'Teknik layered box-shadow (memisahkan beberapa shadow dengan koma dari ambient hingga direct shadow) meniru difusi cahaya di dunia nyata, menghasilkan bayangan yang jauh lebih halus daripada satu shadow tunggal yang pekat.',
      },
      {
        question_text: 'Nilai properti position manakah yang membuat elemen berperilaku relatif hingga mencapai offset scroll tertentu lalu menempel seperti fixed?',
        material: 'CSS', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: cssPropConcept,
        options: ['sticky', 'fixed', 'absolute', 'relative'], correct: 'A', points: 10,
        explanation: 'position: sticky beralih antara relative dan fixed tergantung pada posisi scroll pengguna terhadap viewport scrolling context.',
      },

      // =========================================================================
      // JAVASCRIPT - HARD (10 Soal Lengkap)
      // =========================================================================
      {
        question_text: "Diberikan kode berikut: setTimeout(() => console.log('A'), 0); Promise.resolve().then(() => console.log('B')); console.log('C');. Urutan output console yang benar adalah:",
        material: 'JAVASCRIPT', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: eventLoopConcept,
        options: ['C, B, A', 'C, A, B', 'A, B, C', 'B, C, A'], correct: 'A', points: 10,
        explanation: '1. Kode sinkron dieksekusi pertama (C). 2. Antrean Microtask (Promise callback) dikuras sebelum Macrotask berikutnya (B). 3. Macrotask (setTimeout callback) dieksekusi di akhir putaran (A).',
      },
      {
        question_text: 'Apa perbedaan perilaku Promise.all() dibanding Promise.allSettled() ketika salah satu Promise mengalami penolakan (reject)?',
        material: 'JAVASCRIPT', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: promiseConcept,
        options: ['Promise.all() langsung menolak (short-circuit / fail-fast), sedangkan Promise.allSettled() menunggu semua selesai dan mengembalikan status masing-masing', 'Promise.all() mengabaikan error dan mengembalikan nilai sisanya', 'Promise.allSettled() akan melempar exception fatal yang menghentikan eksekusi script', 'Promise.all() hanya dapat menerima maksimal 3 buah Promise'], correct: 'A', points: 10,
        explanation: 'Promise.all langsung reject begitu ada satu promise yang gagal. Promise.allSettled menunggu seluruh promise selesai (baik resolve maupun reject) dan mengembalikan array status lengkap.',
      },
      {
        question_text: 'Dalam JavaScript, apa yang dimaksud dengan mekanisme "Closure"?',
        material: 'JAVASCRIPT', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: scopeConcept,
        options: ['Kombinasi antara sebuah fungsi dan lingkungan leksikal tempat fungsi tersebut dideklarasikan, memungkinkan fungsi mengingat variabel luarnya', 'Perintah untuk menutup koneksi database secara otomatis setelah fungsi selesai dieksekusi', 'Fitur untuk mencegah fungsi dipanggil lebih dari satu kali', 'Proses pembersihan memori oleh garbage collector saat fungsi selesai berjalan'], correct: 'A', points: 10,
        explanation: 'Closure memberikan fungsi akses ke scope luarnya (outer scope) bahkan setelah fungsi luar tersebut selesai dieksekusi, menjadi fondasi encapsulation dan private variables di JS.',
      },
      {
        question_text: 'Bagaimana perilaku kata kunci this di dalam sebuah Arrow Function?',
        material: 'JAVASCRIPT', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: funcDeclConcept,
        options: ['Arrow function tidak memiliki binding this sendiri; nilai this ditentukan secara leksikal dari scope tempat arrow function tersebut dibuat', 'Nilai this selalu merujuk pada objek global (window atau global)', 'Nilai this dapat diubah kapan saja menggunakan metode .bind() atau .call()', 'Arrow function menghasilkan nilai this baru setiap kali dipanggil'], correct: 'A', points: 10,
        explanation: 'Arrow function tidak mendefinisikan konteks this sendiri. Ia mewarisi this dari enclosing lexical scope saat dideklarasikan dan tidak dapat di-rebind menggunakan bind/call/apply.',
      },
      {
        question_text: 'Apa manfaat utama menerapkan teknik "Event Delegation" pada daftar elemen HTML yang panjang dan dinamis?',
        material: 'JAVASCRIPT', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: domEventsConcept,
        options: ['Hanya memasang satu event listener pada elemen induk untuk menangani event dari seluruh elemen anak menggunakan event.target, menghemat memori', 'Mencegah event merambat ke luar jendela browser', 'Memaksa setiap elemen anak memiliki handler unik tersendiri di memori', 'Menonaktifkan seluruh animasi CSS pada saat event berlangsung'], correct: 'A', points: 10,
        explanation: 'Event delegation memanfaatkan event bubbling: satu listener pada parent container dapat menangani klik dari semua item saat ini maupun item baru yang ditambahkan di masa depan secara efisien.',
      },
      {
        question_text: 'Mengapa sintaks spread operator const copy = { ...original } tidak aman digunakan untuk menduplikasi objek yang memiliki struktur bersarang (nested objects)?',
        material: 'JAVASCRIPT', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: arrayMethConcept,
        options: ['Spread operator hanya menyalin referensi memori untuk objek bersarang (shallow copy), sehingga mutasi pada objek anak akan mengubah objek asli', 'Spread operator akan mengubah nilai objek bersarang menjadi undefined', 'Spread operator hanya bekerja pada array, bukan objek', 'Browser akan melempar TypeError saat menemukan objek bersarang'], correct: 'A', points: 10,
        explanation: 'Spread operator hanya melakukan shallow copy pada level pertama. Objek bersarang di dalamnya tetap merujuk ke alamat memori yang sama.',
      },
      {
        question_text: 'Apa dampak pemanggilan Object.freeze(user) pada sebuah objek JavaScript?',
        material: 'JAVASCRIPT', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: objLiteralConcept,
        options: ['Mencegah penambahan properti baru, penghapusan properti, dan modifikasi nilai properti yang sudah ada pada level terluar', 'Menghapus seluruh nilai properti objek dan mengosongkannya', 'Mengubah tipe data objek menjadi tipe primitif string', 'Membuat seluruh objek bersarang di dalamnya menjadi deep immutable secara otomatis'], correct: 'A', points: 10,
        explanation: 'Object.freeze() membuat objek shallowly immutable: properti tidak dapat ditambah, dihapus, atau diubah nilainya. Catatan: pembekuan bersifat dangkal (shallow freeze).',
      },
      {
        question_text: 'Bagaimana cara membuat custom error class yang benar dalam JavaScript ES6+?',
        material: 'JAVASCRIPT', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: errorHandlingConcept,
        options: ['class ValidationError extends Error { constructor(message) { super(message); this.name = "ValidationError"; } }', 'class ValidationError implements Error { constructor(message) { this.message = message; } }', 'function ValidationError(msg) { Error.call(this, msg); }', 'const ValidationError = new Error("ValidationError");'], correct: 'A', points: 10,
        explanation: 'Membuat subclass turunan dari Error dengan mewarisi prototype, memanggil super(message) untuk mempertahankan stack trace, dan menetapkan this.name sesuai identitas error.',
      },
      {
        question_text: 'Jika sebuah fungsi async melempar kesalahan (throw Error) dan tidak ditangkap oleh blok try...catch di dalamnya, apa yang akan dikembalikan oleh pemanggilan fungsi tersebut?',
        material: 'JAVASCRIPT', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: asyncAwaitConcept,
        options: ['Promise dengan status rejected yang membawa objek error tersebut', 'Nilai null yang dikembalikan secara sinkron', 'Browser langsung mengalami crash', 'Objek kosong {} dengan status COMPLETED'], correct: 'A', points: 10,
        explanation: 'Fungsi async selalu mengembalikan Promise. Jika terjadi unhandled throw di dalam fungsi async, Promise yang dikembalikan otomatis beralih ke state rejected.',
      },
      {
        question_text: 'Metode manakah yang digunakan untuk mengonversi string format JSON menjadi objek JavaScript yang valid?',
        material: 'JAVASCRIPT', difficulty: 'HARD', type: 'MULTIPLE_CHOICE', concept_id: objLiteralConcept,
        options: ['JSON.parse()', 'JSON.stringify()', 'JSON.toObject()', 'JSON.decode()'], correct: 'A', points: 10,
        explanation: 'JSON.parse() mengurai string teks berformat JSON dan mengonversinya menjadi objek atau nilai JavaScript.',
      },
    ];

    let insertedCount = 0;
    let updatedCount = 0;
    for (let i = 0; i < questionsToSeed.length; i++) {
      const q = questionsToSeed[i];
      const check = await client.query(
        "SELECT id FROM questions WHERE LOWER(TRIM(question_text)) = LOWER(TRIM($1))",
        [q.question_text]
      );

      const correctAnswerObj = {
        options: q.options,
        correct: q.correct
      };

      if (check.rows.length === 0) {
        await client.query(`
          INSERT INTO questions (
            concept_id, material, difficulty, type, question_text,
            correct_answer, points, order_index, is_active, explanation
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `, [
          q.concept_id,
          q.material,
          q.difficulty,
          q.type,
          q.question_text,
          JSON.stringify(correctAnswerObj),
          q.points || 10,
          i + 1,
          true,
          q.explanation || null
        ]);
        insertedCount++;
      } else {
        const existingId = check.rows[0].id;
        await client.query(`
          UPDATE questions
             SET concept_id = $1,
                 material = $2,
                 difficulty = $3,
                 type = $4,
                 correct_answer = $5,
                 points = $6,
                 is_active = true,
                 explanation = $7
           WHERE id = $8
        `, [
          q.concept_id,
          q.material,
          q.difficulty,
          q.type,
          JSON.stringify(correctAnswerObj),
          q.points || 10,
          q.explanation || null,
          existingId
        ]);
        updatedCount++;
      }
    }

    await client.query('COMMIT');
    console.log(`Seeding complete! ${insertedCount} questions inserted, ${updatedCount} questions updated.`);
    console.log(`Total questions in seed: ${questionsToSeed.length}`);
    return { inserted: insertedCount, updated: updatedCount };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    if (require.main === module) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  seed();
}

module.exports = { seedMixedQuestionBank: seed };

