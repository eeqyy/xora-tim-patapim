// ============================================================
// XOLEARN — Interactive Learning Path Page (Jalur Belajar)
// Editorial Grid System · Flat · Token-driven
// frontend/src/pages/LearningPathPage.jsx
// ------------------------------------------------------------
// Struktur editorial bernomor:
//   01 / FILTER MATERI           -> chips kesiapan + reset
//   ·  Inspector konsep (id="concept-inspector")
//   02 / STRUKTUR LEVEL & TOPIK  -> band level + grid topik/konsep
//
// Logika data (state, useEffect, API, handler, URL, teks) tidak berubah.
// ============================================================

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { subjectsApi, learningPathApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  GlassPanel,
  Grid,
  GridCell,
  SectionHeader,
  StatusBadge,
  ProgressBar,
  PrimaryButton,
  OutlineButton,
  EmptyState,
  LoadingState,
  ErrorState,
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
  IconChart,
  IconLock,
} from "../components/Icons";

const FILTER_OPTIONS = [
  { key: "ALL", label: "Semua Materi" },
  { key: "READY", label: "Siap Dipelajari" },
  { key: "NEEDS_PRACTICE", label: "Perlu Penguatan" },
  { key: "MASTERED", label: "Sudah Dikuasai" },
  { key: "LOCKED", label: "Menunggu Prasyarat" },
];

// Kerangka CTA kontekstual (editorial, flat).
const ACTION_BOX = cx(
  "flex flex-col gap-3 border-t pt-4 md:flex-row md:items-center md:justify-between",
  HAIRLINE
);

// Indikator titik status konsep -> token warna (presentasi saja).
function conceptDotTone(concept) {
  if (concept.is_locked) return "bg-muted dark:bg-muted-dark";
  if (concept.is_mastered) return "bg-ink dark:bg-ink-dark";
  const s = String(concept.learning_status || "").toUpperCase();
  if (s === "CONFIRMED_GAP" || s === "POSSIBLE_GAP" || s === "IN_PRACTICE") {
    return "bg-brand";
  }
  return "bg-muted dark:bg-muted-dark";
}

