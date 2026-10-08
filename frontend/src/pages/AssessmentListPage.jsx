// ============================================================
// XORA — Assessment List Page
// frontend/src/pages/AssessmentListPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { assessmentsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";

export default function AssessmentListPage() {
  const { navigate } = useRouter();
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState("ALL");

  useEffect(() => {
    async function fetchAssessments() {
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
    }

    fetchAssessments();
  }, []);

  const filteredAssessments = assessments.filter((a) => {
    if (typeFilter === "ALL") return true;
    return a.type === typeFilter;
  });

  const getTypeBadge = (type) => {
    switch (type) {
      case "TOPIC":
        return <span className="badge badge-topic">Topik</span>;
      case "LEVEL_FINAL":
        return <span className="badge badge-difficulty badge-hard">Ujian Level</span>;
      case "PRACTICE":
        return <span className="badge badge-difficulty badge-medium">Latihan</span>;
      default:
        return <span className="badge badge-role">{type}</span>;
    }
  };

  return (
    <div className="assessment-container">
      {/* Header Card */}
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">EVIDENCE-BASED ASSESSMENT</div>
        <h1 className="assessment-title">Daftar Asesmen Pembelajaran</h1>
        <p className="assessment-subtitle">
          Uji pemahaman dan kumpulkan bukti capaian belajar Anda. Hasil jawaban Anda
          akan dievaluasi secara objektif untuk memvalidasi pemahaman konsep.
        </p>

        {/* Filter Bar */}
        <div className="assessment-filters">
          <span className="filter-label">Tipe:</span>
          <button
            type="button"
            className={`filter-chip ${typeFilter === "ALL" ? "filter-chip-active" : ""}`}
            onClick={() => setTypeFilter("ALL")}
          >
            Semua ({assessments.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${typeFilter === "TOPIC" ? "filter-chip-active" : ""}`}
            onClick={() => setTypeFilter("TOPIC")}
          >
            Topik
          </button>
          <button
            type="button"
            className={`filter-chip ${typeFilter === "LEVEL_FINAL" ? "filter-chip-active" : ""}`}
            onClick={() => setTypeFilter("LEVEL_FINAL")}
          >
            Ujian Level
          </button>
          <button
            type="button"
            className={`filter-chip ${typeFilter === "PRACTICE" ? "filter-chip-active" : ""}`}
            onClick={() => setTypeFilter("PRACTICE")}
          >
            Latihan
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="card loading-card">
          <p>Memuat daftar asesmen yang tersedia...</p>
        </div>
      )}

      {error && (
        <div className="card alert-card alert-error">
          <p>{error}</p>
        </div>
      )}

      {/* Assessment Grid */}
      {!isLoading && !error && filteredAssessments.length === 0 && (
        <div className="card empty-card">
          <p>Tidak ada asesmen yang tersedia untuk kategori ini.</p>
        </div>
      )}

      {!isLoading && !error && filteredAssessments.length > 0 && (
        <div className="assessment-grid">
          {filteredAssessments.map((item) => (
            <div key={item.id} className="card assessment-card">
              <div className="assessment-card-header">
                {getTypeBadge(item.type)}
                <span className="assessment-subject-name">{item.subject_name}</span>
              </div>

              <h2 className="assessment-card-title">{item.title}</h2>

              <div className="assessment-meta-list">
                {item.level_name && (
                  <div className="meta-item">
                    <span className="meta-label">Level:</span>
                    <span className="meta-val">{item.level_name}</span>
                  </div>
                )}
                {item.topic_name && (
                  <div className="meta-item">
                    <span className="meta-label">Topik:</span>
                    <span className="meta-val">{item.topic_name}</span>
                  </div>
                )}
                <div className="meta-item">
                  <span className="meta-label">Jumlah Soal:</span>
                  <span className="meta-val">{item.question_count} Soal</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Durasi:</span>
                  <span className="meta-val">{item.duration_minutes ? `${item.duration_minutes} Menit` : "Fleksibel"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">KKM / Passing:</span>
                  <span className="meta-val">{item.passing_score ? `${Math.round(item.passing_score)}%` : "70%"}</span>
                </div>
              </div>

              <div className="assessment-card-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => navigate(`/assessments/${item.id}`)}
                >
                  Mulai Asesmen →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
