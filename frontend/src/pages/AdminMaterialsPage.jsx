// ============================================================
// XORA — Admin: Kelola Materi (list + create/edit/delete)
// frontend/src/pages/AdminMaterialsPage.jsx
// ============================================================
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// Materi selalu berada di bawah satu topik; konsep opsional, dan bila
// diisi harus berada pada subjek yang sama dengan topik (divalidasi juga
// di backend). `content` adalah JSONB bebas — admin mengisinya lewat
// textarea JSON yang divalidasi sebelum dikirim.
// Respons adminCatalogApi.materials sudah dinormalisasi ke camelCase:
//   material { id, topicId, topicName, levelId, levelName, subjectId,
//              subjectName, conceptId, conceptName, title, type, content,
//              orderIndex, status, createdAt, updatedAt }
// Layout memakai kelas legacy admin-* yang sudah ada di index.css.
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { adminCatalogApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminNav from "../components/ui/AdminNav";

const EMPTY_FORM = {
  topicId: "",
  conceptId: "",
  title: "",
  type: "ARTICLE",
  orderIndex: "",
  status: "DRAFT",
  content: "",
};

const TYPE_OPTIONS = [
  { value: "ARTICLE", label: "Artikel" },
  { value: "VIDEO", label: "Video" },
  { value: "CODE_EXAMPLE", label: "Contoh Kode" },
  { value: "REFERENCE", label: "Referensi" },
];

const TYPE_LABELS = TYPE_OPTIONS.reduce((acc, opt) => {
  acc[opt.value] = opt.label;
  return acc;
}, {});

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draf" },
  { value: "PUBLISHED", label: "Terbit" },
  { value: "ARCHIVED", label: "Diarsipkan" },
];

const STATUS_LABELS = {
  PUBLISHED: "Terbit",
  DRAFT: "Draf",
  ARCHIVED: "Diarsipkan",
};

// Placeholder contoh agar admin tahu bentuk JSON per tipe.
const CONTENT_PLACEHOLDER = {
  ARTICLE: '{\n  "body": "Teks penjelasan materi..."\n}',
  VIDEO: '{\n  "url": "https://...",\n  "duration_minutes": 10\n}',
  CODE_EXAMPLE: '{\n  "language": "javascript",\n  "code": "console.log(1)"\n}',
  REFERENCE: '{\n  "url": "https://..."\n}',
};

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

const topicLabel = (topic) =>
  [topic.subjectName, topic.levelName, topic.name].filter(Boolean).join(" · ") ||
  topic.name;

