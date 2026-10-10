// ============================================================
// XORA — Admin: Kelola Level (form + daftar)
// frontend/src/pages/AdminLevelsPage.jsx
// ============================================================
// Satu level selalu milik satu subject. Form di halaman ini dipakai untuk
// create & edit sekaligus (mode edit mengisi ulang field yang sama).
// Memakai kelas legacy admin (card, admin-table, btn-*, alert, form-*)
// supaya tampilan konsisten dengan AdminAssessmentsPage.
// Data dari adminCatalogApi sudah camelCase (lihat services/api.js).
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { adminCatalogApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminNav from "../components/ui/AdminNav";

const DIFFICULTY_LABELS = {
  EASY: "Mudah",
  MEDIUM: "Sedang",
  HARD: "Sulit",
};

const STATUS_LABELS = {
  PUBLISHED: "Terbit",
  DRAFT: "Draf",
  ARCHIVED: "Arsip",
};

const EMPTY_FORM = {
  subjectId: "",
  name: "",
  difficulty: "EASY",
  description: "",
  orderIndex: "",
};

function difficultyBadgeClass(difficulty) {
  return `badge badge-difficulty badge-${String(difficulty || "MEDIUM").toLowerCase()}`;
}

function statusBadgeClass(status) {
  switch (status) {
    case "PUBLISHED":
      return "badge badge-topic";
    case "ARCHIVED":
      return "badge badge-difficulty badge-hard";
    default:
      return "badge badge-role";
  }
}

export default function AdminLevelsPage() {
  const { token } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [notice, setNotice] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async ({ silent = false } = {}) => {
    if (!silent) setIsLoading(true);
    setError(null);
    try {
      const [subjectRes, levelRes] = await Promise.all([
        adminCatalogApi.subjects.list(token),
        adminCatalogApi.levels.list(token),
      ]);
      setSubjects(Array.isArray(subjectRes?.data) ? subjectRes.data : []);
      setLevels(Array.isArray(levelRes?.data) ? levelRes.data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar level.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const subjectOptions = useMemo(() => {
    const base = subjects.map((s) => ({ id: s.id, name: s.name }));
    if (form.subjectId && !base.some((s) => s.id === form.subjectId)) {
      const current = levels.find((l) => l.id === editingId);
      base.push({
        id: form.subjectId,
        name: current?.subjectName || "(subject tidak diketahui)",
      });
    }
    return base;
  }, [subjects, levels, form.subjectId, editingId]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setFormErrors({});
    setEditingId(null);
    setNotice(null);
  };

  const handleChange = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setFormErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
    setNotice(null);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setForm({
      subjectId: item.subjectId || "",
      name: item.name || "",
      difficulty: item.difficulty || "EASY",
      description: item.description || "",
      orderIndex: item.orderIndex == null ? "" : String(item.orderIndex),
    });
    setFormErrors({});
    setNotice(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    if (!form.subjectId) errors.subjectId = "Subject wajib dipilih.";
    if (!form.name.trim()) errors.name = "Nama wajib diisi.";
    if (!form.difficulty) errors.difficulty = "Kesulitan wajib dipilih.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setNotice({ type: "error", text: "Periksa kembali isian yang wajib diisi." });
      return;
    }

    const description = form.description.trim();
    const payload = {
      subjectId: form.subjectId,
      name: form.name.trim(),
      difficulty: form.difficulty,
      description: description === "" ? null : description,
    };
    if (form.orderIndex !== "") {
      payload.orderIndex = Number(form.orderIndex);
    }

    setIsSaving(true);
    setNotice(null);
    try {
      if (editingId) {
        await adminCatalogApi.levels.update(editingId, payload, token);
        resetForm();
        setNotice({ type: "success", text: "Level berhasil diperbarui." });
      } else {
        await adminCatalogApi.levels.create(payload, token);
        resetForm();
        setNotice({ type: "success", text: "Level berhasil ditambahkan." });
      }
      await loadData({ silent: true });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Gagal menyimpan level." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Hapus level "${item.name}"?\n\nLevel yang masih dipakai topik atau asesmen tidak bisa dihapus.`
    );
    if (!confirmed) return;

    setError(null);
    try {
      await adminCatalogApi.levels.remove(item.id, token);
      setLevels((prev) => prev.filter((level) => level.id !== item.id));
      if (editingId === item.id) resetForm();
    } catch (err) {
      setError(err.message || "Gagal menghapus level.");
    }
  };

  return (
    <div className="assessment-container">
      <AdminNav />

      {/* Header */}
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <h1 className="assessment-title">Kelola Level</h1>
            <p className="assessment-subtitle">
              Tambah, ubah, dan hapus level di tiap subject. Urutan level menentukan
              urutan belajar peserta; biarkan urutan kosong agar diisi otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* Loading / error */}
      {isLoading && (
        <div className="card loading-card">
          <p>Memuat daftar level...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && (
        <>
          {/* Form create / edit */}
          <section className="card" aria-labelledby="level-form-heading">
            <h2 id="level-form-heading" className="admin-section-title">
              {editingId ? "Ubah Level" : "Tambah Level"}
            </h2>

            {notice && (
              <div
                className={`alert ${notice.type === "error" ? "alert-error" : "alert-success"}`}
                role={notice.type === "error" ? "alert" : "status"}
              >
                <p>{notice.text}</p>
              </div>
            )}

            <form className="admin-form" onSubmit={handleSubmit} noValidate>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label htmlFor="level-subject">Subject *</label>
                  <select
                    id="level-subject"
                    value={form.subjectId}
                    onChange={(e) => handleChange({ subjectId: e.target.value })}
                    required
                    aria-invalid={formErrors.subjectId ? "true" : undefined}
                    aria-required="true"
                  >
                    <option value="">— Pilih subject —</option>
                    {subjectOptions.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="level-name">Nama *</label>
                  <input
                    id="level-name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleChange({ name: e.target.value })}
                    required
                    aria-invalid={formErrors.name ? "true" : undefined}
                    aria-required="true"
                    placeholder="Contoh: Dasar HTML"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="level-difficulty">Kesulitan *</label>
                  <select
                    id="level-difficulty"
                    value={form.difficulty}
                    onChange={(e) => handleChange({ difficulty: e.target.value })}
                    required
                    aria-invalid={formErrors.difficulty ? "true" : undefined}
                    aria-required="true"
                  >
                    <option value="EASY">Mudah</option>
                    <option value="MEDIUM">Sedang</option>
                    <option value="HARD">Sulit</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="level-order">Urutan (opsional)</label>
                  <input
                    id="level-order"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={form.orderIndex}
                    onChange={(e) => handleChange({ orderIndex: e.target.value })}
                    placeholder="Otomatis bila kosong"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="level-description">Deskripsi (opsional)</label>
                <textarea
                  id="level-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => handleChange({ description: e.target.value })}
                  placeholder="Tulis ringkasan level..."
                />
              </div>

              <div className="admin-form-actions">
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving
                    ? "Menyimpan..."
                    : editingId
                    ? "Simpan Perubahan"
                    : "Simpan"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={resetForm}
                    disabled={isSaving}
                    aria-label="Batalkan pengubahan level"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Daftar level */}
          {levels.length === 0 ? (
            <div className="card empty-card">
              <p>Belum ada level. Gunakan form di atas untuk menambahkannya.</p>
            </div>
          ) : (
            <div className="card admin-table-card">
              <div className="table-scroll">
                <table className="admin-table">
                  <caption className="admin-caption">
                    {levels.length} level terdaftar. Kolom “Aksi” berisi tombol ubah dan hapus.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Nama</th>
                      <th scope="col">Subject</th>
                      <th scope="col">Kesulitan</th>
                      <th scope="col" className="admin-col-num">
                        Urutan
                      </th>
                      <th scope="col">Status</th>
                      <th scope="col" className="admin-col-actions">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {levels.map((item) => (
                      <tr key={item.id}>
                        <th scope="row" className="admin-cell-title">
                          {item.name}
                        </th>
                        <td className="admin-cell-muted">{item.subjectName || "—"}</td>
                        <td>
                          <span className={difficultyBadgeClass(item.difficulty)}>
                            {DIFFICULTY_LABELS[item.difficulty] || item.difficulty}
                          </span>
                        </td>
                        <td className="admin-cell-num">{item.orderIndex ?? "—"}</td>
                        <td>
                          <span className={statusBadgeClass(item.status)}>
                            {STATUS_LABELS[item.status] || item.status}
                          </span>
                        </td>
                        <td className="admin-cell-actions">
                          <div className="btn-group">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => startEdit(item)}
                              aria-label={`Ubah level ${item.name}`}
                            >
                              Ubah
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(item)}
                              aria-label={`Hapus level ${item.name}`}
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
