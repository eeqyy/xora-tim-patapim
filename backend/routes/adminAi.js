// ============================================================
// XORA — Admin AI Routes (/api/admin/ai)
// backend/routes/adminAi.js
// ============================================================
// Mengelola API key provider AI dari dashboard admin:
//   - Simpan beberapa provider (key terenkripsi), satu aktif.
//   - "Muat Model"  -> daftar model dari provider memakai key tersebut.
//   - "Uji"         -> chat round-trip JSON nyata (validasi model siap Xora).
//
// Hanya role ADMIN. API key mentah TIDAK pernah dikembalikan ke klien.
// ============================================================

const express = require("express");
const router = express.Router();

const aiConfigService = require("../services/aiConfigService");
const aiProvider = require("../config/aiProvider");
const auditService = require("../services/auditService");
const { requireAuth } = require("../middleware/auth");
const { requireAdmin } = require("../middleware/requireAdmin");
const { sendError, badRequest, isValidUuid } = require("../utils/errors");

// Semua endpoint admin butuh login + role ADMIN.
router.use(requireAuth, requireAdmin);

function assertUuid(id, label) {
  if (!isValidUuid(id)) throw badRequest(`${label} tidak valid`);
  return id;
}

function clientIp(req) {
  return req.ip || req.headers["x-forwarded-for"] || null;
}

