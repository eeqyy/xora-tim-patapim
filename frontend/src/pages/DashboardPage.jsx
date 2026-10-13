// ============================================================
// XORA — Dashboard Analitik (Editorial System v2)
// frontend/src/pages/DashboardPage.jsx
// ------------------------------------------------------------
// Struktur editorial bernomor:
//   01 / RINGKASAN ASESMEN      -> grid metrik (garis horizontal)
//   02 / ANALISIS BUKTI BELAJAR -> akordeon log diagnostik
//   03 / MATRIKS KESENJANGAN    -> akordeon miskonsepsi + confidence
//   04 / PROGRAM REMEDI         -> checklist + CTA
//
// Pemisah = garis horizontal + ruang kosong (tanpa grid kotak).
//
// Sumber data (endpoint tidak berubah):
//   - Learner : history/mastery/gaps/recommendations (per-pengguna)
//   - Admin   : GET /api/admin/users/:id/analytics (learner terpilih)
// Filter kelas memakai peta concept_id -> subject_id.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { useDashboardFilter } from "../context/DashboardFilterContext";
import {
  historyApi,
  masteryApi,
  gapsApi,
  recommendationsApi,
  adminUsersApi,
} from "../services/api";
import { IconChevronDown, IconArrowRight } from "../components/Icons";
import {
  PageContainer,
  PageHeader,
  MicroMeta,
  SectionHeader,
  Grid,
  MetricCell,
  AccordionRow,
  ChecklistRow,
  SeverityBadge,
  PrimaryButton,
  GhostButton,
  ProgressBar,
  Alert,
  Reveal,
  HAIRLINE,
  INK,
  MUTED,
  cx,
} from "../components";

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function gapStatusLabel(status) {
  const s = String(status || "").toUpperCase();
  if (s.includes("CONFIRMED")) return "Kesenjangan terkonfirmasi";
  if (s.includes("POSSIBLE") || s.includes("VERIFICATION") || s.includes("HYPOTHESIS"))
    return "Dugaan kesenjangan";
  if (s.includes("IN_PRACTICE")) return "Sedang dilatih";
  if (s.includes("RESOLVED")) return "Tuntas";
  if (s.includes("REJECTED")) return "Tidak terbukti";
  if (!s) return "Belum dievaluasi";
  return status;
}

function gapTone(status) {
  const s = String(status || "").toUpperCase();
  if (s.includes("CONFIRMED")) return "high";
  if (s.includes("POSSIBLE") || s.includes("VERIFICATION") || s.includes("HYPOTHESIS"))
    return "medium";
  if (s.includes("IN_PRACTICE")) return "medium";
  if (s.includes("RESOLVED")) return "low";
  return "low";
}

function gapSeverityShort(status) {
  const s = String(status || "").toUpperCase();
  if (s.includes("CONFIRMED")) return "Terkonfirmasi";
  if (s.includes("POSSIBLE") || s.includes("VERIFICATION") || s.includes("HYPOTHESIS"))
    return "Dugaan";
  if (s.includes("IN_PRACTICE")) return "Latihan";
  if (s.includes("RESOLVED")) return "Tuntas";
  return "Aman";
}

function actionTypeLabel(type) {
  const t = String(type || "").toUpperCase();
  if (t.includes("VERIFICATION")) return "Verifikasi";
  if (t.includes("PRACTICE")) return "Latihan";
  if (t.includes("REMEDI")) return "Remediasi";
  return type || "Tindak lanjut";
}

