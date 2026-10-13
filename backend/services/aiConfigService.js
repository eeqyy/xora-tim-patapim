// ============================================================
// XOLEARN — AI Config Service
// backend/services/aiConfigService.js
// ============================================================
// Menyimpan & membaca konfigurasi provider AI dari tabel
// ai_provider_settings (dikelola lewat /api/admin/ai).
//
// - getActiveResolved() dipakai backend/config/aiProvider.js.
// - API key disimpan terenkripsi (utils/secretBox) dan TIDAK pernah
//   dikembalikan mentah ke klien; yang keluar hanya mask last4.
// - Cache in-memory singkat + invalidateCache() tiap mutasi, supaya
//   tiap request AI tidak perlu query DB.
// ============================================================

const pool = require("../db");
const secretBox = require("../utils/secretBox");
const { notFound, badRequest } = require("../utils/errors");

const DEFAULT_BASE = "https://openrouter.ai/api/v1";
const CACHE_TTL_MS = 15000;

let cache = { value: null, expiresAt: 0 };

function invalidateCache() {
  cache = { value: null, expiresAt: 0 };
}

function normalizeBase(baseUrl) {
  const base = String(baseUrl || DEFAULT_BASE).trim();
  return base.replace(/\/+$/, "") || DEFAULT_BASE;
}