export default function AdminMaterialsPage() {
  const { token } = useAuth();

  const [materials, setMaterials] = useState([]);
  const [topics, setTopics] = useState([]);
  const [concepts, setConcepts] = useState([]);
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
      const [materialsRes, topicsRes, conceptsRes] = await Promise.all([
        adminCatalogApi.materials.list(token),
        adminCatalogApi.topics.list(token),
        adminCatalogApi.concepts.list(token),
      ]);
      setMaterials(Array.isArray(materialsRes?.data) ? materialsRes.data : []);
      setTopics(Array.isArray(topicsRes?.data) ? topicsRes.data : []);
      setConcepts(Array.isArray(conceptsRes?.data) ? conceptsRes.data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar materi.");
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

  const selectedTopic = useMemo(
    () => topics.find((t) => String(t.id) === String(form.topicId)) || null,
    [topics, form.topicId]
  );

  // Konsep hanya boleh berasal dari subjek yang sama dengan topik terpilih.
  const conceptOptions = useMemo(() => {
    if (!selectedTopic) return [];
    return concepts.filter(
      (c) => String(c.subjectId) === String(selectedTopic.subjectId)
    );
  }, [concepts, selectedTopic]);

  const handleTopicChange = (value) => {
    setForm((prev) => {
      const next = { ...prev, topicId: value };
      const topic = topics.find((t) => String(t.id) === String(value));
      const conceptStillValid =
        prev.conceptId &&
        topic &&
        concepts.some(
          (c) =>
            String(c.id) === String(prev.conceptId) &&
            String(c.subjectId) === String(topic.subjectId)
        );
      if (!conceptStillValid) next.conceptId = "";
      return next;
    });
    setFormError(null);
  };

  const handleEdit = (material) => {
    setEditingId(material.id);
    setForm({
      topicId: material.topicId == null ? "" : String(material.topicId),
      conceptId: material.conceptId == null ? "" : String(material.conceptId),
      title: material.title || "",
      type: material.type || "ARTICLE",
      orderIndex:
        material.orderIndex == null ? "" : String(material.orderIndex),
      status: material.status || "DRAFT",
      content:
        material.content == null
          ? ""
          : JSON.stringify(material.content, null, 2),
    });
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.topicId) {
      setFormError("Topik wajib dipilih.");
      return;
    }
    if (!form.title.trim()) {
      setFormError("Judul materi wajib diisi.");
      return;
    }

    let content;
    try {
      content = JSON.parse(form.content);
    } catch (err) {
      setFormError("Content harus berupa JSON yang valid.");
      return;
    }
    if (content === null || typeof content !== "object") {
      setFormError("Content harus berupa objek atau array JSON.");
      return;
    }

    const payload = {
      topicId: form.topicId,
      conceptId: form.conceptId === "" ? null : form.conceptId,
      title: form.title.trim(),
      type: form.type,
      content,
      orderIndex: form.orderIndex === "" ? null : Number(form.orderIndex),
      status: form.status,
    };

    setIsSaving(true);
    setFormError(null);
    try {
      if (editingId) {
        await adminCatalogApi.materials.update(editingId, payload, token);
      } else {
        await adminCatalogApi.materials.create(payload, token);
      }
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan materi.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (material) => {
    const confirmed = window.confirm(
      `Hapus materi "${material.title}"?\n\nTindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    setError(null);
    try {
      await adminCatalogApi.materials.remove(material.id, token);
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
      if (editingId === material.id) resetForm();
    } catch (err) {
      setError(err.message || "Gagal menghapus materi.");
    }
  };

  const editingMaterial = editingId
    ? materials.find((m) => m.id === editingId)
    : null;
  const currentTopicMissing =
    Boolean(form.topicId) &&
    !topics.some((t) => String(t.id) === String(form.topicId));
  const missingTopicLabel = editingMaterial
    ? [editingMaterial.subjectName, editingMaterial.levelName, editingMaterial.topicName]
        .filter(Boolean)
        .join(" · ") || "Topik saat ini"
    : "Topik saat ini";

  return (
    <div className="assessment-container">
      <AdminNav />

      {/* Header */}
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <h1 className="assessment-title">Kelola Materi</h1>
            <p className="assessment-subtitle">
              Buat, ubah, dan hapus materi pembelajaran. Setiap materi berada di
              bawah satu topik dan opsional dikaitkan ke satu konsep.
            </p>
          </div>
        </div>
      </div>

      {/* Formulir tambah / ubah */}
      <section className="card" aria-labelledby="material-form-heading">
        <h2 id="material-form-heading" className="admin-section-title">
          {editingId ? "Ubah Materi" : "Tambah Materi"}
        </h2>

        {formError && (
          <div className="alert alert-error" role="alert">
            <p>{formError}</p>
          </div>
        )}

        <form className="admin-form" onSubmit={handleSubmit} noValidate>
          <div className="admin-form-grid">
            <div className="form-group">
              <label htmlFor="material-topic">Topik *</label>
              <select
                id="material-topic"
                value={form.topicId}
                onChange={(e) => handleTopicChange(e.target.value)}
                required
              >
                <option value="">— Pilih topik —</option>
                {currentTopicMissing && (
                  <option value={form.topicId} disabled>
                    {missingTopicLabel}
                  </option>
                )}
                {topics.map((topic) => (
                  <option key={topic.id} value={String(topic.id)}>
                    {topicLabel(topic)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="material-concept">Konsep (opsional)</label>
              <select
                id="material-concept"
                value={form.conceptId}
                onChange={(e) => updateField("conceptId", e.target.value)}
                disabled={!selectedTopic}
              >
                <option value="">— Tanpa konsep —</option>
                {conceptOptions.map((concept) => (
                  <option key={concept.id} value={String(concept.id)}>
                    {concept.name}
                  </option>
                ))}
              </select>
              <span className="field-hint">
                Hanya konsep pada subjek yang sama dengan topik terpilih.
              </span>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="form-group">
              <label htmlFor="material-title">Judul *</label>
              <input
                id="material-title"
                type="text"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
                placeholder="Contoh: Pengenalan HTML"
              />
            </div>

            <div className="form-group">
              <label htmlFor="material-type">Tipe</label>
              <select
                id="material-type"
                value={form.type}
                onChange={(e) => updateField("type", e.target.value)}
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-form-grid">
            <div className="form-group">
              <label htmlFor="material-order">Urutan</label>
              <input
                id="material-order"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={form.orderIndex}
                onChange={(e) => updateField("orderIndex", e.target.value)}
                placeholder="Kosongkan untuk otomatis"
              />
            </div>

            <div className="form-group">
              <label htmlFor="material-status">Status</label>
              <select
                id="material-status"
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
            <label htmlFor="material-content">Content (JSON) *</label>
            <textarea
              id="material-content"
              rows={8}
              spellCheck={false}
              value={form.content}
              onChange={(e) => updateField("content", e.target.value)}
              placeholder={CONTENT_PLACEHOLDER[form.type] || CONTENT_PLACEHOLDER.ARTICLE}
              style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
            />
            <span className="field-hint">
              Isi objek JSON sesuai tipe materi, mis. {" "}
              <code>{CONTENT_PLACEHOLDER[form.type]?.replace(/\n\s*/g, " ")}</code>
            </span>
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
          <p>Memuat daftar materi...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && materials.length === 0 && (
        <div className="card empty-card">
          <p>Belum ada materi. Gunakan formulir di atas untuk menambahkan.</p>
        </div>
      )}

      {!isLoading && materials.length > 0 && (
        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <caption className="admin-caption">
                {materials.length} materi terdaftar. Kolom “Aksi” berisi tombol ubah dan hapus.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Judul</th>
                  <th scope="col">Topik</th>
                  <th scope="col">Konsep</th>
                  <th scope="col">Tipe</th>
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
                {materials.map((material) => (
                  <tr key={material.id}>
                    <th scope="row" className="admin-cell-title">
                      {material.title}
                    </th>
                    <td className="admin-cell-muted">{material.topicName || "—"}</td>
                    <td className="admin-cell-muted">{material.conceptName || "—"}</td>
                    <td>{TYPE_LABELS[material.type] || material.type}</td>
                    <td className="admin-cell-num">
                      {material.orderIndex == null ? "—" : material.orderIndex}
                    </td>
                    <td>
                      <span className={statusBadgeClass(material.status)}>
                        {STATUS_LABELS[material.status] || material.status}
                      </span>
                    </td>
                    <td className="admin-cell-actions">
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleEdit(material)}
                          aria-label={`Ubah materi ${material.title}`}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(material)}
                          aria-label={`Hapus materi ${material.title}`}
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
