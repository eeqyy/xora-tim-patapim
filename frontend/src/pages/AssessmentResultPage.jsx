// ============================================================
// XORA — Assessment Result & Diagnostic Breakdown Page
// Premium Light Glassmorphism · Minimal · Reusable
// frontend/src/pages/AssessmentResultPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { assessmentsApi, recommendationsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  GlassPanel,
  StatCard,
  StatusBadge,
  PrimaryButton,
  OutlineButton,
  LoadingState,
  ErrorState,
} from "../components";
import {
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconAlertTriangle,
  IconInfo,
  IconRefresh,
  IconCompass,
  IconChart,
  IconSparkles,
  IconTarget,
} from "../components/Icons";

function formatErrorPattern(rawPattern) {
  if (!rawPattern) return "Belum terdeteksi pola galat spesifik";
  const str = String(rawPattern).trim();
  if (str.startsWith("WRONG_OPTION:")) {
    const parts = str.replace("WRONG_OPTION:", "").split(";");
    const sel = parts.find((p) => p.startsWith("selected="))?.replace("selected=", "") || "";
    const exp = parts.find((p) => p.startsWith("expected="))?.replace("expected=", "") || "";
    return `Kekeliruan memilih opsi jawaban (${sel || "?"} dipilih, seharusnya ${exp || "?"})`;
  }
  if (str === "DRAG_DROP_MISMATCH") {
    return "Pencocokan relasi belum tepat pada pasangan elemen";
  }
  if (str === "DRAG_DROP_NO_KEY") {
    return "Elemen belum terpasang lengkap pada slot yang disediakan";
  }
  if (str === "NO_ANSWER") {
    return "Pertanyaan dilewati tanpa jawaban";
  }
  if (str.includes("SYNTAX") || str.includes("CODE")) {
    return "Kesalahan sintaks atau struktur logika kode program";
  }
  if (str.includes("KEYWORD") || str.includes("MISSING")) {
    return "Penjelasan belum memuat kata kunci konseptual yang diharapkan";
  }
  return str;
}

function getGapStatusBadge(gapStatus) {
  switch (gapStatus) {
    case "MASTERED":
      return { text: "Dikuasai", variant: "success" };
    case "NO_GAP":
      return { text: "Kompeten (Tidak Ada Gap)", variant: "success" };
    case "POSSIBLE_GAP":
      return { text: "Indikasi Gap", variant: "warning" };
    case "VERIFICATION":
      return { text: "Tahap Verifikasi", variant: "info" };
    case "CONFIRMED":
      return { text: "Akar Masalah Terkonfirmasi", variant: "error" };
    case "REJECTED":
      return { text: "Dugaan Gugur", variant: "neutral" };
    case "INCONCLUSIVE":
      return { text: "Belum Konklusif", variant: "neutral" };
    case "IN_PRACTICE":
      return { text: "Sedang Remediasi", variant: "info" };
    case "RESOLVED":
      return { text: "Telah Teratasi", variant: "success" };
    case "INSUFFICIENT_EVIDENCE":
    default:
      return { text: "Bukti Terbatas (< 3)", variant: "neutral" };
  }
}

function getDiagnosticStatusBadge(status) {
  switch (status) {
    case "HYPOTHESIS":
      return { text: "Dugaan Awal (Hipotesis)", variant: "primary" };
    case "PENDING":
      return { text: "Menunggu Analisis", variant: "neutral" };
    case "VERIFICATION":
      return { text: "Dalam Tahap Verifikasi", variant: "info" };
    case "CONFIRMED":
      return { text: "Akar Masalah Terkonfirmasi", variant: "error" };
    case "VERIFIED":
      return { text: "Terverifikasi", variant: "info" };
    case "REJECTED":
      return { text: "Dugaan Gugur (Prasyarat Aman)", variant: "success" };
    case "INCONCLUSIVE":
      return { text: "Belum Konklusif", variant: "neutral" };
    default:
      return { text: status || "Belum Dinilai", variant: "neutral" };
  }
}

function getActionTypeLabel(actionType) {
  switch (actionType) {
    case "RUN_DIAGNOSTIC":
      return "Verifikasi Diagnosis Prasyarat";
    case "PREREQUISITE_PRACTICE":
      return "Remediasi Konsep Prasyarat";
    case "TARGETED_PRACTICE":
      return "Latihan Terarah Konsep Utama";
    case "COLLECT_MORE_EVIDENCE":
      return "Kumpulkan Lebih Banyak Bukti";
    case "ADVANCE":
      return "Lanjut ke Materi Berikutnya";
    default:
      return actionType || "Tindakan Pembelajaran";
  }
}

