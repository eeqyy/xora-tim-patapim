// ============================================================
// XORA — Admin: Kelola Asesmen (list + hapus)
// frontend/src/pages/AdminAssessmentsPage.jsx
// ============================================================
// Hanya bisa dibuka lewat AdminRoute (role ADMIN).
// Form pembuatan & pengubahan ada di AdminAssessmentEditorPage
// (/admin/assessments/new dan /admin/assessments/:id) supaya satu sumber
// form yang sama untuk create & edit.
// Layout memakai kelas .assessment-* yang sudah ada di index.css
// supaya tampilan admin konsisten dengan halaman peserta.
// ============================================================

import React, { useEffect, useState } from "react";
import { assessmentsApi, adminAssessmentsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";

const TYPE_LABELS = {
  PRACTICE: "Latihan",
  TOPIC: "Topik",
  LEVEL_FINAL: "Ujian Level",
  MIXED: "Campuran",
  REASSESSMENT: "Remedial",
};

export default function AdminAssessmentsPage() {
  const { navigate } = useRouter();

  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAssessments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await assessmentsApi.getAll();
      setAssessments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar asesmen.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Hapus asesmen "${item.title}" beserta seluruh soalnya?\n\nTindakan ini tidak bisa dibatalkan.`
    );
    if (!confirmed) return;

    setError(null);
    try {
      await adminAssessmentsApi.remove(item.id);
      setAssessments((prev) => prev.filter((a) => a.id !== item.id));
    } catch (err) {
      setError(err.message || "Gagal menghapus asesmen.");
    }
  };

  const typeBadgeClass = (type) => {
    switch (type) {
      case "LEVEL_FINAL":
        return "badge badge-difficulty badge-hard";
      case "TOPIC":
        return "badge badge-topic";
      case "PRACTICE":
        return "badge badge-difficulty badge-medium";
      default:
        return "badge badge-role";
    }
  };

  return (
    <div className="assessment-container">
      {/* Header */}
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <h1 className="assessment-title">Kelola Asesmen</h1>
            <p className="assessment-subtitle">
              Buat asesmen baru, ubah detailnya, dan atur isinya. Perubahan di sini
              langsung dipakai saat peserta mengerjakan asesmen.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/admin/assessments/new")}
          >
            + Buat Asesmen
          </button>
        </div>
      </div>

      {/* Loading / error / kosong */}
      {isLoading && (
        <div className="card loading-card">
          <p>Memuat daftar asesmen...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="alert alert-error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {!isLoading && !error && assessments.length === 0 && (
        <div className="card empty-card">
          <p>Belum ada asesmen. Gunakan tombol “+ Buat Asesmen” untuk memulai.</p>
        </div>
      )}

      {!isLoading && assessments.length > 0 && (
        <div className="card admin-table-card">
          <div className="table-scroll">
            <table className="admin-table">
              <caption className="admin-caption">
                {assessments.length} asesmen terdaftar. Kolom “Aksi” berisi tombol ubah dan hapus.
              </caption>
              <thead>
                <tr>
                  <th scope="col">Judul</th>
                  <th scope="col">Tipe</th>
                  <th scope="col">Subjek</th>
                  <th scope="col">Level / Topik</th>
                  <th scope="col">Soal</th>
                  <th scope="col" className="admin-col-actions">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {assessments.map((item) => (
                  <tr key={item.id}>
                    <th scope="row" className="admin-cell-title">
                      {item.title}
                    </th>
                    <td>
                      <span className={typeBadgeClass(item.type)}>{TYPE_LABELS[item.type] || item.type}</span>
                    </td>
                    <td>{item.subject_name}</td>
                    <td className="admin-cell-muted">
                      {[item.level_name, item.topic_name].filter(Boolean).join(" · ") || "—"}
                    </td>
                    <td className="admin-cell-num">{item.question_count}</td>
                    <td className="admin-cell-actions">
                      <div className="btn-group">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => navigate(`/admin/assessments/${item.id}`)}
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(item)}
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
