// ============================================================
// XORA — Learner Progress & Growth History Page
// Premium Light Glassmorphism · Minimal · Reusable
// frontend/src/pages/ProgressPage.jsx
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { historyApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  GlassPanel,
  StatCard,
  StatusBadge,
  PrimaryButton,
  OutlineButton,
  ProgressBar,
  EmptyState,
  LoadingState,
  ErrorState,
} from "../components";
import {
  IconArrowRight,
  IconRefresh,
  IconBook,
  IconCompass,
  IconChart,
  IconTrendingUp,
  IconClock,
  IconTarget,
  IconSparkles,
} from "../components/Icons";

export default function ProgressPage() {
  const { navigate } = useRouter();

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "growth" | "timeline" | "insights"
  const [historyData, setHistoryData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timelineFilter, setTimelineFilter] = useState("ALL");

  const loadProgressData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await historyApi.getHistory();
      if (res?.data) {
        setHistoryData(res.data);
      }
    } catch (err) {
      setError(err.message || "Gagal memuat progres dan riwayat belajar.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProgressData();
  }, [loadProgressData]);

  const formatDate = (isoString) => {
    if (!isoString) return "-";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  const getEventIconComponent = (eventType) => {
    if (eventType.includes("ASSESSMENT")) return <IconBook size={18} />;
    if (eventType.includes("PRACTICE")) return <IconTarget size={18} />;
    if (eventType.includes("DIAGNOSTIC")) return <IconSparkles size={18} />;
    if (eventType.includes("REASSESSMENT")) return <IconRefresh size={18} />;
    if (eventType.includes("RECOMMENDATION")) return <IconCompass size={18} />;
    return <IconClock size={18} />;
  };

  // Filter timeline
  const filteredTimeline = (historyData?.history?.timeline || []).filter((item) => {
    if (timelineFilter === "ALL") return true;
    if (timelineFilter === "ASSESSMENT") return item.event_type.includes("ASSESSMENT") || item.entity_type === "attempt";
    if (timelineFilter === "PRACTICE") return item.event_type.includes("PRACTICE");
    if (timelineFilter === "DIAGNOSTIC") return item.event_type.includes("DIAGNOSTIC") || item.entity_type === "diagnostic";
    return true;
  });

  if (isLoading) {
    return (
      <PageContainer maxWidth="normal">
        <LoadingState message="Memuat rekam jejak progres &amp; riwayat belajar Anda..." />
      </PageContainer>
    );
  }

  const overview = historyData?.overview || {};
  const growth = historyData?.growth || {};
  const insights = historyData?.insights || {};

  return (
    <PageContainer maxWidth="normal">
      {/* Header Banner */}
      <GlassPanel variant="elevated" className="path-header-card">
        <PageHeader
          badge="Growth & Analytics"
          title="Progres &amp; Riwayat Belajar"
          description="Pantau pertumbuhan kompetensi, evaluasi skor dari waktu ke waktu, dan telusuri jejak bukti belajar riil Anda."
          actions={
            <>
              <OutlineButton
                size="sm"
                onClick={loadProgressData}
                icon={<IconRefresh size={14} />}
              >
                Segarkan
              </OutlineButton>
              <PrimaryButton
                size="sm"
                onClick={() => navigate("/learning-path")}
                iconRight={<IconCompass size={14} />}
              >
                Buka Peta Pembelajaran
              </PrimaryButton>
            </>
          }
        />

        {/* Tab Navigation */}
        <div className="subject-tabs" style={{ marginTop: "1rem" }}>
          <button
            type="button"
            className={`btn-subject-tab ${activeTab === "overview" ? "btn-subject-tab-active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Ringkasan Progres ({overview.total_concepts || 0} Konsep)
          </button>
          <button
            type="button"
            className={`btn-subject-tab ${activeTab === "growth" ? "btn-subject-tab-active" : ""}`}
            onClick={() => setActiveTab("growth")}
          >
            Pertumbuhan Skor ({growth.comparable_assessments?.length || 0})
          </button>
          <button
            type="button"
            className={`btn-subject-tab ${activeTab === "timeline" ? "btn-subject-tab-active" : ""}`}
            onClick={() => setActiveTab("timeline")}
          >
            Linimasa Aktivitas ({historyData?.history?.total_events || 0})
          </button>
          <button
            type="button"
            className={`btn-subject-tab ${activeTab === "insights" ? "btn-subject-tab-active" : ""}`}
            onClick={() => setActiveTab("insights")}
          >
            Langkah Rekomendasi
          </button>
        </div>
      </GlassPanel>

      {/* Error Alert */}
      {error && (
        <ErrorState
          title="Gagal Memuat Progres"
          message={error}
          onRetry={loadProgressData}
        />
      )}

      {/* TAB 1: RINGKASAN PROGRES BELAJAR (OVERVIEW) */}
      {activeTab === "overview" && (
        <div className="progress-content-section">
          {/* Summary Metrics Bar */}
          <div className="map-summary-bar">
            <StatCard label="Total Konsep" value={overview.total_concepts || 0} />
            <StatCard label="Dikuasai" value={overview.mastered_concepts || 0} variant="success" />
            <StatCard label="Sedang Latihan" value={overview.in_practice_concepts || 0} variant="info" />
            <StatCard label="Kesenjangan Pasti" value={overview.confirmed_gap_concepts || 0} variant="error" />
            <StatCard label="Perlu Verifikasi" value={overview.possible_gap_concepts || 0} variant="warning" />
            <StatCard label="Belum Dinilai" value={overview.not_assessed_concepts || 0} variant="neutral" />
          </div>

          {/* Average Mastery Rate Card */}
          <GlassPanel variant="default" style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "0.25rem", color: "var(--color-text-main)" }}>
                  Tingkat Penguasaan Rata-Rata (Assessed Concepts)
                </h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.875rem" }}>
                  Dihitung dari konsep yang memiliki bukti asesmen aktual ({overview.assessed_concepts_count || 0} dari {overview.total_concepts || 0} konsep).
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "2rem", fontWeight: 800, color: overview.average_mastery !== null ? "var(--color-primary)" : "var(--color-text-dim)" }}>
                  {overview.average_mastery !== null ? `${overview.average_mastery}%` : "Belum Dinilai"}
                </span>
                <span style={{ display: "block", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                  {overview.mastery_percentage}% dari kurikulum tuntas
                </span>
              </div>
            </div>
          </GlassPanel>

          {/* Concepts Breakdown Table / List */}
          <GlassPanel variant="default">
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "1.25rem", color: "var(--color-text-main)" }}>
              Rincian Penguasaan Seluruh Konsep
            </h3>

            {(!overview.concepts_detail || overview.concepts_detail.length === 0) ? (
              <EmptyState
                title="Belum Ada Konsep"
                description="Belum ada data konsep kurikulum yang terhubung."
              />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {overview.concepts_detail.map((c) => (
                  <div
                    key={c.id}
                    className="metric-box"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "0.75rem",
                      backgroundColor: "var(--color-surface-solid)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "220px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <strong style={{ fontSize: "0.95rem", color: "var(--color-text-main)" }}>{c.name}</strong>
                        <StatusBadge status={c.learning_status} dot />
                      </div>
                      {c.description && (
                        <p style={{ color: "var(--color-text-muted)", fontSize: "0.825rem", marginTop: "0.25rem" }}>
                          {c.description}
                        </p>
                      )}
                    </div>

                    <div style={{ minWidth: "160px", textAlign: "right" }}>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                        {c.mastery_score !== null ? `${c.mastery_score}%` : "Belum Dinilai"}
                      </div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                        {c.evidence_count > 0 ? `${c.evidence_count} bukti terkumpul` : "Belum ada bukti asesmen"}
                      </div>
                      {c.mastery_score !== null && (
                        <div className="progress-bar-track progress-bar-sm" style={{ width: "120px", marginLeft: "auto", marginTop: "0.35rem" }}>
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${Math.min(100, Math.max(0, c.mastery_score))}%`,
                              backgroundColor:
                                c.mastery_score >= 70
                                  ? "var(--color-success)"
                                  : c.mastery_score >= 40
                                  ? "var(--color-warning)"
                                  : "var(--color-error)",
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        </div>
      )}

      {/* TAB 2: PERTUMBUHAN SKOR & EVALUASI (MASTERY GROWTH) */}
      {activeTab === "growth" && (
        <div className="progress-content-section">
          {growth.has_comparisons ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="alert alert-success" style={{ borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>
                <IconInfo size={16} />
                <span>
                  <strong>Evaluasi Komparatif Objektif:</strong> {growth.note}
                </span>
              </div>

              {growth.comparable_assessments.map((comp) => (
                <GlassPanel key={comp.assessment_id} variant="default" style={{ borderLeft: "4px solid var(--color-primary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                    <div>
                      <StatusBadge status={comp.assessment_type} style={{ marginBottom: "0.4rem" }} />
                      <h3 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--color-text-main)" }}>{comp.assessment_title}</h3>
                      <p style={{ color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                        Total Pengerjaan: {comp.attempts_count} kali percobaan
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <StatusBadge
                        variant={comp.improved ? "success" : comp.score_difference === 0 ? "warning" : "error"}
                        label={
                          comp.improved
                            ? `Meningkat +${comp.score_difference}%`
                            : comp.score_difference === 0
                            ? "Skor Stabil"
                            : `Selisih ${comp.score_difference}%`
                        }
                      />
                    </div>
                  </div>

                  {/* Before vs After Comparison */}
                  <div className="detail-metrics-grid" style={{ marginBottom: "1.25rem" }}>
                    <div className="metric-box">
                      <span className="metric-lbl">Skor Awal (Percobaan #1)</span>
                      <span className="metric-val">{comp.initial_score}%</span>
                      <span className="metric-sub">{formatDate(comp.initial_completed_at)}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-lbl">Skor Terbaru (Percobaan #{comp.attempts_count})</span>
                      <span className="metric-val" style={{ color: comp.improved ? "var(--color-success)" : "var(--color-text-main)" }}>
                        {comp.latest_score}%
                      </span>
                      <span className="metric-sub">{formatDate(comp.latest_completed_at)}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-lbl">Pertumbuhan Kompetensi</span>
                      <span className="metric-val" style={{ color: comp.improved ? "var(--color-success)" : "var(--color-error)" }}>
                        {comp.score_difference > 0 ? `+${comp.score_difference}%` : `${comp.score_difference}%`}
                      </span>
                      <span className="metric-sub">
                        {comp.improved ? "Peningkatan kompetensi nyata" : "Perlu latihan pemantapan"}
                      </span>
                    </div>
                  </div>

                  {/* History List of All Attempts */}
                  <div style={{ backgroundColor: "var(--color-bg-subtle)", padding: "1rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                    <h4 style={{ fontSize: "0.825rem", color: "var(--color-text-muted)", textTransform: "uppercase", marginBottom: "0.5rem", fontWeight: 700 }}>
                      Riwayat Seluruh Percobaan
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {comp.attempts.map((att) => (
                        <div
                          key={att.attempt_id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "0.85rem",
                            padding: "0.4rem 0.5rem",
                            borderBottom: "1px solid var(--color-border)",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>Percobaan #{att.attempt_number}</span>
                          <span style={{ color: "var(--color-text-muted)" }}>{formatDate(att.completed_at)}</span>
                          <strong style={{ color: "var(--color-text-main)" }}>{att.score}%</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<IconTrendingUp size={36} />}
              title="Belum Ada Perbandingan Pengerjaan Berulang"
              description={growth.note}
              action={
                <PrimaryButton
                  onClick={() => navigate("/assessments")}
                  iconRight={<IconArrowRight size={16} />}
                >
                  Mulai Asesmen / Re-assessment
                </PrimaryButton>
              }
            />
          )}
        </div>
      )}

      {/* TAB 3: LINIMASA RIWAYAT BELAJAR (TIMELINE HISTORY) */}
      {activeTab === "timeline" && (
        <div className="progress-content-section">
          {/* Timeline Filter */}
          <div className="map-filter-bar">
            <span className="filter-label">Filter Aktivitas:</span>
            <div className="filter-chips">
              <button
                type="button"
                className={`filter-chip ${timelineFilter === "ALL" ? "filter-chip-active" : ""}`}
                onClick={() => setTimelineFilter("ALL")}
              >
                Semua ({historyData?.history?.timeline?.length || 0})
              </button>
              <button
                type="button"
                className={`filter-chip ${timelineFilter === "ASSESSMENT" ? "filter-chip-active" : ""}`}
                onClick={() => setTimelineFilter("ASSESSMENT")}
              >
                Asesmen
              </button>
              <button
                type="button"
                className={`filter-chip ${timelineFilter === "PRACTICE" ? "filter-chip-active" : ""}`}
                onClick={() => setTimelineFilter("PRACTICE")}
              >
                Latihan &amp; Remediasi
              </button>
              <button
                type="button"
                className={`filter-chip ${timelineFilter === "DIAGNOSTIC" ? "filter-chip-active" : ""}`}
                onClick={() => setTimelineFilter("DIAGNOSTIC")}
              >
                Verifikasi Diagnostik
              </button>
            </div>
          </div>

          {/* Timeline List */}
          {filteredTimeline.length === 0 ? (
            <EmptyState
              icon={<IconClock size={36} />}
              title="Belum Ada Aktivitas yang Tercatat"
              description="Riwayat aktivitas Anda akan otomatis dicatat setiap kali Anda menyelesaikan asesmen, sesi latihan, atau verifikasi diagnosis."
              action={
                <PrimaryButton
                  onClick={() => navigate("/assessments")}
                  iconRight={<IconArrowRight size={16} />}
                >
                  Mulai Aktivitas Pertama
                </PrimaryButton>
              }
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredTimeline.map((item) => (
                <GlassPanel
                  key={item.id}
                  variant="default"
                  style={{
                    padding: "1rem 1.35rem",
                    marginBottom: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "var(--radius-sm)",
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {getEventIconComponent(item.event_type)}
                  </div>

                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <strong style={{ fontSize: "0.95rem", color: "var(--color-text-main)" }}>{item.title}</strong>
                      <StatusBadge
                        variant="neutral"
                        label={item.event_type.replace(/_/g, " ")}
                      />
                    </div>
                    {item.subtitle && (
                      <p style={{ color: "var(--color-text-muted)", fontSize: "0.825rem", marginTop: "0.2rem" }}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>

                  <div style={{ textAlign: "right", minWidth: "140px" }}>
                    {item.score !== null && (
                      <div style={{ fontSize: "0.95rem", fontWeight: 700, color: item.score >= 70 ? "var(--color-success)" : "var(--color-error)" }}>
                        Skor: {item.score}%
                      </div>
                    )}
                    <span style={{ color: "var(--color-text-muted)", fontSize: "0.75rem" }}>
                      {formatDate(item.occurred_at)}
                    </span>
                  </div>
                </GlassPanel>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: LANGKAH BERIKUTNYA (ACTIONABLE INSIGHTS) */}
      {activeTab === "insights" && (
        <div className="progress-content-section">
          {insights.next_best_action ? (
            <GlassPanel variant="elevated" style={{ borderLeft: "4px solid var(--color-success)", marginBottom: "1.5rem" }}>
              <StatusBadge variant="success" label="Rekomendasi Prioritas Utama" style={{ marginBottom: "0.5rem" }} />
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.35rem", color: "var(--color-text-main)" }}>
                Target Fokus: {insights.next_best_action.concept_name || insights.next_best_action.action_type}
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.925rem", lineHeight: 1.5, marginBottom: "1.25rem" }}>
                {insights.next_best_action.reason}
              </p>

              <PrimaryButton
                onClick={() => navigate(insights.next_best_action.target_url)}
                iconRight={<IconArrowRight size={16} />}
              >
                {insights.next_best_action.cta_text}
              </PrimaryButton>
            </GlassPanel>
          ) : (
            <GlassPanel variant="default" style={{ marginBottom: "1.5rem", textAlign: "center", padding: "2.5rem 1.5rem" }}>
              <h3 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--color-text-main)" }}>
                Tidak Ada Kesenjangan Kritis yang Terbuka
              </h3>
              <p style={{ maxWidth: "550px", margin: "0 auto 1.5rem auto", fontSize: "0.925rem", color: "var(--color-text-muted)" }}>
                Seluruh materi yang telah Anda kerjakan berada dalam kondisi aman atau tidak memiliki gap aktif. Anda siap melanjutkan ke materi kurikulum berikutnya di Peta Pembelajaran.
              </p>
              <PrimaryButton
                onClick={() => navigate("/learning-path")}
                iconRight={<IconArrowRight size={16} />}
              >
                Eksplorasi Peta Pembelajaran
              </PrimaryButton>
            </GlassPanel>
          )}

          {/* Active Secondary Recommendations */}
          {insights.active_recommendations?.length > 0 && (
            <GlassPanel variant="default">
              <h4 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "0.85rem", color: "var(--color-text-main)" }}>
                Rekomendasi Aktivitas Tambahan
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {insights.active_recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.85rem 1.15rem",
                      backgroundColor: "var(--color-bg-subtle)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "0.925rem", color: "var(--color-text-main)" }}>{rec.concept_name}</strong>
                      <p style={{ color: "var(--color-text-muted)", fontSize: "0.825rem", margin: "0.15rem 0 0 0" }}>
                        {rec.reason}
                      </p>
                    </div>
                    <OutlineButton
                      size="sm"
                      onClick={() =>
                        navigate(
                          rec.action_type === "RUN_DIAGNOSTIC"
                            ? `/verification/${rec.diagnostic_id}`
                            : `/practice/${rec.id}`
                        )
                      }
                      iconRight={<IconArrowRight size={14} />}
                    >
                      Mulai
                    </OutlineButton>
                  </div>
                ))}
              </div>
            </GlassPanel>
          )}
        </div>
      )}
    </PageContainer>
  );
}
