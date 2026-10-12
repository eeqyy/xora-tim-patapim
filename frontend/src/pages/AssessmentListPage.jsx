// ============================================================
// XORA — Assessment Discovery & List Page (Asesmen)
// Premium Light Glassmorphism · Minimal · Reusable
// frontend/src/pages/AssessmentListPage.jsx
// ============================================================

import React, { useEffect, useState, useMemo } from "react";
import { assessmentsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  GlassPanel,
  StatusBadge,
  PrimaryButton,
  OutlineButton,
  Button,
  LoadingState,
  ErrorState,
} from "../components";
import {
  IconArrowRight,
  IconRefresh,
  IconLock,
  IconCompass,
  IconTarget,
} from "../components/Icons";

const CORE_LEVEL_CONFIGS = [
  {
    difficulty: "EASY",
    order: 1,
    levelName: "Tingkat Dasar",
    defaultTitle: "Asesmen Diagnostik Campuran — Tingkat Dasar",
    desc: "Fondasi web: HTML, CSS, dan JavaScript dasar.",
  },
  {
    difficulty: "MEDIUM",
    order: 2,
    levelName: "Tingkat Menengah",
    defaultTitle: "Asesmen Campuran — Tingkat Menengah",
    desc: "Logika pemrograman & interaktivitas web menengah.",
  },
  {
    difficulty: "HARD",
    order: 3,
    levelName: "Tingkat Lanjut",
    defaultTitle: "Asesmen Campuran — Tingkat Lanjut",
    desc: "Arsitektur frontend, state, dan optimasi performa.",
  },
];