function toMasked(row) {
  const last4 = row.api_key_last4 || "";
  return {
    id: row.id,
    label: row.label,
    base_url: row.base_url,
    model: row.model,
    json_mode: row.json_mode,
    is_active: row.is_active,
    api_key_last4: last4 || null,
    api_key_masked: last4 ? `••••••••${last4}` : "••••••••",
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function list() {
  const res = await pool.query(
    `SELECT * FROM ai_provider_settings ORDER BY is_active DESC, created_at DESC`
  );
  return res.rows.map(toMasked);
}

async function getRowById(id) {
  const res = await pool.query(`SELECT * FROM ai_provider_settings WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

async function getActiveRow() {
  const res = await pool.query(
    `SELECT * FROM ai_provider_settings WHERE is_active = TRUE LIMIT 1`
  );
  return res.rows[0] || null;
}

/**
 * Ambil satu baris + dekripsi API key-nya (dipakai untuk "Muat Model"
 * dan "Uji" pada provider yang sudah tersimpan). Jangan kirim keluar.
 */
async function getResolvedById(id) {
  const row = await getRowById(id);
  if (!row) throw notFound("Provider AI tidak ditemukan");
  const api_key = secretBox.decrypt(row.api_key_ciphertext);
  return {
    id: row.id,
    label: row.label,
    base_url: row.base_url,
    model: row.model,
    json_mode: row.json_mode,
    api_key,
  };
}

/**
 * Konfigurasi aktif siap pakai untuk aiProvider. Bila tak ada baris
 * aktif (atau gagal didekripsi) → null, sehingga aiProvider memakai
 * fallback .env.
 */
async function getActiveResolved() {
  const now = Date.now();
  if (cache.expiresAt > now) return cache.value;

  let value = null;
  const row = await getActiveRow();
  if (row) {
    try {
      const apiKey = secretBox.decrypt(row.api_key_ciphertext);
      if (apiKey) {
        value = {
          id: row.id,
          label: row.label,
          base_url: row.base_url || DEFAULT_BASE,
          model: row.model,
          json_mode: row.json_mode,
          api_key: apiKey,
          source: "db",
        };
      }
    } catch (e) {
      console.warn("Gagal mendekripsi API key AI aktif:", e.message);
    }
  }

  cache = { value, expiresAt: now + CACHE_TTL_MS };
  return value;
}

async function create(
  { label, base_url, api_key, model, json_mode = true, is_active = false },
  actorId
) {
  if (!label || !String(label).trim()) throw badRequest("Label provider wajib diisi");
  if (!api_key || !String(api_key).trim()) throw badRequest("API key wajib diisi");
  if (!model || !String(model).trim()) throw badRequest("Model wajib dipilih");
  if (!secretBox.isConfigured()) {
    throw badRequest(
      "AI_CREDENTIALS_SECRET belum diisi di server — tidak bisa menyimpan API key terenkripsi"
    );
  }

  const key = String(api_key).trim();
  const ciphertext = secretBox.encrypt(key);
  const last4 = key.slice(-4);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (is_active) {
      await client.query(
        `UPDATE ai_provider_settings SET is_active = FALSE, updated_at = NOW() WHERE is_active = TRUE`
      );
    }
    const res = await client.query(
      `INSERT INTO ai_provider_settings
         (label, base_url, api_key_ciphertext, api_key_last4, model, json_mode, is_active, created_by, updated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8)
       RETURNING *`,
      [
        String(label).trim(),
        normalizeBase(base_url),
        ciphertext,
        last4,
        String(model).trim(),
        !!json_mode,
        !!is_active,
        actorId || null,
      ]
    );
    await client.query("COMMIT");
    invalidateCache();
    return toMasked(res.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function update(id, patch, actorId) {
  if (!secretBox.isConfigured() && patch.api_key) {
    throw badRequest(
      "AI_CREDENTIALS_SECRET belum diisi di server — tidak bisa menyimpan API key terenkripsi"
    );
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const cur = await client.query(
      `SELECT * FROM ai_provider_settings WHERE id = $1 FOR UPDATE`,
      [id]
    );
    const row = cur.rows[0];
    if (!row) throw notFound("Provider AI tidak ditemukan");

    const next = {
      label: patch.label !== undefined ? String(patch.label).trim() : row.label,
      base_url: patch.base_url !== undefined ? normalizeBase(patch.base_url) : row.base_url,
      model: patch.model !== undefined ? String(patch.model).trim() : row.model,
      json_mode: patch.json_mode !== undefined ? !!patch.json_mode : row.json_mode,
      is_active: patch.is_active !== undefined ? !!patch.is_active : row.is_active,
      api_key_ciphertext: row.api_key_ciphertext,
      api_key_last4: row.api_key_last4,
    };

    if (patch.api_key) {
      const key = String(patch.api_key).trim();
      next.api_key_ciphertext = secretBox.encrypt(key);
      next.api_key_last4 = key.slice(-4);
    }

    if (next.is_active) {
      await client.query(
        `UPDATE ai_provider_settings SET is_active = FALSE, updated_at = NOW() WHERE is_active = TRUE AND id <> $1`,
        [id]
      );
    }

    const res = await client.query(
      `UPDATE ai_provider_settings
          SET label = $1, base_url = $2, model = $3, json_mode = $4,
              is_active = $5, api_key_ciphertext = $6, api_key_last4 = $7,
              updated_by = $8, updated_at = NOW()
        WHERE id = $9
        RETURNING *`,
      [
        next.label,
        next.base_url,
        next.model,
        next.json_mode,
        next.is_active,
        next.api_key_ciphertext,
        next.api_key_last4,
        actorId || null,
        id,
      ]
    );
    await client.query("COMMIT");
    invalidateCache();
    return toMasked(res.rows[0]);
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

async function remove(id) {
  const res = await pool.query(
    `DELETE FROM ai_provider_settings WHERE id = $1 RETURNING id, label`,
    [id]
  );
  if (!res.rows[0]) throw notFound("Provider AI tidak ditemukan");
  invalidateCache();
  return res.rows[0];
}

async function activate(id) {
  return update(id, { is_active: true });
}

/* ------------------------------------------------------------
   Interaksi langsung ke provider (dipakai UI admin)
   ------------------------------------------------------------ */

async function providerFetch(url, apiKey, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs || 20000);
  try {
    return await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Ambil katalog model dari provider memakai API key tertentu.
 * Dipakai tombol "Muat Model" sebelum key disimpan.
 */
async function fetchModels({ api_key, base_url }) {
  const key = String(api_key || "").trim();
  if (!key) throw badRequest("API key wajib diisi untuk memuat daftar model");
  const url = `${normalizeBase(base_url)}/models`;

  let res;
  try {
    res = await providerFetch(url, key, { method: "GET" });
  } catch (e) {
    const err = new Error(
      e.name === "AbortError"
        ? "Provider timeout saat memuat daftar model"
        : `Gagal menghubungi provider: ${e.message}`
    );
    err.status = 504;
    throw err;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(
      `Provider menolak permintaan model (HTTP ${res.status})${
        text ? `: ${text.slice(0, 200)}` : ""
      }`
    );
    err.status = res.status === 401 || res.status === 403 ? 401 : 504;
    throw err;
  }

  const data = await res.json().catch(() => null);
  const raw = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  const models = raw
    .map((m) => ({
      id: typeof m === "string" ? m : m.id,
      name: (typeof m === "object" && (m.name || m.id)) || m,
      context_length: typeof m === "object" ? m.context_length || null : null,
    }))
    .filter((m) => m.id)
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));

  return { count: models.length, models };
}

function tryParseJson(text) {
  const raw = String(text || "").trim();
  const stripped = raw.startsWith("```")
    ? raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()
    : raw;
  try {
    return JSON.parse(stripped);
  } catch {
    return null;
  }
}

function categorizeHttp(status) {
  if (status === 401 || status === 403) return "AUTHENTICATION_FAILED";
  if (status === 404) return "MODEL_NOT_FOUND";
  if (status === 429) return "RATE_LIMITED";
  if (status >= 500) return "UPSTREAM_SERVER_ERROR";
  if (status >= 400) return "BAD_REQUEST";
  return "PROVIDER_ERROR";
}

/**
 * Uji nyata: kirim prompt mini bergaya Xolearn dan pastikan model
 * mengembalikan JSON valid (bukan sekadar ping). Inilah penentu
 * apakah model cocok untuk diagnosis Xolearn.
 */
async function testConnection({ api_key, base_url, model, json_mode = true }) {
  const key = String(api_key || "").trim();
  if (!key) throw badRequest("API key wajib diisi");
  if (!model || !String(model).trim()) throw badRequest("Model wajib dipilih");

  const url = `${normalizeBase(base_url)}/chat/completions`;
  const body = {
    model: String(model).trim(),
    messages: [
      { role: "system", content: "Balas HANYA dengan JSON valid, tanpa markdown." },
      { role: "user", content: 'Balas JSON ini apa adanya: {"ok": true, "engine": "xora"}' },
    ],
    max_tokens: 80,
    temperature: 0,
  };
  if (json_mode) body.response_format = { type: "json_object" };

  const started = Date.now();
  let res;
  try {
    res = await providerFetch(url, key, { method: "POST", body: JSON.stringify(body) });
  } catch (e) {
    return {
      ok: false,
      status: "ERROR",
      http_status: null,
      duration_ms: Date.now() - started,
      error_category: e.name === "AbortError" ? "TIMEOUT" : "NETWORK_ERROR",
      message: e.message,
    };
  }

  const duration_ms = Date.now() - started;

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return {
      ok: false,
      status: "ERROR",
      http_status: res.status,
      duration_ms,
      error_category: categorizeHttp(res.status),
      message: text ? text.slice(0, 300) : `Provider error ${res.status}`,
    };
  }

  const data = await res.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content || "";
  const parsed = tryParseJson(content);

  return {
    ok: Boolean(parsed),
    status: parsed ? "HEALTHY" : "INVALID_JSON",
    http_status: res.status,
    duration_ms,
    json_mode: !!json_mode,
    sample: content.slice(0, 200),
    message: parsed
      ? "Model merespons JSON valid — siap dipakai Xolearn."
      : "Respons bukan JSON valid. Coba matikan JSON mode atau pilih model lain.",
  };
}

module.exports = {
  DEFAULT_BASE,
  invalidateCache,
  list,
  getRowById,
  getActiveRow,
  getActiveResolved,
  getResolvedById,
  create,
  update,
  remove,
  activate,
  fetchModels,
  testConnection,
};
