// ============================================================
// XOLEARN — Assessment Discovery & List Page (Asesmen)
// Editorial Grid System · Flat · Token-driven
// frontend/src/pages/AssessmentListPage.jsx
// ------------------------------------------------------------
// Struktur editorial bernomor:
//   01 / ALUR TINGKAT PEMBELAJARAN -> grid progres 3 tahap
//   02 / ASESMEN TINGKAT KEMAHIRAN -> grid kartu asesmen inti
//   03 / ASESMEN PENGUATAN TERARAH -> grid remedial (kondisional)
//   04 / BANK LATIHAN PER TOPIK   -> filter + grid latihan topik
//
// Logika data (state, useEffect, API, handler, URL, teks) tidak berubah.
// ============================================================

import { useEffect, useState, useMemo } from "react";
import { assessmentsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  Grid,
  GridCell,
  SectionHeader,
  GlassPanel,
  StatusBadge,
  SeverityBadge,
  PrimaryButton,
  OutlineButton,
  Button,
  LoadingState,
  ErrorState,
  EmptyState,
  MicroMeta,
  HAIRLINE,
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

  // Asesmen inti (MIXED) yang benar-benar tersedia — dipakai untuk
  // menentukan tampilan empty state bila semua level kosong.
  const coreAvailable = useMemo(
    () => coreLevelAssessments.filter((c) => c.assessment),
    [coreLevelAssessments]
  );

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
        <Button disabled variant="outline" fullWidth icon={<IconLock size={15} />}>
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

  const chipInactive = CHIP_INACTIVE;

  return (
    <PageContainer maxWidth="normal">
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

      {/* 01 — Alur Tingkat Pembelajaran */}
      <SectionHeader id="levels" index="1" title="Alur Tingkat Pembelajaran" />
      <Grid cols={3} aria-label="Alur Tingkat Pembelajaran">
        {/* Stage 1: Easy */}
        <GridCell className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <MicroMeta>Tahap 1</MicroMeta>
            <StatusBadge
              variant={levelProgression.easy.passed ? "success" : "primary"}
              label={levelProgression.easy.passed ? "Sudah Lulus" : "Tersedia"}
              dot={levelProgression.easy.passed}
            />
          </div>
          <h4 className={cx("text-sm font-bold md:text-[15px]", INK)}>Tingkat Dasar</h4>
          <p className={cx("text-[12px] leading-relaxed", MUTED)}>
            Fondasi HTML, CSS, dan JavaScript dasar.
          </p>
        </GridCell>

        {/* Stage 2: Medium */}
        <GridCell className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <MicroMeta>Tahap 2</MicroMeta>
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
          <h4 className={cx("text-sm font-bold md:text-[15px]", INK)}>Tingkat Menengah</h4>
          <p className={cx("text-[12px] leading-relaxed", MUTED)}>
            Logika pemrograman &amp; interaktivitas. Memerlukan kelulusan Tingkat Dasar.
          </p>
        </GridCell>

        {/* Stage 3: Hard */}
        <GridCell className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <MicroMeta>Tahap 3</MicroMeta>
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
          <h4 className={cx("text-sm font-bold md:text-[15px]", INK)}>Tingkat Lanjut</h4>
          <p className={cx("text-[12px] leading-relaxed", MUTED)}>
            Arsitektur aplikasi &amp; performa. Memerlukan kelulusan Tingkat Menengah.
          </p>
        </GridCell>
      </Grid>

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

      {/* 02 — Asesmen Tingkat Kemahiran */}
      {!isLoading && !error && (
        <>
          <SectionHeader id="core" index="2" title="Asesmen Tingkat Kemahiran" />
          <GlassPanel>
            <p className={cx("text-[13px] leading-relaxed", MUTED)}>
              Instrumen asesmen inti yang memetakan pemahaman konsep HTML, CSS, dan JavaScript secara bertahap.
            </p>
          </GlassPanel>
          {coreAvailable.length === 0 ? (
            <EmptyState
              title="Belum Ada Asesmen Inti untuk Level Ini"
              description="Belum ada asesmen inti yang tersedia untuk level ini. Mulai dari Bank Latihan Per Topik atau telusuri Jalur Belajar terlebih dahulu."
              action={
                <>
                  <PrimaryButton
                    onClick={() =>
                      document.getElementById("bank")?.scrollIntoView({ behavior: "smooth" })
                    }
                    iconRight={<IconArrowRight size={16} />}
                  >
                    Bank Latihan Per Topik
                  </PrimaryButton>
                  <OutlineButton
                    onClick={() => navigate("/learning-path")}
                    icon={<IconCompass size={15} />}
                  >
                    Jalur Belajar
                  </OutlineButton>
                </>
              }
            />
          ) : null}
          {coreAvailable.length > 0 && (
            <Grid cols={3} className="mt-8">
            {coreAvailable.map((cfg) => {
              const item = cfg.assessment;
              if (!item) return null;

              const isLocked = item.learner_status?.is_locked === true;
              const accessStatus = item.learner_status?.access_status || "AVAILABLE";
              const coveredTopics = Array.isArray(item.covered_topics) && item.covered_topics.length > 0
                ? item.covered_topics
                : ["HTML", "CSS", "JavaScript"];

              return (
                <GridCell
                  key={item.id}
                  className={cx("flex flex-col gap-3", isLocked && "opacity-70")}
                >
                  {/* Card Header: Difficulty & Access Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={cfg.difficulty} label={cfg.levelName} />
                    <StatusBadge status={accessStatus} />
                  </div>

                  <h3 className={cx("text-base font-extrabold leading-snug tracking-tight", INK)}>
                    {item.title}
                  </h3>

                  {/* Main Coverage */}
                  <div className="flex flex-col gap-2">
                    <MicroMeta>Cakupan Materi</MicroMeta>
                    <div className="flex flex-wrap gap-2">
                      {coveredTopics.map((top, idx) => (
                        <SeverityBadge key={idx} tone="neutral">
                          {top}
                        </SeverityBadge>
                      ))}
                    </div>
                  </div>

                  {/* Minimal Metadata List */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <MicroMeta>Tingkat Kesulitan</MicroMeta>
                      <span className={cx("text-[13px] font-bold", INK)}>{cfg.levelName}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <MicroMeta>Jumlah Soal</MicroMeta>
                      <span className={cx("text-[13px] font-bold", INK)}>
                        {item.question_count || 30} Soal
                      </span>
                    </div>
                    {item.learner_status?.best_score !== null && item.learner_status?.best_score !== undefined && (
                      <div className="flex items-center justify-between gap-3">
                        <MicroMeta>Skor Terbaik</MicroMeta>
                        <span
                          className={cx(
                            "tabular-nums text-[13px] font-bold",
                            item.learner_status.is_passed ? INK : "text-accent"
                          )}
                        >
                          {Math.round(item.learner_status.best_score)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Lock Explanation Note */}
                  {isLocked && (
                    <div
                      className={cx(
                        "flex items-start gap-2 rounded-2xl border p-3 text-[12px] leading-relaxed",
                        HAIRLINE,
                        MUTED
                      )}
                    >
                      <IconLock size={14} className="mt-0.5 shrink-0" />
                      <span>
                        {item.learner_status?.lock_reason ||
                          "Asesmen ini belum terbuka. Selesaikan tingkat sebelumnya terlebih dahulu."}
                      </span>
                    </div>
                  )}

                  {/* Single Relevant CTA */}
                  <div className="mt-auto">
                    {renderAssessmentCta(item, isLocked)}
                  </div>
                </GridCell>
              );
            })}
            </Grid>
          )}

          {/* 03 — Asesmen Penguatan Terarah (Only shown if recommended) */}
          {recommendedRemedials.length > 0 && (
            <>
              <SectionHeader id="remedial" index="3" title="Asesmen Penguatan Terarah" />
              <GlassPanel className="flex items-start gap-3">
                <span className="shrink-0 text-accent">
                  <IconTarget size={20} />
                </span>
                <p className={cx("text-[13px] leading-relaxed", MUTED)}>
                  Latihan khusus untuk memperkuat pemahaman pada materi yang perlu ditingkatkan berdasarkan hasil evaluasi Anda.
                </p>
              </GlassPanel>

              <Grid cols={3} className="mt-8">
                {recommendedRemedials.map((rem) => {
                  const accessStatus = rem.learner_status?.access_status || "AVAILABLE";
                  const coveredTopics = Array.isArray(rem.covered_topics) && rem.covered_topics.length > 0
                    ? rem.covered_topics
                    : ["Materi Penguatan"];

                  return (
                    <GridCell key={rem.id} className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge variant="neutral" label="Penguatan" />
                        <StatusBadge status={accessStatus} />
                      </div>

                      <h3 className={cx("text-base font-extrabold leading-snug tracking-tight", INK)}>
                        {rem.title}
                      </h3>

                      {/* Main Coverage */}
                      <div className="flex flex-col gap-2">
                        <MicroMeta>Materi Fokus</MicroMeta>
                        <div className="flex flex-wrap gap-2">
                          {coveredTopics.map((top, idx) => (
                            <SeverityBadge key={idx} tone="neutral">
                              {top}
                            </SeverityBadge>
                          ))}
                        </div>
                      </div>

                      {/* Reason / Context */}
                      {rem.learner_status?.recommendation_reason && (
                        <div
                          className={cx(
                            "rounded-2xl border p-3 text-[12px] leading-relaxed",
                            HAIRLINE,
                            MUTED
                          )}
                        >
                          {rem.learner_status.recommendation_reason}
                        </div>
                      )}

                      {/* Minimal Metadata List */}
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                          <MicroMeta>Jumlah Soal</MicroMeta>
                          <span className={cx("text-[13px] font-bold", INK)}>
                            {rem.question_count || 20} Soal
                          </span>
                        </div>
                        {rem.learner_status?.best_score !== null && rem.learner_status?.best_score !== undefined && (
                          <div className="flex items-center justify-between gap-3">
                            <MicroMeta>Skor Terakhir</MicroMeta>
                            <span
                              className={cx(
                                "tabular-nums text-[13px] font-bold",
                                rem.learner_status.is_passed ? INK : "text-accent"
                              )}
                            >
                              {Math.round(rem.learner_status.best_score)}%
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Single Relevant CTA */}
                      <div className="mt-auto">
                        {renderAssessmentCta(rem, false)}
                      </div>
                    </GridCell>
                  );
                })}
              </Grid>
            </>
          )}

          {/* 04 — Bank Latihan Per Topik */}
          <SectionHeader id="bank" index="4" title="Bank Latihan Per Topik" />
          <GlassPanel className="flex flex-col gap-4">
            <p className={cx("text-[13px] leading-relaxed", MUTED)}>
              Latihan terarah 20 soal adaptif dengan potongan kode untuk mengasah penguasaan setiap topik spesifik.
            </p>

            {/* Material Filter Chips */}
            <div className="flex flex-wrap gap-2">
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
                    className={cx(
                      CHIP_CLASS,
                      isActive
                        ? CHIP_ACTIVE
                        : chipInactive
                    )}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          <Grid cols={3} className="mt-8">
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
                  <GridCell key={practice.id} className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge variant="primary" label={materialName} />
                      <StatusBadge status={difficulty} label={diffLabel} />
                      <StatusBadge status={accessStatus} />
                    </div>

                    <h3 className={cx("text-base font-extrabold leading-snug tracking-tight", INK)}>
                      {practice.title}
                    </h3>

                    <div className="flex flex-col gap-2">
                      <MicroMeta>Materi &amp; Topik</MicroMeta>
                      <div className="flex flex-wrap gap-2">
                        <span className={cx("rounded-full border px-3 py-1 text-[12px] font-bold", HAIRLINE, INK)}>
                          {materialName} • {topicName}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <MicroMeta>Tingkat Kesulitan</MicroMeta>
                        <span className={cx("text-[13px] font-bold", INK)}>{diffLabel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <MicroMeta>Jumlah Soal</MicroMeta>
                        <span className={cx("text-[13px] font-bold", INK)}>
                          {practice.question_count || 20} Soal
                        </span>
                      </div>
                      {practice.learner_status?.best_score !== null && practice.learner_status?.best_score !== undefined && (
                        <div className="flex items-center justify-between gap-3">
                          <MicroMeta>Skor Terbaik</MicroMeta>
                          <span
                            className={cx(
                              "tabular-nums text-[13px] font-bold",
                              practice.learner_status.is_passed ? INK : "text-accent"
                            )}
                          >
                            {Math.round(practice.learner_status.best_score)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto">
                      {renderAssessmentCta(practice, false)}
                    </div>
                  </GridCell>
                );
              })}
            </Grid>
        </>
      )}
    </PageContainer>
  );
}
