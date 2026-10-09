// ============================================================
// XORA — Learning Path Page
// frontend/src/pages/LearningPathPage.jsx
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { subjectsApi, learningPathApi } from "../services/api";
import { useRouter } from "../context/RouterContext";

export default function LearningPathPage() {
  const { navigate } = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [learningPath, setLearningPath] = useState(null);

  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [isLoadingPath, setIsLoadingPath] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch available subjects
  const fetchSubjects = useCallback(async () => {
    setIsLoadingSubjects(true);
    setError(null);
    try {
      const res = await subjectsApi.getAll();
      const list = Array.isArray(res?.data) ? res.data : [];
      setSubjects(list);

      // Auto-select first subject if none selected
      if (list.length > 0) {
        setSelectedSubjectId((prev) => prev || list[0].id);
      }
    } catch (err) {
      setError(err.message || "Gagal memuat daftar mata pelajaran.");
    } finally {
      setIsLoadingSubjects(false);
    }
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  // 2. Fetch learning path when selectedSubjectId changes
  const fetchPath = useCallback(async (subjectId) => {
    if (!subjectId) return;
    setIsLoadingPath(true);
    setError(null);
    try {
      const res = await learningPathApi.getPath(subjectId);
      setLearningPath(res?.data || null);
    } catch (err) {
      setError(err.message || "Gagal memuat struktur alur belajar.");
      setLearningPath(null);
    } finally {
      setIsLoadingPath(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSubjectId) {
      fetchPath(selectedSubjectId);
    }
  }, [selectedSubjectId, fetchPath]);

  const handleSelectSubject = (id) => {
    if (id !== selectedSubjectId) {
      setSelectedSubjectId(id);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case "EASY":
        return <span className="badge badge-difficulty badge-easy">Mudah (Easy)</span>;
      case "MEDIUM":
        return <span className="badge badge-difficulty badge-medium">Menengah (Medium)</span>;
      case "HARD":
        return <span className="badge badge-difficulty badge-hard">Sulit (Hard)</span>;
      default:
        return <span className="badge badge-role">{difficulty}</span>;
    }
  };

  if (isLoadingSubjects) {
    return (
      <div className="learning-path-container">
        <div className="card loading-card">
          <p>Memuat kurikulum alur belajar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-path-container">
      {/* Page Header */}
      <div className="card path-header-card">
        <h1 className="path-page-title">Alur Pembelajaran (Learning Path)</h1>
        <p className="path-page-desc">
          Eksplorasi struktur kurikulum bertingkat dari Level, Topik, hingga Konsep kompetensi.
        </p>

        {/* Subjects Selector */}
        {subjects.length === 0 ? (
          <div className="empty-box" style={{ marginTop: "1rem" }}>
            <p>Belum ada mata pelajaran yang tersedia di database.</p>
          </div>
        ) : (
          <div className="subject-tabs-container">
            <span className="subject-tabs-label">Pilih Mata Pelajaran:</span>
            <div className="subject-tabs">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectSubject(s.id)}
                  className={`btn-subject-tab ${
                    selectedSubjectId === s.id ? "btn-subject-tab-active" : ""
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
          <button
            onClick={() => (selectedSubjectId ? fetchPath(selectedSubjectId) : fetchSubjects())}
            className="btn btn-sm btn-outline"
            style={{ marginTop: "0.5rem" }}
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Path Loading */}
      {isLoadingPath && (
        <div className="card loading-card">
          <p>Memuat detail alur belajar untuk subject terpilih...</p>
        </div>
      )}

      {/* Path Content */}
      {!isLoadingPath && learningPath && (
        <div className="learning-path-content">
          {/* Selected Subject Overview */}
          <div className="card selected-subject-card">
            <div className="subject-meta-row">
              <div>
                <h2 className="selected-subject-title">{learningPath.subject?.name}</h2>
                {learningPath.subject?.description && (
                  <p className="selected-subject-desc">{learningPath.subject.description}</p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                <span className="badge badge-success">
                  {learningPath.subject?.status || "PUBLISHED"}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => navigate("/assessments")}
                >
                  Buka Asesmen →
                </button>
              </div>
            </div>
          </div>

          {/* Levels & Hierarchy */}
          {!learningPath.levels || learningPath.levels.length === 0 ? (
            <div className="card empty-card">
              <p>Belum ada level pembelajaran pada mata pelajaran ini.</p>
            </div>
          ) : (
            <div className="levels-list">
              {learningPath.levels.map((level, lvlIdx) => (
                <div key={level.id} className="card level-card">
                  {/* Level Header */}
                  <div className="level-header">
                    <div className="level-order-pill">Level {level.order_index ?? lvlIdx + 1}</div>
                    <div className="level-title-block">
                      <h3 className="level-name">{level.name}</h3>
                      {level.description && (
                        <p className="level-desc">{level.description}</p>
                      )}
                    </div>
                    <div>{getDifficultyBadge(level.difficulty)}</div>
                  </div>

                  {/* Topics under Level */}
                  <div className="topics-section">
                    <h4 className="topics-heading">Daftar Topik:</h4>

                    {!level.topics || level.topics.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: "0.9rem" }}>
                        Belum ada topik pada level ini.
                      </p>
                    ) : (
                      <div className="topics-grid">
                        {level.topics.map((topic, topIdx) => (
                          <div key={topic.id} className="topic-card">
                            <div className="topic-header">
                              <span className="topic-number">
                                {topIdx + 1}.
                              </span>
                              <div style={{ flex: 1 }}>
                                <h5 className="topic-name">{topic.name}</h5>
                                {topic.description && (
                                  <p className="topic-desc">{topic.description}</p>
                                )}
                              </div>
                            </div>

                            {/* Concepts under Topic */}
                            <div className="concepts-section">
                              <span className="concepts-label">Konsep Kompetensi:</span>
                              {!topic.concepts || topic.concepts.length === 0 ? (
                                <p className="text-muted" style={{ fontSize: "0.825rem" }}>
                                  Belum ada konsep terhubung.
                                </p>
                              ) : (
                                <div className="concepts-tags">
                                  {topic.concepts.map((concept) => {
                                    const locked = concept.is_locked === true;
                                    const prereqTitle =
                                      concept.prerequisites && concept.prerequisites.length > 0
                                        ? "Prasyarat: " +
                                          concept.prerequisites
                                            .map(
                                              (p) =>
                                                `${p.name} — mastery ${p.mastery_score ?? 0}/70 ${
                                                  p.satisfied ? "✓" : "✗"
                                                }`
                                            )
                                            .join("; ")
                                        : concept.description || "";
                                    return (
                                      <span
                                        key={concept.id}
                                        className={`concept-tag${locked ? " concept-tag-locked" : ""}`}
                                        title={prereqTitle}
                                      >
                                        {locked && <span className="concept-lock">🔒</span>}
                                        <span className="concept-dot"></span>
                                        {concept.name}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
