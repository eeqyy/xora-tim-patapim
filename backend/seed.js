// ============================================================
// XORA — Development Seed Data
// backend/seed.js
// ============================================================
// Usage:  npm run seed   (or:  node seed.js)
// Safe to re-run:  uses ON CONFLICT … DO NOTHING everywhere.
// ============================================================

const pool = require("./db");

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/**
 * Insert a single row, return the row (with generated id).
 * ON CONFLICT on `conflictTarget` → DO NOTHING + re-SELECT by `lookupCol`/`lookupVal`.
 */
async function upsertRow(client, table, columns, values, conflictTarget, lookupCol, lookupVal) {
  const placeholders = values.map((_, i) => "$" + (i + 1)).join(", ");
  const sql = `INSERT INTO ${table} (${columns.join(", ")})
               VALUES (${placeholders})
               ON CONFLICT ${conflictTarget} DO NOTHING
               RETURNING *`;
  const res = await client.query(sql, values);
  if (res.rows.length > 0) return res.rows[0];
  // Row already existed – look it up
  const lookup = await client.query(
    `SELECT * FROM ${table} WHERE ${lookupCol} = $1`,
    [lookupVal]
  );
  return lookup.rows[0];
}

/**
 * Find an existing row by a WHERE clause, or insert a new one.
 * For tables without suitable unique constraints (assessments, attempts, etc.).
 */
