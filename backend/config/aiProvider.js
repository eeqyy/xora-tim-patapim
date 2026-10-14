const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

const aiConfigService = require("../services/aiConfigService");

// Default hanya fallback — ketersediaan model :free berubah-ubah.
const DEFAULT_MODEL = "nvidia/nemotron-3.5-lightning:free";
const DEFAULT_BASE = "https://openrouter.ai/api/v1";

/**
 * Sumber konfigurasi berlapis:
 *   1. Baris aktif di tabel ai_provider_settings (dikelola admin).
 *   2. Fallback ke .env (AI_API_KEY / AI_MODEL / AI_BASE_URL).
 * Selalu mengembalikan objek (walau api_key kosong) supaya pemanggil
 * bisa membedakan "belum dikonfigurasi" (503) dari error lain.
 */
async function resolveConfig() {
  try {
    const dbCfg = await aiConfigService.getActiveResolved();
    if (dbCfg && dbCfg.api_key && dbCfg.model) return dbCfg;
  } catch (e) {
    console.warn("Gagal memuat konfigurasi AI dari database:", e.message);
  }
  return {
    api_key: (process.env.AI_API_KEY || "").trim(),
    base_url: process.env.AI_BASE_URL || DEFAULT_BASE,
    model: process.env.AI_MODEL || DEFAULT_MODEL,
    json_mode: process.env.AI_JSON_MODE !== "false",
    label: "OpenRouter (.env)",
    source: "env",
  };
}

async function chat(messages, { jsonMode = null } = {}) {
  const cfg = await resolveConfig();
  const apiKey = cfg.api_key;
  if (!apiKey) {
    const err = new Error("AI provider belum dikonfigurasi (API key kosong)");
    err.statusCode = 503;
    throw err;
  }
  const model = cfg.model || DEFAULT_MODEL;
  const base = cfg.base_url || DEFAULT_BASE;
  // jsonMode: null -> ikuti preferensi provider aktif. Beberapa model free
  // menolak response_format; admin bisa mematikan "JSON mode" per provider.
  const useJsonMode = jsonMode ?? cfg.json_mode !== false;
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 30000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body = {
      model,
      messages,
    };
    if (useJsonMode) body.response_format = { type: "json_object" };

    const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.api_key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
    return data.choices?.[0]?.message?.content || "";
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
 * Info provider/model yang SEDANG dipakai (untuk ditampilkan di respons AI
 * & dashboard admin). Tidak mengekspos API key.
 */
async function currentInfo() {
  try {
    const dbCfg = await aiConfigService.getActiveResolved();
    if (dbCfg && dbCfg.api_key) {
      return {
        model: dbCfg.model,
        label: dbCfg.label,
        base_url: dbCfg.base_url,
        source: "db",
        json_mode: dbCfg.json_mode !== false,
      };
    }
  } catch (e) {
    console.warn("Gagal membaca info AI dari DB:", e.message);
  }
  return {
    model: process.env.AI_MODEL || DEFAULT_MODEL,
    label: "OpenRouter (.env)",
    base_url: process.env.AI_BASE_URL || DEFAULT_BASE,
    source: "env",
    json_mode: process.env.AI_JSON_MODE !== "false",
  };
}

/**
 * Health check aman: hanya melaporkan metadata dan status tanpa mengekspos secret.
 */
async function healthCheck() {
  let cfg;
  try {
    const dbCfg = await aiConfigService.getActiveResolved();
    if (dbCfg && dbCfg.api_key) {
      cfg = { ...dbCfg, provider: dbCfg.label || "OpenRouter", source: "db" };
    }
  } catch (e) {
    console.warn("Gagal memuat konfigurasi AI dari database:", e.message);
  }
  if (!cfg) {
    cfg = {
      api_key: (process.env.AI_API_KEY || "").trim(),
      base_url: process.env.AI_BASE_URL || DEFAULT_BASE,
      model: process.env.AI_MODEL || DEFAULT_MODEL,
      json_mode: process.env.AI_JSON_MODE !== "false",
      label: "OpenRouter (.env)",
      source: "env",
    };
  }

  const apiKey = (cfg.api_key || "").trim();
  const configured = !!apiKey;
  const provider = cfg.label || "OpenRouter";
  const model = cfg.model || DEFAULT_MODEL;

  if (!configured) {
    return {
      configured: false,
      provider,
      model,
      source: cfg.source || "env",
      json_mode: cfg.json_mode !== false,
      status: "UNCONFIGURED",
      http_status: null,
      duration_ms: 0,
      error_category: "MISSING_API_KEY",
    };
  }

  const base = cfg.base_url || DEFAULT_BASE;
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

    const meta = { provider, model, source: cfg.source || "env", json_mode: cfg.json_mode !== false };

    if (!res.ok) {
      let errCategory = "PROVIDER_ERROR";
      if (res.status === 401 || res.status === 403) errCategory = "AUTHENTICATION_FAILED";
      else if (res.status === 404) errCategory = "MODEL_NOT_FOUND";
      else if (res.status === 429) errCategory = "RATE_LIMITED";
      else if (res.status >= 500) errCategory = "UPSTREAM_SERVER_ERROR";

      return {
        configured: true,
        ...meta,
        status: "ERROR",
        http_status: res.status,
        duration_ms,
        error_category: errCategory,
      };
    }

    return {
      configured: true,
      ...meta,
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
      source: cfg.source || "env",
      json_mode: cfg.json_mode !== false,
      status: "ERROR",
      http_status: null,
      duration_ms,
      error_category,
    };
  }
}

module.exports = { chat, currentInfo, healthCheck, resolveConfig, DEFAULT_MODEL, DEFAULT_BASE };
