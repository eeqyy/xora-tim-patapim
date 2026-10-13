// ============================================================
// XORA — Admin: AI & Model — Editorial Grid System
// frontend/src/pages/AdminAiSettingsPage.jsx
// ============================================================
// Mengelola API key provider AI yang dipakai fitur diagnosis Xora:
//   - Simpan beberapa provider (key terenkripsi di server), satu aktif.
//   - "Muat Model" menarik katalog model dari provider memakai key itu.
//   - "Uji" melakukan chat round-trip JSON nyata untuk memastikan model
//     benar-benar kompatibel (Xora mewajibkan output JSON).
//
// API key mentah tidak pernah ditampilkan — hanya 4 karakter terakhir.
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// ============================================================

import React, { useEffect, useState } from "react";
import { adminAiApi } from "../services/api";
import {
  PageContainer,
  PageHeader,
  SectionHeader,
  GlassPanel,
  StatusBadge,
  PrimaryButton,
  SecondaryButton,
  OutlineButton,
  LoadingState,
  EmptyState,
  Alert,
  Field,
  Input,
  Select,
  TABLE_CLASS,
  TH_CLASS,
  TD_CLASS,
  HAIRLINE,
  INK,
  MUTED,
  cx,
} from "../components";

const DEFAULT_BASE = "https://openrouter.ai/api/v1";

const HEALTH_LABELS = {
  HEALTHY: "Sehat",
  UNCONFIGURED: "Belum dikonfigurasi",
  ERROR: "Bermasalah",
  INVALID_JSON: "JSON tidak valid",
};

function healthBadge(status) {
  switch (status) {
    case "HEALTHY":
      return { variant: "success", label: HEALTH_LABELS.HEALTHY };
    case "UNCONFIGURED":
      return { variant: "neutral", label: HEALTH_LABELS.UNCONFIGURED };
    default:
      return { variant: "error", label: HEALTH_LABELS[status] || status || "—" };
  }
}

function sourceLabel(source) {
  return source === "db" ? "Dashboard admin" : "Env (.env)";
}

function formatDateTime(value) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("id-ID");
  } catch {
    return String(value);
  }
}

const EMPTY_FORM = {
  id: null,
  label: "OpenRouter",
  base_url: DEFAULT_BASE,
  api_key: "",
  model: "",
  json_mode: true,
  is_active: true,
};

