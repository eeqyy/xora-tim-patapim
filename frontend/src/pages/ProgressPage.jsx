// ============================================================
// XOLEARN — Learner Progress & Growth History Page
// Editorial Grid System · Flat · Token-driven
// frontend/src/pages/ProgressPage.jsx
// ------------------------------------------------------------
// Struktur editorial per tab (nomor di-reset tiap tab):
//   Ringkasan  : 01 metrik, 02 penguasaan, 03 rincian konsep
//   Pertumbuhan: 01 perbandingan skor
//   Linimasa   : 01 filter + daftar aktivitas
//   Langkah    : 01 rekomendasi utama, 02 rekomendasi tambahan
//
// Logika data (state, useEffect, API, handler, URL, teks) tidak berubah.
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { historyApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  Grid,
  GridCell,
  SectionHeader,
  GlassPanel,
  StatCard,
  StatusBadge,
  PrimaryButton,
  OutlineButton,
  ProgressBar,
  EmptyState,
  LoadingState,
  ErrorState,
  Alert,
  MicroMeta,
  HAIRLINE,
  RULE,
  CHIP_CLASS,
  CHIP_ACTIVE,
  CHIP_INACTIVE,
  INK,
  MUTED,
  cx,
} from "../components";
import {
  IconArrowRight,
  IconRefresh,
  IconBook,
  IconCompass,
  IconTrendingUp,
  IconClock,
  IconTarget,
  IconDiagnose,
} from "../components/Icons";

/* Pengelompokan konsep per status (urutan prioritas tampil). */
const CONCEPT_STATUS_GROUPS = [
  { key: "CONFIRMED_GAP", label: "Kesenjangan Terkonfirmasi" },
  { key: "POSSIBLE_GAP", label: "Perlu Verifikasi" },
  { key: "IN_PRACTICE", label: "Sedang Latihan" },
  { key: "MASTERED", label: "Dikuasai" },
  { key: "NOT_ASSESSED", label: "Belum Dinilai" },
];

/* Batas tampilan awal grup "Belum Dinilai" agar daftar tidak
   mendominasi halaman; sisanya diringkas jadi satu baris catatan. */
