// ============================================================
// XORA — Admin: Kelola Subjek (list + create/edit/delete)
// frontend/src/pages/AdminSubjectsPage.jsx
// ============================================================
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// Respons adminCatalogApi.subjects sudah dinormalisasi ke camelCase:
//   subject { id, name, description, status, createdAt, updatedAt }
// Layout memakai kelas legacy admin-* yang sudah ada di index.css
// agar konsisten dengan halaman admin lainnya.
// ============================================================

import React, { useEffect, useState } from "react";
import { adminCatalogApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminNav from "../components/ui/AdminNav";

const EMPTY_FORM = {
  name: "",
  description: "",
  status: "DRAFT",
};

const STATUS_LABELS = {
  PUBLISHED: "Terbit",
  DRAFT: "Draf",
  ARCHIVED: "Diarsipkan",
};

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draf" },
  { value: "PUBLISHED", label: "Terbit" },
  { value: "ARCHIVED", label: "Diarsipkan" },
];

// PUBLISHED -> badge-topic, DRAFT -> badge-role, ARCHIVED -> badge-hard.
const statusBadgeClass = (status) => {
  switch (status) {
    case "PUBLISHED":
      return "badge badge-topic";
    case "ARCHIVED":
      return "badge badge-difficulty badge-hard";
    case "DRAFT":
      return "badge badge-role";
    default:
      return "badge badge-role";
  }
};

export default function AdminSubjectsPage() {
  const { token } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminCatalogApi.subjects.list(token);
      setSubjects(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar subjek.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setFormError(null);
  };

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  };

  const handleEdit = (subject) => {
    setEditingId(subject.id);
    setForm({
      name: subject.name || "",
      description: subject.description || "",
      status: subject.status || "DRAFT",
    });
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setFormError("Nama subjek wajib diisi.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() === "" ? null : form.description.trim(),
      status: form.status,
    };

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await adminCatalogApi.subjects.update(editingId, payload, token);
      } else {
        await adminCatalogApi.subjects.create(payload, token);
      }
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan subjek.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (subject) => {
    const confirmed = window.confirm(
      `Hapus subjek "${subject.name}"?\n\nSubjek yang masih dipakai tidak dapat dihapus.\nTindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    setError(null);
    try {
      await adminCatalogApi.subjects.remove(subject.id, token);
      setSubjects((prev) => prev.filter((s) => s.id !== subject.id));
      if (editingId === subject.id) resetForm();
    } catch (err) {
      setError(err.message || "Gagal menghapus subjek.");
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
            <h1 className="assessment-title">Kelola Subjek</h1>
            <p className="assessment-subtitle">
              Buat, ubah, dan hapus mata pelajaran (subject). Subjek menjadi akar
              struktur level, topik, konsep, dan asesmen.
            </p>
          </div>
        </div>
      </div>

      {/* Formulir tambah / ubah */}
      <section className="card" aria-labelledby="subject-form-heading">
        <h2 id="subject-form-heading" className="admin-section-title">
          {editingId ? "Ubah Subjek" : "Tambah Subjek"}
        </h2>

        {formError && (
          <div className="alert alert-error" role="alert">
            <p>{formError}</p>
          </div>
        )}

        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <div className="admin-form-grid">
            <div className="form-group">
              <label htmlFor="subject-name">Nama *</label>
              <input
                id="subject-name"
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                placeholder="Contoh: Pemrograman Web"
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject-status">Status</label>
              <select
                id="subject-status"
                value={form.status}
                onChange={(e) => updateField("status", e.target.value)}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="subject-description">Deskripsi</label>
            <textarea
              id="subject-description"
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Ringkasan singkat mata pelajaran..."
            />
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={resetForm}
                disabled={isSaving}
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Loading / error / kosong / tabel */}
      {isLoading && (
        <div className="card loading-card">
          <p>Memuat daftar subjek...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && subjects.length === 0 && (
        <div className="card empty-card">
          <p>Belum ada subjek. Gunakan formulir di atas untuk menambahkan.</p>
        </div>
      )}

      {!isLoading && subjects.length > 0 && (
        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <caption className="admin-caption">
                {subjects.length} subjek terdaftar. Kolom “Aksi” berisi tombol ubah dan hapus.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nama</th>
                  <th scope="col">Deskripsi</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="admin-col-actions">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id}>
                    <th scope="row" className="admin-cell-title">
                      {subject.name}
                    </th>
                    <td className="admin-cell-muted">{subject.description || "—"}</td>
                    <td>
                      <span className={statusBadgeClass(subject.status)}>
                        {STATUS_LABELS[subject.status] || subject.status}
                      </span>
                    </td>
                    <td className="admin-cell-actions">
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(subject)}
                          aria-label={`Ubah subjek ${subject.name}`}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(subject)}
                          aria-label={`Hapus subjek ${subject.name}`}
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
    </div>
  );
}