export default function AdminAiSettingsPage() {
  const [status, setStatus] = useState({ active: null, providers: [], health: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const [models, setModels] = useState([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState(null);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const editing = Boolean(form.id);

  const loadStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminAiApi.getStatus();
      setStatus({
        active: res?.data?.active || null,
        providers: Array.isArray(res?.data?.providers) ? res.data.providers : [],
        health: res?.data?.health || null,
      });
    } catch (err) {
      setError(err.message || "Gagal memuat konfigurasi AI.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setTestResult(null);
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setModels([]);
    setModelsError(null);
    setTestResult(null);
  };

  const startEdit = (row) => {
    setForm({
      id: row.id,
      label: row.label || "",
      base_url: row.base_url || DEFAULT_BASE,
      api_key: "",
      model: row.model || "",
      json_mode: row.json_mode !== false,
      is_active: Boolean(row.is_active),
    });
    setModels(row.model ? [{ id: row.model, name: row.model }] : []);
    setModelsError(null);
    setTestResult(null);
    setNotice(null);
    setError(null);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLoadModels = async () => {
    setIsLoadingModels(true);
    setModelsError(null);
    setNotice(null);
    try {
      let res;
      if (form.api_key) {
        res = await adminAiApi.fetchModels({
          api_key: form.api_key,
          base_url: form.base_url,
        });
      } else if (editing) {
        res = await adminAiApi.fetchModelsForProvider(form.id);
      } else {
        throw new Error("Isi API key dulu untuk memuat daftar model.");
      }
      const list = Array.isArray(res?.data?.models) ? res.data.models : [];
      setModels(list);
      if (list.length === 0) {
        setModelsError("Provider tidak mengembalikan model apa pun.");
      }
    } catch (err) {
      setModelsError(err.message || "Gagal memuat daftar model.");
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    setNotice(null);
    try {
      const useStored = editing && !form.api_key;
      const payload = {
        model: form.model,
        json_mode: form.json_mode,
        api_key: form.api_key || undefined,
        base_url: form.base_url,
      };
      const res = useStored
        ? await adminAiApi.testProvider(form.id, {
            model: form.model,
            json_mode: form.json_mode,
          })
        : await adminAiApi.test(payload);
      setTestResult(res?.data || null);
    } catch (err) {
      setTestResult({ ok: false, status: "ERROR", message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      const base = {
        label: form.label,
        base_url: form.base_url,
        model: form.model,
        json_mode: form.json_mode,
        is_active: form.is_active,
      };
      if (editing) {
        const body = { ...base };
        if (form.api_key) body.api_key = form.api_key;
        await adminAiApi.update(form.id, body);
        setNotice(`Provider "${form.label}" diperbarui.`);
      } else {
        await adminAiApi.create({ ...base, api_key: form.api_key });
        setNotice(`Provider "${form.label}" ditambahkan.`);
      }
      resetForm();
      await loadStatus();
    } catch (err) {
      setError(err.message || "Gagal menyimpan provider AI.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleActivate = async (row) => {
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      await adminAiApi.activate(row.id);
      setNotice(`Provider "${row.label}" dijadikan aktif.`);
      await loadStatus();
    } catch (err) {
      setError(err.message || "Gagal mengaktifkan provider.");
    } finally {
      setBusyId(null);
    }
  };

  const handleRowTest = async (row) => {
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      const res = await adminAiApi.testProvider(row.id, {});
      const data = res?.data || {};
      setNotice(
        `${data.ok ? "✅" : "⚠️"} "${row.label}" — ${data.message || data.status}${
          data.duration_ms ? ` (${data.duration_ms} ms)` : ""
        }`
      );
    } catch (err) {
      setError(err.message || "Gagal menguji provider.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (row) => {
    const confirmed = window.confirm(
      `Hapus provider "${row.label}"? API key tersimpan akan ikut dihapus.`
    );
    if (!confirmed) return;
    setBusyId(row.id);
    setError(null);
    setNotice(null);
    try {
      await adminAiApi.remove(row.id);
      setNotice(`Provider "${row.label}" dihapus.`);
      if (form.id === row.id) resetForm();
      await loadStatus();
    } catch (err) {
      setError(err.message || "Gagal menghapus provider.");
    } finally {
      setBusyId(null);
    }
  };

  const health = status.health || {};
  const badge = healthBadge(health.status);
  const providers = status.providers || [];

  return (
    <PageContainer>
      <PageHeader
        badge="ADMIN"
        title="AI & Model"
        description="Simpan API key provider AI dan pilih model untuk mesin diagnosis Xora. API key disimpan terenkripsi dan tidak pernah ditampilkan utuh."
      />

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}

      {isLoading && <LoadingState message="Memuat konfigurasi AI..." />}

      {!isLoading && (
        <>
          {/* ---- 01 Status ---- */}
          <SectionHeader id="ai-status" index="01" title="Status AI" />
          <GlassPanel variant="subtle" className="mt-8 p-5 md:p-6">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
              <div className="flex flex-col gap-1.5">
                <span className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", MUTED)}>
                  Provider
                </span>
                <span className={cx("text-[15px] font-bold", INK)}>
                  {health.provider || "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", MUTED)}>
                  Model
                </span>
                <span className={cx("text-[13px] font-bold break-all", INK)}>
                  {health.model || "—"}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", MUTED)}>
                  Sumber
                </span>
                <span className={cx("text-[13px] font-bold", INK)}>
                  {sourceLabel(health.source)}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <span className={cx("text-[11px] font-semibold uppercase tracking-[0.16em]", MUTED)}>
                  Status
                </span>
                <span>
                  <StatusBadge status={health.status} label={badge.label} variant={badge.variant} dot />
                </span>
              </div>
            </div>
            {health.error_category && health.status !== "HEALTHY" && (
              <p className={cx("mt-4 text-[12px]", MUTED)}>
                Kategori error: <span className="font-semibold">{health.error_category}</span>
              </p>
            )}
            {status.active && (
              <div className="mt-5">
                <SecondaryButton
                  type="button"
                  size="sm"
                  disabled={busyId === status.active.id}
                  onClick={() => handleRowTest(status.active)}
                >
                  Uji Provider Aktif
                </SecondaryButton>
              </div>
            )}
          </GlassPanel>

          {/* ---- 02 Provider tersimpan ---- */}
          <SectionHeader id="ai-providers" index="02" title="API Key Tersimpan" />
          {providers.length === 0 ? (
            <EmptyState
              title="Belum Ada API Key"
              description="Tambahkan API key provider di bawah agar fitur diagnosis AI Xora bisa berjalan."
            />
          ) : (
            <div className={cx("mt-8 overflow-x-auto rounded-3xl border", HAIRLINE)}>
              <table className={TABLE_CLASS}>
                <thead>
                  <tr>
                    <th scope="col" className={TH_CLASS}>Label</th>
                    <th scope="col" className={TH_CLASS}>API Key</th>
                    <th scope="col" className={TH_CLASS}>Model</th>
                    <th scope="col" className={TH_CLASS}>JSON</th>
                    <th scope="col" className={TH_CLASS}>Status</th>
                    <th scope="col" className={TH_CLASS}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((row) => {
                    const busy = busyId === row.id;
                    return (
                      <tr key={row.id}>
                        <th scope="row" className={cx(TD_CLASS, "font-bold")}>
                          <span className="inline-flex flex-wrap items-center gap-2">
                            {row.label}
                            {row.is_active && (
                              <StatusBadge status="ACTIVE" label="Aktif" variant="success" dot />
                            )}
                          </span>
                          <span className={cx("mt-1 block text-[11px]", MUTED)}>
                            {row.base_url}
                          </span>
                        </th>
                        <td className={cx(TD_CLASS, MUTED)}>
                          <code className="text-[12px]">{row.api_key_masked}</code>
                        </td>
                        <td className={cx(TD_CLASS, "break-all")}>{row.model}</td>
                        <td className={cx(TD_CLASS, MUTED)}>{row.json_mode ? "Aktif" : "Nonaktif"}</td>
                        <td className={TD_CLASS}>
                          {row.is_active ? (
                            <StatusBadge status="ACTIVE" label="Aktif" variant="success" dot />
                          ) : (
                            <StatusBadge status="INACTIVE" label="Nonaktif" variant="neutral" />
                          )}
                        </td>
                        <td className={TD_CLASS}>
                          <div className="flex flex-wrap gap-2">
                            {!row.is_active && (
                              <SecondaryButton
                                size="sm"
                                disabled={busy}
                                onClick={() => handleActivate(row)}
                              >
                                Aktifkan
                              </SecondaryButton>
                            )}
                            <SecondaryButton
                              size="sm"
                              disabled={busy}
                              onClick={() => handleRowTest(row)}
                            >
                              Uji
                            </SecondaryButton>
                            <SecondaryButton
                              size="sm"
                              disabled={busy}
                              onClick={() => startEdit(row)}
                            >
                              Ubah
                            </SecondaryButton>
                            <OutlineButton
                              size="sm"
                              disabled={busy}
                              onClick={() => handleDelete(row)}
                            >
                              Hapus
                            </OutlineButton>
                          </div>
                          <span className={cx("mt-2 block text-[10px]", MUTED)}>
                            Diperbarui {formatDateTime(row.updated_at)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ---- 03 Tambah / Ubah ---- */}
          <SectionHeader
            id="ai-form"
            index="03"
            title={editing ? `Ubah Provider — ${form.label}` : "Tambah Provider"}
          />

          <GlassPanel variant="subtle" className="mt-8 p-5 md:p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Label Provider" htmlFor="ai-label" required>
                  <Input
                    id="ai-label"
                    value={form.label}
                    onChange={(e) => updateForm({ label: e.target.value })}
                    placeholder="OpenRouter"
                    required
                  />
                </Field>

                <Field
                  label="Base URL"
                  htmlFor="ai-base"
                  required
                  hint="Endpoint OpenAI-compatible. Default OpenRouter."
                >
                  <Input
                    id="ai-base"
                    value={form.base_url}
                    onChange={(e) => updateForm({ base_url: e.target.value })}
                    placeholder={DEFAULT_BASE}
                    required
                  />
                </Field>
              </div>

              <Field
                label="API Key"
                htmlFor="ai-key"
                required={!editing}
                hint={
                  editing
                    ? `Kosongkan bila tidak ingin mengganti key. Key tersimpan berakhir "${status.providers.find((p) => p.id === form.id)?.api_key_last4 || "????"}".`
                    : "Disimpan terenkripsi (AES-256-GCM) di server."
                }
              >
                <Input
                  id="ai-key"
                  type="password"
                  autoComplete="off"
                  value={form.api_key}
                  onChange={(e) => updateForm({ api_key: e.target.value })}
                  placeholder={editing ? "•••••••• (biarkan kosong)" : "sk-or-..."}
                  required={!editing}
                />
              </Field>

              <div className="flex flex-wrap items-end gap-3">
                <Field label="Model" htmlFor="ai-model" className="min-w-[260px] flex-1" required>
                  {models.length > 0 ? (
                    <Select
                      id="ai-model"
                      value={form.model}
                      onChange={(e) => updateForm({ model: e.target.value })}
                      required
                    >
                      <option value="">— Pilih model —</option>
                      {models.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.id}
                        </option>
                      ))}
                    </Select>
                  ) : (
                    <Input
                      id="ai-model"
                      value={form.model}
                      onChange={(e) => updateForm({ model: e.target.value })}
                      placeholder="Muat model, atau ketik id model manual"
                      required
                    />
                  )}
                </Field>
                <div className="pb-[2px]">
                  <OutlineButton
                    type="button"
                    onClick={handleLoadModels}
                    disabled={isLoadingModels}
                  >
                    {isLoadingModels ? "Memuat..." : "Muat Model"}
                  </OutlineButton>
                </div>
              </div>

              {modelsError && <Alert tone="error">{modelsError}</Alert>}

              <div className="flex flex-col gap-3 border-t pt-5 md:flex-row md:items-center md:justify-between">
                <label className="flex min-h-[44px] items-center gap-3 text-[13px] font-semibold text-ink dark:text-ink-dark">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-brand"
                    checked={form.json_mode}
                    onChange={(e) => updateForm({ json_mode: e.target.checked })}
                  />
                  Gunakan JSON mode (response_format)
                  <span className={cx("text-[12px] font-normal", MUTED)}>
                    matikan bila model menolaknya
                  </span>
                </label>

                <label className="flex min-h-[44px] items-center gap-3 text-[13px] font-semibold text-ink dark:text-ink-dark">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-brand"
                    checked={form.is_active}
                    onChange={(e) => updateForm({ is_active: e.target.checked })}
                  />
                  Jadikan provider aktif
                </label>
              </div>

              {testResult && (
                <Alert tone={testResult.ok ? "success" : "error"}>
                  <div className="flex flex-col gap-1">
                    <strong>
                      {testResult.ok ? "Uji berhasil" : "Uji gagal"} — {testResult.status}
                      {testResult.duration_ms ? ` · ${testResult.duration_ms} ms` : ""}
                    </strong>
                    {testResult.message && <span>{testResult.message}</span>}
                    {testResult.error_category && (
                      <span className="text-[12px]">Kategori: {testResult.error_category}</span>
                    )}
                  </div>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <PrimaryButton type="submit" disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Tambah Provider"}
                </PrimaryButton>
                <OutlineButton type="button" onClick={handleTest} disabled={isTesting || !form.model}>
                  {isTesting ? "Menguji..." : "Uji Model"}
                </OutlineButton>
                {editing && (
                  <SecondaryButton type="button" onClick={resetForm}>
                    Batal
                  </SecondaryButton>
                )}
              </div>
            </form>
          </GlassPanel>
        </>
      )}
    </PageContainer>
  );
}
