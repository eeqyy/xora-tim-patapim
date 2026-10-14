// ============================================================
// XOLEARN — Assessment Result & Diagnostic Breakdown Page
// Editorial Grid System · Flat · Hairline grid
// frontend/src/pages/AssessmentResultPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { assessmentsApi, recommendationsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  GlassPanel,
  Grid,
  GridCell,
  StatCard,
  StatusBadge,
  SectionHeader,
  SectionLede,
  MicroMeta,
  Alert,
  EmptyState,
  ProgressBar,
  PrimaryButton,
  OutlineButton,
  LoadingState,
  ErrorState,
  cx,
  HAIRLINE,
  INK,
  MUTED,
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
      <PageHeader
        badge="Rekapitulasi Pembelajaran"
        title={result.assessment_title || "Hasil Asesmen"}
        description={
          <>
            Mata Pelajaran: <strong className={cx("font-bold", INK)}>{result.subject_name}</strong>
          </>
        }
      />

      {/* Context Banners for Verification / Practice Sittings */}
      {result.verification_context && (
        <Alert tone="success" className="mt-5">
          <strong className={cx("font-bold", INK)}>Sesi Verifikasi Selesai:</strong> Asesmen ini menguji pemahaman konsep prasyarat{" "}
          <em>"{result.verification_context.candidate_root_cause_name}"</em> untuk memverifikasi akar masalah pada konsep{" "}
          <em>"{result.verification_context.concept_name}"</em>.
        </Alert>
      )}

      {result.action_context && (
        <Alert tone="success" className="mt-5">
          <strong className={cx("font-bold", INK)}>Sesi Latihan Remediasi Selesai:</strong> Asesmen ini ditujukan untuk memperkuat penguasaan konsep{" "}
          <em>"{result.action_context.concept_name}"</em>.
        </Alert>
      )}

      {/* Primary Attempt Score Band */}
      <GlassPanel
        variant="elevated"
        className="mt-8 flex flex-col gap-5 p-5 md:flex-row md:items-end md:justify-between md:p-6"
      >
        <div className="flex flex-col gap-2">
          <MicroMeta>Skor Attempt</MicroMeta>
          <span
            className={cx(
              "text-4xl font-extrabold leading-none tracking-tight md:text-6xl",
              isPassed ? INK : "text-accent"
            )}
          >
            {scoreNum}%
          </span>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <StatusBadge
            variant={isPassed ? "success" : "error"}
            label={isPassed ? "LULUS STANDAR KKM" : "BELUM MEMENUHI KKM"}
            dot
          />
          <p className={cx("text-[12px]", MUTED)}>
            Standar Kelulusan Minimum (KKM): <strong className={cx("font-bold", INK)}>{passingScoreNum}%</strong>
          </p>
        </div>
      </GlassPanel>

      {/* Quantitative Metrics Grid */}
      <Grid cols={4} className="mt-8">
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
      </Grid>

      {/* SECTION 01: Performa Berbasis Materi Utama (HTML, CSS, JavaScript) */}
      {result.material_scores && Object.keys(result.material_scores).length > 0 && (
        <>
          <SectionHeader index="1" title="Performa Berbasis Materi Utama" meta="Cakupan Materi Evaluasi" />
          <SectionLede>
            Distribusi pemahaman pada materi HTML, CSS, dan JavaScript dari attempt ini.
          </SectionLede>

          <Grid cols={3} className="mt-8">
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
                <GridCell key={mat}>
                  <div className="flex items-start justify-between gap-3">
                    <strong className={cx("text-[14px] font-bold leading-snug", INK)}>
                      {mat === "BELUM_TERPETAKAN" ? "Materi Lain (Belum Terpetakan)" : mat}
                    </strong>
                    <StatusBadge variant={badgeVariant} label={badgeLabel} />
                  </div>

                  <div className="mt-3 flex items-baseline gap-2">
                    <span className={cx("text-4xl font-extrabold leading-none tracking-tight", INK)}>{score}%</span>
                    <span className={cx("text-[11px]", MUTED)}>
                      ({data.correct || 0} benar, {data.incorrect || 0} salah{data.unanswered ? `, ${data.unanswered} kosong` : ""})
                    </span>
                  </div>

                  <ProgressBar value={score} variant={score >= 70 ? "success" : "error"} className="mt-3" />

                  {isLimited ? (
                    <span className={cx("mt-2 block text-[11px] italic leading-snug", MUTED)}>
                      Sampel {data.total} soal belum mencukupi untuk menyimpulkan penguasaan.
                    </span>
                  ) : (
                    <span className={cx("mt-2 block text-[11px] leading-snug", MUTED)}>
                      Sampel terverifikasi ({data.total} soal dinilai).
                    </span>
                  )}
                </GridCell>
              );
            })}
          </Grid>
        </>
      )}

      {/* SECTION 02: Distribusi Topik Teruji */}
      {Array.isArray(result.topic_scores) && result.topic_scores.length > 0 && (
        <>
          <SectionHeader
            index="2"
            title="Distribusi Pemahaman per Topik"
            meta={`${result.topic_scores.length} Topik`}
          />
          <SectionLede>
            Rincian akurasi dan kecukupan sampel per topik pembelajaran.
          </SectionLede>

          <Grid cols={3} className="mt-8">
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
                <GridCell key={idx}>
                  <div className="flex items-start justify-between gap-2">
                    <strong className={cx("text-[13px] font-bold leading-snug", INK)}>
                      {ts.topic_name}
                    </strong>
                    <StatusBadge variant={tBadgeVariant} label={tBadgeLabel} />
                  </div>
                  <div className={cx("mt-3 flex items-baseline justify-between gap-2 text-[11px]", MUTED)}>
                    <span>{ts.correct || 0} dari {ts.total || 0} soal benar</span>
                    <strong className={cx("text-xl font-extrabold leading-none tracking-tight", INK)}>{tScore}%</strong>
                  </div>
                </GridCell>
              );
            })}
          </Grid>
        </>
      )}

      {/* SECTION 03: Research Gap Analysis & Rekomendasi Remedial */}
      {result.primary_gap && (
        <>
          <SectionHeader
            index="3"
            title={`Research Gap Teridentifikasi: ${result.primary_gap.material}`}
          />
          <GlassPanel variant="elevated" className="mt-8 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-accent">
                <IconAlertTriangle size={20} />
              </span>
              <StatusBadge
                variant={result.primary_gap.confidence === "HIGH" ? "error" : "warning"}
                label={`Tingkat Kepastian: ${result.primary_gap.confidence || "MEDIUM"}`}
              />
            </div>

            <p className={cx("mt-3 text-[13px] leading-relaxed", INK)}>
              Akurasi materi <strong className={cx("font-bold", INK)}>{result.primary_gap.material}</strong> tercatat sebesar{" "}
              <strong className={cx("font-bold", INK)}>{Math.round(result.primary_gap.score_percent)}%</strong> ({result.primary_gap.correct_count} dari {result.primary_gap.total_questions} soal benar),
              merupakan titik kesenjangan utama pada asesmen ini.
            </p>

            {result.remedial_recommendation && (
              <div className={cx("mt-4 flex flex-wrap items-center justify-between gap-4 border-t pt-4", HAIRLINE)}>
                <div className="min-w-0">
                  <span className="tabular-nums text-[10px] font-bold uppercase tracking-widest text-accent md:text-[11px]">
                    Rekomendasi Remedial Terarah
                  </span>
                  <strong className={cx("mt-1 block text-[14px]", INK)}>
                    {result.remedial_recommendation.title}
                  </strong>
                  <span className={cx("text-[12px]", MUTED)}>
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
        </>
      )}

      {/* SECTION 04: AI Research Insights */}
      {result.ai_analysis && (
        <>
          <SectionHeader index="4" title="Analisis Gap &amp; Insight Pembelajaran" meta={aiLabel} />
          <GlassPanel variant="subtle" className="mt-8 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-end gap-3">
              <StatusBadge variant={aiBadgeVariant} label={aiLabel} />
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

            {(isFallback || aiStatus === "FAILED") && (
              <Alert tone="info" className="mt-3">
                <span className="shrink-0 text-accent"><IconAlertTriangle size={15} /></span>
                <span>
                  {result.ai_analysis?.notice ||
                    "Analisis dihasilkan oleh engine deterministik berbasis data tersimpan. Layanan AI kualitatif sedang tidak tersedia."}
                </span>
              </Alert>
            )}

            {aiRetryMessage && (
              <Alert tone="info" className="mt-3">
                <span className="shrink-0 text-accent"><IconInfo size={16} /></span>
                <span>{aiRetryMessage}</span>
              </Alert>
            )}

            <div className={cx("mt-3 text-[13px] leading-relaxed", INK)}>
              <p className="mb-2 font-medium">{result.ai_analysis.summary}</p>
              {result.ai_analysis.gap_explanation && (
                <p className="mb-2">
                  <strong className={cx("font-bold", INK)}>Evaluasi Gap:</strong> {result.ai_analysis.gap_explanation}
                </p>
              )}
              {result.ai_analysis.study_advice && (
                <p>
                  <strong className={cx("font-bold", INK)}>Saran Pembelajaran:</strong> {result.ai_analysis.study_advice}
                </p>
              )}
            </div>

            {Array.isArray(result.ai_analysis.strengths) && result.ai_analysis.strengths.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {result.ai_analysis.strengths.map((str, idx) => (
                  <span
                    key={idx}
                    className={cx("inline-flex items-center rounded-full border px-3 py-1.5 tabular-nums text-[10px] font-bold uppercase tracking-widest md:text-[11px]", HAIRLINE, INK)}
                  >
                    ✓ {str}
                  </span>
                ))}
              </div>
            )}
          </GlassPanel>
        </>
      )}

      {/* SECTION 05: Re-Assessment Comparative Evaluation */}
      {result.comparison?.is_comparable && (
        <>
          <SectionHeader
            index="5"
            title="Evaluasi Komparatif Re-Assessment"
            meta={
              result.comparison.score_difference > 0
                ? `Peningkatan +${result.comparison.score_difference}%`
                : result.comparison.score_difference === 0
                ? `Skor Tetap (0%)`
                : `Selisih ${result.comparison.score_difference}%`
            }
          />
          <SectionLede>
            Perbandingan performa terhadap attempt sebelumnya pada instrumen asesmen yang sama.
          </SectionLede>

          <Grid cols={3} className="mt-8">
            <GridCell>
              <MicroMeta>Skor Sebelumnya</MicroMeta>
              <span className={cx("mt-2 block text-4xl font-extrabold leading-none tracking-tight", MUTED)}>
                {result.comparison.previous_score ?? 0}%
              </span>
            </GridCell>
            <GridCell>
              <MicroMeta>Skor Re-Assessment</MicroMeta>
              <span className={cx("mt-2 block text-4xl font-extrabold leading-none tracking-tight", INK)}>
                {result.comparison.current_score ?? 0}%
              </span>
            </GridCell>
            <GridCell>
              <MicroMeta>Diferensiasi Skor</MicroMeta>
              <span
                className={cx(
                  "mt-2 block text-4xl font-extrabold leading-none tracking-tight",
                  result.comparison.score_difference >= 0 ? INK : "text-accent"
                )}
              >
                {result.comparison.score_difference > 0 ? `+${result.comparison.score_difference}%` : `${result.comparison.score_difference}%`}
              </span>
            </GridCell>
          </Grid>

          <div className={cx("mt-8 flex items-start gap-2 border-t pt-5 text-[12px]", HAIRLINE, MUTED)}>
            <span className="shrink-0"><IconCheck size={14} /></span>
            <span>
              <strong className={cx("font-bold", INK)}>Instrumen Terverifikasi:</strong> Perbandingan dihitung murni terhadap upaya pengerjaan sebelumnya pada instrumen yang sama.
            </span>
          </div>
        </>
      )}

      {/* SECTION 06: Concept-Level Breakdown */}
      <SectionHeader
        index="6"
        title="Performa Berbasis Konsep"
        meta={`${concepts.length} Konsep Diuji`}
      />
      <SectionLede>
        Evaluasi penguasaan setiap konsep kompetensi yang diuji dalam asesmen ini.
      </SectionLede>

      {concepts.length === 0 ? (
        <EmptyState
          title="Belum ada data konsep granular yang dipetakan pada soal asesmen ini."
          description=""
        />
      ) : (
        <Grid cols={3} className="mt-8">
          {concepts.map((concept) => {
            const gapBadge = getGapStatusBadge(concept.gap_status);
            const hasEnoughEvidence = concept.evidence_count >= 3;

            return (
              <GridCell key={concept.concept_id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className={cx("text-[14px] font-bold leading-snug", INK)}>{concept.concept_name}</h3>
                    <span className={cx("mt-1 block text-[11px]", MUTED)}>
                      Benar {concept.correct_count} dari {concept.total_questions} soal pada attempt ini
                    </span>
                  </div>
                  <StatusBadge variant={gapBadge.variant} label={gapBadge.text} />
                </div>

                <div className={cx("mt-4 grid grid-cols-3 gap-x-4 border-t pt-4", HAIRLINE)}>
                  <div className="min-w-0">
                    <MicroMeta>Skor Attempt Ini</MicroMeta>
                    <span className={cx("mt-1 block text-xl font-extrabold leading-none tracking-tight", INK)}>
                      {concept.attempt_score != null ? `${Math.round(concept.attempt_score)}%` : "N/A"}
                    </span>
                    <span className={cx("mt-1 block text-[10px] leading-snug", MUTED)}>Performa sesi ini</span>
                  </div>

                  <div className="min-w-0">
                    <MicroMeta>Mastery Score</MicroMeta>
                    <span className={cx("mt-1 block text-[14px] font-extrabold leading-none tracking-tight", INK)}>
                      {concept.mastery_score != null ? `${Math.round(concept.mastery_score)}%` : "Belum Dinilai"}
                    </span>
                    <span className={cx("mt-1 block text-[10px] leading-snug", MUTED)}>Akumulasi berbobot</span>
                  </div>

                  <div className="min-w-0">
                    <MicroMeta>Confidence</MicroMeta>
                    <span className={cx("mt-1 block text-[14px] font-extrabold leading-none tracking-tight", INK)}>
                      {concept.evidence_confidence != null ? `${Math.round(concept.evidence_confidence)}%` : "0%"}
                    </span>
                    <span className={cx("mt-1 block text-[10px] leading-snug", MUTED)}>
                      {hasEnoughEvidence ? `${concept.evidence_count} bukti terkumpul` : "Bukti masih sedikit"}
                    </span>
                  </div>
                </div>

                {!hasEnoughEvidence && (
                  <p className={cx("mt-3 flex items-start gap-1.5 text-[11px] leading-snug", MUTED)}>
                    <span className="shrink-0"><IconInfo size={14} /></span>
                    <span>
                      <strong className={cx("font-bold", INK)}>Bukti Masih Terbatas ({concept.evidence_count}/3):</strong> Skor penguasaan konsep ini belum definitif. Diperlukan minimal 3 bukti asesmen untuk memvalidasi pemahaman.
                    </span>
                  </p>
                )}

                <div className={cx("mt-4 border-t pt-4", HAIRLINE)}>
                  <MicroMeta>Pola Galat Terdeteksi:</MicroMeta>
                  <p className={cx("mt-1 text-[12px] leading-snug", INK)}>
                    {formatErrorPattern(concept.primary_error_pattern)}
                  </p>
                </div>
              </GridCell>
            );
          })}
        </Grid>
      )}

      {/* SECTION 07: Diagnostic & Root-Cause Hypotheses */}
      <SectionHeader
        index="7"
        title="Analisis Diagnostik &amp; Akar Masalah"
      />
      <SectionLede>
        Hasil penelusuran relasi prasyarat (prerequisite chain) untuk mengidentifikasi kemungkinan akar kendala konseptual.
      </SectionLede>

      {diagnostics.length === 0 ? (
        <GlassPanel variant="subtle" className="mt-8 flex items-start gap-3 p-5 md:p-6">
          <span className="shrink-0 text-accent"><IconCheck size={20} /></span>
          <div className="min-w-0">
            <h3 className={cx("text-sm font-bold", INK)}>Tidak Terdeteksi Kesenjangan Pemahaman Signifikan</h3>
            <p className={cx("mt-1 text-[13px] leading-relaxed", MUTED)}>
              Seluruh konsep yang diuji berada di atas ambang batas kesenjangan, atau bukti pemahaman Anda telah mencukupi standar kompetensi.
            </p>
          </div>
        </GlassPanel>
      ) : (
        diagnostics.map((diag) => {
          const effectiveStatus = diag.verification_result || diag.diagnostic_status;
          const statusBadge = getDiagnosticStatusBadge(effectiveStatus);
          const isHypothesis = effectiveStatus === "HYPOTHESIS";
          const isConfirmed = effectiveStatus === "CONFIRMED";
          const isRejected = effectiveStatus === "REJECTED";
          const isInconclusive = effectiveStatus === "INCONCLUSIVE";

          return (
            <GlassPanel key={diag.id} className={cx("border-t pt-5 md:pt-6", HAIRLINE)}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <span className={cx("text-[13px]", MUTED)}>
                  Konsep yang Mengalami Kendala: <strong className={cx("font-bold", INK)}>{diag.concept_name}</strong>
                </span>
                <StatusBadge variant={statusBadge.variant} label={statusBadge.text} />
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {diag.candidate_root_cause_name ? (
                  <div>
                    <MicroMeta>Dugaan Akar Masalah:</MicroMeta>
                    <p className={cx("mt-1 text-[14px] font-bold leading-snug", INK)}>{diag.candidate_root_cause_name}</p>
                  </div>
                ) : (
                  <div>
                    <MicroMeta>Analisis:</MicroMeta>
                    <p className={cx("mt-1 text-[13px] leading-relaxed", INK)}>
                      Konsep ini tidak memiliki prasyarat lanjutan. Kesenjangan berada langsung pada materi konsep ini.
                    </p>
                  </div>
                )}

                {diag.candidate_root_cause_name && (
                  <p className={cx("text-[12px] leading-relaxed", MUTED)}>
                    <span>Bukti Pendukung: </span>
                    Penguasaan konsep prasyarat <em>"{diag.candidate_root_cause_name}"</em> tercatat berada pada tingkat mastery{" "}
                    <strong className={cx("font-bold", INK)}>
                      {diag.candidate_mastery_score != null ? `${Math.round(diag.candidate_mastery_score)}%` : "0%"}
                    </strong>{" "}
                    (di bawah batas kelulusan kompetensi 70%).
                  </p>
                )}

                <div className={cx("flex flex-col gap-2 text-[12px] leading-relaxed", INK)}>
                  {isHypothesis && (
                    <p>
                      <strong className={cx("font-bold", INK)}>Status Hipotesis:</strong> Ini adalah dugaan analitis sistem, bukan simpulan pasti. Diperlukan sesi verifikasi asesmen prasyarat untuk membuktikan kebenaran dugaan ini.
                    </p>
                  )}
                  {isConfirmed && (
                    <p>
                      <strong className={cx("font-bold", INK)}>Akar Masalah Terkonfirmasi:</strong> Dugaan terbukti benar berdasarkan bukti pengerjaan soal prasyarat. Remediasi harus diprioritaskan pada konsep prasyarat tersebut.
                    </p>
                  )}
                  {isRejected && (
                    <p>
                      <strong className={cx("font-bold", INK)}>Dugaan Gugur:</strong> Penguasaan konsep prasyarat terbukti baik. Kesenjangan bukan disebabkan oleh prasyarat, melainkan pemahaman konsep target itu sendiri.
                    </p>
                  )}
                  {isInconclusive && (
                    <p>
                      <strong className={cx("font-bold", INK)}>Belum Konklusif:</strong> Bukti verifikasi belum cukup kuat untuk membuktikan atau menggugurkan dugaan. Dianjurkan memperbanyak latihan.
                    </p>
                  )}
                </div>
              </div>
            </GlassPanel>
          );
        })
      )}

      {/* SECTION 08: Next Best Action Recommendation */}
      {nextAction && (
        <>
          <SectionHeader
            index="8"
            title="Rekomendasi Tindakan Belajar (Next Best Action)"
            meta={`Prioritas #${nextAction.priority || 1}`}
          />
          <SectionLede>
            Langkah yang disarankan oleh sistem untuk menyelesaikan kesenjangan pemahaman secara terarah.
          </SectionLede>

          <GlassPanel variant="subtle" className="mt-8 p-5 md:p-6">
            <MicroMeta>{getActionTypeLabel(nextAction.action_type)}</MicroMeta>
            <h3 className={cx("mt-2 text-lg font-extrabold leading-tight tracking-tight", INK)}>
              Target Fokus: {nextAction.concept_name || "Konsep Terkait"}
            </h3>
            <p className={cx("mt-2 text-[13px] leading-relaxed", MUTED)}>{nextAction.reason}</p>

            {actionError && (
              <Alert tone="error" className="mt-3">
                <span className="shrink-0"><IconAlertTriangle size={16} /></span>
                <span>{actionError}</span>
              </Alert>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
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
              <div className={cx("mt-5 flex flex-wrap items-center justify-between gap-3 border-t pt-4", HAIRLINE)}>
                <div>
                  <strong className={cx("block text-[13px]", INK)}>
                    Siap Menguji Ulang Pemahaman (Re-Assessment)?
                  </strong>
                  <span className={cx("text-[12px]", MUTED)}>
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
          </GlassPanel>
        </>
      )}

      {/* Footer Actions */}
      <div className={cx("mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-5", HAIRLINE)}>
        <OutlineButton
          onClick={() => navigate("/assessments")}
          icon={<IconArrowLeft size={16} />}
        >
          Daftar Asesmen
        </OutlineButton>
        <div className="flex flex-wrap items-center gap-3">
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
    </PageContainer>
  );
}