export default function AssessmentResultPage({ attemptId }) {
  const { navigate } = useRouter();
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isStartingAction, setIsStartingAction] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [isRetryingAi, setIsRetryingAi] = useState(false);
  const [aiRetryMessage, setAiRetryMessage] = useState(null);

  const handleRetryAi = async () => {
    if (!attemptId || isRetryingAi) return;
    setIsRetryingAi(true);
    setAiRetryMessage(null);
    try {
      const res = await assessmentsApi.retryGapAnalysis(attemptId);
      if (res?.data?.attempt) {
        setResult(res.data.attempt);
        setAiRetryMessage("Analisis AI berhasil diperbarui.");
      }
    } catch (err) {
      setAiRetryMessage(err.message || "Gagal memperbarui analisis AI.");
    } finally {
      setIsRetryingAi(false);
    }
  };

  const handleStartAction = async (action) => {
    if (!action || isStartingAction) return;
    setIsStartingAction(true);
    setActionError(null);
    try {
      if (action.action_type === "RUN_DIAGNOSTIC") {
        if (action.id) {
          const res = await recommendationsApi.start(action.id);
          const diagId = res?.data?.diagnosticId || action.diagnostic_id;
          if (diagId) {
            navigate(`/verification/${diagId}`);
            return;
          }
        }
        if (action.diagnostic_id) {
          navigate(`/verification/${action.diagnostic_id}`);
          return;
        }
      }

      if (action.action_type === "PREREQUISITE_PRACTICE" || action.action_type === "TARGETED_PRACTICE") {
        if (action.id) {
          const res = await recommendationsApi.start(action.id);
          const actId = res?.data?.actionId || action.id;
          navigate(`/practice/${actId}`);
          return;
        }
      }

      if (action.assessment_id) {
        navigate(`/assessments/${action.assessment_id}`);
        return;
      }

      navigate("/assessments");
    } catch (err) {
      console.error("Gagal menjalankan next best action:", err);
      setActionError(err.message || "Gagal memulai sesi rekomendasi. Silakan coba lagi.");
    } finally {
      setIsStartingAction(false);
    }
  };

  const handleStartReassessment = async (asmtId) => {
    if (!asmtId || isStartingAction) return;
    setIsStartingAction(true);
    setActionError(null);
    try {
      await assessmentsApi.reassess(asmtId);
      navigate(`/reassess/${asmtId}`);
    } catch (err) {
      console.error("Gagal memulai re-assessment:", err);
      setActionError(err.message || "Gagal memulai sesi re-assessment. Silakan coba lagi.");
    } finally {
      setIsStartingAction(false);
    }
  };

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
      <PageContainer maxWidth="normal">
        <LoadingState message="Memuat rekapitulasi performa dan analisis diagnostik..." />
      </PageContainer>
    );
  }

  if (error || !result) {
    return (
      <PageContainer maxWidth="normal">
        <ErrorState
          title="Hasil Asesmen Tidak Tersedia"
          message={error || "Hasil asesmen tidak dapat ditampilkan."}
          onRetry={() => navigate("/assessments")}
          retryLabel="Kembali ke Daftar Asesmen"
        />
      </PageContainer>
    );
  }

  const scoreNum = Math.round(Number(result.score) || 0);
  const passingScoreNum = Math.round(Number(result.passing_score) || 70);
  const isPassed = result.passed ?? result.is_passed ?? (scoreNum >= passingScoreNum);

  const concepts = Array.isArray(result.concepts) ? result.concepts : [];
  const diagnostics = Array.isArray(result.diagnostics) ? result.diagnostics : [];
  const nextAction = result.next_action || null;

  // AI status helpers — distinguish real AI, deterministic fallback, and no analysis
  const aiStatus = result.ai_status || "NONE";
  const isFallback = result.ai_analysis?.is_fallback === true;
  const aiLabel = aiStatus === "COMPLETED" && !isFallback
    ? "AI Sungguhan Aktif"
    : aiStatus === "COMPLETED" && isFallback
    ? "Fallback Deterministik"
    : aiStatus === "FAILED"
    ? "AI Offline — Fallback Aktif"
    : "Belum Dianalisis";
  const aiBadgeVariant = aiStatus === "COMPLETED" && !isFallback
    ? "primary"
    : aiStatus === "FAILED" || isFallback
    ? "warning"
    : "neutral";

  // Unanswered count — prefer backend field, fallback to calculation
  const totalQ = Number(result.total_questions) || 0;
  const answeredQ = Number(result.answered_count) || 0;
  const unansweredQ = result.unanswered_count != null
    ? Number(result.unanswered_count)
    : Math.max(0, totalQ - answeredQ);

  return (
    <PageContainer maxWidth="normal">
      <GlassPanel variant="elevated" className="result-card">
        {/* Context Banners for Verification / Practice Sittings */}
        {result.verification_context && (
          <div className="alert alert-success result-context-banner">
            <IconInfo size={18} />
            <div>
              <strong>Sesi Verifikasi Selesai:</strong> Asesmen ini menguji pemahaman konsep prasyarat{" "}
              <em>"{result.verification_context.candidate_root_cause_name}"</em> untuk memverifikasi akar masalah pada konsep{" "}
              <em>"{result.verification_context.concept_name}"</em>.
            </div>
          </div>
        )}

        {result.action_context && (
          <div className="alert alert-success result-context-banner">
            <IconInfo size={18} />
            <div>
              <strong>Sesi Latihan Remediasi Selesai:</strong> Asesmen ini ditujukan untuk memperkuat penguasaan konsep{" "}
              <em>"{result.action_context.concept_name}"</em>.
            </div>
          </div>
        )}

        {/* Header */}
        <div className="result-header">
          <div className="result-status-badge">Rekapitulasi Pembelajaran</div>
          <h1 className="result-title">{result.assessment_title || "Hasil Asesmen"}</h1>
          <p className="result-subject">
            Mata Pelajaran: <strong>{result.subject_name}</strong>
          </p>
        </div>

        {/* Primary Attempt Score Card */}
        <div className={`result-score-banner ${isPassed ? "result-pass-bg" : "result-fail-bg"}`}>
          <div className="result-score-circle">
            <span className="result-score-number">{scoreNum}%</span>
            <span className="result-score-label">Skor Attempt</span>
          </div>

          <div className="result-verdict">
            <StatusBadge
              variant={isPassed ? "success" : "error"}
              label={isPassed ? "LULUS STANDAR KKM" : "BELUM MEMENUHI KKM"}
              dot
              style={{ fontSize: "0.95rem", padding: "0.4rem 1.25rem" }}
            />
            <p className="result-verdict-note">
              Standar Kelulusan Minimum (KKM): <strong>{passingScoreNum}%</strong>
            </p>
          </div>
        </div>

        {/* Quantitative Metrics Grid */}
        <div className="result-stats-grid">
          <StatCard
            label="Total Soal"
            value={totalQ || result.total_questions}
          />
          <StatCard
            label="Jawaban Benar"
            value={result.correct_count ?? 0}
            variant="success"
          />
          <StatCard
            label="Jawaban Salah"
            value={result.incorrect_count ?? 0}
            variant="error"
          />
          <StatCard
            label={unansweredQ > 0 ? "Tidak Dijawab" : "Status"}
            value={unansweredQ > 0 ? unansweredQ : (isPassed ? "Lulus" : "Belum Lulus")}
            variant={unansweredQ > 0 ? "warning" : (isPassed ? "success" : "error")}
          />
        </div>

        {/* SECTION: Performa Berbasis Materi Utama (HTML, CSS, JavaScript) */}
        {result.material_scores && Object.keys(result.material_scores).length > 0 && (
          <div className="result-diagnostic-section" style={{ marginTop: "2rem" }}>
            <div className="section-title-row">
              <div>
                <h2 className="result-section-heading">Performa Berbasis Materi Utama</h2>
                <p className="result-section-sub">
                  Distribusi pemahaman pada materi HTML, CSS, dan JavaScript dari attempt ini.
                </p>
              </div>
              <StatusBadge variant="primary" label="Cakupan Materi Evaluasi" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
              {Object.entries(result.material_scores).map(([mat, data]) => {
                const score = Math.round(data.score_percent ?? (data.total > 0 ? (data.correct / data.total) * 100 : 0));
                const isLimited = data.sample_status === "DATA_TERBATAS" || data.total < 3;
                let badgeVariant = "error";
                let badgeLabel = "Perlu Penguatan";

                if (isLimited) {
                  badgeVariant = "neutral";
                  badgeLabel = "Data Terbatas (< 3)";
                } else if (score >= 85) {
                  badgeVariant = "success";
                  badgeLabel = "Menguasai";
                } else if (score >= 70) {
                  badgeVariant = "info";
                  badgeLabel = "Berkembang";
                }

                return (
                  <GlassPanel key={mat} variant="subtle" style={{ padding: "1.25rem", borderRadius: "var(--radius-sm)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                      <strong style={{ fontSize: "1.05rem", color: "var(--color-text-main)" }}>
                        {mat === "BELUM_TERPETAKAN" ? "Materi Lain (Belum Terpetakan)" : mat}
                      </strong>
                      <StatusBadge variant={badgeVariant} label={badgeLabel} />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "var(--color-text-main)" }}>{score}%</span>
                      <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                        ({data.correct || 0} benar, {data.incorrect || 0} salah{data.unanswered ? `, ${data.unanswered} kosong` : ""})
                      </span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "var(--color-bg-subtle)", borderRadius: "3px", overflow: "hidden", marginBottom: "0.5rem" }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, score))}%`,
                          height: "100%",
                          background: score >= 70 ? "var(--color-success)" : "var(--color-error)",
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>
                    {isLimited ? (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontStyle: "italic", display: "block" }}>
                        Sampel {data.total} soal belum mencukupi untuk menyimpulkan penguasaan.
                      </span>
                    ) : (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>
                        Sampel terverifikasi ({data.total} soal dinilai).
                      </span>
                    )}
                  </GlassPanel>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: Distribusi Topik Teruji */}
        {Array.isArray(result.topic_scores) && result.topic_scores.length > 0 && (
          <div className="result-diagnostic-section" style={{ marginTop: "1.75rem" }}>
            <div className="section-title-row">
              <div>
                <h2 className="result-section-heading">Distribusi Pemahaman per Topik</h2>
                <p className="result-section-sub">
                  Rincian akurasi dan kecukupan sampel per topik pembelajaran.
                </p>
              </div>
              <StatusBadge variant="neutral" label={`${result.topic_scores.length} Topik`} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.85rem", marginTop: "1rem" }}>
              {result.topic_scores.map((ts, idx) => {
                const tScore = Math.round(ts.score_percent ?? (ts.total > 0 ? (ts.correct / ts.total) * 100 : 0));
                const isLimited = ts.total < 3;
                let tBadgeVariant = "error";
                let tBadgeLabel = "Perlu Penguatan";

                if (isLimited) {
                  tBadgeVariant = "neutral";
                  tBadgeLabel = "Data Terbatas";
                } else if (tScore >= 85) {
                  tBadgeVariant = "success";
                  tBadgeLabel = "Menguasai";
                } else if (tScore >= 70) {
                  tBadgeVariant = "info";
                  tBadgeLabel = "Berkembang";
                }

                return (
                  <div
                    key={idx}
                    style={{
                      background: "var(--color-surface-solid)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "0.9rem 1rem",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem", marginBottom: "0.4rem" }}>
                      <strong style={{ fontSize: "0.925rem", color: "var(--color-text-main)" }}>
                        {ts.topic_name}
                      </strong>
                      <StatusBadge variant={tBadgeVariant} label={tBadgeLabel} style={{ fontSize: "0.725rem", padding: "0.2rem 0.5rem" }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: "0.825rem", color: "var(--color-text-muted)" }}>
                      <span>{ts.correct || 0} dari {ts.total || 0} soal benar</span>
                      <strong style={{ fontSize: "1.1rem", color: "var(--color-text-main)" }}>{tScore}%</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: Research Gap Analysis & Rekomendasi Remedial */}
        {result.primary_gap && (
          <GlassPanel
            variant="elevated"
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--color-error-border)",
              background: "var(--color-error-bg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <IconAlertTriangle size={20} style={{ color: "var(--color-error)" }} />
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                  Research Gap Teridentifikasi: {result.primary_gap.material}
                </h3>
              </div>
              <StatusBadge
                variant={result.primary_gap.confidence === "HIGH" ? "error" : "warning"}
                label={`Tingkat Kepastian: ${result.primary_gap.confidence || "MEDIUM"}`}
              />
            </div>

            <p style={{ margin: "0 0 1rem", fontSize: "0.925rem", color: "var(--color-text-main)", lineHeight: 1.6 }}>
              Akurasi materi <strong>{result.primary_gap.material}</strong> tercatat sebesar{" "}
              <strong>{Math.round(result.primary_gap.score_percent)}%</strong> ({result.primary_gap.correct_count} dari {result.primary_gap.total_questions} soal benar),
              merupakan titik kesenjangan utama pada asesmen ini.
            </p>

            {result.remedial_recommendation && (
              <div
                style={{
                  padding: "1rem 1.25rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-surface-solid)",
                  border: "1px solid var(--color-primary-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--color-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.2rem" }}>
                    Rekomendasi Remedial Terarah
                  </div>
                  <strong style={{ fontSize: "1rem", color: "var(--color-text-main)", display: "block" }}>
                    {result.remedial_recommendation.title}
                  </strong>
                  <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                    {result.remedial_recommendation.reason}
                  </span>
                </div>
                <PrimaryButton
                  onClick={() => navigate(`/assessments/${result.remedial_recommendation.assessment_id}`)}
                  iconRight={<IconArrowRight size={16} />}
                >
                  Mulai Remedial {result.primary_gap.material}
                </PrimaryButton>
              </div>
            )}
          </GlassPanel>
        )}

        {/* SECTION: AI Research Insights */}
        {result.ai_analysis && (
          <GlassPanel
            variant="subtle"
            style={{
              marginTop: "2rem",
              padding: "1.5rem",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${aiStatus === "COMPLETED" && !isFallback ? "var(--color-primary-border)" : "var(--color-warning-border)"}`,
              background: aiStatus === "COMPLETED" && !isFallback
                ? "var(--color-primary-light)"
                : "var(--color-warning-bg)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <IconSparkles size={20} style={{ color: aiStatus === "COMPLETED" && !isFallback ? "var(--color-primary)" : "var(--color-warning)" }} />
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                  Analisis Gap &amp; Insight Pembelajaran
                </h3>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <StatusBadge
                  variant={aiBadgeVariant}
                  label={aiLabel}
                />
                {aiStatus === "FAILED" && (
                  <OutlineButton
                    size="sm"
                    loading={isRetryingAi}
                    disabled={isRetryingAi}
                    onClick={handleRetryAi}
                    icon={<IconRefresh size={14} />}
                  >
                    Coba Ulang AI
                  </OutlineButton>
                )}
              </div>
            </div>

            {(isFallback || aiStatus === "FAILED") && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--color-warning-bg)",
                  border: "1px solid var(--color-warning-border)",
                  marginBottom: "0.85rem",
                  fontSize: "0.825rem",
                  color: "var(--color-warning-text)",
                  lineHeight: 1.5,
                }}
              >
                <IconAlertTriangle size={15} style={{ flexShrink: 0, marginTop: "1px" }} />
                <span>
                  {result.ai_analysis?.notice ||
                    "Analisis dihasilkan oleh engine deterministik berbasis data tersimpan. Layanan AI kualitatif sedang tidak tersedia."}
                </span>
              </div>
            )}

            {aiRetryMessage && (
              <div className="alert alert-info" style={{ marginBottom: "1rem", fontSize: "0.85rem" }}>
                <IconInfo size={16} />
                <span>{aiRetryMessage}</span>
              </div>
            )}

            <div style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--color-text-main)", marginBottom: "1rem" }}>
              <p style={{ margin: "0 0 0.75rem", fontWeight: 500 }}>{result.ai_analysis.summary}</p>
              {result.ai_analysis.gap_explanation && (
                <p style={{ margin: "0 0 0.75rem", color: "var(--color-text-main)" }}>
                  <strong>Evaluasi Gap:</strong> {result.ai_analysis.gap_explanation}
                </p>
              )}
              {result.ai_analysis.study_advice && (
                <p style={{ margin: "0", color: "var(--color-text-main)" }}>
                  <strong>Saran Pembelajaran:</strong> {result.ai_analysis.study_advice}
                </p>
              )}
            </div>

            {Array.isArray(result.ai_analysis.strengths) && result.ai_analysis.strengths.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.75rem" }}>
                {result.ai_analysis.strengths.map((str, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "var(--color-success-bg)",
                      color: "var(--color-success)",
                      padding: "0.25rem 0.65rem",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                    }}
                  >
                    ✓ {str}
                  </span>
                ))}
              </div>
            )}
          </GlassPanel>
        )}

        {/* SECTION 0: Re-Assessment Comparative Evaluation */}
        {result.comparison?.is_comparable && (
          <GlassPanel
            variant="subtle"
            style={{
              margin: "1.75rem 0",
              textAlign: "left",
              borderColor: "var(--color-primary-border)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--color-text-main)" }}>
                  Evaluasi Komparatif Re-Assessment
                </h3>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
                  Perbandingan performa terhadap attempt sebelumnya pada instrumen asesmen yang sama.
                </p>
              </div>
              <StatusBadge
                variant={result.comparison.improved ? "success" : result.comparison.score_difference === 0 ? "neutral" : "error"}
                label={
                  result.comparison.score_difference > 0
                    ? `Peningkatan +${result.comparison.score_difference}%`
                    : result.comparison.score_difference === 0
                    ? `Skor Tetap (0%)`
                    : `Selisih ${result.comparison.score_difference}%`
                }
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
              <div className="result-stat-box">
                <span className="stat-label">Skor Sebelumnya</span>
                <span className="stat-val" style={{ color: "var(--color-text-muted)" }}>
                  {result.comparison.previous_score ?? 0}%
                </span>
              </div>
              <div className="result-stat-box">
                <span className="stat-label">Skor Re-Assessment</span>
                <span className={`stat-val ${result.comparison.improved ? "text-success" : ""}`}>
                  {result.comparison.current_score ?? 0}%
                </span>
              </div>
              <div className="result-stat-box">
                <span className="stat-label">Diferensiasi Skor</span>
                <span className={`stat-val ${result.comparison.score_difference >= 0 ? "text-success" : "text-danger"}`}>
                  {result.comparison.score_difference > 0 ? `+${result.comparison.score_difference}%` : `${result.comparison.score_difference}%`}
                </span>
              </div>
            </div>

            <div style={{ fontSize: "0.825rem", color: "var(--color-text-muted)", lineHeight: 1.5, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <IconCheck size={14} style={{ color: "var(--color-success)" }} />
              <span>
                <strong>Instrumen Terverifikasi:</strong> Perbandingan dihitung murni terhadap upaya pengerjaan sebelumnya pada instrumen yang sama.
              </span>
            </div>
          </GlassPanel>
        )}

        {/* SECTION 1: Concept-Level Breakdown */}
        <div className="result-diagnostic-section">
          <div className="section-title-row">
            <div>
              <h2 className="result-section-heading">Performa Berbasis Konsep</h2>
              <p className="result-section-sub">
                Evaluasi penguasaan setiap konsep kompetensi yang diuji dalam asesmen ini.
              </p>
            </div>
            <StatusBadge variant="primary" label={`${concepts.length} Konsep Diuji`} />
          </div>

          {concepts.length === 0 ? (
            <div className="empty-box">
              <p>Belum ada data konsep granular yang dipetakan pada soal asesmen ini.</p>
            </div>
          ) : (
            <div className="concept-cards-grid">
              {concepts.map((concept) => {
                const gapBadge = getGapStatusBadge(concept.gap_status);
                const hasEnoughEvidence = concept.evidence_count >= 3;

                return (
                  <div key={concept.concept_id} className="concept-result-card">
                    <div className="concept-result-header">
                      <div>
                        <h3 className="concept-result-title">{concept.concept_name}</h3>
                        <span className="concept-result-answered">
                          Benar {concept.correct_count} dari {concept.total_questions} soal pada attempt ini
                        </span>
                      </div>
                      <StatusBadge variant={gapBadge.variant} label={gapBadge.text} />
                    </div>

                    <div className="concept-metrics-row">
                      <div className="metric-box">
                        <span className="metric-label">Skor Attempt Ini</span>
                        <span className="metric-value">
                          {concept.attempt_score != null ? `${Math.round(concept.attempt_score)}%` : "N/A"}
                        </span>
                        <span className="metric-hint">Performa sesi ini</span>
                      </div>

                      <div className="metric-box">
                        <span className="metric-label">Mastery Score</span>
                        <span className="metric-value" style={{ color: "var(--color-primary)" }}>
                          {concept.mastery_score != null ? `${Math.round(concept.mastery_score)}%` : "Belum Dinilai"}
                        </span>
                        <span className="metric-hint">Akumulasi berbobot</span>
                      </div>

                      <div className="metric-box">
                        <span className="metric-label">Confidence</span>
                        <span className="metric-value">
                          {concept.evidence_confidence != null ? `${Math.round(concept.evidence_confidence)}%` : "0%"}
                        </span>
                        <span className="metric-hint">
                          {hasEnoughEvidence ? `${concept.evidence_count} bukti terkumpul` : "Bukti masih sedikit"}
                        </span>
                      </div>
                    </div>

                    {!hasEnoughEvidence && (
                      <div className="evidence-warning-notice">
                        <IconInfo size={14} style={{ display: "inline-block", marginRight: "0.35rem" }} />
                        <strong>Bukti Masih Terbatas ({concept.evidence_count}/3):</strong> Skor penguasaan konsep ini belum definitif. Diperlukan minimal 3 bukti asesmen untuk memvalidasi pemahaman.
                      </div>
                    )}

                    <div className="concept-error-row">
                      <span className="error-pattern-label">Pola Galat Terdeteksi:</span>
                      <span className="error-pattern-value">
                        {formatErrorPattern(concept.primary_error_pattern)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: Diagnostic & Root-Cause Hypotheses */}
        <div className="result-diagnostic-section">
          <div className="section-title-row">
            <div>
              <h2 className="result-section-heading">Analisis Diagnostik &amp; Akar Masalah</h2>
              <p className="result-section-sub">
                Hasil penelusuran relasi prasyarat (prerequisite chain) untuk mengidentifikasi kemungkinan akar kendala konseptual.
              </p>
            </div>
          </div>

          {diagnostics.length === 0 ? (
            <div className="diagnostic-success-box">
              <div className="success-icon">
                <IconCheck size={20} />
              </div>
              <div>
                <h3 className="success-title">Tidak Terdeteksi Kesenjangan Pemahaman Signifikan</h3>
                <p className="success-desc">
                  Seluruh konsep yang diuji berada di atas ambang batas kesenjangan, atau bukti pemahaman Anda telah mencukupi standar kompetensi.
                </p>
              </div>
            </div>
          ) : (
            <div className="diagnostics-list">
              {diagnostics.map((diag) => {
                const effectiveStatus = diag.verification_result || diag.diagnostic_status;
                const statusBadge = getDiagnosticStatusBadge(effectiveStatus);
                const isHypothesis = effectiveStatus === "HYPOTHESIS";
                const isConfirmed = effectiveStatus === "CONFIRMED";
                const isRejected = effectiveStatus === "REJECTED";
                const isInconclusive = effectiveStatus === "INCONCLUSIVE";

                return (
                  <div key={diag.id} className="diagnostic-item-card">
                    <div className="diagnostic-card-header">
                      <div>
                        <span className="diagnostic-concept-context">
                          Konsep yang Mengalami Kendala: <strong>{diag.concept_name}</strong>
                        </span>
                      </div>
                      <StatusBadge variant={statusBadge.variant} label={statusBadge.text} />
                    </div>

                    <div className="diagnostic-hypothesis-body">
                      {diag.candidate_root_cause_name ? (
                        <div className="root-cause-lead">
                          <span className="root-cause-lead-label">Dugaan Akar Masalah:</span>
                          <span className="root-cause-lead-target">{diag.candidate_root_cause_name}</span>
                        </div>
                      ) : (
                        <div className="root-cause-lead">
                          <span className="root-cause-lead-label">Analisis:</span>
                          <span className="root-cause-lead-target">
                            Konsep ini tidak memiliki prasyarat lanjutan. Kesenjangan berada langsung pada materi konsep ini.
                          </span>
                        </div>
                      )}

                      {diag.candidate_root_cause_name && (
                        <div className="root-cause-evidence-note">
                          <span>Bukti Pendukung: </span>
                          Penguasaan konsep prasyarat <em>"{diag.candidate_root_cause_name}"</em> tercatat berada pada tingkat mastery{" "}
                          <strong>
                            {diag.candidate_mastery_score != null ? `${Math.round(diag.candidate_mastery_score)}%` : "0%"}
                          </strong>{" "}
                          (di bawah batas kelulusan kompetensi 70%).
                        </div>
                      )}

                      <div className="diagnostic-status-explanation">
                        {isHypothesis && (
                          <p>
                            <strong>Status Hipotesis:</strong> Ini adalah dugaan analitis sistem, bukan simpulan pasti. Diperlukan sesi verifikasi asesmen prasyarat untuk membuktikan kebenaran dugaan ini.
                          </p>
                        )}
                        {isConfirmed && (
                          <p>
                            <strong>Akar Masalah Terkonfirmasi:</strong> Dugaan terbukti benar berdasarkan bukti pengerjaan soal prasyarat. Remediasi harus diprioritaskan pada konsep prasyarat tersebut.
                          </p>
                        )}
                        {isRejected && (
                          <p>
                            <strong>Dugaan Gugur:</strong> Penguasaan konsep prasyarat terbukti baik. Kesenjangan bukan disebabkan oleh prasyarat, melainkan pemahaman konsep target itu sendiri.
                          </p>
                        )}
                        {isInconclusive && (
                          <p>
                            <strong>Belum Konklusif:</strong> Bukti verifikasi belum cukup kuat untuk membuktikan atau menggugurkan dugaan. Dianjurkan memperbanyak latihan.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 3: Next Best Action Recommendation */}
        {nextAction && (
          <div className="result-diagnostic-section">
            <div className="section-title-row">
              <div>
                <h2 className="result-section-heading">Rekomendasi Tindakan Belajar (Next Best Action)</h2>
                <p className="result-section-sub">
                  Langkah yang disarankan oleh sistem untuk menyelesaikan kesenjangan pemahaman secara terarah.
                </p>
              </div>
              <StatusBadge variant="info" label={`Prioritas #${nextAction.priority || 1}`} />
            </div>

            <div className="next-action-card">
              <div className="action-type-badge">
                {getActionTypeLabel(nextAction.action_type)}
              </div>
              <h3 className="next-action-concept">
                Target Fokus: {nextAction.concept_name || "Konsep Terkait"}
              </h3>
              <p className="next-action-reason">{nextAction.reason}</p>

              {actionError && (
                <div className="alert alert-error" style={{ margin: "0.5rem 0", fontSize: "0.85rem" }}>
                  <IconAlertTriangle size={16} />
                  <span>{actionError}</span>
                </div>
              )}

              <div className="next-action-cta-row" style={{ marginTop: "0.75rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                {nextAction.action_type === "RUN_DIAGNOSTIC" && (
                  <PrimaryButton
                    disabled={isStartingAction}
                    loading={isStartingAction}
                    onClick={() => handleStartAction(nextAction)}
                    iconRight={<IconArrowRight size={16} />}
                  >
                    Mulai Verifikasi Diagnosis
                  </PrimaryButton>
                )}

                {nextAction.action_type === "PREREQUISITE_PRACTICE" && (
                  <PrimaryButton
                    disabled={isStartingAction}
                    loading={isStartingAction}
                    onClick={() => handleStartAction(nextAction)}
                    iconRight={<IconArrowRight size={16} />}
                  >
                    Mulai Remediasi Prasyarat
                  </PrimaryButton>
                )}

                {nextAction.action_type === "TARGETED_PRACTICE" && (
                  <PrimaryButton
                    disabled={isStartingAction}
                    loading={isStartingAction}
                    onClick={() => handleStartAction(nextAction)}
                    iconRight={<IconArrowRight size={16} />}
                  >
                    Mulai Latihan Terarah
                  </PrimaryButton>
                )}

                {(nextAction.action_type === "COLLECT_MORE_EVIDENCE" || nextAction.action_type === "ADVANCE") && (
                  <PrimaryButton
                    disabled={isStartingAction}
                    loading={isStartingAction}
                    onClick={() => handleStartAction(nextAction)}
                    iconRight={<IconArrowRight size={16} />}
                  >
                    Mulai Sesi Latihan
                  </PrimaryButton>
                )}
              </div>

              {/* Re-Assessment Opportunity Card */}
              {result.reassessment_eligible && result.reassessment_assessment_id && (
                <div
                  style={{
                    marginTop: "1.25rem",
                    padding: "1rem 1.25rem",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--color-surface-solid)",
                    border: "1px solid var(--color-primary-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                  }}
                >
                  <div>
                    <strong style={{ display: "block", color: "var(--color-text-main)", fontSize: "0.95rem" }}>
                      Siap Menguji Ulang Pemahaman (Re-Assessment)?
                    </strong>
                    <span style={{ fontSize: "0.825rem", color: "var(--color-text-muted)" }}>
                      Ambil sesi re-assessment untuk membuktikan peningkatan pemahaman dan memperbarui tingkat mastery Anda.
                    </span>
                  </div>
                  <PrimaryButton
                    size="sm"
                    disabled={isStartingAction}
                    onClick={() => handleStartReassessment(result.reassessment_assessment_id)}
                    iconRight={<IconArrowRight size={14} />}
                  >
                    Mulai Re-Assessment
                  </PrimaryButton>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="result-actions" style={{ marginTop: "2.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "space-between" }}>
          <OutlineButton
            onClick={() => navigate("/assessments")}
            icon={<IconArrowLeft size={16} />}
          >
            Daftar Asesmen
          </OutlineButton>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <OutlineButton
              onClick={() => navigate("/progress")}
              icon={<IconChart size={16} />}
            >
              Lihat Riwayat &amp; Progres
            </OutlineButton>
            <PrimaryButton
              onClick={() => navigate("/learning-path")}
              iconRight={<IconCompass size={16} />}
            >
              Peta Pembelajaran
            </PrimaryButton>
          </div>
        </div>
      </GlassPanel>
    </PageContainer>
  );
}
