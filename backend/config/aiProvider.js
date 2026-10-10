// Default hanya fallback — ketersediaan model :free berubah-ubah.
// Selalu set AI_MODEL eksplisit dari daftar terkini:
// https://openrouter.ai/models?tab=free
const DEFAULT_MODEL = "google/gemma-3-27b-it:free";
const DEFAULT_BASE = "https://openrouter.ai/api/v1";
// Retry hanya untuk kegagalan transien (429, 5xx, jaringan, timeout).
// 4xx lain (400/401/403/404) = error konfigurasi/auth/model → fail fast.
const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [500, 1000]; // sebelum attempt ke-2 dan ke-3

function isTransientHttpStatus(status) {
  return status === 429 || (status >= 500 && status < 600);
}

async function chat(messages, { jsonMode = null } = {}) {
  const apiKey = process.env.AI_API_KEY || "";
  if (!apiKey) {
    const err = new Error("AI provider belum dikonfigurasi (AI_API_KEY kosong)");
    err.statusCode = 503;
    throw err;
  }
  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  const base = process.env.AI_BASE_URL || DEFAULT_BASE;
  // jsonMode: null -> ikuti AI_JSON_MODE (default true). Beberapa model free
  // menolak response_format; set AI_JSON_MODE=false untuk model seperti itu.
  const useJsonMode = jsonMode ?? process.env.AI_JSON_MODE !== "false";
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 60000;

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  // Atribusi OpenRouter (opsional, disarankan)
  if (process.env.AI_REFERRER) headers["HTTP-Referer"] = process.env.AI_REFERRER;
  if (process.env.AI_TITLE) headers["X-Title"] = process.env.AI_TITLE;

  // Satu percobaan: AbortController + timeout segar per attempt.
  const makeAttempt = async (attemptModel) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const payload = {
        model: attemptModel,
        messages,
        ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
      };
      const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        const err = new Error(`AI provider error ${res.status}: ${text}`);
        err.statusCode = 504;
        err.httpStatus = res.status; // untuk keputusan retry
        throw err;
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || "";
      return content;
    } catch (e) {
      if (e.name === "AbortError") {
        const err = new Error("AI provider timeout (504)");
        err.statusCode = 504;
        err.transient = true;
        throw err;
      }
      if (e instanceof TypeError) {
        // fetch network error — transien, boleh retry
        const err = new Error(`AI provider network error: ${e.message}`);
        err.statusCode = 504;
        err.transient = true;
        throw err;
      }
      throw e;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const isTransient = (e) =>
    e.transient === true ||
    isTransientHttpStatus(e.httpStatus);

  // Primary: retry hingga MAX_ATTEMPTS kali, hanya untuk kegagalan transien.
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt - 2]));
    }
    try {
      return await makeAttempt(model);
    } catch (e) {
      lastError = e;
      if (!isTransient(e)) throw e; // 4xx non-transien: fail fast
    }
  }

  // Fallback: satu percobaan terakhir dengan model cadangan
  // (jika diset dan berbeda dari model utama), tanpa retry lagi.
  const fallbackModel = process.env.AI_FALLBACK_MODEL || "";
  if (fallbackModel && fallbackModel !== model) {
    try {
      return await makeAttempt(fallbackModel);
    } catch (e) {
      lastError = e;
    }
  }

  lastError.statusCode = 504;
  throw lastError;
}

module.exports = { chat };
