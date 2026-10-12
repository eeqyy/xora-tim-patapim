// ============================================================
// XORA — Dashboard Analitik (mobile-first)
// frontend/src/pages/DashboardPage.jsx
// ------------------------------------------------------------
// Struktur mobile-first:
//   - pemilih "Kelas" (subject) & "Siswa" (learner) yang sticky;
//   - ringkasan metrik sebagai carousel (scroll horizontal) di
//     mobile, grid 3 kolom di desktop;
//   - matriks gap sebagai kartu akordeon (tap untuk membuka);
//   - rekomendasi remediasi dengan CTA selebar penuh (>=48px).
//
// Sumber data:
//   - Learner  : endpoint pribadi (history/mastery/gaps/recommendations);
//   - Admin    : GET /api/admin/users/:id/analytics (read-only, learner
//                yang dipilih). Filter kelas dilakukan di klien dengan
//     memetakan concept_id -> subject_id (tabel concepts punya subject_id).
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import {
  historyApi,
  masteryApi,
  gapsApi,
  recommendationsApi,
  subjectsApi,
  conceptsApi,
  adminUsersApi,
} from "../services/api";
import { IconChevronDown, IconArrowRight } from "../components/Icons";

const SECTION_LINKS = [
  { id: "summary", label: "Dashboard" },
  { id: "evidence", label: "Evidence" },
  { id: "gap", label: "Gaps" },
  { id: "remediation", label: "Remediation" },
];

const SUBJECT_KEY = "xora_dashboard_subject";
const LEARNER_KEY = "xora_dashboard_learner";

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function readSaved(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function saveValue(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // Abaikan error storage.
  }
}

function gapStatusLabel(status) {
  switch (status) {
    case "CONFIRMED_GAP":
      return "Kesenjangan terkonfirmasi";
    case "POSSIBLE_GAP":
      return "Perlu verifikasi diagnostik";
    case "IN_PRACTICE":
      return "Sedang latihan pemantapan";
    case "MASTERED":
      return "Sudah dikuasai";
    default:
      return status ? String(status).replace(/_/g, " ").toLowerCase() : "Tidak diketahui";
  }
}

function gapTone(status) {
  switch (status) {
    case "CONFIRMED":
      return "error";
    case "POSSIBLE_GAP":
    case "REJECTED":
      return "warning";
    case "IN_PRACTICE":
    case "VERIFICATION":
      return "info";
    default:
      return "neutral";
  }
}

function actionTypeLabel(type) {
  switch (type) {
    case "RUN_DIAGNOSTIC":
      return "Verifikasi Diagnostik";
    case "PRACTICE":
    case "RUN_PRACTICE":
      return "Modul Latihan";
    case "REMEDIAL":
      return "Modul Remediasi";
    default:
      return type ? String(type).replace(/_/g, " ") : "Rekomendasi";
  }
}

function targetUrlForAction(rec) {
  return rec.action_type === "RUN_DIAGNOSTIC"
    ? `/verification/${rec.diagnostic_id}`
    : `/practice/${rec.id}`;
}