export default function AssessmentListPage() {
  const { navigate } = useRouter();
  const [assessments, setAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMaterialFilter, setSelectedMaterialFilter] = useState("ALL");

  const fetchAssessments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await assessmentsApi.getAll();
      setAssessments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      setError(err.message || "Gagal memuat daftar asesmen pembelajaran.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Compute learner's overall progression across levels
  const levelProgression = useMemo(() => {
    const easyAssessments = assessments.filter(
      (a) => (a.difficulty || a.level_difficulty || "EASY").toUpperCase() === "EASY"
    );
    const mediumAssessments = assessments.filter(
      (a) => (a.difficulty || a.level_difficulty || "").toUpperCase() === "MEDIUM"
    );
    const hardAssessments = assessments.filter(
      (a) => (a.difficulty || a.level_difficulty || "").toUpperCase() === "HARD"
    );

    const easyPassed = easyAssessments.some((a) => a.learner_status?.is_passed);
    const mediumPassed = mediumAssessments.some((a) => a.learner_status?.is_passed);
    const hardPassed = hardAssessments.some((a) => a.learner_status?.is_passed);

    return {
      easy: { passed: easyPassed, unlocked: true },
      medium: { passed: mediumPassed, unlocked: easyPassed },
      hard: { passed: hardPassed, unlocked: mediumPassed },
    };
  }, [assessments]);

  // Map canonical core assessments per level
  const coreLevelAssessments = useMemo(() => {
    return CORE_LEVEL_CONFIGS.map((cfg) => {
      const mixedItem = assessments.find(
        (a) =>
          a.type === "MIXED" &&
          (a.difficulty || a.level_difficulty || "EASY").toUpperCase() === cfg.difficulty
      );
      return {
        ...cfg,
        assessment: mixedItem || null,
      };
    });
  }, [assessments]);

  // Recommended remedial assessments: only shown if relevant to learner's gap analysis or active
  const recommendedRemedials = useMemo(() => {
    const practiceItems = assessments.filter(
      (a) => a.type === "PRACTICE" || a.type === "REASSESSMENT"
    );

    const activeOrRecommended = practiceItems.filter(
      (a) =>
        a.learner_status?.is_recommended === true ||
        a.learner_status?.access_status === "IN_PROGRESS" ||
        a.learner_status?.access_status === "NEEDS_PRACTICE"
    );

    // Deduplicate by assessment ID
    const seenIds = new Set();
    const deduped = [];
    for (const item of activeOrRecommended) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        deduped.push(item);
      }
    }
    return deduped;
  }, [assessments]);

  // All topic practice assessments (14 specific topics across HTML, CSS, JavaScript)
  const allTopicPractices = useMemo(() => {
    const list = assessments.filter((a) => a.type === "PRACTICE" || a.type === "REASSESSMENT");
    const seen = new Set();
    const result = [];
    for (const a of list) {
      if (!seen.has(a.id)) {
        seen.add(a.id);
        result.push(a);
      }
    }
    return result;
  }, [assessments]);

  const filteredTopicPractices = useMemo(() => {
    if (selectedMaterialFilter === "ALL") return allTopicPractices;
    return allTopicPractices.filter((a) => {
      const titleUpper = (a.title || "").toUpperCase();
      const topicUpper = (a.topic_name || "").toUpperCase();
      const covered = Array.isArray(a.covered_topics) ? a.covered_topics.join(" ").toUpperCase() : "";
      const filterKey = selectedMaterialFilter.toUpperCase();
      return titleUpper.includes(filterKey) || topicUpper.includes(filterKey) || covered.includes(filterKey);
    });
  }, [allTopicPractices, selectedMaterialFilter]);

  // Standard CTA renderer
  const renderAssessmentCta = (item, isLocked) => {
    if (isLocked) {
      return (
        <Button disabled variant="outline" fullWidth iconLeft={<IconLock size={15} />}>
          Belum Tersedia
        </Button>
      );
    }

    const accessStatus = item.learner_status?.access_status || "AVAILABLE";
    const isPractice = item.type === "PRACTICE" || item.type === "REASSESSMENT";

    if (accessStatus === "IN_PROGRESS") {
      return (
        <PrimaryButton
          fullWidth
          onClick={() => navigate(`/assessments/${item.id}`)}
          iconRight={<IconArrowRight size={16} />}
        >
          {isPractice ? "Lanjutkan Latihan" : "Lanjutkan Asesmen"}
        </PrimaryButton>
      );
    }

    if (accessStatus === "PASSED") {
      if (isPractice) {
        return (
          <PrimaryButton
            fullWidth
            onClick={() => navigate(`/assessments/${item.id}`)}
            iconRight={<IconArrowRight size={16} />}
          >
            Ulangi Latihan
          </PrimaryButton>
        );
      }
      const resultTarget = item.learner_status?.latest_attempt_id
        ? `/assessments/result/${item.learner_status.latest_attempt_id}`
        : `/assessments/${item.id}`;
      return (
        <OutlineButton
          fullWidth
          onClick={() => navigate(resultTarget)}
          iconRight={<IconArrowRight size={16} />}
        >
          Lihat Hasil
        </OutlineButton>
      );
    }

    if (accessStatus === "NEEDS_PRACTICE") {
      return (
        <PrimaryButton
          fullWidth
          onClick={() => navigate(`/assessments/${item.id}`)}
          iconRight={<IconArrowRight size={16} />}
        >
          {isPractice ? "Ulangi Latihan" : "Ulangi Asesmen"}
        </PrimaryButton>
      );
    }

    // Default AVAILABLE
    return (
      <PrimaryButton
        fullWidth
        onClick={() => navigate(`/assessments/${item.id}`)}
        iconRight={<IconArrowRight size={16} />}
      >
        {isPractice ? "Mulai Latihan" : "Mulai Asesmen"}
      </PrimaryButton>
    );
  };

  return (
    <PageContainer maxWidth="normal">
      {/* 1. Header Card */}
      <GlassPanel variant="elevated" className="assessment-header-card">
        <PageHeader
          badge="Evaluasi Pemahaman"
          title="Asesmen"
          description="Evaluasi terstruktur untuk mengukur pemahaman materi web development secara bertahap."
          actions={
            <>
              <OutlineButton
                size="sm"
                onClick={fetchAssessments}
                icon={<IconRefresh size={14} />}
              >
                Segarkan
              </OutlineButton>
              <PrimaryButton
                size="sm"
                onClick={() => navigate("/learning-path")}
                iconRight={<IconCompass size={14} />}
              >
                Jalur Belajar
              </PrimaryButton>
            </>
          }
        />

        {/* 2. Level Progression Track */}
        <div className="level-progression-track" aria-label="Alur Tingkat Pembelajaran">
          {/* Stage 1: Easy */}
          <div
            className={`progression-step-card ${
              levelProgression.easy.passed ? "step-passed" : "step-active"
            }`}
          >
            <div className="step-header">
              <span className="step-number">Tahap 1</span>
              <StatusBadge
                variant={levelProgression.easy.passed ? "success" : "primary"}
                label={levelProgression.easy.passed ? "Sudah Lulus" : "Tersedia"}
                dot={levelProgression.easy.passed}
              />
            </div>
            <h4 className="step-title">Tingkat Dasar</h4>
            <p className="step-desc">Fondasi HTML, CSS, dan JavaScript dasar.</p>
          </div>

          {/* Stage 2: Medium */}
          <div
            className={`progression-step-card ${
              levelProgression.medium.passed
                ? "step-passed"
                : levelProgression.medium.unlocked
                ? "step-active"
                : "step-locked"
            }`}
          >
            <div className="step-header">
              <span className="step-number">Tahap 2</span>
              <StatusBadge
                variant={
                  levelProgression.medium.passed
                    ? "success"
                    : levelProgression.medium.unlocked
                    ? "primary"
                    : "neutral"
                }
                label={
                  levelProgression.medium.passed
                    ? "Sudah Lulus"
                    : levelProgression.medium.unlocked
                    ? "Terbuka"
                    : "Belum Terbuka"
                }
                dot={levelProgression.medium.passed}
              />
            </div>
            <h4 className="step-title">Tingkat Menengah</h4>
            <p className="step-desc">
              Logika pemrograman &amp; interaktivitas. Memerlukan kelulusan Tingkat Dasar.
            </p>
          </div>

          {/* Stage 3: Hard */}
          <div
            className={`progression-step-card ${
              levelProgression.hard.passed
                ? "step-passed"
                : levelProgression.hard.unlocked
                ? "step-active"
                : "step-locked"
            }`}
          >
            <div className="step-header">
              <span className="step-number">Tahap 3</span>
              <StatusBadge
                variant={
                  levelProgression.hard.passed
                    ? "success"
                    : levelProgression.hard.unlocked
                    ? "primary"
                    : "neutral"
                }
                label={
                  levelProgression.hard.passed
                    ? "Sudah Lulus"
                    : levelProgression.hard.unlocked
                    ? "Terbuka"
                    : "Belum Terbuka"
                }
                dot={levelProgression.hard.passed}
              />
            </div>
            <h4 className="step-title">Tingkat Lanjut</h4>
            <p className="step-desc">
              Arsitektur aplikasi &amp; performa. Memerlukan kelulusan Tingkat Menengah.
            </p>
          </div>
        </div>
      </GlassPanel>

      {/* Loading & Error States */}
      {isLoading && (
        <LoadingState message="Memuat instrumen asesmen pembelajaran..." />
      )}

      {error && !isLoading && (
        <ErrorState
          title="Gagal Memuat Asesmen"
          message={error}
          onRetry={fetchAssessments}
        />
      )}

      {/* 3. Core Level Assessments Grid */}
      {!isLoading && !error && (
        <>
          <div className="assessment-section-header">
            <h2 className="assessment-section-title">Asesmen Tingkat Kemahiran</h2>
            <p className="assessment-section-desc">
              Instrumen asesmen inti yang memetakan pemahaman konsep HTML, CSS, dan JavaScript secara bertahap.
            </p>
          </div>

          <div className="assessment-grid">
            {coreLevelAssessments.map((cfg) => {
              const item = cfg.assessment;
              if (!item) return null;

              const isLocked = item.learner_status?.is_locked === true;
              const accessStatus = item.learner_status?.access_status || "AVAILABLE";
              const coveredTopics = Array.isArray(item.covered_topics) && item.covered_topics.length > 0
                ? item.covered_topics
                : ["HTML", "CSS", "JavaScript"];

              return (
                <GlassPanel
                  key={item.id}
                  variant="default"
                  className={`assessment-card ${isLocked ? "assessment-card-locked" : ""}`}
                >
                  {/* Card Header: Difficulty & Access Status */}
                  <div className="assessment-card-header">
                    <StatusBadge status={cfg.difficulty} label={cfg.levelName} />
                    <StatusBadge status={accessStatus} />
                  </div>

                  <h3 className="assessment-card-title">{item.title}</h3>

                  {/* Main Coverage */}
                  <div className="assessment-topics-section">
                    <span className="assessment-topics-label">Cakupan Materi</span>
                    <div className="assessment-topics-list">
                      {coveredTopics.map((top, idx) => (
                        <span key={idx} className="assessment-topic-tag">
                          {top}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Minimal Metadata List */}
                  <div className="assessment-meta-list">
                    <div className="meta-item">
                      <span className="meta-label">Tingkat Kesulitan</span>
                      <span className="meta-val">{cfg.levelName}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Jumlah Soal</span>
                      <span className="meta-val">{item.question_count || 30} Soal</span>
                    </div>
                    {item.learner_status?.best_score !== null && item.learner_status?.best_score !== undefined && (
                      <div className="meta-item">
                        <span className="meta-label">Skor Terbaik</span>
                        <span
                          className="meta-val"
                          style={{
                            color: item.learner_status.is_passed
                              ? "var(--color-success)"
                              : "var(--color-error)",
                          }}
                        >
                          {Math.round(item.learner_status.best_score)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lock Explanation Note */}
                  {isLocked && (
                    <div className="assessment-lock-alert">
                      <IconLock size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
                      <span>
                        {item.learner_status?.lock_reason ||
                          "Asesmen ini belum terbuka. Selesaikan tingkat sebelumnya terlebih dahulu."}
                      </span>
                    </div>
                  )}

                  {/* Single Relevant CTA */}
                  <div className="assessment-card-actions">
                    {renderAssessmentCta(item, isLocked)}
                  </div>
                </GlassPanel>
              );
            })}
          </div>

          {/* 4. Remedial Assessments Section (Only shown if recommended) */}
          {recommendedRemedials.length > 0 && (
            <>
              <div className="assessment-section-header" style={{ marginTop: "2.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <IconTarget size={20} color="var(--color-primary)" />
                  <h2 className="assessment-section-title" style={{ margin: 0 }}>
                    Asesmen Penguatan Terarah
                  </h2>
                </div>
                <p className="assessment-section-desc">
                  Latihan khusus untuk memperkuat pemahaman pada materi yang perlu ditingkatkan berdasarkan hasil evaluasi Anda.
                </p>
              </div>

              <div className="assessment-grid">
                {recommendedRemedials.map((rem) => {
                  const accessStatus = rem.learner_status?.access_status || "AVAILABLE";
                  const coveredTopics = Array.isArray(rem.covered_topics) && rem.covered_topics.length > 0
                    ? rem.covered_topics
                    : ["Materi Penguatan"];

                  return (
                    <GlassPanel
                      key={rem.id}
                      variant="default"
                      className="assessment-card"
                    >
                      <div className="assessment-card-header">
                        <StatusBadge variant="neutral" label="Penguatan" />
                        <StatusBadge status={accessStatus} />
                      </div>

                      <h3 className="assessment-card-title">{rem.title}</h3>

                      {/* Main Coverage */}
                      <div className="assessment-topics-section">
                        <span className="assessment-topics-label">Materi Fokus</span>
                        <div className="assessment-topics-list">
                          {coveredTopics.map((top, idx) => (
                            <span key={idx} className="assessment-topic-tag">
                              {top}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Reason / Context */}
                      {rem.learner_status?.recommendation_reason && (
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-text-muted)",
                            backgroundColor: "var(--color-bg-subtle)",
                            padding: "0.6rem 0.8rem",
                            borderRadius: "var(--radius-sm)",
                            marginBottom: "1rem",
                            border: "1px solid var(--color-border)",
                          }}
                        >
                          {rem.learner_status.recommendation_reason}
                        </div>
                      )}

                      {/* Minimal Metadata List */}
                      <div className="assessment-meta-list">
                        <div className="meta-item">
                          <span className="meta-label">Jumlah Soal</span>
                          <span className="meta-val">{rem.question_count || 20} Soal</span>
                        </div>
                        {rem.learner_status?.best_score !== null && rem.learner_status?.best_score !== undefined && (
                          <div className="meta-item">
                            <span className="meta-label">Skor Terakhir</span>
                            <span
                              className="meta-val"
                              style={{
                                color: rem.learner_status.is_passed
                                  ? "var(--color-success)"
                                  : "var(--color-error)",
                              }}
                            >
                              {Math.round(rem.learner_status.best_score)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Single Relevant CTA */}
                      <div className="assessment-card-actions">
                        {renderAssessmentCta(rem, false)}
                      </div>
                    </GlassPanel>
                  );
                })}
              </div>
            </>
          )}

          {/* 5. Topic Practice Bank (Latihan Per Topik) */}
          <div className="assessment-section-header" style={{ marginTop: "2.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 className="assessment-section-title" style={{ margin: 0 }}>
                  Bank Latihan Per Topik
                </h2>
                <p className="assessment-section-desc">
                  Latihan terarah 20 soal adaptif dengan potongan kode untuk mengasah penguasaan setiap topik spesifik.
                </p>
              </div>

              {/* Material Filter Chips */}
              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                {[
                  { key: "ALL", label: "Semua Topik" },
                  { key: "HTML", label: "HTML" },
                  { key: "CSS", label: "CSS" },
                  { key: "JAVASCRIPT", label: "JavaScript" },
                ].map((chip) => {
                  const isActive = selectedMaterialFilter === chip.key;
                  return (
                    <button
                      key={chip.key}
                      type="button"
                      onClick={() => setSelectedMaterialFilter(chip.key)}
                      style={{
                        padding: "0.4rem 0.85rem",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        borderRadius: "9999px",
                        border: "1px solid",
                        borderColor: isActive ? "var(--color-primary)" : "var(--color-border)",
                        backgroundColor: isActive ? "var(--color-primary)" : "var(--color-surface-solid)",
                        color: isActive ? "#ffffff" : "var(--color-text-main)",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="assessment-grid">
            {filteredTopicPractices.map((practice) => {
              const accessStatus = practice.learner_status?.access_status || "AVAILABLE";
              const difficulty = (practice.difficulty || "MEDIUM").toUpperCase();
              const diffLabel = {
                EASY: "Mudah",
                MEDIUM: "Menengah",
                HARD: "Sulit",
              }[difficulty] || "Menengah";

              const materialName = (practice.title || "").toUpperCase().includes("CSS")
                ? "CSS"
                : (practice.title || "").toUpperCase().includes("JAVASCRIPT")
                ? "JavaScript"
                : "HTML";

              const topicName = practice.topic_name || (Array.isArray(practice.covered_topics) && practice.covered_topics[0]) || practice.title;

              return (
                <GlassPanel
                  key={practice.id}
                  variant="default"
                  className="assessment-card"
                >
                  <div className="assessment-card-header">
                    <StatusBadge variant="primary" label={materialName} />
                    <StatusBadge status={difficulty} label={diffLabel} />
                    <StatusBadge status={accessStatus} />
                  </div>

                  <h3 className="assessment-card-title">{practice.title}</h3>

                  <div className="assessment-topics-section">
                    <span className="assessment-topics-label">Materi &amp; Topik</span>
                    <div className="assessment-topics-list">
                      <span className="assessment-topic-tag" style={{ fontWeight: 600 }}>
                        {materialName} • {topicName}
                      </span>
                    </div>
                  </div>

                  <div className="assessment-meta-list">
                    <div className="meta-item">
                      <span className="meta-label">Tingkat Kesulitan</span>
                      <span className="meta-val">{diffLabel}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Jumlah Soal</span>
                      <span className="meta-val">{practice.question_count || 20} Soal</span>
                    </div>
                    {practice.learner_status?.best_score !== null && practice.learner_status?.best_score !== undefined && (
                      <div className="meta-item">
                        <span className="meta-label">Skor Terbaik</span>
                        <span
                          className="meta-val"
                          style={{
                            color: practice.learner_status.is_passed
                              ? "var(--color-success)"
                              : "var(--color-error)",
                          }}
                        >
                          {Math.round(practice.learner_status.best_score)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="assessment-card-actions">
                    {renderAssessmentCta(practice, false)}
                  </div>
                </GlassPanel>
              );
            })}
          </div>
        </>
      )}
    </PageContainer>
  );
}
