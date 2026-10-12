const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

// Default hanya fallback — ketersediaan model :free berubah-ubah.
const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning:free";
const DEFAULT_BASE = "https://openrouter.ai/api/v1";

async function chat(messages, { jsonMode = null } = {}) {
  const apiKey = (process.env.AI_API_KEY || "").trim();
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

/**
 * Health check aman: hanya melaporkan metadata dan status tanpa mengekspos secret.
 */
async function healthCheck() {
  const apiKey = (process.env.AI_API_KEY || "").trim();
  const configured = !!apiKey;
  const provider = "OpenRouter";
  const model = process.env.AI_MODEL || DEFAULT_MODEL;

  if (!configured) {
    return {
      configured: false,
      provider,
      model,
      status: "UNCONFIGURED",
      http_status: null,
      duration_ms: 0,
      error_category: "MISSING_API_KEY",
    };
  }

  const base = process.env.AI_BASE_URL || DEFAULT_BASE;
  const timeoutMs = 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const t0 = Date.now();

  try {
    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const duration_ms = Date.now() - t0;

    if (!res.ok) {
      let errCategory = "PROVIDER_ERROR";
      if (res.status === 401 || res.status === 403) errCategory = "AUTHENTICATION_FAILED";
      else if (res.status === 404) errCategory = "MODEL_NOT_FOUND";
      else if (res.status === 429) errCategory = "RATE_LIMITED";
      else if (res.status >= 500) errCategory = "UPSTREAM_SERVER_ERROR";

      return {
        configured: true,
        provider,
        model,
        status: "ERROR",
        http_status: res.status,
        duration_ms,
        error_category: errCategory,
      };
    }

    return {
      configured: true,
      provider,
      model,
      status: "HEALTHY",
      http_status: 200,
      duration_ms,
      error_category: null,
    };
  } catch (e) {
    clearTimeout(timeoutId);
    const duration_ms = Date.now() - t0;
    const error_category = e.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR";
    return {
      configured: true,
      provider,
      model,
      status: "ERROR",
      http_status: null,
      duration_ms,
      error_category,
    };
  }
}

module.exports = { chat, healthCheck };