function humanizePattern(pattern) {
  if (!pattern) return null;
  return String(pattern).replace(/_/g, " ").toLowerCase();
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();

  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [mastery, setMastery] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [openGapId, setOpenGapId] = useState(null);

  // Pemilih kelas & siswa.
  const [subjects, setSubjects] = useState([]);
  const [learners, setLearners] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(() => readSaved(SUBJECT_KEY));
  const [selectedLearnerId, setSelectedLearnerId] = useState(user?.id || "");
  const [conceptSubject, setConceptSubject] = useState({});

  // ── Muat referensi: kelas (subject), konsep, dan daftar siswa ──
  useEffect(() => {
    let isMounted = true;

    const loadRefs = async () => {
      const [subjRes, conceptRes, learnersRes] = await Promise.allSettled([
        subjectsApi.getAll(),
        conceptsApi.getAll(),
        isAdmin ? adminUsersApi.list({ role: "LEARNER", limit: 100 }) : Promise.resolve(null),
      ]);

      if (!isMounted) return;

      if (subjRes.status === "fulfilled") {
        setSubjects(Array.isArray(subjRes.value?.data) ? subjRes.value.data : []);
      }
      if (conceptRes.status === "fulfilled") {
        const map = {};
        (conceptRes.value?.data || []).forEach((c) => {
          map[c.id] = c.subject_id;
        });
        setConceptSubject(map);
      }

      if (isAdmin) {
        const payload =
          learnersRes.status === "fulfilled" ? learnersRes.value?.data : null;
        const list = Array.isArray(payload) ? payload : payload?.items || [];
        setLearners(list);
        const saved = readSaved(LEARNER_KEY);
        const valid = saved && list.some((l) => l.id === saved);
        setSelectedLearnerId(valid ? saved : list[0]?.id || "");
      }
    };

    loadRefs();
    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  // ── Muat analitik untuk siswa terpilih ──
  useEffect(() => {
    if (!selectedLearnerId) return undefined;
    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      // Admin: ambil ringkasan learner lewat endpoint analitik admin.
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
          setError(e?.message || "Gagal memuat analitik siswa. Pilih siswa lain atau coba lagi.");
        } finally {
          if (isMounted) setIsLoading(false);
        }
        return;
      }

      // Learner: pakai endpoint per-pengguna.
      const [histRes, masteryRes, gapsRes, recsRes] = await Promise.allSettled([
        historyApi.getHistory({ limit: 20 }),
        masteryApi.getSummary(),
        gapsApi.list(),
        recommendationsApi.list(),
      ]);

      if (!isMounted) return;

      if (histRes.status === "fulfilled") {
        setOverview(histRes.value?.data?.overview || null);
      }
      if (masteryRes.status === "fulfilled") {
        setMastery(Array.isArray(masteryRes.value?.data) ? masteryRes.value.data : []);
      }
      if (gapsRes.status === "fulfilled") {
        setGaps(Array.isArray(gapsRes.value?.data) ? gapsRes.value.data : []);
      }
      if (recsRes.status === "fulfilled") {
        setRecommendations(Array.isArray(recsRes.value?.data) ? recsRes.value.data : []);
      }

      const allFailed = [histRes, masteryRes, gapsRes, recsRes].every(
        (r) => r.status === "rejected"
      );
      if (allFailed) {
        setError("Gagal memuat data analitik. Pastikan Anda login sebagai learner.");
      }

      setIsLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, selectedLearnerId]);

  // Persist pilihan.
  useEffect(() => {
    saveValue(SUBJECT_KEY, selectedSubject);
  }, [selectedSubject]);

  useEffect(() => {
    if (isAdmin) saveValue(LEARNER_KEY, selectedLearnerId);
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

  const masteredCount = assessedRows.filter((m) => safeNumber(m.mastery_score) >= 70).length;
  const totalConcepts = assessedRows.length;
  const readiness = totalConcepts ? Math.round((masteredCount / totalConcepts) * 100) : 0;

  const metrics = [
    {
      label: "Akurasi Keseluruhan",
      value: `${overallAccuracy}%`,
      hint: `${totalConcepts} konsep berbukti diukur`,
    },
    {
      label: "Kesenjangan Aktif",
      value: String(filteredGaps.length),
      hint: "Dugaan/terkonfirmasi lemah",
    },
    {
      label: "Kesiapan Remediasi",
      value: `${readiness}%`,
      hint: `${masteredCount} dari ${totalConcepts} konsep dikuasai`,
    },
  ];

  const evidenceRows = (filteredMastery.length
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

  const toggleGap = (conceptId) => {
    setOpenGapId((prev) => (prev === conceptId ? null : conceptId));
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleLearnerChange = (e) => {
    setSelectedLearnerId(e.target.value);
  };

  const selectedLearner = learners.find((l) => l.id === selectedLearnerId);

  return (
    <div className="dashboard">
      {/* Sub-navigasi section */}
      <div className="dash-subnav">
        <div className="dash-subnav-brand">
          <span className="brand-dot" aria-hidden="true" />
          <span className="dash-eyebrow">Xora Analytics</span>
        </div>
        <nav className="dash-subnav-links" aria-label="Bagian dashboard">
          {SECTION_LINKS.map((link) => (
            <a key={link.id} href={`#${link.id}`} className="dash-subnav-link">
              {link.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Pemilih kelas & siswa */}
      <div className="dash-filters">
        <label className="dash-field">
          <span className="dash-field-label">Kelas</span>
          <select
            className="dash-select"
            value={selectedSubject}
            onChange={handleSubjectChange}
          >
            <option value="">Semua Kelas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="dash-field">
          <span className="dash-field-label">Siswa</span>
          {isAdmin ? (
            <select
              className="dash-select"
              value={selectedLearnerId}
              onChange={handleLearnerChange}
              disabled={learners.length === 0}
            >
              {learners.length === 0 ? (
                <option value="">Tidak ada siswa</option>
              ) : (
                learners.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} · {l.email}
                  </option>
                ))
              )}
            </select>
          ) : (
            <select className="dash-select" value={user?.id || ""} disabled>
              <option value={user?.id || ""}>{user?.name || "Saya"}</option>
            </select>
          )}
        </label>
      </div>

      {/* Ringkasan eksekutif */}
      <section id="summary" className="dash-section">
        <p className="dash-eyebrow">
          {today} · Ringkasan{selectedSubject ? " per Kelas" : ""}
        </p>
        <h1 className="dash-title">
          Analisis Bukti Belajar <span className="dash-title-accent">&amp;</span> Kesenjangan Konsep
        </h1>
        <p className="dash-lead">
          Ringkasan untuk <strong>{isAdmin ? selectedLearner?.name || "Siswa" : user?.name || "Siswa"}</strong>{" "}
          — menghubungkan bukti pekerjaan, konsep yang masih lemah, dan rencana tindak lanjut.
        </p>

        <div className="metric-carousel" role="list" aria-label="Ringkasan metrik">
          {metrics.map((m) => (
            <div className="metric-card" role="listitem" key={m.label}>
              <p className="metric-card-label">{m.label}</p>
              <p className="metric-card-value">{m.value}</p>
              <p className="metric-card-hint">{m.hint}</p>
            </div>
          ))}
        </div>
      </section>

      {error && <div className="dash-note dash-note-error">{error}</div>}

      {isLoading ? (
        <div className="dash-note">Memuat analitik bukti belajar…</div>
      ) : (
        <>
          <div className="dash-split">
            <section id="evidence" className="dash-panel">
              <p className="dash-eyebrow">Learning Evidence</p>
              <h2 className="dash-panel-title">Bukti Pembelajaran</h2>
              <p className="dash-panel-sub">
                Sampel pekerjaan dan jejak asesmen yang menjadi dasar analisis.
              </p>

              <div className="evidence-list">
                {evidenceRows.length === 0 ? (
                  <p className="dash-empty">
                    Belum ada bukti belajar. Mulai asesmen untuk menghasilkan data.
                  </p>
                ) : (
                  evidenceRows.map((row) => {
                    const score =
                      row.mastery_score === null || row.mastery_score === undefined
                        ? null
                        : safeNumber(row.mastery_score);
                    return (
                      <div className="evidence-row" key={row.concept_id}>
                        <div className="evidence-row-head">
                          <span className="evidence-name">
                            {row.concept || row.concept_name || "Konsep"}
                          </span>
                          <span className="evidence-count">
                            {safeNumber(row.evidence_count)} bukti
                          </span>
                        </div>
                        <div className="evidence-bar">
                          <div className="evidence-track">
                            <div
                              className="evidence-fill"
                              style={{ width: `${score === null ? 0 : Math.min(100, score)}%` }}
                            />
                          </div>
                          <span className="evidence-score">
                            {score === null ? "—" : `${score}%`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <section id="gap" className="dash-panel">
              <p className="dash-eyebrow">AI Gap Analysis</p>
              <h2 className="dash-panel-title">Matriks Kesenjangan</h2>
              <p className="dash-panel-sub">
                Ketuk kartu untuk melihat pola kesalahan, keyakinan data, dan tingkat kepentingan.
              </p>

              <div className="gap-accordion">
                {topGaps.length === 0 ? (
                  <p className="dash-empty">
                    Tidak ada kesenjangan aktif. Pertahankan dan lanjutkan ke materi berikutnya.
                  </p>
                ) : (
                  topGaps.map((gap) => {
                    const score = safeNumber(gap.mastery_score);
                    const confidence = safeNumber(gap.evidence_confidence);
                    const isOpen = openGapId === gap.concept_id;
                    const severity = gapStatusLabel(gap.gap_status);
                    const tone = gapTone(gap.gap_status);
                    return (
                      <div
                        className={`gap-item ${isOpen ? "gap-item-open" : ""}`}
                        key={gap.concept_id}
                      >
                        <button
                          type="button"
                          className="gap-summary"
                          aria-expanded={isOpen}
                          onClick={() => toggleGap(gap.concept_id)}
                        >
                          <span className="gap-summary-text">
                            <span className="gap-name">{gap.concept_name}</span>
                            <span className="gap-sub">{severity}</span>
                          </span>
                          <span className="gap-score">{score}%</span>
                          <IconChevronDown className="gap-chevron" size={18} />
                        </button>

                        {isOpen && (
                          <div className="gap-body">
                            <div className="gap-meta">
                              <span className={`gap-badge gap-badge-${tone}`}>{severity}</span>
                              <span className="gap-badge gap-badge-neutral">
                                {safeNumber(gap.evidence_count)} bukti
                              </span>
                            </div>

                            {humanizePattern(gap.primary_error_pattern) && (
                              <p className="gap-detail">
                                <strong>Pola kesalahan utama:</strong>{" "}
                                {humanizePattern(gap.primary_error_pattern)}
                              </p>
                            )}

                            {gap.candidate_root_cause_name && (
                              <p className="gap-detail">
                                <strong>Dugaan akar masalah:</strong>{" "}
                                {gap.candidate_root_cause_name}
                              </p>
                            )}

                            <p className="gap-detail">
                              <strong>Keyakinan data:</strong> {confidence}%
                            </p>
                            <div className="gap-conf-track">
                              <div
                                className="gap-conf-fill"
                                style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </div>

          <section id="remediation" className="dash-section">
            <div className="remediation-header">
              <div>
                <p className="dash-eyebrow">Targeted Remediation</p>
                <h2 className="dash-panel-title">Rekomendasi Remediasi</h2>
              </div>
              <button
                type="button"
                className="remediation-export"
                onClick={() => window.print()}
              >
                Export Report
                <IconArrowRight size={15} />
              </button>
            </div>

            {filteredRecommendations.length === 0 ? (
              <div className="dash-note">
                Belum ada rekomendasi remediasi aktif. Selesaikan asesmen agar AI dapat menyusun
                rencana tindak lanjut.
              </div>
            ) : (
              <div className="remediation-grid">
                {filteredRecommendations.map((rec) => (
                  <article key={rec.id} className="remediation-card">
                    <div>
                      <div className="remediation-tag-row">
                        <span className="remediation-type">{actionTypeLabel(rec.action_type)}</span>
                        <span className="remediation-priority">P{rec.priority ?? "-"}</span>
                      </div>
                      <h3 className="remediation-title">{rec.concept_name || "Konsep"}</h3>
                      <p className="remediation-desc">{rec.reason || "Rencana tindak lanjut."}</p>
                    </div>
                    <button
                      type="button"
                      className="remediation-cta"
                      onClick={() => navigate(targetUrlForAction(rec))}
                    >
                      Buka Modul
                      <IconArrowRight size={16} />
                    </button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
