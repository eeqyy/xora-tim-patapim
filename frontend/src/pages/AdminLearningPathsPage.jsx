// ============================================================
// XORA — Admin: Learning Path (list + status + current level)
// frontend/src/pages/AdminLearningPathsPage.jsx
// ============================================================
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// Oversight learning path learner: lihat semua path (learner, subjek,
// level awal/current, progress), ubah status, dan pindahkan current
// level (hanya level yang berada pada subjek yang sama — divalidasi juga
// di backend). Path dibuat otomatis saat learner memulai.
// Respons adminLearningPathApi sudah dinormalisasi ke camelCase.
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { adminLearningPathApi, adminCatalogApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import AdminNav from "../components/ui/AdminNav";

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "ACTIVE", label: "Aktif" },
  { value: "PAUSED", label: "Dijeda" },
  { value: "COMPLETED", label: "Selesai" },
];

const EDIT_STATUS_OPTIONS = STATUS_OPTIONS.filter((opt) => opt.value !== "");

const STATUS_LABELS = {
  ACTIVE: "Aktif",
  PAUSED: "Dijeda",
  COMPLETED: "Selesai",
};

const statusBadgeClass = (status) => {
  switch (status) {
    case "ACTIVE":
      return "badge badge-success";
    case "PAUSED":
      return "badge badge-warning";
    case "COMPLETED":
      return "badge badge-topic";
    default:
      return "badge badge-role";
  }
};

const progressLabel = (path) => {
  if (!path.totalLevels) return "—";
  const pct = Math.round(
    ((path.currentLevelOrder || 0) / path.totalLevels) * 100
  );
  return `${pct}% (level ${path.currentLevelOrder || "?"}/${path.totalLevels})`;
};

export default function AdminLearningPathsPage() {
  const { token } = useAuth();

  const [paths, setPaths] = useState([]);
  const [levels, setLevels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [editing, setEditing] = useState(null); // path object
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formLevelId, setFormLevelId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  const loadData = async (keyword = search, statusKey = statusFilter) => {
    setIsLoading(true);
    setError(null);
    try {
      const [pathsRes, levelsRes] = await Promise.all([
        adminLearningPathApi.list(token, {
          search: keyword,
          status: statusKey,
        }),
        adminCatalogApi.levels.list(token),
      ]);
      setPaths(Array.isArray(pathsRes?.data) ? pathsRes.data : []);
      setLevels(Array.isArray(levelsRes?.data) ? levelsRes.data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar learning path.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData("", "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const options = useMemo(() => ({ search, statusFilter }), [search, statusFilter]);

  const handleFilter = (event) => {
    event.preventDefault();
    loadData(options.search, options.statusFilter);
  };

  const editingLevelOptions = useMemo(() => {
    if (!editing) return [];
    return levels
      .filter((l) => String(l.subjectId) === String(editing.subjectId))
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
  }, [levels, editing]);

  const handleEdit = (path) => {
    setEditing(path);
    setFormStatus(path.status || "ACTIVE");
    setFormLevelId(path.currentLevelId == null ? "" : String(path.currentLevelId));
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formLevelId) {
      setFormError("Pilih level saat ini terlebih dahulu.");
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      await adminLearningPathApi.setStatus(editing.id, formStatus, token);
      const updated = await adminLearningPathApi.setCurrentLevel(
        editing.id,
        formLevelId,
        token
      );
      setPaths((prev) =>
        prev.map((p) =>
          p.id === editing.id ? { ...p, ...(updated?.data || {}) } : p
        )
      );
      setEditing(null);
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan learning path.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(null);
    setFormError(null);
  };

  return (
    <div className="assessment-container">
      <AdminNav />

      {/* Header */}
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <h1 className="assessment-title">Kelola Learning Path</h1>
            <p className="assessment-subtitle">
              Pantau seluruh learning path learner, ubah status, dan geser
              level saat ini sebagai tindakan oversight.
            </p>
          </div>
        </div>
      </div>

      {/* Pencarian & filter */}
      <section className="card" aria-labelledby="path-search-heading">
        <h2 id="path-search-heading" className="admin-section-title">
          Filter
        </h2>
        <form className="admin-form admin-form-grid" onSubmit={handleFilter} noValidate>
          <div className="form-group">
            <label htmlFor="path-search">Nama atau email learner</label>
            <input
              id="path-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik untuk mencari..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="path-status-filter">Status</label>
            <select
              id="path-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-form-actions">
            <button type="submit" className="btn btn-primary">
              Terapkan
            </button>
          </div>
        </form>
      </section>

      {/* Formulir ubah status & level */}
      {editing && (
        <section className="card" aria-labelledby="path-edit-heading">
          <h2 id="path-edit-heading" className="admin-section-title">
            Ubah Path — {editing.learnerName}{" "}
            <span className="admin-cell-muted">({editing.subjectName})</span>
          </h2>

          {formError && (
            <div className="alert alert-error" role="alert">
              <p>{formError}</p>
            </div>
          )}

          <form className="admin-form" onSubmit={handleSubmit} noValidate>
            <div className="admin-form-grid">
              <div className="form-group">
                <label htmlFor="path-status">Status</label>
                <select
                  id="path-status"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                >
                  {EDIT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="path-current-level">Level saat ini *</label>
                <select
                  id="path-current-level"
                  value={formLevelId}
                  onChange={(e) => setFormLevelId(e.target.value)}
                  required
                >
                  <option value="">— Pilih level —</option>
                  {editingLevelOptions.map((level) => (
                    <option key={level.id} value={String(level.id)}>
                      {`${level.orderIndex ?? "?"}. ${level.name}`}
                    </option>
                  ))}
                </select>
                <span className="field-hint">
                  Hanya level pada subjek {editing.subjectName} yang tersedia.
                </span>
              </div>
            </div>

            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancel}
                disabled={isSaving}
              >
                Batal
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Loading / error / kosong / tabel */}
      {isLoading && (
        <div className="card loading-card">
          <p>Memuat daftar learning path...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && paths.length === 0 && (
        <div className="card empty-card">
          <p>Tidak ada learning path yang cocok.</p>
        </div>
      )}

      {!isLoading && paths.length > 0 && (
        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <caption className="admin-caption">
                {paths.length} learning path. Gunakan tombol “Ubah” untuk
                mengatur status dan level saat ini.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Learner</th>
                  <th scope="col">Subjek</th>
                  <th scope="col">Level</th>
                  <th scope="col" className="admin-col-num">
                    Progress
                  </th>
                  <th scope="col">Status</th>
                  <th scope="col" className="admin-col-actions">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paths.map((path) => (
                  <tr key={path.id}>
                    <th scope="row" className="admin-cell-title">
                      {path.learnerName}
                      <span className="admin-cell-muted block-sub">({path.learnerEmail})</span>
                    </th>
                    <td>{path.subjectName}</td>
                    <td className="admin-cell-muted">
                      {path.initialLevelName} → {path.currentLevelName}
                    </td>
                    <td className="admin-cell-num">{progressLabel(path)}</td>
                    <td>
                      <span className={statusBadgeClass(path.status)}>
                        {STATUS_LABELS[path.status] || path.status}
                      </span>
                    </td>
                    <td className="admin-cell-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleEdit(path)}
                        aria-label={`Ubah learning path ${path.learnerName}`}
                      >
                        Ubah
                      </button>
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