const NOT_ASSESSED_CAP = 8;

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
    if (eventType.includes("DIAGNOSTIC")) return <IconDiagnose size={18} />;
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

  const conceptList = overview.concepts_detail || [];
  const conceptGroups = CONCEPT_STATUS_GROUPS.map((group) => ({
    ...group,
    concepts: conceptList.filter((c) => c.learning_status === group.key),
  })).filter((group) => group.concepts.length > 0);
  const otherConcepts = conceptList.filter(
    (c) => !CONCEPT_STATUS_GROUPS.some((group) => group.key === c.learning_status)
  );
  if (otherConcepts.length > 0) {
    conceptGroups.push({ key: "OTHER", label: "Lainnya", concepts: otherConcepts });
  }

  const tabBase =
    "inline-flex min-h-[44px] items-center rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors";
  const tabActive = "bg-brand-soft text-accent";
  const tabInactive =
    "text-muted hover:bg-cell hover:text-ink dark:text-muted-dark dark:hover:bg-cell-dark dark:hover:text-ink-dark";

  const chipBase = CHIP_CLASS;
  const chipActive = CHIP_ACTIVE;
  const chipInactive = CHIP_INACTIVE;

  return (
    <PageContainer maxWidth="normal">
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
      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          className={cx(tabBase, activeTab === "overview" ? tabActive : tabInactive)}
          onClick={() => setActiveTab("overview")}
        >
          Ringkasan Progres ({overview.total_concepts || 0} Konsep)
        </button>
        <button
          type="button"
          className={cx(tabBase, activeTab === "growth" ? tabActive : tabInactive)}
          onClick={() => setActiveTab("growth")}
        >
          Pertumbuhan Skor ({growth.comparable_assessments?.length || 0})
        </button>
        <button
          type="button"
          className={cx(tabBase, activeTab === "timeline" ? tabActive : tabInactive)}
          onClick={() => setActiveTab("timeline")}
        >
          Linimasa Aktivitas ({historyData?.history?.total_events || 0})
        </button>
        <button
          type="button"
          className={cx(tabBase, activeTab === "insights" ? tabActive : tabInactive)}
          onClick={() => setActiveTab("insights")}
        >
          Langkah Rekomendasi
        </button>
      </div>

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
        <>
          <SectionHeader
            id="summary"
            index="1"
            title="Ringkasan Progres Belajar"
            meta={`${overview.total_concepts || 0} KONSEP`}
          />
          <Grid cols={6}>
            <StatCard label="Total Konsep" value={overview.total_concepts || 0} />
            <StatCard label="Dikuasai" value={overview.mastered_concepts || 0} variant="success" />
            <StatCard label="Sedang Latihan" value={overview.in_practice_concepts || 0} variant="info" />
            <StatCard label="Kesenjangan Pasti" value={overview.confirmed_gap_concepts || 0} variant="error" />
            <StatCard label="Perlu Verifikasi" value={overview.possible_gap_concepts || 0} variant="warning" />
            <StatCard label="Belum Dinilai" value={overview.not_assessed_concepts || 0} variant="neutral" />
          </Grid>

          {/* Average Mastery Rate */}
          <SectionHeader id="mastery" index="2" title="Tingkat Penguasaan" />
          <GlassPanel variant="subtle" className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="min-w-0">
              <h3 className={cx("text-[15px] font-extrabold tracking-tight", INK)}>
                Tingkat Penguasaan Rata-Rata (Assessed Concepts)
              </h3>
              <p className={cx("mt-1 text-[12px] leading-relaxed", MUTED)}>
                Dihitung dari konsep yang memiliki bukti asesmen aktual ({overview.assessed_concepts_count || 0} dari {overview.total_concepts || 0} konsep).
              </p>
            </div>
            <div className="shrink-0 md:text-right">
              <span
                className={cx(
                  "tabular-nums text-3xl font-extrabold tracking-tight",
                  overview.average_mastery !== null ? "text-accent" : MUTED
                )}
              >
                {overview.average_mastery !== null ? `${overview.average_mastery}%` : "Belum Dinilai"}
              </span>
              <span className={cx("mt-1 block tabular-nums text-[11px]", MUTED)}>
                {overview.mastery_percentage}% dari kurikulum tuntas
              </span>
            </div>
          </GlassPanel>

          {/* Concepts Breakdown */}
          <SectionHeader
            id="concepts"
            index="3"
            title="Rincian Penguasaan Seluruh Konsep"
            meta={`${conceptList.length} KONSEP`}
          />
          {conceptList.length === 0 ? (
            <EmptyState
              title="Belum Ada Konsep"
              description="Belum ada data konsep kurikulum yang terhubung."
            />
          ) : (
            conceptGroups.map((group) => {
              // Batasi grup "Belum Dinilai" agar daftar panjang tidak dominan.
              const shownConcepts =
                group.key === "NOT_ASSESSED"
                  ? group.concepts.slice(0, NOT_ASSESSED_CAP)
                  : group.concepts;
              const hiddenCount = group.concepts.length - shownConcepts.length;
              return (
              <div key={group.key}>
                <div
                  className={cx(
                    "mt-10 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t pt-4",
                    RULE
                  )}
                >
                  <span className={cx("text-[11px] font-bold uppercase tracking-[0.16em]", INK)}>
                    {group.label}
                  </span>
                  <MicroMeta>
                    {hiddenCount > 0
                      ? `${shownConcepts.length} dari ${group.concepts.length} konsep`
                      : `${group.concepts.length} konsep`}
                  </MicroMeta>
                </div>

                {shownConcepts.map((c, idx) => (
                  <GlassPanel
                    key={c.id}
                    className={cx(
                      "flex flex-col gap-3 md:flex-row md:items-center md:justify-between",
                      idx === 0 ? "pt-4 pb-5" : "border-t py-5",
                      HAIRLINE
                    )}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-bold tabular-nums text-accent">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className={cx("text-[14px] font-bold", INK)}>{c.name}</strong>
                          <StatusBadge status={c.learning_status} dot />
                        </div>
                        {c.description && (
                          <p className={cx("mt-1 text-[12px] leading-relaxed", MUTED)}>
                            {c.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 md:min-w-[160px] md:text-right">
                      <div className={cx("tabular-nums text-[13px] font-bold", INK)}>
                        {c.mastery_score !== null ? `${c.mastery_score}%` : "Belum Dinilai"}
                      </div>
                      <div className={cx("text-[11px]", MUTED)}>
                        {c.evidence_count > 0 ? `${c.evidence_count} bukti terkumpul` : "Belum ada bukti asesmen"}
                      </div>
                      {c.mastery_score !== null && (
                        <div className="mt-1.5 w-[120px] md:ml-auto">
                          <ProgressBar value={c.mastery_score} size="sm" showPercent={false} />
                        </div>
                      )}
                    </div>
                  </GlassPanel>
                ))}
                {hiddenCount > 0 ? (
                  <p className={cx("border-t py-4 text-[12px]", HAIRLINE, MUTED)}>
                    +{hiddenCount} konsep lainnya belum dinilai
                  </p>
                ) : null}
              </div>
              );
            })
          )}
        </>
      )}

      {/* TAB 2: PERTUMBUHAN SKOR & EVALUASI (MASTERY GROWTH) */}
      {activeTab === "growth" && (
        <>
          <SectionHeader id="growth" index="1" title="Perbandingan Pertumbuhan Skor" />
          {growth.has_comparisons ? (
            <>
              <Alert tone="success">
                <span>
                  <strong className={cx("font-bold", INK)}>Evaluasi Komparatif Objektif:</strong> {growth.note}
                </span>
              </Alert>

              {growth.comparable_assessments.map((comp) => (
                <GlassPanel key={comp.assessment_id} variant="elevated" className="mt-8 p-5 md:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <StatusBadge status={comp.assessment_type} />
                      <h3 className={cx("mt-1 text-[17px] font-extrabold tracking-tight", INK)}>
                        {comp.assessment_title}
                      </h3>
                      <p className={cx("mt-1 text-[12px]", MUTED)}>
                        Total Pengerjaan: {comp.attempts_count} kali percobaan
                      </p>
                    </div>

                    <div className="shrink-0 sm:text-right">
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
                  <Grid cols={3} className="mt-4">
                    <GridCell className="flex flex-col gap-1">
                      <MicroMeta>Skor Awal (Percobaan #1)</MicroMeta>
                      <span className={cx("tabular-nums text-2xl font-extrabold tracking-tight", INK)}>
                        {comp.initial_score}%
                      </span>
                      <span className={cx("tabular-nums text-[11px]", MUTED)}>
                        {formatDate(comp.initial_completed_at)}
                      </span>
                    </GridCell>
                    <GridCell className="flex flex-col gap-1">
                      <MicroMeta>Skor Terbaru (Percobaan #{comp.attempts_count})</MicroMeta>
                      <span className={cx("tabular-nums text-2xl font-extrabold tracking-tight", INK)}>
                        {comp.latest_score}%
                      </span>
                      <span className={cx("tabular-nums text-[11px]", MUTED)}>
                        {formatDate(comp.latest_completed_at)}
                      </span>
                    </GridCell>
                    <GridCell className="flex flex-col gap-1">
                      <MicroMeta>Pertumbuhan Kompetensi</MicroMeta>
                      <span
                        className={cx(
                          "tabular-nums text-2xl font-extrabold tracking-tight",
                          comp.improved ? INK : "text-accent"
                        )}
                      >
                        {comp.score_difference > 0 ? `+${comp.score_difference}%` : `${comp.score_difference}%`}
                      </span>
                      <span className={cx("text-[11px] leading-snug", MUTED)}>
                        {comp.improved ? "Peningkatan kompetensi nyata" : "Perlu latihan pemantapan"}
                      </span>
                    </GridCell>
                  </Grid>

                  {/* History List of All Attempts */}
                  <div className="mt-4">
                    <MicroMeta>Riwayat Seluruh Percobaan</MicroMeta>
                    <div className="mt-2">
                      {comp.attempts.map((att) => (
                        <div
                          key={att.attempt_id}
                          className={cx(
                            "flex flex-wrap items-center justify-between gap-2 border-b py-2",
                            HAIRLINE
                          )}
                        >
                          <span className={cx("text-[13px] font-bold", INK)}>
                            Percobaan #{att.attempt_number}
                          </span>
                          <span className={cx("tabular-nums text-[12px]", MUTED)}>
                            {formatDate(att.completed_at)}
                          </span>
                          <strong className={cx("tabular-nums text-[13px] font-bold", INK)}>
                            {att.score}%
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassPanel>
              ))}
            </>
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
        </>
      )}

      {/* TAB 3: LINIMASA RIWAYAT BELAJAR (TIMELINE HISTORY) */}
      {activeTab === "timeline" && (
        <>
          <SectionHeader id="timeline" index="1" title="Linimasa Aktivitas" />
          <GlassPanel className="mb-8 flex flex-col gap-3 md:flex-row md:items-center">
            <MicroMeta>Filter Aktivitas</MicroMeta>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cx(chipBase, timelineFilter === "ALL" ? chipActive : chipInactive)}
                onClick={() => setTimelineFilter("ALL")}
              >
                Semua ({historyData?.history?.timeline?.length || 0})
              </button>
              <button
                type="button"
                className={cx(chipBase, timelineFilter === "ASSESSMENT" ? chipActive : chipInactive)}
                onClick={() => setTimelineFilter("ASSESSMENT")}
              >
                Asesmen
              </button>
              <button
                type="button"
                className={cx(chipBase, timelineFilter === "PRACTICE" ? chipActive : chipInactive)}
                onClick={() => setTimelineFilter("PRACTICE")}
              >
                Latihan &amp; Remediasi
              </button>
              <button
                type="button"
                className={cx(chipBase, timelineFilter === "DIAGNOSTIC" ? chipActive : chipInactive)}
                onClick={() => setTimelineFilter("DIAGNOSTIC")}
              >
                Verifikasi Diagnostik
              </button>
            </div>
          </GlassPanel>

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
            filteredTimeline.map((item) => (
              <GlassPanel
                key={item.id}
                className={cx("flex flex-wrap items-center gap-4 border-t pt-5", HAIRLINE)}
              >
                <span
                  className={cx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-accent",
                    HAIRLINE
                  )}
                >
                  {getEventIconComponent(item.event_type)}
                </span>

                <div className="min-w-[200px] flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className={cx("text-[14px] font-bold", INK)}>{item.title}</strong>
                    <StatusBadge
                      variant="neutral"
                      label={item.event_type.replace(/_/g, " ")}
                    />
                  </div>
                  {item.subtitle && (
                    <p className={cx("mt-0.5 text-[12px]", MUTED)}>
                      {item.subtitle}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {item.score !== null && (
                    <div
                      className={cx(
                        "tabular-nums text-[13px] font-bold",
                        item.score >= 70 ? INK : "text-accent"
                      )}
                    >
                      Skor: {item.score}%
                    </div>
                  )}
                  <span className={cx("tabular-nums text-[11px]", MUTED)}>
                    {formatDate(item.occurred_at)}
                  </span>
                </div>
              </GlassPanel>
            ))
          )}
        </>
      )}

      {/* TAB 4: LANGKAH BERIKUTNYA (ACTIONABLE INSIGHTS) */}
      {activeTab === "insights" && (
        <>
          <SectionHeader id="insights" index="1" title="Langkah Rekomendasi" />
          {insights.next_best_action ? (
            <GlassPanel variant="elevated" className="p-5 md:p-6">
              <StatusBadge variant="success" label="Rekomendasi Prioritas Utama" />
              <h3 className={cx("mt-2 text-[18px] font-extrabold tracking-tight", INK)}>
                Target Fokus: {insights.next_best_action.concept_name || insights.next_best_action.action_type}
              </h3>
              <p className={cx("mt-1 max-w-2xl text-[13px] leading-relaxed", MUTED)}>
                {insights.next_best_action.reason}
              </p>

              <div className="mt-5">
                <PrimaryButton
                  onClick={() => navigate(insights.next_best_action.target_url)}
                  iconRight={<IconArrowRight size={16} />}
                >
                  {insights.next_best_action.cta_text}
                </PrimaryButton>
              </div>
            </GlassPanel>
          ) : (
            <GlassPanel className={cx("flex flex-col items-center border-t pt-8 text-center", HAIRLINE)}>
              <h3 className={cx("text-[18px] font-extrabold tracking-tight", INK)}>
                Tidak Ada Kesenjangan Kritis yang Terbuka
              </h3>
              <p className={cx("mt-2 max-w-[550px] text-[13px] leading-relaxed", MUTED)}>
                Seluruh materi yang telah Anda kerjakan berada dalam kondisi aman atau tidak memiliki gap aktif. Anda siap melanjutkan ke materi kurikulum berikutnya di Peta Pembelajaran.
              </p>
              <div className="mt-5">
                <PrimaryButton
                  onClick={() => navigate("/learning-path")}
                  iconRight={<IconArrowRight size={16} />}
                >
                  Eksplorasi Peta Pembelajaran
                </PrimaryButton>
              </div>
            </GlassPanel>
          )}

          {/* Active Secondary Recommendations */}
          {insights.active_recommendations?.length > 0 && (
            <>
              <SectionHeader id="recommendations" index="2" title="Rekomendasi Aktivitas Tambahan" />
              {insights.active_recommendations.map((rec) => (
                <GlassPanel
                  key={rec.id}
                  className={cx(
                    "flex flex-col gap-3 border-t pt-5 md:flex-row md:items-center md:justify-between",
                    HAIRLINE
                  )}
                >
                  <div className="min-w-0">
                    <strong className={cx("text-[13px] font-bold", INK)}>{rec.concept_name}</strong>
                    <p className={cx("mt-0.5 text-[12px]", MUTED)}>{rec.reason}</p>
                  </div>
                  <div className="shrink-0">
                    <OutlineButton
                      size="sm"
                      onClick={() =>
                        navigate(
                          rec.action_type === "RUN_DIAGNOSTIC"
                            ? `/verification/${rec.diagnostic_id}`
                            : `/practice/${rec.id}`
                        )
                      }
                      iconRight={<IconArrowRight size={16} />}
                    >
                      Mulai
                    </OutlineButton>
                  </div>
                </GlassPanel>
              ))}
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}
