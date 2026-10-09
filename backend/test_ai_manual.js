// Manual test helper untuk AI layer (OpenRouter).
// Pra-syarat: backend berjalan ->  cd backend && node index.js
// Jalankan:    node test_ai_manual.js [BASE_URL]
//
// Alur yang diuji:
//  [1] POST /api/auth/register              -> 201 + token
//  [2] POST /api/ai/analyze tanpa token     -> 401
//  [3] POST /api/ai/analyze token salah     -> 401
//  [4] GET  /api/assessments                -> daftar assessment
//  [5] POST /api/attempts                   -> mulai attempt + daftar soal
//  [6] POST /api/attempts/:id/submit        -> nilai + tulis evidence
//  [7] POST /api/ai/analyze token valid     -> 200 | 502 | 503 | 504
//
// Nonaktif: node test_ai_manual.js http://localhost:5000

const BASE = process.argv[2] || "http://localhost:5000";

async function call(method, path, { token, body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* respons non-JSON */
  }
  return { status: res.status, data };
}

/** Pilihan huruf valid untuk soal MULTIPLE_CHOICE (indeks opsi terakhir). */
function mcLetter(options) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const n = Array.isArray(options) ? options.length : 0;
  return n > 0 ? letters[Math.min(n, letters.length) - 1] : "A";
}

/** Bentuk jawaban per tipe soal (lihat utils/grading.js). */
function buildAnswer(q) {
  switch (q.type) {
    case "MULTIPLE_CHOICE":
      return { selected: mcLetter(q.options) };
    case "CODE":
      return { code: "// jawaban test" };
    case "ESSAY":
      return { text: "jawaban test" };
    default:
      return null; // DRAG_DROP / tipe lain: dilewati (tidak menghasilkan evidence)
  }
}

async function main() {
  console.log(`Base URL: ${BASE}\n`);

  // [1] Register (email unik berbasis waktu agar tidak bentrok)
  const email = `ai-test-${Date.now()}@xora.local`;
  const reg = await call("POST", "/api/auth/register", {
    body: { name: "Test AI", email, password: "Sandi123!" },
  });
  console.log(`[1] register ${email}`);
  console.log(`    -> ${reg.status} ${JSON.stringify(reg.data)}`);
  if (reg.status !== 201 || !reg.data?.data?.token) {
    console.log("\nGAGAL: register tidak menghasilkan token. Berhenti.");
    process.exit(1);
  }
  const token = reg.data.data.token;

  // [2] analyze tanpa token -> 401
  const noAuth = await call("POST", "/api/ai/analyze", {});
  console.log(`\n[2] analyze tanpa token`);
  console.log(`    -> ${noAuth.status} ${JSON.stringify(noAuth.data)}`);

  // [3] analyze token salah -> 401
  const badAuth = await call("POST", "/api/ai/analyze", { token: "garbage" });
  console.log(`\n[3] analyze token salah`);
  console.log(`    -> ${badAuth.status} ${JSON.stringify(badAuth.data)}`);

  // [4] daftar assessment
  const list = await call("GET", "/api/assessments", { token });
  const assessments = Array.isArray(list.data?.data) ? list.data.data : [];
  console.log(`\n[4] GET /api/assessments -> ${list.status}, ${assessments.length} assessment`);
  if (!assessments.length) {
    console.log("    Tidak ada assessment di DB. Jalankan: cd backend && node seed.js");
    console.log("\n--- Interpretasi ---");
    console.log("401 sudah terbukti; analysis tidak bisa dilanjut tanpa assessment.");
    process.exit(0);
  }
  const assessment = assessments[0];
  console.log(`    pakai: "${assessment.title}" (${assessment.type}, ${assessment.question_count} soal)`);

  // [5] mulai attempt
  const start = await call("POST", "/api/attempts", {
    token,
    body: { assessmentId: assessment.id },
  });
  const attemptId = start.data?.data?.attemptId;
  const questions = start.data?.data?.questions || [];
  console.log(`\n[5] POST /api/attempts -> ${start.status}, attemptId=${attemptId}, ${questions.length} soal`);
  if (!attemptId) {
    console.log(`    GAGAL mulai attempt: ${JSON.stringify(start.data)}`);
    process.exit(1);
  }

  // [6] submit jawaban (jawab semua soal yang didukung; sengaja tidak dicari benar)
  const answers = [];
  for (const q of questions) {
    const answer = buildAnswer(q);
    if (answer) answers.push({ questionId: q.id, answer, responseTimeSeconds: 5 });
  }
  if (!answers.length) {
    console.log("    Tidak ada soal MC/CODE/ESSAY — tidak ada evidence yang bisa dibikin.");
    process.exit(0);
  }
  const submit = await call("POST", `/api/attempts/${attemptId}/submit`, {
    token,
    body: { answers },
  });
  const result = submit.data?.data || {};
  console.log(`\n[6] POST /api/attempts/${attemptId}/submit -> ${submit.status}`);
  console.log(
    `    answered=${result.answeredCount} correct=${result.correctCount} mastery=${JSON.stringify(result.mastery)}`
  );

  // [7] analyze dengan evidence asli
  const analyze = await call("POST", "/api/ai/analyze", { token, body: {} });
  console.log(`\n[7] POST /api/ai/analyze -> ${analyze.status}`);
  console.log(JSON.stringify(analyze.data, null, 2));

  console.log("\n--- Interpretasi ---");
  switch (analyze.status) {
    case 200:
      console.log("200 = SUKSES PENUH: diagnosis dari provider sudah tervalidasi.");
      console.log("      Lihat suspected_concept, confidence, reason, reference_evidence_ids.");
      break;
    case 400:
      console.log("400 = masih belum ada evidence (submit gagal atau semua soal dilewati).");
      break;
    case 502:
      console.log("502 = respons AI tidak valid (sering karena model free tidak support JSON mode).");
      console.log("      Set AI_JSON_MODE=false di .env, restart backend, coba lagi.");
      break;
    case 503:
      console.log("503 = AI_API_KEY belum diisi di .env. Isi key OpenRouter, restart backend.");
      break;
    case 504:
      console.log("504 = provider error (key salah / model tidak valid / timeout). Cek AI_API_KEY & AI_MODEL di .env.");
      break;
    default:
      console.log(`Status ${analyze.status} di luar skenario yang diharapkan — cek log backend.`);
  }
}

main().catch((e) => {
  console.error("ERROR:", e.message);
  console.error("Pastikan backend berjalan: cd backend && node index.js");
  process.exit(1);
});