async function findOrInsert(client, table, columns, values, lookupWhere, lookupParams) {
  const existing = await client.query(
    `SELECT * FROM ${table} WHERE ${lookupWhere} LIMIT 1`,
    lookupParams
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const placeholders = values.map((_, i) => "$" + (i + 1)).join(", ");
  const sql = `INSERT INTO ${table} (${columns.join(", ")})
               VALUES (${placeholders})
               RETURNING *`;
  const res = await client.query(sql, values);
  return res.rows[0];
}

// ────────────────────────────────────────────────────────────
// Main seed function
// ────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    console.log("🌱 Seeding Xora development data…\n");

    // ══════════════════════════════════════════════════════════
    // 1. ROLES
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Roles");
    const learnerRole = await upsertRow(
      client, "roles",
      ["name", "description"],
      ["LEARNER", "Pelajar yang menggunakan platform Xora"],
      "(name)", "name", "LEARNER"
    );
    const adminRole = await upsertRow(
      client, "roles",
      ["name", "description"],
      ["ADMIN", "Administrator platform Xora"],
      "(name)", "name", "ADMIN"
    );

    // ══════════════════════════════════════════════════════════
    // 2. USERS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Users");
    // Dummy bcrypt hash for "password123" (cost 10) – safe for dev only
    const dummyHash = "$2b$10$dummyHashForDevelopmentOnlyXoraProject2026abc";

    const learnerUser = await upsertRow(
      client, "users",
      ["email", "password_hash", "name", "status"],
      ["learner@xora.dev", dummyHash, "Dev Learner", "ACTIVE"],
      "(email)", "email", "learner@xora.dev"
    );

    const adminUser = await upsertRow(
      client, "users",
      ["email", "password_hash", "name", "status"],
      ["admin@xora.dev", dummyHash, "Dev Admin", "ACTIVE"],
      "(email)", "email", "admin@xora.dev"
    );

    // ══════════════════════════════════════════════════════════
    // 3. USER ROLES
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ User Roles");
    await upsertRow(
      client, "user_roles",
      ["user_id", "role_id"],
      [learnerUser.id, learnerRole.id],
      "(user_id, role_id)", "user_id", learnerUser.id
    );
    await upsertRow(
      client, "user_roles",
      ["user_id", "role_id"],
      [adminUser.id, adminRole.id],
      "(user_id, role_id)", "user_id", adminUser.id
    );

    // ══════════════════════════════════════════════════════════
    // 4. SUBJECT
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Subjects");
    const subject = await upsertRow(
      client, "subjects",
      ["name", "description", "status"],
      ["Web Development", "Belajar pengembangan web dari dasar HTML hingga framework modern", "PUBLISHED"],
      "(name)", "name", "Web Development"
    );

    // ══════════════════════════════════════════════════════════
    // 5. PROFILES
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Profiles");
    await upsertRow(
      client, "learner_profiles",
      ["user_id", "learning_goal", "experience_level", "preferred_subject_id", "onboarding_completed"],
      [learnerUser.id, "Menguasai web development full-stack", "BEGINNER", subject.id, true],
      "(user_id)", "user_id", learnerUser.id
    );
    await upsertRow(
      client, "admin_profiles",
      ["user_id", "employee_code"],
      [adminUser.id, "ADM-001"],
      "(user_id)", "user_id", adminUser.id
    );

    // ══════════════════════════════════════════════════════════
    // 6. LEVELS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Levels");
    const levelDefs = [
      { name: "HTML & Web Fundamentals", difficulty: "EASY",   order: 1, desc: "Dasar HTML dan struktur halaman web" },
      { name: "CSS Fundamentals",        difficulty: "EASY",   order: 2, desc: "Styling dan layout halaman web" },
      { name: "JavaScript Fundamentals", difficulty: "MEDIUM", order: 3, desc: "Logika pemrograman dengan JavaScript" },
      { name: "Advanced JavaScript",     difficulty: "MEDIUM", order: 4, desc: "Konsep lanjutan JavaScript dan browser API" },
      { name: "Frontend Development",    difficulty: "HARD",   order: 5, desc: "Membangun aplikasi web modern dengan React" },
    ];

    const levels = {};
    for (const l of levelDefs) {
      levels[l.name] = await upsertRow(
        client, "levels",
        ["subject_id", "name", "difficulty", "description", "order_index", "status"],
        [subject.id, l.name, l.difficulty, l.desc, l.order, "PUBLISHED"],
        "(subject_id, name)", "name", l.name
      );
    }

    // ══════════════════════════════════════════════════════════
    // 7. TOPICS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Topics");
    const topicDefs = {
      "HTML & Web Fundamentals": [
        { name: "HTML Basics",       order: 1, desc: "Elemen dasar HTML dan struktur dokumen" },
        { name: "Semantic HTML",     order: 2, desc: "Elemen semantik dan aksesibilitas" },
        { name: "Forms & Validation", order: 3, desc: "Formulir HTML dan validasi bawaan" },
      ],
      "CSS Fundamentals": [
        { name: "CSS Basics",        order: 1, desc: "Selector, properti, dan nilai CSS" },
        { name: "Box Model",         order: 2, desc: "Margin, border, padding, dan content" },
        { name: "Flexbox",           order: 3, desc: "Layout fleksibel dengan Flexbox" },
        { name: "Responsive Design", order: 4, desc: "Media query dan desain responsif" },
      ],
      "JavaScript Fundamentals": [
        { name: "Variables & Data Types", order: 1, desc: "Deklarasi variabel dan tipe data dasar" },
        { name: "Functions",              order: 2, desc: "Fungsi, parameter, dan return value" },
        { name: "Arrays & Objects",       order: 3, desc: "Struktur data array dan objek" },
        { name: "Control Flow",           order: 4, desc: "Percabangan dan perulangan" },
      ],
      "Advanced JavaScript": [
        { name: "DOM Manipulation", order: 1, desc: "Memanipulasi elemen halaman dengan JavaScript" },
        { name: "Async JavaScript", order: 2, desc: "Asynchronous programming dan event loop" },
        { name: "Promises",        order: 3, desc: "Promise, async/await, dan error handling" },
        { name: "Modules",         order: 4, desc: "ES Modules dan organisasi kode" },
      ],
      "Frontend Development": [
        { name: "React Fundamentals", order: 1, desc: "Dasar React dan JSX" },
        { name: "Components",         order: 2, desc: "Membuat dan menyusun komponen React" },
        { name: "Props & State",      order: 3, desc: "Mengelola data dengan props dan state" },
        { name: "Routing",            order: 4, desc: "Navigasi halaman dengan React Router" },
      ],
    };

    const topics = {};
    for (const [levelName, topicList] of Object.entries(topicDefs)) {
      const level = levels[levelName];
      for (const t of topicList) {
        topics[t.name] = await upsertRow(
          client, "topics",
          ["level_id", "name", "description", "order_index", "status"],
          [level.id, t.name, t.desc, t.order, "PUBLISHED"],
          "(level_id, name)", "name", t.name
        );
      }
    }

    // ══════════════════════════════════════════════════════════
    // 8. CONCEPTS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Concepts");
    const conceptNames = [
      // HTML
      "HTML Element", "HTML Attribute", "Document Structure",
      "Semantic Elements", "Accessibility", "Form Controls",
      "Form Validation",
      // CSS
      "CSS Selector", "CSS Property", "CSS Value",
      "Margin", "Border", "Padding", "Content Box",
      "Flex Container", "Flex Items", "Flex Direction",
      "Media Query", "Viewport", "Breakpoint",
      // JS Basics
      "Variable Declaration", "Primitive Data Type", "Scope",
      "Function Declaration", "Parameter", "Return Value",
      "Array Methods", "Object Literal", "Destructuring",
      "Conditional Statement", "Loop", "Switch",
      // Advanced JS
      "DOM Selection", "DOM Events", "DOM Modification",
      "Callback", "Event Loop", "setTimeout/setInterval",
      "Promise Object", "Async Await", "Error Handling",
      "ES Module Import", "ES Module Export", "Module Bundler",
      // React
      "React Component", "JSX Syntax", "Virtual DOM",
      "Component Composition", "Functional Component", "Component Lifecycle",
      "Props", "State", "useState Hook",
      "React Router", "Route Parameters", "Navigation",
    ];

    const concepts = {};
    for (const name of conceptNames) {
      concepts[name] = await upsertRow(
        client, "concepts",
        ["subject_id", "name", "description", "status"],
        [subject.id, name, `Konsep: ${name}`, "PUBLISHED"],
        "(subject_id, name)", "name", name
      );
    }

    // ══════════════════════════════════════════════════════════
    // 9. TOPIC ↔ CONCEPTS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Topic–Concept links");
    const topicConceptMap = {
      "HTML Basics":       ["HTML Element", "HTML Attribute", "Document Structure"],
      "Semantic HTML":     ["Semantic Elements", "Accessibility"],
      "Forms & Validation":["Form Controls", "Form Validation"],
      "CSS Basics":        ["CSS Selector", "CSS Property", "CSS Value"],
      "Box Model":         ["Margin", "Border", "Padding", "Content Box"],
      "Flexbox":           ["Flex Container", "Flex Items", "Flex Direction"],
      "Responsive Design": ["Media Query", "Viewport", "Breakpoint"],
      "Variables & Data Types": ["Variable Declaration", "Primitive Data Type", "Scope"],
      "Functions":         ["Function Declaration", "Parameter", "Return Value"],
      "Arrays & Objects":  ["Array Methods", "Object Literal", "Destructuring"],
      "Control Flow":      ["Conditional Statement", "Loop", "Switch"],
      "DOM Manipulation":  ["DOM Selection", "DOM Events", "DOM Modification"],
      "Async JavaScript":  ["Callback", "Event Loop", "setTimeout/setInterval"],
      "Promises":          ["Promise Object", "Async Await", "Error Handling"],
      "Modules":           ["ES Module Import", "ES Module Export", "Module Bundler"],
      "React Fundamentals":["React Component", "JSX Syntax", "Virtual DOM"],
      "Components":        ["Component Composition", "Functional Component", "Component Lifecycle"],
      "Props & State":     ["Props", "State", "useState Hook"],
      "Routing":           ["React Router", "Route Parameters", "Navigation"],
    };

    for (const [topicName, conceptList] of Object.entries(topicConceptMap)) {
      for (let i = 0; i < conceptList.length; i++) {
        const weight = (1.0 - i * 0.1).toFixed(2);
        await upsertRow(
          client, "topic_concepts",
          ["topic_id", "concept_id", "relevance_weight", "order_index"],
          [topics[topicName].id, concepts[conceptList[i]].id, weight, i + 1],
          "(topic_id, concept_id)", "topic_id", topics[topicName].id
        );
      }
    }

    // ══════════════════════════════════════════════════════════
    // 10. CONCEPT PREREQUISITES
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Concept Prerequisites");
    const prereqs = [
      // HTML chain
      ["HTML Attribute",       "HTML Element"],
      ["Document Structure",   "HTML Element"],
      ["Semantic Elements",    "Document Structure"],
      ["Accessibility",        "Semantic Elements"],
      ["Form Controls",        "HTML Element"],
      ["Form Validation",      "Form Controls"],
      // CSS chain
      ["CSS Property",         "CSS Selector"],
      ["CSS Value",            "CSS Property"],
      ["Margin",               "CSS Value"],
      ["Border",               "CSS Value"],
      ["Padding",              "CSS Value"],
      ["Content Box",          "CSS Value"],
      ["Flex Container",       "Margin"],
      ["Flex Items",           "Flex Container"],
      ["Flex Direction",       "Flex Container"],
      ["Media Query",          "CSS Selector"],
      ["Viewport",             "Media Query"],
      ["Breakpoint",           "Media Query"],
      // JS chain
      ["Primitive Data Type",  "Variable Declaration"],
      ["Scope",                "Variable Declaration"],
      ["Function Declaration", "Variable Declaration"],
      ["Parameter",            "Function Declaration"],
      ["Return Value",         "Function Declaration"],
      ["Array Methods",        "Variable Declaration"],
      ["Object Literal",       "Variable Declaration"],
      ["Destructuring",        "Object Literal"],
      ["Conditional Statement","Variable Declaration"],
      ["Loop",                 "Conditional Statement"],
      ["Switch",               "Conditional Statement"],
      // Advanced JS chain
      ["DOM Selection",        "Variable Declaration"],
      ["DOM Events",           "DOM Selection"],
      ["DOM Modification",     "DOM Selection"],
      ["Callback",             "Function Declaration"],
      ["Event Loop",           "Callback"],
      ["setTimeout/setInterval","Callback"],
      ["Promise Object",       "Callback"],
      ["Async Await",          "Promise Object"],
      ["Error Handling",       "Async Await"],
      ["ES Module Import",     "Function Declaration"],
      ["ES Module Export",     "Function Declaration"],
      ["Module Bundler",       "ES Module Import"],
      // React chain
      ["React Component",     "Function Declaration"],
      ["JSX Syntax",           "React Component"],
      ["Virtual DOM",          "React Component"],
      ["Component Composition","React Component"],
      ["Functional Component", "React Component"],
      ["Component Lifecycle",  "Functional Component"],
      ["Props",                "React Component"],
      ["State",                "React Component"],
      ["useState Hook",        "State"],
      ["React Router",         "React Component"],
      ["Route Parameters",     "React Router"],
      ["Navigation",           "React Router"],
    ];

    for (const [concept, prereq] of prereqs) {
      await upsertRow(
        client, "concept_prerequisites",
        ["concept_id", "prerequisite_concept_id", "dependency_weight"],
        [concepts[concept].id, concepts[prereq].id, 1.00],
        "(concept_id, prerequisite_concept_id)", "concept_id", concepts[concept].id
      );
    }

    // ══════════════════════════════════════════════════════════
    // 11. MATERIALS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Materials");
    const materialDefs = [
      { topic: "HTML Basics",       title: "Pengenalan HTML",            type: "ARTICLE",      order: 1, content: { body: "HTML (HyperText Markup Language) adalah bahasa markup standar untuk membuat halaman web. Setiap elemen HTML ditandai dengan tag pembuka dan penutup." } },
      { topic: "HTML Basics",       title: "Contoh Kode HTML Dasar",    type: "CODE_EXAMPLE", order: 2, content: { language: "html", code: "<!DOCTYPE html>\n<html>\n<head><title>Halaman Pertama</title></head>\n<body><h1>Halo Dunia!</h1></body>\n</html>" } },
      { topic: "Semantic HTML",     title: "Elemen Semantik HTML5",      type: "ARTICLE",      order: 1, content: { body: "Elemen semantik seperti <header>, <nav>, <main>, <article>, <section>, dan <footer> memberikan makna struktur pada halaman web." } },
      { topic: "CSS Basics",        title: "Pengenalan CSS",             type: "ARTICLE",      order: 1, content: { body: "CSS (Cascading Style Sheets) digunakan untuk mengatur tampilan elemen HTML. Selector memilih elemen, property menentukan aspek visual, dan value menentukan nilainya." } },
      { topic: "CSS Basics",        title: "Video Tutorial CSS",         type: "VIDEO",        order: 2, content: { url: "https://example.com/css-tutorial", duration_minutes: 15 } },
      { topic: "Box Model",         title: "Memahami Box Model",         type: "ARTICLE",      order: 1, content: { body: "Setiap elemen HTML adalah sebuah box. Box model terdiri dari content, padding, border, dan margin. Memahami box model penting untuk layout." } },
      { topic: "Flexbox",           title: "Flexbox Layout",             type: "ARTICLE",      order: 1, content: { body: "Flexbox menyediakan cara efisien untuk mengatur layout, alignment, dan distribusi ruang antar item dalam container." } },
      { topic: "Variables & Data Types", title: "Variabel JavaScript",   type: "ARTICLE",      order: 1, content: { body: "JavaScript memiliki tiga cara mendeklarasikan variabel: var, let, dan const. Let dan const diperkenalkan di ES6 dengan block scope." } },
      { topic: "Variables & Data Types", title: "Contoh Deklarasi Variabel", type: "CODE_EXAMPLE", order: 2, content: { language: "javascript", code: "const name = 'Xora';\nlet count = 0;\ncount += 1;\nconsole.log(name, count);" } },
      { topic: "Functions",         title: "Fungsi JavaScript",          type: "ARTICLE",      order: 1, content: { body: "Fungsi adalah blok kode yang dapat digunakan kembali. Dapat menerima parameter dan mengembalikan nilai." } },
      { topic: "Arrays & Objects",  title: "Array dan Objek",            type: "ARTICLE",      order: 1, content: { body: "Array menyimpan kumpulan data berurutan. Objek menyimpan data dalam pasangan key-value." } },
      { topic: "DOM Manipulation",  title: "Manipulasi DOM",             type: "ARTICLE",      order: 1, content: { body: "DOM (Document Object Model) memungkinkan JavaScript mengakses dan mengubah konten, struktur, dan style halaman web." } },
      { topic: "Async JavaScript",  title: "Asynchronous JavaScript",    type: "ARTICLE",      order: 1, content: { body: "JavaScript bersifat single-threaded tetapi mendukung operasi asynchronous melalui callback, promises, dan async/await." } },
      { topic: "Promises",          title: "Promise dan Async/Await",    type: "ARTICLE",      order: 1, content: { body: "Promise merepresentasikan nilai yang mungkin tersedia di masa depan. Async/await adalah syntax sugar untuk bekerja dengan Promise." } },
      { topic: "Promises",          title: "Contoh Kode Promise",        type: "CODE_EXAMPLE", order: 2, content: { language: "javascript", code: "async function fetchData() {\n  try {\n    const response = await fetch('/api/data');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error('Error:', error);\n  }\n}" } },
      { topic: "React Fundamentals",title: "Pengenalan React",           type: "ARTICLE",      order: 1, content: { body: "React adalah library JavaScript untuk membangun user interface. Menggunakan pendekatan component-based dan virtual DOM." } },
      { topic: "Components",        title: "Komponen React",             type: "ARTICLE",      order: 1, content: { body: "Komponen adalah blok bangunan utama aplikasi React. Functional component adalah cara modern membuat komponen." } },
      { topic: "Props & State",     title: "Props dan State",            type: "ARTICLE",      order: 1, content: { body: "Props adalah data yang dikirim dari parent ke child component. State adalah data internal yang dapat berubah di dalam component." } },
      { topic: "Props & State",     title: "Contoh useState",            type: "CODE_EXAMPLE", order: 2, content: { language: "jsx", code: "import { useState } from 'react';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;\n}" } },
      { topic: "Routing",           title: "React Router",               type: "ARTICLE",      order: 1, content: { body: "React Router memungkinkan navigasi antar halaman di aplikasi single-page tanpa full page reload." } },
    ];

    for (const m of materialDefs) {
      await upsertRow(
        client, "materials",
        ["topic_id", "title", "type", "content", "order_index", "status"],
        [topics[m.topic].id, m.title, m.type, JSON.stringify(m.content), m.order, "PUBLISHED"],
        "(topic_id, order_index)", "topic_id", topics[m.topic].id
      );
    }

    // ══════════════════════════════════════════════════════════
    // 12. ASSESSMENTS & QUESTIONS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Assessments & Questions");

    // Topic-level assessment: HTML Basics
    const assessHtmlBasics = await findOrInsert(
      client, "assessments",
      ["subject_id", "level_id", "topic_id", "type", "title", "duration_minutes", "passing_score"],
      [subject.id, levels["HTML & Web Fundamentals"].id, topics["HTML Basics"].id, "TOPIC", "Quiz: HTML Basics", 15, 70.00],
      "title = $1", ["Quiz: HTML Basics"]
    );

    const questionsHtmlBasics = [
      {
        type: "MULTIPLE_CHOICE", order: 1, points: 10,
        text: "Apa kepanjangan HTML?",
        answer: { correct: "B", options: ["Hyper Transfer Markup Language", "HyperText Markup Language", "High Text Markup Language", "Home Tool Markup Language"] }
      },
      {
        type: "MULTIPLE_CHOICE", order: 2, points: 10,
        text: "Tag HTML mana yang digunakan untuk membuat paragraf?",
        answer: { correct: "C", options: ["<br>", "<h1>", "<p>", "<div>"] }
      },
      {
        type: "CODE", order: 3, points: 20,
        text: "Tulis struktur dasar dokumen HTML5 dengan judul 'Hello World'.",
        answer: { expected: "<!DOCTYPE html><html><head><title>Hello World</title></head><body></body></html>", criteria: ["DOCTYPE", "<html>", "<head>", "<title>", "<body>"] }
      },
    ];

    const savedQuestionsHtml = [];
    for (const q of questionsHtmlBasics) {
      const saved = await upsertRow(
        client, "questions",
        ["assessment_id", "type", "question_text", "correct_answer", "points", "order_index"],
        [assessHtmlBasics.id, q.type, q.text, JSON.stringify(q.answer), q.points, q.order],
        "(assessment_id, order_index)", "assessment_id", assessHtmlBasics.id
      );
      savedQuestionsHtml.push(saved);
    }

    // Level Final assessment
    const assessLevelFinal = await findOrInsert(
      client, "assessments",
      ["subject_id", "level_id", "type", "title", "duration_minutes", "passing_score"],
      [subject.id, levels["HTML & Web Fundamentals"].id, "LEVEL_FINAL", "Level Final: HTML & Web Fundamentals", 30, 75.00],
      "title = $1", ["Level Final: HTML & Web Fundamentals"]
    );

    const questionsLevelFinal = [
      {
        type: "MULTIPLE_CHOICE", order: 1, points: 10,
        text: "Elemen semantik mana yang digunakan untuk konten utama halaman?",
        answer: { correct: "B", options: ["<div>", "<main>", "<section>", "<article>"] }
      },
      {
        type: "ESSAY", order: 2, points: 20,
        text: "Jelaskan perbedaan antara elemen <div> dan elemen semantik HTML5.",
        answer: { criteria: ["semantic meaning", "accessibility", "SEO", "structure"] }
      },
    ];

    for (const q of questionsLevelFinal) {
      await upsertRow(
        client, "questions",
        ["assessment_id", "type", "question_text", "correct_answer", "points", "order_index"],
        [assessLevelFinal.id, q.type, q.text, JSON.stringify(q.answer), q.points, q.order],
        "(assessment_id, order_index)", "assessment_id", assessLevelFinal.id
      );
    }

    // Practice assessment: JavaScript
    const assessJsPractice = await findOrInsert(
      client, "assessments",
      ["subject_id", "level_id", "topic_id", "type", "title", "duration_minutes", "passing_score"],
      [subject.id, levels["JavaScript Fundamentals"].id, topics["Variables & Data Types"].id, "PRACTICE", "Practice: JavaScript Variables", 10, 60.00],
      "title = $1", ["Practice: JavaScript Variables"]
    );

    const questionsJsPractice = [
      {
        type: "MULTIPLE_CHOICE", order: 1, points: 10,
        text: "Keyword mana yang membuat variabel yang TIDAK bisa di-reassign?",
        answer: { correct: "C", options: ["var", "let", "const", "function"] }
      },
      {
        type: "CODE", order: 2, points: 15,
        text: "Tulis deklarasi variabel menggunakan const untuk menyimpan nama 'Xora' dan let untuk menyimpan angka 42.",
        answer: { expected: "const name = 'Xora';\nlet number = 42;", criteria: ["const", "let", "string", "number"] }
      },
    ];

    for (const q of questionsJsPractice) {
      await upsertRow(
        client, "questions",
        ["assessment_id", "type", "question_text", "correct_answer", "points", "order_index"],
        [assessJsPractice.id, q.type, q.text, JSON.stringify(q.answer), q.points, q.order],
        "(assessment_id, order_index)", "assessment_id", assessJsPractice.id
      );
    }

    // ══════════════════════════════════════════════════════════
    // 13. LEARNING PATH
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Learning Path");
    const learningPath = await findOrInsert(
      client, "learning_paths",
      ["learner_id", "subject_id", "initial_level_id", "current_level_id", "status"],
      [learnerUser.id, subject.id, levels["HTML & Web Fundamentals"].id, levels["HTML & Web Fundamentals"].id, "ACTIVE"],
      "learner_id = $1 AND subject_id = $2", [learnerUser.id, subject.id]
    );

    // ══════════════════════════════════════════════════════════
    // 14. LEARNER CONCEPT STATES
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Learner Concept States");
    const conceptStates = [
      { concept: "HTML Element",      mastery: 90.00, confidence: 85.00, count: 5, gap: "MASTERED" },
      { concept: "HTML Attribute",    mastery: 85.00, confidence: 80.00, count: 4, gap: "MASTERED" },
      { concept: "Document Structure",mastery: 75.00, confidence: 70.00, count: 3, gap: "NO_GAP" },
      { concept: "CSS Selector",      mastery: 60.00, confidence: 55.00, count: 3, gap: "NO_GAP" },
      { concept: "CSS Property",      mastery: 45.00, confidence: 40.00, count: 2, gap: "POSSIBLE_GAP" },
      { concept: "Variable Declaration",mastery: 30.00,confidence: 25.00, count: 1, gap: "INSUFFICIENT_EVIDENCE" },
      { concept: "Function Declaration",mastery: 0.00, confidence: 0.00,  count: 0, gap: "INSUFFICIENT_EVIDENCE" },
    ];

    for (const cs of conceptStates) {
      await upsertRow(
        client, "learner_concept_states",
        ["learner_id", "concept_id", "mastery_score", "evidence_confidence", "evidence_count", "gap_status", "last_assessed_at"],
        [learnerUser.id, concepts[cs.concept].id, cs.mastery, cs.confidence, cs.count, cs.gap, new Date()],
        "(learner_id, concept_id)", "learner_id", learnerUser.id
      );
    }

    // ══════════════════════════════════════════════════════════
    // 15. ATTEMPT & EVIDENCE
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Attempt & Evidence");
    const attempt = await findOrInsert(
      client, "attempts",
      ["learner_id", "assessment_id", "status", "completed_at", "score"],
      [learnerUser.id, assessHtmlBasics.id, "COMPLETED", new Date(), 80.00],
      "learner_id = $1 AND assessment_id = $2", [learnerUser.id, assessHtmlBasics.id]
    );

    // Evidence for each HTML Basics question
    if (savedQuestionsHtml.length >= 3) {
      const evidenceData = [
        { question: savedQuestionsHtml[0], concept: "HTML Element",      answer: { selected: "B" }, correct: true,  score: 10.00, time: 30 },
        { question: savedQuestionsHtml[1], concept: "HTML Attribute",    answer: { selected: "C" }, correct: true,  score: 10.00, time: 25 },
        { question: savedQuestionsHtml[2], concept: "Document Structure",answer: { code: "<!DOCTYPE html><html><head><title>Hello World</title></head><body></body></html>" }, correct: true, score: 18.00, time: 120 },
      ];

      for (const ev of evidenceData) {
        await findOrInsert(
          client, "evidence",
          ["attempt_id", "question_id", "concept_id", "answer", "is_correct", "score", "response_time_seconds"],
          [attempt.id, ev.question.id, concepts[ev.concept].id, JSON.stringify(ev.answer), ev.correct, ev.score, ev.time],
          "attempt_id = $1 AND question_id = $2", [attempt.id, ev.question.id]
        );
      }
    }

    // ══════════════════════════════════════════════════════════
    // 16. DIAGNOSTIC
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Diagnostics");
    const diagnostic = await findOrInsert(
      client, "diagnostics",
      ["learner_id", "concept_id", "candidate_root_cause_id", "diagnostic_status"],
      [learnerUser.id, concepts["CSS Property"].id, concepts["CSS Selector"].id, "HYPOTHESIS"],
      "learner_id = $1 AND concept_id = $2", [learnerUser.id, concepts["CSS Property"].id]
    );

    // ══════════════════════════════════════════════════════════
    // 17. LEARNING ACTIONS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Learning Actions");
    const actionDefs = [
      { concept: "Variable Declaration", type: "COLLECT_MORE_EVIDENCE", reason: "Mastery score rendah dan evidence count baru 1", priority: 1, status: "RECOMMENDED" },
      { concept: "CSS Property",         type: "RUN_DIAGNOSTIC",       reason: "Possible gap terdeteksi pada CSS Property",         priority: 2, status: "IN_PROGRESS", diagnosticId: diagnostic.id },
      { concept: "Function Declaration", type: "COLLECT_MORE_EVIDENCE", reason: "Belum ada evidence untuk konsep ini",               priority: 3, status: "RECOMMENDED" },
      { concept: "HTML Element",         type: "ADVANCE",              reason: "Mastery tinggi, siap lanjut ke konsep berikutnya",   priority: 4, status: "COMPLETED" },
      { concept: "CSS Selector",         type: "TARGETED_PRACTICE",    reason: "Perlu latihan tambahan untuk selector CSS",          priority: 5, status: "RECOMMENDED" },
    ];

    for (const a of actionDefs) {
      await findOrInsert(
        client, "learning_actions",
        ["learner_id", "concept_id", "diagnostic_id", "action_type", "reason", "priority", "status"],
        [learnerUser.id, concepts[a.concept].id, a.diagnosticId || null, a.type, a.reason, a.priority, a.status],
        "learner_id = $1 AND concept_id = $2 AND action_type = $3", [learnerUser.id, concepts[a.concept].id, a.type]
      );
    }

    // ══════════════════════════════════════════════════════════
    // 18. LEARNING EVENTS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Learning Events");
    const eventDefs = [
      { type: "LOGIN",                entityType: "session",    entityId: learnerUser.id,      meta: { ip: "127.0.0.1" } },
      { type: "ASSESSMENT_STARTED",   entityType: "assessment", entityId: assessHtmlBasics.id, meta: { title: "Quiz: HTML Basics" } },
      { type: "ASSESSMENT_COMPLETED", entityType: "attempt",    entityId: attempt.id,          meta: { score: 80.00 } },
      { type: "MATERIAL_VIEWED",      entityType: "material",   entityId: learnerUser.id,      meta: { title: "Pengenalan HTML" } },
      { type: "DIAGNOSTIC_GENERATED", entityType: "diagnostic", entityId: diagnostic.id,       meta: { concept: "CSS Property" } },
    ];

    for (const ev of eventDefs) {
      await findOrInsert(
        client, "learning_events",
        ["learner_id", "event_type", "entity_type", "entity_id", "metadata"],
        [learnerUser.id, ev.type, ev.entityType, ev.entityId, JSON.stringify(ev.meta)],
        "learner_id = $1 AND event_type = $2 AND entity_id = $3", [learnerUser.id, ev.type, ev.entityId]
      );
    }

    // ══════════════════════════════════════════════════════════
    // 19. AUDIT LOGS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Audit Logs");
    await findOrInsert(
      client, "audit_logs",
      ["actor_id", "actor_type", "action", "entity_type", "entity_id", "new_value"],
      [adminUser.id, "ADMIN", "CREATE", "subject", subject.id, JSON.stringify({ name: "Web Development" })],
      "actor_id = $1 AND action = $2 AND entity_id = $3", [adminUser.id, "CREATE", subject.id]
    );
    await findOrInsert(
      client, "audit_logs",
      ["actor_id", "actor_type", "action", "entity_type", "entity_id", "new_value"],
      [adminUser.id, "ADMIN", "PUBLISH", "subject", subject.id, JSON.stringify({ status: "PUBLISHED" })],
      "actor_id = $1 AND action = $2 AND entity_id = $3", [adminUser.id, "PUBLISH", subject.id]
    );

    // ══════════════════════════════════════════════════════════
    // 20. ANALYTICS
    // ══════════════════════════════════════════════════════════
    console.log("  ➜ Analytics");

    // Learner analytics
    await findOrInsert(
      client, "learner_analytics",
      ["learner_id", "total_assessments", "completed_assessments", "average_mastery", "mastered_concept_count", "active_gap_count", "completed_actions", "learning_time_minutes"],
      [learnerUser.id, 3, 1, 55.00, 2, 1, 1, 45],
      "learner_id = $1", [learnerUser.id]
    );

    // Concept analytics
    const conceptAnalyticsDefs = [
      { concept: "HTML Element",      attempts: 5, errors: 0, mastery: 90.00, gaps: 0, diagnostics: 0 },
      { concept: "CSS Property",      attempts: 2, errors: 1, mastery: 45.00, gaps: 1, diagnostics: 1 },
      { concept: "Variable Declaration", attempts: 1, errors: 0, mastery: 30.00, gaps: 0, diagnostics: 0 },
    ];

    for (const ca of conceptAnalyticsDefs) {
      await findOrInsert(
        client, "concept_analytics",
        ["concept_id", "attempt_count", "error_count", "average_mastery", "gap_count", "diagnostic_count"],
        [concepts[ca.concept].id, ca.attempts, ca.errors, ca.mastery, ca.gaps, ca.diagnostics],
        "concept_id = $1", [concepts[ca.concept].id]
      );
    }

    // Learning path analytics
    await findOrInsert(
      client, "learning_path_analytics",
      ["learning_path_id", "completed_topics", "total_topics", "completed_levels", "total_levels", "progress_percentage"],
      [learningPath.id, 2, 19, 0, 5, 10.53],
      "learning_path_id = $1", [learningPath.id]
    );

    // ══════════════════════════════════════════════════════════
    // COMMIT
    // ══════════════════════════════════════════════════════════
    await client.query("COMMIT");
    console.log("\n✅ Seed completed successfully!");

    // Print summary
    const summary = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM roles) as roles,
        (SELECT COUNT(*) FROM user_roles) as user_roles,
        (SELECT COUNT(*) FROM subjects) as subjects,
        (SELECT COUNT(*) FROM levels) as levels,
        (SELECT COUNT(*) FROM topics) as topics,
        (SELECT COUNT(*) FROM concepts) as concepts,
        (SELECT COUNT(*) FROM topic_concepts) as topic_concepts,
        (SELECT COUNT(*) FROM concept_prerequisites) as concept_prerequisites,
        (SELECT COUNT(*) FROM materials) as materials,
        (SELECT COUNT(*) FROM assessments) as assessments,
        (SELECT COUNT(*) FROM questions) as questions,
        (SELECT COUNT(*) FROM learning_paths) as learning_paths,
        (SELECT COUNT(*) FROM learner_concept_states) as learner_concept_states,
        (SELECT COUNT(*) FROM attempts) as attempts,
        (SELECT COUNT(*) FROM evidence) as evidence,
        (SELECT COUNT(*) FROM diagnostics) as diagnostics,
        (SELECT COUNT(*) FROM learning_actions) as learning_actions,
        (SELECT COUNT(*) FROM learning_events) as learning_events,
        (SELECT COUNT(*) FROM audit_logs) as audit_logs,
        (SELECT COUNT(*) FROM learner_analytics) as learner_analytics,
        (SELECT COUNT(*) FROM concept_analytics) as concept_analytics,
        (SELECT COUNT(*) FROM learning_path_analytics) as learning_path_analytics
    `);
    console.log("\n📊 Row counts:");
    const counts = summary.rows[0];
    for (const [table, count] of Object.entries(counts)) {
      console.log(`   ${table}: ${count}`);
    }

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("\n❌ Seed FAILED — ROLLBACK performed");
    console.error("Error:", error.message);
    if (error.detail) console.error("Detail:", error.detail);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
