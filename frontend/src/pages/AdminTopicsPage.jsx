// ============================================================
// XORA — Admin: Kelola Topik (list + create/edit/delete)
// frontend/src/pages/AdminTopicsPage.jsx
// ============================================================
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// Topik selalu berada di bawah satu level. Sumber daftar level
// diambil dari GET /api/levels, jadi label pilihan memuat subjek
// ("subjectName · nama level") supaya admin bisa membedakan level
// bernama sama di subjek berbeda.
// Respons adminCatalogApi sudah dinormalisasi ke camelCase:
//   level { id, subjectId, subjectName, name, difficulty, orderIndex, status }
//   topik { id, levelId, levelName, subjectId, subjectName, name,
//           description, orderIndex, status, createdAt, updatedAt }
// Layout memakai kelas legacy admin-* yang sudah ada di index.css
// agar konsisten dengan halaman admin lainnya.
// ============================================================

import React, { useEffect, useState } from "react";
import { adminCatalogApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminNav from "../components/ui/AdminNav";

const EMPTY_FORM = {
  levelId: "",
  name: "",
  description: "",
  orderIndex: "",
};

const STATUS_LABELS = {
  PUBLISHED: "Terbit",
  DRAFT: "Draf",
  ARCHIVED: "Diarsipkan",
};

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

export default function AdminTopicsPage() {
  const { token } = useAuth();

  const [topics, setTopics] = useState([]);
  const [levels, setLevels] = useState([]);
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
      const [topicsRes, levelsRes] = await Promise.all([
        adminCatalogApi.topics.list(token),
        adminCatalogApi.levels.list(token),
      ]);
      setTopics(Array.isArray(topicsRes?.data) ? topicsRes.data : []);
      setLevels(Array.isArray(levelsRes?.data) ? levelsRes.data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar topik.");
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

  const handleEdit = (topic) => {
    setEditingId(topic.id);
    setForm({
      levelId: topic.levelId == null ? "" : String(topic.levelId),
      name: topic.name || "",
      description: topic.description || "",
      orderIndex: topic.orderIndex == null ? "" : String(topic.orderIndex),
    });
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.levelId) {
      setFormError("Level wajib dipilih.");
      return;
    }
    if (!form.name.trim()) {
      setFormError("Nama topik wajib diisi.");
      return;
    }

    const payload = {
      levelId: form.levelId,
      name: form.name.trim(),
      description: form.description.trim() === "" ? null : form.description.trim(),
      orderIndex: form.orderIndex === "" ? null : Number(form.orderIndex),
    };

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await adminCatalogApi.topics.update(editingId, payload, token);
      } else {
        await adminCatalogApi.topics.create(payload, token);
      }
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan topik.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (topic) => {
    const confirmed = window.confirm(
      `Hapus topik "${topic.name}"?\n\nTindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    setError(null);
    try {
      await adminCatalogApi.topics.remove(topic.id, token);
      setTopics((prev) => prev.filter((t) => t.id !== topic.id));
      if (editingId === topic.id) resetForm();
    } catch (err) {
      setError(err.message || "Gagal menghapus topik.");
    }
  };

  const editingTopic = editingId ? topics.find((t) => t.id === editingId) : null;
  const currentLevelMissing =
    Boolean(form.levelId) && !levels.some((l) => String(l.id) === String(form.levelId));
  const missingLevelLabel = editingTopic
    ? [editingTopic.subjectName, editingTopic.levelName].filter(Boolean).join(" · ") ||
      "Level saat ini"
    : "Level saat ini";

  return (
    <div className="assessment-container">
      <AdminNav />

      {/* Header */}
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <h1 className="assessment-title">Kelola Topik</h1>
            <p className="assessment-subtitle">
              Buat, ubah, dan hapus topik. Setiap topik berada di bawah satu level
              dan menjadi wadah konsep serta asesmen.
            </p>
          </div>
        </div>
      </div>

      {/* Formulir tambah / ubah */}
      <section className="card" aria-labelledby="topic-form-heading">
        <h2 id="topic-form-heading" className="admin-section-title">
          {editingId ? "Ubah Topik" : "Tambah Topik"}
        </h2>

        {formError && (
          <div className="alert alert-error" role="alert">
            <p>{formError}</p>
          </div>
        )}

        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <div className="admin-form-grid">
            <div className="form-group">
              <label htmlFor="topic-level">Level *</label>
              <select
                id="topic-level"
                value={form.levelId}
                onChange={(e) => updateField("levelId", e.target.value)}
                required
              >
                <option value="">— Pilih level —</option>
                {currentLevelMissing && (
                  <option value={form.levelId} disabled>
                    {missingLevelLabel}
                  </option>
                )}
                {levels.map((level) => (
                  <option key={level.id} value={String(level.id)}>
                    {[level.subjectName, level.name].filter(Boolean).join(" · ") || level.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="topic-name">Nama *</label>
              <input
                id="topic-name"
                type="text"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                placeholder="Contoh: Dasar HTML"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="topic-description">Deskripsi</label>
            <textarea
              id="topic-description"
              rows={3}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Ringkasan singkat isi topik..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="topic-order">Urutan</label>
            <input
              id="topic-order"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              value={form.orderIndex}
              onChange={(e) => updateField("orderIndex", e.target.value)}
              placeholder="Kosongkan untuk otomatis"
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
          <p>Memuat daftar topik...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && topics.length === 0 && (
        <div className="card empty-card">
          <p>Belum ada topik. Gunakan formulir di atas untuk menambahkan.</p>
        </div>
      )}

      {!isLoading && topics.length > 0 && (
        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <caption className="admin-caption">
                {topics.length} topik terdaftar. Kolom “Aksi” berisi tombol ubah dan hapus.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nama</th>
                  <th scope="col">Subject</th>
                  <th scope="col">Level</th>
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
                {topics.map((topic) => (
                  <tr key={topic.id}>
                    <th scope="row" className="admin-cell-title">
                      {topic.name}
                    </th>
                    <td>{topic.subjectName || "—"}</td>
                    <td className="admin-cell-muted">{topic.levelName || "—"}</td>
                    <td className="admin-cell-num">
                      {topic.orderIndex == null ? "—" : topic.orderIndex}
                    </td>
                    <td>
                      <span className={statusBadgeClass(topic.status)}>
                        {STATUS_LABELS[topic.status] || topic.status}
                      </span>
                    </td>
                    <td className="admin-cell-actions">
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(topic)}
                          aria-label={`Ubah topik ${topic.name}`}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(topic)}
                          aria-label={`Hapus topik ${topic.name}`}
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
