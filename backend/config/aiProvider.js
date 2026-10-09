// Default hanya fallback — ketersediaan model :free berubah-ubah.
// Selalu set AI_MODEL eksplisit dari daftar terkini:
// https://openrouter.ai/models?tab=free
const DEFAULT_MODEL = "google/gemma-3-27b-it:free";
const DEFAULT_BASE = "https://openrouter.ai/api/v1";

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload = {
      model,
      messages,
      ...(useJsonMode ? { response_format: { type: "json_object" } } : {}),
    };
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`AI provider error ${res.status}: ${text}`);
      err.statusCode = 504;
      throw err;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";
    return content;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === "AbortError") {
      const err = new Error("AI provider timeout (504)");
      err.statusCode = 504;
      throw err;
    }
    throw e;
  }
}

module.exports = { chat };