function boolOrUndefined(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function logAudit(req, action, entityId, newValue, oldValue) {
  return auditService.log({
    actorId: req.user.id,
    actorType: "ADMIN",
    action,
    entityType: "ai_provider",
    entityId,
    oldValue: oldValue || null,
    newValue: newValue || null,
    ipAddress: clientIp(req),
  });
}

// Sama seperti helper di routes/admin.js — jangan pernah log key mentah.
function publicSummary(row) {
  return {
    label: row.label,
    base_url: row.base_url,
    model: row.model,
    json_mode: row.json_mode,
    is_active: row.is_active,
    api_key_last4: row.api_key_last4 || null,
  };
}

// ============================================================
// Status & daftar
// ============================================================

// GET /api/admin/ai — ringkasan: provider aktif, seluruh provider, health
router.get("/", async (req, res) => {
  try {
    const [providers, health] = await Promise.all([
      aiConfigService.list(),
      aiProvider.healthCheck(),
    ]);
    res.json({
      status: "ok",
      data: {
        active: providers.find((p) => p.is_active) || null,
        providers,
        health,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/ai ERROR:", error);
    sendError(res, error);
  }
});

// GET /api/admin/ai/providers — daftar provider tersimpan (masked)
router.get("/providers", async (req, res) => {
  try {
    const data = await aiConfigService.list();
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("GET /api/admin/ai/providers ERROR:", error);
    sendError(res, error);
  }
});

// ============================================================
// CRUD provider
// ============================================================

// POST /api/admin/ai/providers — tambah provider
router.post("/providers", async (req, res) => {
  try {
    const b = req.body || {};
    const created = await aiConfigService.create(
      {
        label: b.label,
        base_url: b.base_url,
        api_key: b.api_key,
        model: b.model,
        json_mode: boolOrUndefined(b.json_mode) ?? true,
        is_active: boolOrUndefined(b.is_active) ?? false,
      },
      req.user.id
    );

    await logAudit(req, "CREATE", created.id, publicSummary(created));
    res.status(201).json({ status: "ok", data: created });
  } catch (error) {
    console.error("POST /api/admin/ai/providers ERROR:", error);
    sendError(res, error);
  }
});

// PUT /api/admin/ai/providers/:id — ubah provider (api_key opsional)
router.put("/providers/:id", async (req, res) => {
  try {
    const id = assertUuid(req.params.id, "ID provider");
    const b = req.body || {};

    const patch = {
      label: b.label,
      base_url: b.base_url,
      model: b.model,
      json_mode: boolOrUndefined(b.json_mode),
      is_active: boolOrUndefined(b.is_active),
    };
    if (b.api_key) patch.api_key = b.api_key;

    const previous = await aiConfigService.getRowById(id);
    const updated = await aiConfigService.update(id, patch, req.user.id);

    await logAudit(
      req,
      "UPDATE",
      id,
      publicSummary(updated),
      previous ? publicSummary(previous) : null
    );
    res.json({ status: "ok", data: updated });
  } catch (error) {
    console.error("PUT /api/admin/ai/providers/:id ERROR:", error);
    sendError(res, error);
  }
});

// DELETE /api/admin/ai/providers/:id — hapus provider
router.delete("/providers/:id", async (req, res) => {
  try {
    const id = assertUuid(req.params.id, "ID provider");
    const removed = await aiConfigService.remove(id);
    await logAudit(req, "DELETE", id, removed);
    res.json({ status: "ok", data: removed });
  } catch (error) {
    console.error("DELETE /api/admin/ai/providers/:id ERROR:", error);
    sendError(res, error);
  }
});

// PATCH /api/admin/ai/providers/:id/activate — jadikan provider aktif
router.patch("/providers/:id/activate", async (req, res) => {
  try {
    const id = assertUuid(req.params.id, "ID provider");
    const active = await aiConfigService.activate(id, req.user.id);
    await logAudit(req, "UPDATE", id, { is_active: true });
    res.json({ status: "ok", data: active });
  } catch (error) {
    console.error("PATCH /api/admin/ai/providers/:id/activate ERROR:", error);
    sendError(res, error);
  }
});

// ============================================================
// Muat model (pakai key yang dikirim, atau key tersimpan)
// ============================================================

// POST /api/admin/ai/models — { api_key, base_url } atau { provider_id }
router.post("/models", async (req, res) => {
  try {
    const b = req.body || {};
    let api_key = b.api_key;
    let base_url = b.base_url;

    if (!api_key && b.provider_id) {
      const creds = await aiConfigService.getResolvedById(
        assertUuid(b.provider_id, "ID provider")
      );
      api_key = creds.api_key;
      base_url = creds.base_url;
    }

    const data = await aiConfigService.fetchModels({ api_key, base_url });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/admin/ai/models ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/admin/ai/providers/:id/models — pakai key tersimpan
router.post("/providers/:id/models", async (req, res) => {
  try {
    const id = assertUuid(req.params.id, "ID provider");
    const creds = await aiConfigService.getResolvedById(id);
    const data = await aiConfigService.fetchModels({
      api_key: creds.api_key,
      base_url: creds.base_url,
    });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/admin/ai/providers/:id/models ERROR:", error);
    sendError(res, error);
  }
});

// ============================================================
// Uji koneksi (chat round-trip JSON nyata)
// ============================================================

// POST /api/admin/ai/test — body transient atau { provider_id }
router.post("/test", async (req, res) => {
  try {
    const b = req.body || {};
    let { api_key, base_url, model } = b;
    let json_mode = boolOrUndefined(b.json_mode);

    if (b.provider_id) {
      const creds = await aiConfigService.getResolvedById(
        assertUuid(b.provider_id, "ID provider")
      );
      api_key = api_key || creds.api_key;
      base_url = base_url || creds.base_url;
      model = model || creds.model;
      if (json_mode === undefined) json_mode = creds.json_mode;
    }

    const data = await aiConfigService.testConnection({
      api_key,
      base_url,
      model,
      json_mode: json_mode ?? true,
    });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/admin/ai/test ERROR:", error);
    sendError(res, error);
  }
});

// POST /api/admin/ai/providers/:id/test — pakai key tersimpan (+ override model)
router.post("/providers/:id/test", async (req, res) => {
  try {
    const id = assertUuid(req.params.id, "ID provider");
    const b = req.body || {};
    const creds = await aiConfigService.getResolvedById(id);
    const data = await aiConfigService.testConnection({
      api_key: creds.api_key,
      base_url: b.base_url || creds.base_url,
      model: b.model || creds.model,
      json_mode: boolOrUndefined(b.json_mode) ?? creds.json_mode,
    });
    res.json({ status: "ok", data });
  } catch (error) {
    console.error("POST /api/admin/ai/providers/:id/test ERROR:", error);
    sendError(res, error);
  }
});

module.exports = router;
