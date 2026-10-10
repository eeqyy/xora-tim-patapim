// ============================================================
// XORA — Admin: Kelola Konsep (+ prasyarat)
// frontend/src/pages/AdminConceptsPage.jsx
// ============================================================
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// Satu halaman memuat form (create & edit) dan tabel daftar konsep.
// Layout memakai kelas admin legacy yang sudah ada (card, admin-table,
// btn-*, alert-*, loading-card, empty-card, fieldset, dst) supaya tampilan
// konsisten dengan halaman admin lain.
//
// Catatan kontrak API (lihat services/api.js -> adminCatalogApi.concepts):
//   - list() TIDAK memuat daftar id prasyarat; id prasyarat diambil terpisah
//     lewat getPrerequisites(id, token) saat masuk mode ubah.
//   - create() menyimpan prasyarat atomik; update() tidak mengubah subjek,
//     sehingga select subjek dinonaktifkan saat mengubah konsep.
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { adminCatalogApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminNav from "../components/ui/AdminNav";

const EMPTY_FORM = {
  subjectId: "",
  name: "",
  description: "",
  status: "DRAFT",
};

const STATUS_LABELS = {
  DRAFT: "Draf",
  PUBLISHED: "Terbit",
  ARCHIVED: "Diarsipkan",
};

function statusBadgeClass(status) {
  switch (status) {
    case "PUBLISHED":
      return "badge badge-topic";
    case "DRAFT":
      return "badge badge-role";
    case "ARCHIVED":
      return "badge badge-difficulty badge-hard";
    default:
      return "badge badge-role";
  }
}

export default function AdminConceptsPage() {
  const { token } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [concepts, setConcepts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [selectedPrerequisites, setSelectedPrerequisites] = useState([]);
  const [prereqLoading, setPrereqLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subjectRes, conceptRes] = await Promise.all([
        adminCatalogApi.subjects.list(token),
        adminCatalogApi.concepts.list(token),
      ]);
      setSubjects(Array.isArray(subjectRes?.data) ? subjectRes.data : []);
      setConcepts(Array.isArray(conceptRes?.data) ? conceptRes.data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat data konsep.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Kandidat prasyarat: konsep lain pada subjek yang sama, kecuali konsep
  // yang sedang diubah (tidak boleh menjadi prasyarat dirinya sendiri).
  const candidates = useMemo(
    () => concepts.filter((c) => c.subjectId === form.subjectId && c.id !== editingId),
    [concepts, form.subjectId, editingId]
  );

  const clearForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSelectedPrerequisites([]);
    setFormErrors({});
    setPrereqLoading(false);
  };

  const handleCancel = () => {
    clearForm();
    setNotice(null);
  };

  const handleFieldChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    setNotice(null);
  };

  // Mengganti subjek membatalkan pilihan prasyarat lama (milik subjek berbeda).
  const handleSubjectChange = (value) => {
    setForm((prev) => ({ ...prev, subjectId: value }));
    setSelectedPrerequisites([]);
    setFormErrors((prev) => {
      if (!prev.subjectId) return prev;
      const next = { ...prev };
      delete next.subjectId;
      return next;
    });
    setNotice(null);
  };

  const togglePrerequisite = (conceptId) => {
    setSelectedPrerequisites((prev) =>
      prev.includes(conceptId) ? prev.filter((id) => id !== conceptId) : [...prev, conceptId]
    );
  };

  const handleEdit = async (concept) => {
    setEditingId(concept.id);
    setForm({
      subjectId: concept.subjectId || "",
      name: concept.name || "",
      description: concept.description || "",
      status: concept.status || "DRAFT",
    });
    setSelectedPrerequisites([]);
    setFormErrors({});
    setNotice(null);

    setPrereqLoading(true);
    try {
      const res = await adminCatalogApi.concepts.getPrerequisites(concept.id, token);
      const rows = Array.isArray(res?.data) ? res.data : [];
      const ids = rows
        .map((row) => row.prerequisiteId ?? row.prerequisite_concept_id)
        .filter(Boolean);
      setSelectedPrerequisites([...new Set(ids)]);
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Gagal memuat prasyarat konsep." });
    } finally {
      setPrereqLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const errors = {};
    if (!form.subjectId) errors.subjectId = "Subjek wajib dipilih.";
    if (!form.name.trim()) errors.name = "Nama konsep wajib diisi.";
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setNotice({ type: "error", text: "Periksa kembali isian yang ditandai." });
      return;
    }

    setIsSaving(true);
    setNotice(null);
    try {
      if (editingId) {
        await adminCatalogApi.concepts.update(
          editingId,
          {
            name: form.name.trim(),
            description: form.description.trim() || null,
            status: form.status,
          },
          token
        );
        await adminCatalogApi.concepts.setPrerequisites(editingId, selectedPrerequisites, token);
        clearForm();
        await loadData();
        setNotice({ type: "success", text: "Konsep tersimpan." });
      } else {
        await adminCatalogApi.concepts.create(
          {
            subjectId: form.subjectId,
            name: form.name.trim(),
            description: form.description.trim() || null,
            status: form.status,
            prerequisiteIds: selectedPrerequisites,
          },
          token
        );
        clearForm();
        await loadData();
        setNotice({ type: "success", text: "Konsep baru ditambahkan." });
      }
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Gagal menyimpan konsep." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (concept) => {
    const confirmed = window.confirm(
      `Hapus konsep "${concept.name}"?\n\nTindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    setNotice(null);
    try {
      await adminCatalogApi.concepts.remove(concept.id, token);
      if (editingId === concept.id) clearForm();
      setConcepts((prev) => prev.filter((c) => c.id !== concept.id));
      setNotice({ type: "success", text: "Konsep dihapus." });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Gagal menghapus konsep." });
    }
  };

  const isEditing = Boolean(editingId);

  return (
    <div className="assessment-container">
      <AdminNav />

      {/* Header */}
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <h1 className="assessment-title">Kelola Konsep</h1>
            <p className="assessment-subtitle">
              Buat, ubah, dan hapus konsep beserta prasyaratnya. Konsep adalah unit
              penguasaan (mastery) yang dipakai soal dan jalur belajar.
            </p>
          </div>
        </div>
      </div>

      {/* Form create / edit */}
      <section className="card" aria-labelledby="concept-form-heading">
        <div className="admin-title-row">
          <div>
            <h2 id="concept-form-heading" className="admin-section-title">
              {isEditing ? "Ubah Konsep" : "Tambah Konsep"}
            </h2>
            <p className="field-hint">
              {isEditing
                ? "Perbarui nama, deskripsi, status, dan prasyarat konsep ini."
                : "Isi detail konsep, lalu tandai konsep lain sebagai prasyarat bila ada."}
            </p>
          </div>
          {isEditing && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Batal ubah
            </button>
          )}
        </div>

        {notice && (
          <div
            className={`alert ${notice.type === "error" ? "alert-error" : "alert-success"}`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.text}
          </div>
        )}

        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <div className="admin-form-grid">
            <div className="form-group">
              <label htmlFor="concept-subject">Subjek *</label>
              <select
                id="concept-subject"
                value={form.subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                disabled={isEditing}
                aria-invalid={formErrors.subjectId ? "true" : undefined}
                aria-describedby={isEditing ? "concept-subject-hint" : undefined}
              >
                <option value="">— Pilih subjek —</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
              {isEditing && (
                <p id="concept-subject-hint" className="field-hint">
                  Subjek tidak dapat diubah saat mengubah konsep.
                </p>
              )}
              {formErrors.subjectId && (
                <p className="field-error" role="alert">
                  {formErrors.subjectId}
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="concept-name">Nama konsep *</label>
              <input
                id="concept-name"
                type="text"
                value={form.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                aria-invalid={formErrors.name ? "true" : undefined}
                placeholder="Mis. Struktur HTML dasar"
              />
              {formErrors.name && (
                <p className="field-error" role="alert">
                  {formErrors.name}
                </p>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="concept-description">Deskripsi</label>
            <textarea
              id="concept-description"
              rows={3}
              value={form.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Penjelasan singkat tentang konsep ini (opsional)."
            />
          </div>

          <div className="form-group" style={{ maxWidth: "18rem" }}>
            <label htmlFor="concept-status">Status *</label>
            <select
              id="concept-status"
              value={form.status}
              onChange={(e) => handleFieldChange("status", e.target.value)}
            >
              <option value="DRAFT">Draf</option>
              <option value="PUBLISHED">Terbit</option>
              <option value="ARCHIVED">Diarsipkan</option>
            </select>
          </div>

          <fieldset className="admin-fieldset">
            <legend>Prasyarat</legend>
            <p className="field-hint">
              Pilih konsep lain pada subjek yang sama yang harus dikuasai lebih dulu.
            </p>

            {isEditing && prereqLoading ? (
              <p className="field-hint">Memuat prasyarat…</p>
            ) : !form.subjectId ? (
              <p className="field-hint">
                Pilih subjek terlebih dahulu untuk melihat konsep yang tersedia.
              </p>
            ) : candidates.length === 0 ? (
              <p className="field-hint">Tidak ada konsep lain pada subjek ini.</p>
            ) : (
              <div
                style={{
                  maxHeight: "14rem",
                  overflowY: "auto",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  padding: "0.6rem 0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.45rem",
                }}
              >
                {candidates.map((concept) => (
                  <label
                    key={concept.id}
                    style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPrerequisites.includes(concept.id)}
                      onChange={() => togglePrerequisite(concept.id)}
                      aria-label={`Jadikan ${concept.name} sebagai prasyarat`}
                    />
                    <span>{concept.name}</span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : isEditing ? "Simpan perubahan" : "Tambah konsep"}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Reset
            </button>
            <span className="field-hint">
              {selectedPrerequisites.length > 0
                ? `${selectedPrerequisites.length} prasyarat dipilih.`
                : "Tanpa prasyarat."}
            </span>
          </div>
        </form>
      </section>

      {/* Loading / error / kosong */}
      {isLoading && (
        <div className="card loading-card">
          <p>Memuat daftar konsep...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && concepts.length === 0 && (
        <div className="card empty-card">
          <p>Belum ada konsep. Gunakan form di atas untuk menambahkannya.</p>
        </div>
      )}

      {!isLoading && !error && concepts.length > 0 && (
        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <caption className="admin-caption">
                {concepts.length} konsep terdaftar. Kolom “Aksi” berisi tombol ubah dan hapus.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nama</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Status</th>
                  <th scope="col" className="admin-col-actions">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {concepts.map((concept) => (
                  <tr key={concept.id}>
                    <th scope="row" className="admin-cell-title">
                      {concept.name}
                    </th>
                    <td className="admin-cell-muted">{concept.subjectName || "—"}</td>
                    <td>
                      <span className={statusBadgeClass(concept.status)}>
                        {STATUS_LABELS[concept.status] || concept.status}
                      </span>
                    </td>
                    <td className="admin-cell-actions">
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(concept)}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(concept)}
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