export default function LearningPathPage() {
  const { navigate } = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [learningPath, setLearningPath] = useState(null);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
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
    setSelectedConcept(null);
    try {
      const res = await learningPathApi.getPath(subjectId);
      setLearningPath(res?.data || null);
    } catch (err) {
      setError(err.message || "Gagal memuat alur belajar.");
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

  // Filter helper predicate
  const matchesFilter = useCallback((concept) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "READY") return !concept.is_locked && !concept.is_mastered;
    if (statusFilter === "NEEDS_PRACTICE") {
      return ["CONFIRMED_GAP", "POSSIBLE_GAP", "IN_PRACTICE"].includes(concept.learning_status);
    }
    if (statusFilter === "MASTERED") return concept.is_mastered === true;
    if (statusFilter === "LOCKED") return concept.is_locked === true;
    return true;
  }, [statusFilter]);

  // Filter counts across the entire subject
  const filterCounts = useMemo(() => {
    if (!learningPath?.levels) {
      return { all: 0, ready: 0, needsPractice: 0, mastered: 0, locked: 0 };
    }
    let all = 0;
    let ready = 0;
    let needsPractice = 0;
    let mastered = 0;
    let locked = 0;

    for (const lvl of learningPath.levels) {
      for (const topic of lvl.topics || []) {
        for (const c of topic.concepts || []) {
          all++;
          if (c.is_mastered) mastered++;
          if (c.is_locked) locked++;
          if (!c.is_locked && !c.is_mastered) ready++;
          if (["CONFIRMED_GAP", "POSSIBLE_GAP", "IN_PRACTICE"].includes(c.learning_status)) {
            needsPractice++;
          }
        }
      }
    }

    return { all, ready, needsPractice, mastered, locked };
  }, [learningPath]);

  // Total matching concepts under active filter
  const totalMatchingConcepts = useMemo(() => {
    if (!learningPath?.levels) return 0;
    let count = 0;
    for (const lvl of learningPath.levels) {
      for (const topic of lvl.topics || []) {
        for (const c of topic.concepts || []) {
          if (matchesFilter(c)) count++;
        }
      }
    }
    return count;
  }, [learningPath, matchesFilter]);

  const handleSelectSubject = (id) => {
    if (id !== selectedSubjectId) {
      setSelectedSubjectId(id);
    }
  };

  // Find concept by id for prerequisite click jumps
  const findConceptById = (conceptId) => {
    if (!learningPath?.levels) return null;
    for (const lvl of learningPath.levels) {
      for (const topic of lvl.topics || []) {
        for (const c of topic.concepts || []) {
          if (c.id === conceptId) return { ...c, topicName: topic.name, levelName: lvl.name };
        }
      }
    }
    return null;
  };

  const handlePrerequisiteClick = (prereqId) => {
    const found = findConceptById(prereqId);
    if (found) {
      setSelectedConcept(found);
      setTimeout(() => {
        const el = document.getElementById("concept-inspector");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }, 50);
    }
  };

  const handleSelectConcept = (concept, topicName, levelName) => {
    setSelectedConcept({
      ...concept,
      topicName,
      levelName,
    });
    setTimeout(() => {
      const el = document.getElementById("concept-inspector");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 50);
  };

  // Friendly status formatter for concept inspector
  const getConceptStatusInfo = (concept) => {
    if (!concept) return { title: "-", desc: "-", badgeStatus: "NOT_ASSESSED" };
    if (concept.is_locked) {
      return {
        title: "Terkunci",
        desc: "Prasyarat belum lengkap",
        badgeStatus: "LOCKED",
      };
    }
    if (concept.is_mastered) {
      return {
        title: "Sudah Dikuasai",
        desc: "Kompetensi tercapai (≥70%)",
        badgeStatus: "MASTERED",
      };
    }
    if (concept.learning_status === "IN_PRACTICE") {
      return {
        title: "Sedang Dilatih",
        desc: "Sesi latihan aktif",
        badgeStatus: "IN_PRACTICE",
      };
    }
    if (concept.learning_status === "CONFIRMED_GAP") {
      return {
        title: "Perlu Penguatan",
        desc: "Kesenjangan pemahaman terkonfirmasi",
        badgeStatus: "CONFIRMED_GAP",
      };
    }
    if (concept.learning_status === "POSSIBLE_GAP") {
      return {
        title: "Perlu Verifikasi",
        desc: "Akar kendala memerlukan verifikasi",
        badgeStatus: "POSSIBLE_GAP",
      };
    }
    if (!concept.is_assessed) {
      return {
        title: "Belum Dinilai",
        desc: "Siap mengikuti asesmen awal",
        badgeStatus: "NOT_ASSESSED",
      };
    }
    return {
      title: "Siap Dipelajari",
      desc: "Prasyarat terpenuhi, siap dievaluasi",
      badgeStatus: "NOT_ASSESSED",
    };
  };

  // Action CTA generator for selected concept
  const renderConceptAction = (concept) => {
    if (!concept) return null;

    if (concept.is_locked) {
      const unsatisfied = (concept.prerequisites || []).filter((p) => !p.satisfied);
      return (
        <div className={ACTION_BOX}>
          <div>
            <p className={cx("text-sm font-bold", INK)}>Materi Masih Terkunci</p>
            <p className={cx("mt-1 text-[12px] leading-relaxed", MUTED)}>
              Selesaikan materi prasyarat terlebih dahulu untuk membuka materi ini.
            </p>
          </div>
          {unsatisfied.length > 0 && (
            <OutlineButton
              size="sm"
              onClick={() => handlePrerequisiteClick(unsatisfied[0].id)}
              iconRight={<IconArrowRight size={14} />}
            >
              Fokus ke: {unsatisfied[0].name}
            </OutlineButton>
          )}
        </div>
      );
    }

    if (concept.active_action) {
      const act = concept.active_action;
      return (
        <div className={ACTION_BOX}>
          <div>
            <p className={cx("text-sm font-bold", INK)}>Latihan Remediasi Aktif:</p>
            <p className={cx("mt-1 text-[12px] leading-relaxed", MUTED)}>
              {act.action_type === "PREREQUISITE_PRACTICE"
                ? "Latihan penguatan konsep prasyarat direkomendasikan untuk memperkuat pondasi."
                : "Latihan terarah (Targeted Practice) tersedia untuk konsep ini."}
            </p>
          </div>
          <PrimaryButton
            size="sm"
            onClick={() => navigate(`/practice/${act.id}`)}
            iconRight={<IconArrowRight size={14} />}
          >
            Lanjutkan Latihan
          </PrimaryButton>
        </div>
      );
    }

    if (concept.learning_status === "POSSIBLE_GAP" && concept.active_diagnostic) {
      return (
        <div className={ACTION_BOX}>
          <div>
            <p className={cx("text-sm font-bold", INK)}>Verifikasi Diagnostik Diperlukan:</p>
            <p className={cx("mt-1 text-[12px] leading-relaxed", MUTED)}>
              Terdapat hipotesis akar kendala belajar yang perlu dibuktikan melalui verifikasi singkat.
            </p>
          </div>
          <PrimaryButton
            size="sm"
            onClick={() => navigate(`/verification/${concept.active_diagnostic.id}`)}
            iconRight={<IconArrowRight size={14} />}
          >
            Mulai Verifikasi
          </PrimaryButton>
        </div>
      );
    }

    if (concept.learning_status === "IN_PRACTICE" && concept.assessment_id) {
      return (
        <div className={ACTION_BOX}>
          <div>
            <p className={cx("text-sm font-bold", INK)}>Siap untuk Uji Ulang (Re-assessment):</p>
            <p className={cx("mt-1 text-[12px] leading-relaxed", MUTED)}>
              Ukur peningkatan penguasaan materi setelah menyelesaikan sesi latihan terarah.
            </p>
          </div>
          <PrimaryButton
            size="sm"
            onClick={() => navigate(`/reassess/${concept.assessment_id}`)}
            iconRight={<IconArrowRight size={14} />}
          >
            Mulai Uji Ulang
          </PrimaryButton>
        </div>
      );
    }

    if (concept.assessment_id) {
      return (
        <div className={ACTION_BOX}>
          <div>
            <p className={cx("text-sm font-bold", INK)}>Asesmen Tersedia:</p>
            <p className={cx("mt-1 text-[12px] leading-relaxed", MUTED)}>
              {concept.is_assessed
                ? "Evaluasi ulang pemahaman Anda terhadap konsep materi ini."
                : "Ikuti asesmen diagnostik untuk membangun profil penguasaan konsep awal."}
            </p>
          </div>
          <PrimaryButton
            size="sm"
            onClick={() => navigate(`/assessments/${concept.assessment_id}`)}
            iconRight={<IconArrowRight size={14} />}
          >
            {concept.is_assessed ? "Uji Ulang Konsep" : "Mulai Asesmen"}
          </PrimaryButton>
        </div>
      );
    }

    return (
      <div className={ACTION_BOX}>
        <div>
          <p className={cx("text-sm font-bold", INK)}>Asesmen Pembelajaran</p>
          <p className={cx("mt-1 text-[12px] leading-relaxed", MUTED)}>
            Buka daftar asesmen untuk menguji pemahaman konsep pada mata pelajaran ini.
          </p>
        </div>
        <OutlineButton
          size="sm"
          onClick={() => navigate("/assessments")}
          iconRight={<IconArrowRight size={14} />}
        >
          Lihat Daftar Asesmen
        </OutlineButton>
      </div>
    );
  };

  if (isLoadingSubjects) {
    return (
      <PageContainer maxWidth="normal">
        <LoadingState message="Memuat kurikulum alur belajar..." />
      </PageContainer>
    );
  }

  const selectedStatusInfo = selectedConcept ? getConceptStatusInfo(selectedConcept) : null;
  const currentFilterLabel = FILTER_OPTIONS.find((f) => f.key === statusFilter)?.label || "Semua Materi";

  const chipInactive = CHIP_INACTIVE;
  const chipActive = CHIP_ACTIVE;

  return (
    <PageContainer maxWidth="normal">
      {/* 1. Header & Subject Selector */}
      <PageHeader
        badge="Struktur Pembelajaran"
        title="Jalur Belajar"
        description="Pahami susunan topik, relasi prasyarat antar-materi, dan tentukan materi yang siap dipelajari berikutnya."
        actions={
          <>
            <OutlineButton
              size="sm"
              onClick={() => (selectedSubjectId ? fetchPath(selectedSubjectId) : fetchSubjects())}
              icon={<IconRefresh size={14} />}
            >
              Segarkan
            </OutlineButton>
            <PrimaryButton
              size="sm"
              onClick={() => navigate("/progress")}
              iconRight={<IconChart size={14} />}
            >
              Lihat Riwayat &amp; Progres
            </PrimaryButton>
          </>
        }
      />

      {/* Subjects Selector */}
      {subjects.length === 0 ? (
        <EmptyState
          title="Belum Ada Mata Pelajaran"
          description="Belum ada data mata pelajaran yang tersedia di database."
        />
      ) : (
        <GlassPanel className="mt-8 flex flex-col gap-3">
          <MicroMeta>Pilih Mata Pelajaran:</MicroMeta>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSubject(s.id)}
                className={cx(
                  CHIP_CLASS,
                  selectedSubjectId === s.id ? chipActive : chipInactive
                )}
              >
                {s.name}
              </button>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* Error Alert */}
      {error && (
        <ErrorState
          title="Gagal Memuat Alur Belajar"
          message={error}
          onRetry={() => (selectedSubjectId ? fetchPath(selectedSubjectId) : fetchSubjects())}
        />
      )}

      {/* Path Loading */}
      {isLoadingPath && (
        <LoadingState message="Memuat detail peta penguasaan belajar..." />
      )}

      {/* 2. Path Content */}
      {!isLoadingPath && learningPath && (
        <>
          {/* Filter Bar */}
          <SectionHeader
            id="filter"
            index="01"
            title="Filter Materi"
            meta={currentFilterLabel}
          />
          <GlassPanel className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <MicroMeta>Filter Materi Berdasarkan Kesiapan:</MicroMeta>
              {statusFilter !== "ALL" && (
                <button
                  type="button"
                  className="min-h-[44px] tabular-nums text-[11px] font-bold uppercase tracking-widest text-brand hover:underline"
                  onClick={() => setStatusFilter("ALL")}
                >
                  Reset Filter (Tampilkan Semua)
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTER_OPTIONS.map((opt) => {
                const count =
                  opt.key === "ALL"
                    ? filterCounts.all
                    : opt.key === "READY"
                    ? filterCounts.ready
                    : opt.key === "NEEDS_PRACTICE"
                    ? filterCounts.needsPractice
                    : opt.key === "MASTERED"
                    ? filterCounts.mastered
                    : filterCounts.locked;

                return (
                  <button
                    key={opt.key}
                    type="button"
                    className={cx(
                      CHIP_CLASS,
                      statusFilter === opt.key ? chipActive : chipInactive
                    )}
                    onClick={() => setStatusFilter(opt.key)}
                  >
                    {opt.label} ({count})
                  </button>
                );
              })}
            </div>
          </GlassPanel>

          {/* Interactive Concept Detail Panel (when concept selected) */}
          {selectedConcept && (
            <GlassPanel id="concept-inspector" variant="subtle" className="mt-6 flex flex-col gap-4 p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <MicroMeta>
                    {selectedConcept.levelName || "Level"} ›{" "}
                    {selectedConcept.topicName || "Topik"}
                  </MicroMeta>
                  <h3 className={cx("mt-1 text-xl font-extrabold leading-snug tracking-tight md:text-2xl", INK)}>
                    {selectedConcept.name}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    status={selectedStatusInfo.badgeStatus}
                    label={selectedStatusInfo.title}
                    dot
                  />
                  <OutlineButton
                    size="sm"
                    onClick={() => setSelectedConcept(null)}
                    aria-label="Tutup detail konsep"
                  >
                    Tutup
                  </OutlineButton>
                </div>
              </div>

              {selectedConcept.description && (
                <p className={cx("text-[13px] leading-relaxed", MUTED)}>
                  {selectedConcept.description}
                </p>
              )}

              {/* Metrics Grid */}
              <Grid cols={3}>
                <GridCell className="flex flex-col gap-1">
                  <MicroMeta>Tingkat Penguasaan</MicroMeta>
                  <span className={cx("text-2xl font-extrabold tracking-tight", INK)}>
                    {selectedConcept.mastery_score !== null
                      ? `${selectedConcept.mastery_score}%`
                      : "Belum Dinilai"}
                  </span>
                  {selectedConcept.mastery_score !== null && (
                    <ProgressBar
                      value={Math.min(100, Math.max(0, selectedConcept.mastery_score))}
                      showPercent={false}
                      size="sm"
                      variant={
                        selectedConcept.mastery_score >= 70
                          ? "primary"
                          : selectedConcept.mastery_score >= 40
                          ? "warning"
                          : "error"
                      }
                      className="mt-1"
                    />
                  )}
                </GridCell>

                <GridCell className="flex flex-col gap-1">
                  <MicroMeta>Bukti Asesmen Terkumpul</MicroMeta>
                  <span className={cx("text-2xl font-extrabold tracking-tight", INK)}>
                    {selectedConcept.evidence_count > 0
                      ? `${selectedConcept.evidence_count} bukti`
                      : "0 bukti"}
                  </span>
                  <span className={cx("text-[11px] leading-snug", MUTED)}>
                    {selectedConcept.evidence_confidence !== null
                      ? `Tingkat keyakinan: ${selectedConcept.evidence_confidence}%`
                      : "Belum ada keyakinan bukti"}
                  </span>
                </GridCell>

                <GridCell className="flex flex-col gap-1">
                  <MicroMeta>Status Pembelajaran</MicroMeta>
                  <span className={cx("text-base font-bold", INK)}>{selectedStatusInfo.title}</span>
                  <span className={cx("text-[11px] leading-snug", MUTED)}>
                    {selectedStatusInfo.desc}
                  </span>
                </GridCell>
              </Grid>

              {/* Prerequisites Chain */}
              <div className={cx("flex flex-col gap-3 border-t pt-4", HAIRLINE)}>
                <h4 className={cx("text-sm font-bold", INK)}>Relasi Prasyarat:</h4>
                {!selectedConcept.prerequisites || selectedConcept.prerequisites.length === 0 ? (
                  <p className={cx("text-[13px] leading-relaxed", MUTED)}>
                    Materi pondasi dasar — tidak membutuhkan materi prasyarat sebelumnya.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {selectedConcept.prerequisites.map((p) => (
                      <div
                        key={p.id}
                        className={cx(
                          "flex min-h-[44px] cursor-pointer flex-col gap-2 rounded-2xl border p-4 transition-colors",
                          p.satisfied
                            ? "border-transparent bg-cell dark:bg-cell-dark"
                            : "border-hairline hover:bg-cell dark:border-hairline-dark dark:hover:bg-cell-dark"
                        )}
                        onClick={() => handlePrerequisiteClick(p.id)}
                        role="button"
                        tabIndex={0}
                        title="Klik untuk melihat materi prasyarat ini"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <span className={cx("text-sm font-bold", INK)}>{p.name}</span>
                          <StatusBadge
                            variant={p.satisfied ? "success" : "error"}
                            label={p.satisfied ? "Terpenuhi" : "Belum Terpenuhi"}
                          />
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={cx("text-[12px]", MUTED)}>
                            Penguasaan:{" "}
                            <strong className={cx("font-bold", INK)}>
                              {p.mastery_score !== null ? `${p.mastery_score}%` : "Belum Dinilai"}
                            </strong>
                          </span>
                          <span className={cx("text-[12px]", MUTED)}>Target: ≥70%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contextual Action CTA */}
              {renderConceptAction(selectedConcept)}
            </GlassPanel>
          )}

          {/* 3. Levels & Topics Hierarchy */}
          {!learningPath.levels || learningPath.levels.length === 0 ? (
            <EmptyState
              title="Belum Ada Level Pembelajaran"
              description="Belum ada tingkat materi yang terdaftar pada mata pelajaran ini."
            />
          ) : totalMatchingConcepts === 0 ? (
            <EmptyState
              title="Tidak Ada Materi yang Cocok"
              description={`Tidak ditemukan materi untuk filter "${currentFilterLabel}". Silakan pilih kategori filter lain atau tampilkan semua materi.`}
              action={
                <PrimaryButton onClick={() => setStatusFilter("ALL")}>
                  Tampilkan Semua Materi
                </PrimaryButton>
              }
            />
          ) : (
            <>
              <SectionHeader
                id="levels"
                index="02"
                title="Struktur Level & Topik"
                meta={`${learningPath.levels.length} TINGKAT`}
              />
              {learningPath.levels.map((level, lvlIdx) => {
                const levelMatchingCount = (level.topics || []).reduce(
                  (acc, t) => acc + (t.concepts || []).filter(matchesFilter).length,
                  0
                );

                if (levelMatchingCount === 0 && statusFilter !== "ALL") {
                  return null; // Don't render empty level cards when user filtered out its content
                }

                return (
                  <React.Fragment key={level.id}>
                    {/* Level Header */}
                    <GlassPanel
                      variant="subtle"
                      className="mt-8 flex flex-col gap-3 p-4 md:flex-row md:items-start md:justify-between md:p-6"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <MicroMeta className="mt-0.5 shrink-0">
                          Tingkat {level.order_index ?? lvlIdx + 1}
                        </MicroMeta>
                        <div className="min-w-0">
                          <h3 className={cx("text-lg font-extrabold leading-snug tracking-tight md:text-xl", INK)}>
                            {level.name}
                          </h3>
                          {level.description && (
                            <p className={cx("mt-1 text-[13px] leading-relaxed", MUTED)}>
                              {level.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <StatusBadge status={level.difficulty} />
                      </div>
                    </GlassPanel>

                    {/* Topics under Level */}
                    {!level.topics || level.topics.length === 0 ? (
                      <div className={cx("mt-6 border-t pt-5", HAIRLINE)}>
                        <p className={cx("text-[13px]", MUTED)}>
                          Belum ada topik pada tingkat ini.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className={cx("mt-6 border-t pt-5", HAIRLINE)}>
                          <h4 className={cx("tabular-nums text-[10px] font-bold uppercase tracking-widest md:text-[11px]", MUTED)}>
                            Daftar Topik &amp; Konsep Materi
                          </h4>
                        </div>
                        <Grid cols={2} className="mt-6">
                          {level.topics.map((topic, topIdx) => {
                            const matchingConcepts = (topic.concepts || []).filter(matchesFilter);

                            if (matchingConcepts.length === 0 && statusFilter !== "ALL") {
                              return null; // Don't render empty topic cards when filtered out
                            }

                            return (
                              <GridCell key={topic.id} className="flex flex-col gap-3">
                                <div className="flex items-start gap-2">
                                  <MicroMeta className="mt-0.5 shrink-0">{topIdx + 1}.</MicroMeta>
                                  <div className="min-w-0 flex-1">
                                    <h5 className={cx("text-sm font-bold", INK)}>{topic.name}</h5>
                                    {topic.description && (
                                      <p className={cx("mt-1 text-[12px] leading-relaxed", MUTED)}>
                                        {topic.description}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Concepts under Topic */}
                                <div className="flex flex-col gap-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <MicroMeta>Konsep Kompetensi</MicroMeta>
                                    <MicroMeta>
                                      {matchingConcepts.length} dari {(topic.concepts || []).length} materi
                                    </MicroMeta>
                                  </div>

                                  {!topic.concepts || topic.concepts.length === 0 ? (
                                    <p className={cx("text-[12px]", MUTED)}>
                                      Belum ada materi terhubung.
                                    </p>
                                  ) : matchingConcepts.length === 0 ? (
                                    <p className={cx("text-[12px] italic", MUTED)}>
                                      Tidak ada materi yang sesuai dengan filter saat ini.
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {matchingConcepts.map((concept) => {
                                        const isSelected = selectedConcept?.id === concept.id;
                                        const locked = concept.is_locked === true;
                                        const dotTone = conceptDotTone(concept);

                                        return (
                                          <button
                                            key={concept.id}
                                            type="button"
                                            onClick={() =>
                                              handleSelectConcept(concept, topic.name, level.name)
                                            }
                                            className={cx(
                                              "flex min-h-[44px] max-w-full flex-col gap-1 rounded-2xl border px-4 py-2.5 text-left transition-colors",
                                              isSelected
                                                ? "border-brand bg-brand-soft"
                                                : locked
                                                ? "border-transparent bg-cell dark:bg-cell-dark"
                                                : "border-hairline hover:bg-cell dark:border-hairline-dark dark:hover:bg-cell-dark"
                                            )}
                                            title={`Klik untuk melihat detail: ${concept.name}`}
                                          >
                                            <span className="flex items-center gap-2">
                                              <span
                                                className={cx("h-1.5 w-1.5 shrink-0 rounded-full", dotTone)}
                                                aria-hidden="true"
                                              />
                                              <span className={cx("truncate text-[12px] font-bold", locked ? MUTED : INK)}>
                                                {concept.name}
                                              </span>
                                              {locked && (
                                                <IconLock size={12} className="shrink-0 text-muted dark:text-muted-dark" />
                                              )}
                                            </span>

                                            <span className="flex flex-wrap items-center gap-2">
                                              <span className={cx("tabular-nums text-[10px] uppercase tracking-widest", MUTED)}>
                                                {concept.mastery_score !== null
                                                  ? `${concept.mastery_score}%`
                                                  : "Belum dinilai"}
                                              </span>
                                              {concept.prerequisites && concept.prerequisites.length > 0 && (
                                                <span
                                                  className={cx("rounded-full border px-2 py-0.5 tabular-nums text-[10px] uppercase tracking-widest", HAIRLINE, MUTED)}
                                                  title={`${concept.prerequisites.length} prasyarat`}
                                                >
                                                  Prasyarat: {concept.prerequisites.length}
                                                </span>
                                              )}
                                            </span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </GridCell>
                            );
                          })}
                        </Grid>
                      </>
                    )}
                  </React.Fragment>
                );
              })}
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}
