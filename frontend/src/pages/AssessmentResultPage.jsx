// ============================================================
// XORA — Assessment Result Page
// frontend/src/pages/AssessmentResultPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { assessmentsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";

export default function AssessmentResultPage({ attemptId }) {
  const { navigate } = useRouter();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResult() {
      if (!attemptId) return;
      setIsLoading(true);
      setError(null);
      try {
        const res = await assessmentsApi.getAttempt(attemptId);
        if (!res?.data) {
          throw new Error("Data hasil attempt tidak ditemukan.");
        }
        setResult(res.data);
      } catch (err) {
        setError(err.message || "Gagal memuat hasil asesmen.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchResult();
  }, [attemptId]);

  if (isLoading) {
    return (
      <div className="assessment-container">
        <div className="card loading-card">
          <p>Memuat rekapitulasi hasil asesmen...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="assessment-container">
        <div className="card alert-card alert-error">
          <p>{error || "Hasil asesmen tidak dapat ditampilkan."}</p>
          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/assessments")}
            >
              ← Kembali ke Daftar Asesmen
            </button>
          </div>
        </div>
      </div>
    );
  }

  const scoreNum = Math.round(Number(result.score) || 0);
  const passingScoreNum = Math.round(Number(result.passing_score) || 70);
  const isPassed = result.passed ?? (scoreNum >= passingScoreNum);

  return (
    <div className="assessment-container">
      <div className="card result-card">
        <div className="result-header">
          <div className="result-status-badge">ASESMEN SELESAI</div>
          <h1 className="result-title">{result.assessment_title || "Hasil Asesmen"}</h1>
          <p className="result-subject">
            Mata Pelajaran: <strong>{result.subject_name}</strong>
          </p>
        </div>

        {/* Score Card Display */}
        <div className={`result-score-banner ${isPassed ? "result-pass-bg" : "result-fail-bg"}`}>
          <div className="result-score-circle">
            <span className="result-score-number">{scoreNum}%</span>
            <span className="result-score-label">Skor Akhir</span>
          </div>

          <div className="result-verdict">
            <span className={`badge ${isPassed ? "badge-easy" : "badge-hard"}`} style={{ fontSize: "1rem", padding: "0.4rem 1rem" }}>
              {isPassed ? "LULUS (MEMENUHI KKM)" : "BELUM LULUS KKM"}
            </span>
            <p className="result-verdict-note">
              Standar Kelulusan Minimum (KKM): <strong>{passingScoreNum}%</strong>
            </p>
          </div>
        </div>

        {/* Breakdown Statistics */}
        <div className="result-stats-grid">
          <div className="result-stat-box">
            <span className="stat-label">Total Soal</span>
            <span className="stat-val">{result.total_questions}</span>
          </div>

          <div className="result-stat-box">
            <span className="stat-label">Jawaban Benar</span>
            <span className="stat-val text-success">{result.correct_count}</span>
          </div>

          <div className="result-stat-box">
            <span className="stat-label">Jawaban Salah</span>
            <span className="stat-val text-danger">{result.incorrect_count}</span>
          </div>

          <div className="result-stat-box">
            <span className="stat-label">Status Sesi</span>
            <span className="stat-val stat-completed">COMPLETED</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="result-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate("/assessments")}
          >
            ← Daftar Asesmen
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate("/learning-path")}
          >
            Buka Learning Path →
          </button>
        </div>
      </div>
    </div>
  );
}