function humanizePattern(pattern) {
  if (!pattern) return "";
  return String(pattern).replace(/_/g, " ").toLowerCase();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const { isAdmin, learners, conceptSubject, selectedSubject, selectedLearnerId } =
    useDashboardFilter();

  const [overview, setOverview] = useState(null);
  const [mastery, setMastery] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [openEvidenceId, setOpenEvidenceId] = useState(null);
  const [openGapId, setOpenGapId] = useState(null);

  // ── Muat analitik untuk learner terpilih ──
  useEffect(() => {
    if (!selectedLearnerId) return undefined;
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError("");

      if (isAdmin) {
        try {
          const res = await adminUsersApi.getAnalytics(selectedLearnerId);
          if (!isMounted) return;
          const d = res?.data || {};
          setOverview(d.overview || null);
          setMastery(Array.isArray(d.mastery) ? d.mastery : []);
          setGaps(Array.isArray(d.gaps) ? d.gaps : []);
          setRecommendations(Array.isArray(d.recommendations) ? d.recommendations : []);
        } catch (e) {
          if (!isMounted) return;
          setError(e?.message || "Gagal memuat analitik siswa.");
        } finally {
          if (isMounted) setIsLoading(false);
        }
        return;
      }

      const [histRes, masteryRes, gapsRes, recsRes] = await Promise.allSettled([
        historyApi.getHistory({ limit: 20 }),
        masteryApi.getSummary(),
        gapsApi.list(),
        recommendationsApi.list(),
      ]);
      if (!isMounted) return;

      if (histRes.status === "fulfilled") setOverview(histRes.value?.data?.overview || null);
      if (masteryRes.status === "fulfilled")
        setMastery(Array.isArray(masteryRes.value?.data) ? masteryRes.value.data : []);
      if (gapsRes.status === "fulfilled")
        setGaps(Array.isArray(gapsRes.value?.data) ? gapsRes.value.data : []);
      if (recsRes.status === "fulfilled")
        setRecommendations(Array.isArray(recsRes.value?.data) ? recsRes.value.data : []);

      const allFailed = [histRes, masteryRes, gapsRes, recsRes].every(
        (r) => r.status === "rejected"
      );
      if (allFailed) setError("Gagal memuat data analitik.");
      setIsLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, selectedLearnerId]);

  // ── Filter kelas (subject) berbasis peta konsep ──
  const matchSubject = (conceptId) => {
    if (!selectedSubject) return true;
    if (!conceptId) return true;
    return conceptSubject[conceptId] === selectedSubject;
  };

  const filteredMastery = mastery.filter((m) => matchSubject(m.concept_id));
  const filteredGaps = gaps.filter((g) => matchSubject(g.concept_id));
  const filteredRecommendations = recommendations.filter((r) => matchSubject(r.concept_id));

  const assessedRows = filteredMastery.filter(
    (m) => m.mastery_score !== null && m.mastery_score !== undefined
  );

  const overallAccuracy = assessedRows.length
    ? Math.round(
        assessedRows.reduce((sum, m) => sum + safeNumber(m.mastery_score), 0) /
          assessedRows.length
      )
    : 0;

  const totalConcepts = assessedRows.length;

  const metrics = [
    {
      label: "Penguasaan",
      value: `${overallAccuracy}%`,
      hint: `${totalConcepts} konsep berbukti diukur`,
    },
    {
      label: "Kesenjangan",
      value: String(filteredGaps.length),
      hint: "dugaan / terkonfirmasi lemah",
    },
    {
      label: "Status Remediasi",
      value: filteredRecommendations.length ? "Aktif" : "Kosong",
      hint: `${filteredRecommendations.length} langkah tindak lanjut`,
    },
  ];

  const evidenceRows = (
    filteredMastery.length
      ? filteredMastery
      : (overview?.concepts_detail || [])
          .filter((c) => matchSubject(c.id))
          .map((c) => ({
            concept_id: c.id,
            concept: c.name,
            mastery_score: c.mastery_score,
            evidence_count: c.evidence_count,
          }))
  )
    .slice()
    .sort((a, b) => safeNumber(b.evidence_count) - safeNumber(a.evidence_count))
    .slice(0, 6);

  const topGaps = filteredGaps.slice(0, 8);

  const today = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const learnerName = isAdmin
    ? learners.find((l) => l.id === selectedLearnerId)?.name || "Siswa"
    : user?.name || "Anda";

  const toggleEvidence = (id) => setOpenEvidenceId((prev) => (prev === id ? null : id));
  const toggleGap = (id) => setOpenGapId((prev) => (prev === id ? null : id));

  const detailCell = "border-t pt-4";

  return (
    <PageContainer>
      <PageHeader
        badge={`Xora Analytics · ${today}`}
        title="Analitik Asesmen & Kesenjangan Belajar"
        description={
          <>
            Menghubungkan bukti pekerjaan{" "}
            <strong className={cx("font-bold", INK)}>{learnerName}</strong> dengan konsep yang
            masih lemah dan langkah tindak lanjut.
          </>
        }
        actions={
          <>
            <GhostButton onClick={() => window.print()} className="w-auto">
              Ekspor Laporan
            </GhostButton>
            {isLoading ? <MicroMeta>Memuat data…</MicroMeta> : null}
          </>
        }
      />

      {error ? (
        <Alert tone="error" className="mt-8">
          {error}
        </Alert>
      ) : null}

      {/* 01 — Ringkasan */}
      <SectionHeader id="summary" index="01" title="Ringkasan Asesmen" meta={learnerName} />
      <Reveal>
        <Grid cols={3} className="mt-8">
          {metrics.map((m) => (
            <MetricCell key={m.label} label={m.label} value={m.value} hint={m.hint} />
          ))}
        </Grid>
      </Reveal>

      {/* 02 — Analisis bukti belajar */}
      <SectionHeader
        id="evidence"
        index="02"
        title="Analisis Bukti Belajar"
        meta={`${evidenceRows.length} konsep`}
      />
      <Reveal>
      {evidenceRows.length === 0 ? (
        <p className={cx("mt-8 text-[13px]", MUTED)}>
          Belum ada bukti. Mulai asesmen untuk menghasilkan data.
        </p>
      ) : (
        <div className="mt-2">
          {evidenceRows.map((row) => {
            const rawScore = row.mastery_score;
            const score = rawScore === null || rawScore === undefined ? null : safeNumber(rawScore);
            const isOpen = openEvidenceId === row.concept_id;
            return (
              <AccordionRow
                key={row.concept_id}
                open={isOpen}
                onToggle={() => toggleEvidence(row.concept_id)}
                summary={
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className={cx("truncate text-[15px] font-bold", INK)}>
                      {row.concept || row.concept_name || "Konsep"}
                    </span>
                    <MicroMeta>{safeNumber(row.evidence_count)} bukti</MicroMeta>
                  </span>
                }
                trailing={
                  <span
                    className={cx(
                      "text-[15px] font-bold tabular-nums",
                      score === null ? MUTED : INK
                    )}
                  >
                    {score === null ? "—" : `${score}%`}
                  </span>
                }
              >
                <div className="grid grid-cols-3 gap-x-6 gap-y-6">
                  <div className={cx(detailCell, HAIRLINE)}>
                    <MicroMeta>Skor</MicroMeta>
                    <p className={cx("mt-1.5 text-[15px] font-bold tabular-nums", INK)}>
                      {score === null ? "—" : `${score}%`}
                    </p>
                  </div>
                  <div className={cx(detailCell, HAIRLINE)}>
                    <MicroMeta>Bukti</MicroMeta>
                    <p className={cx("mt-1.5 text-[15px] font-bold tabular-nums", INK)}>
                      {safeNumber(row.evidence_count)}
                    </p>
                  </div>
                  <div className={cx(detailCell, HAIRLINE)}>
                    <MicroMeta>Status</MicroMeta>
                    <p className={cx("mt-1.5 text-[15px] font-bold", INK)}>
                      {score === null ? "—" : score >= 70 ? "KUAT" : "PERLU LATIHAN"}
                    </p>
                  </div>
                </div>
                <ProgressBar value={score || 0} showPercent={false} className="mt-5" />
              </AccordionRow>
            );
          })}
        </div>
      )}
      </Reveal>

      {/* 03 — Matriks kesenjangan */}
      <SectionHeader
        id="gap"
        index="03"
        title="Matriks Kesenjangan"
        meta={`${topGaps.length} aktif`}
      />
      <Reveal>
      {topGaps.length === 0 ? (
        <p className={cx("mt-8 text-[13px]", MUTED)}>
          Tidak ada kesenjangan aktif. Pertahankan dan lanjut ke materi berikutnya.
        </p>
      ) : (
        <div className="mt-2">
          {topGaps.map((gap) => {
            const score = safeNumber(gap.mastery_score);
            const confidence = safeNumber(gap.evidence_confidence);
            const isOpen = openGapId === gap.concept_id;
            const tone = gapTone(gap.gap_status);
            return (
              <AccordionRow
                key={gap.concept_id}
                open={isOpen}
                onToggle={() => toggleGap(gap.concept_id)}
                summary={
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className={cx("truncate text-[15px] font-bold", INK)}>
                      {gap.concept_name}
                    </span>
                    <MicroMeta>{gapStatusLabel(gap.gap_status)}</MicroMeta>
                  </span>
                }
                trailing={
                  <>
                    <SeverityBadge tone={tone}>{gapSeverityShort(gap.gap_status)}</SeverityBadge>
                    <span className={cx("hidden text-[15px] font-bold tabular-nums sm:inline", INK)}>
                      {score}%
                    </span>
                    <IconChevronDown
                      size={16}
                      className={cx("transition-transform", isOpen && "rotate-180")}
                    />
                  </>
                }
              >
                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  <div className={cx(detailCell, HAIRLINE)}>
                    <MicroMeta>Pola miskonsepsi</MicroMeta>
                    <p className={cx("mt-1.5 text-[13px] leading-relaxed", INK)}>
                      {humanizePattern(gap.primary_error_pattern) || "—"}
                    </p>
                  </div>
                  <div className={cx(detailCell, HAIRLINE)}>
                    <MicroMeta>Dugaan akar masalah</MicroMeta>
                    <p className={cx("mt-1.5 text-[13px] leading-relaxed", INK)}>
                      {gap.candidate_root_cause_name || "—"}
                    </p>
                  </div>
                  <div className={cx(detailCell, HAIRLINE)}>
                    <MicroMeta>Keyakinan bukti</MicroMeta>
                    <p className={cx("mt-1.5 text-[15px] font-bold tabular-nums", INK)}>
                      {confidence}%
                    </p>
                    <ProgressBar value={confidence} showPercent={false} size="sm" className="mt-3" />
                  </div>
                  <div className={cx(detailCell, HAIRLINE)}>
                    <MicroMeta>Jumlah bukti</MicroMeta>
                    <p className={cx("mt-1.5 text-[15px] font-bold tabular-nums", INK)}>
                      {safeNumber(gap.evidence_count)}
                    </p>
                  </div>
                </div>
              </AccordionRow>
            );
          })}
        </div>
      )}
      </Reveal>

      {/* 04 — Program remedi */}
      <SectionHeader
        id="remediation"
        index="04"
        title="Program Remedi"
        meta={`${filteredRecommendations.length} langkah`}
      />
      <Reveal>
      {filteredRecommendations.length === 0 ? (
        <p className={cx("mt-8 text-[13px]", MUTED)}>
          Belum ada rekomendasi aktif. Selesaikan asesmen agar AI menyusun rencana.
        </p>
      ) : (
        <div className="mt-2">
          {filteredRecommendations.map((rec, i) => (
            <ChecklistRow
              key={rec.id}
              marker={String(i + 1).padStart(2, "0")}
              title={rec.concept_name || "Konsep"}
              description={rec.reason || "Rencana tindak lanjut."}
            >
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                <MicroMeta>{actionTypeLabel(rec.action_type)}</MicroMeta>
                <MicroMeta>Prioritas P{rec.priority ?? "-"}</MicroMeta>
              </div>
              <div className="mt-5">
                <PrimaryButton
                  type="button"
                  onClick={() =>
                    navigate(
                      rec.action_type && String(rec.action_type).includes("VERIFICATION")
                        ? `/verification/${rec.diagnostic_id}`
                        : `/practice/${rec.id}`
                    )
                  }
                >
                  Buka Modul
                  <IconArrowRight size={16} />
                </PrimaryButton>
              </div>
            </ChecklistRow>
          ))}
        </div>
      )}
      </Reveal>
    </PageContainer>
  );
}
