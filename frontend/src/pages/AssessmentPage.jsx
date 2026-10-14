// ============================================================
// XOLEARN — Assessment Page (Pengerjaan Asesmen)
// Editorial Grid System · Flat · Token-driven
// frontend/src/pages/AssessmentPage.jsx
// ------------------------------------------------------------
// Logika data (state, useEffect, timer, API, pemilihan jawaban,
// submit/validasi, aria, dan teks) tidak berubah — hanya
// markup/className/struktur visual yang dimigrasi.
// ============================================================

import React, { useEffect, useState, useMemo } from "react";
import { assessmentsApi, diagnosticsApi, recommendationsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  PageHeader,
  GlassPanel,
  Grid,
  GridCell,
  StatusBadge,
  PrimaryButton,
  OutlineButton,
  Button,
  ProgressBar,
  Alert,
  LoadingState,
  ErrorState,
  MicroMeta,
  HAIRLINE,
  INK,
  MUTED,
  cx,
} from "../components";
import {
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconBook,
  IconTarget,
  IconInfo,
  IconLock,
  IconAlertTriangle,
} from "../components/Icons";

export default function AssessmentPage({
  assessmentId,
  diagnosticId,
  actionId,
  isVerification = false,
  isPractice = false,
  isReassessment = false,
}) {
  const { navigate } = useRouter();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [practiceData, setPracticeData] = useState(null);

  // Flow State: pre-start (false) vs answering (true) vs reviewing (true)
  const [isStarted, setIsStarted] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Question navigation and answer states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [question_id]: "A" | { [itemId]: targetId } }
  const [selectedDragItemId, setSelectedDragItemId] = useState(null);
  const [startTimes, setStartTimes] = useState({}); // { [question_id]: timestamp }

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // 1. Load assessment metadata & questions (filtering out ESSAY questions)
  useEffect(() => {
    let cancelled = false;

    async function initAssessment() {
      setIsLoading(true);
      setLoadError(null);
      try {
        if (isVerification || diagnosticId) {
          const vRes = await diagnosticsApi.startVerification(diagnosticId);
          if (cancelled) return;
          if (!vRes?.data?.assessment?.id || !vRes?.data?.attempt?.id) {
            throw new Error("Gagal menginisiasi sesi verifikasi diagnostik.");
          }
          const vData = vRes.data;
          setVerificationData(vData);
          setAssessment(vData.assessment);
          setAttempt(vData.attempt);

          const qRes = await assessmentsApi.getQuestions(vData.assessment.id);
          if (cancelled) return;
          const rawList = Array.isArray(qRes?.data) ? qRes.data : [];
          // Filter out essay questions
          const qList = rawList.filter((q) => q.type !== "ESSAY");
          setQuestions(qList);

          if (qList.length === 0) {
            throw new Error("Asesmen verifikasi ini belum memiliki pertanyaan yang tersedia untuk dikerjakan.");
          }
        } else if (isPractice || actionId) {
          const pRes = await recommendationsApi.start(actionId);
          if (cancelled) return;
          if (!pRes?.data?.assessment?.id || !pRes?.data?.attempt?.id) {
            throw new Error("Gagal menginisiasi sesi latihan remediasi.");
          }
          const pData = pRes.data;
          setPracticeData(pData);
          setAssessment(pData.assessment);
          setAttempt(pData.attempt);

          let rawList = Array.isArray(pData.questions) ? pData.questions : [];
          if (rawList.length === 0) {
            const qRes = await assessmentsApi.getQuestions(pData.assessment.id);
            if (cancelled) return;
            rawList = Array.isArray(qRes?.data) ? qRes.data : [];
          }
          const qList = rawList.filter((q) => q.type !== "ESSAY");
          setQuestions(qList);

          if (qList.length === 0) {
            throw new Error("Asesmen latihan ini belum memiliki pertanyaan yang tersedia untuk dikerjakan.");
          }
        } else if (isReassessment && assessmentId) {
          const rRes = await assessmentsApi.reassess(assessmentId);
          if (cancelled) return;
          if (!rRes?.data?.assessment?.id || !rRes?.data?.attempt?.id) {
            throw new Error("Gagal menginisiasi sesi uji ulang (re-assessment).");
          }
          const rData = rRes.data;
          setAssessment(rData.assessment);
          setAttempt(rData.attempt);

          let rawList = Array.isArray(rData.questions) ? rData.questions : [];
          if (rawList.length === 0) {
            const qRes = await assessmentsApi.getQuestions(rData.assessment.id);
            if (cancelled) return;
            rawList = Array.isArray(qRes?.data) ? qRes.data : [];
          }
          const qList = rawList.filter((q) => q.type !== "ESSAY");
          setQuestions(qList);

          if (qList.length === 0) {
            throw new Error("Asesmen uji ulang ini belum memiliki pertanyaan yang tersedia untuk dikerjakan.");
          }
        } else if (assessmentId) {
          const aRes = await assessmentsApi.getById(assessmentId);
          if (cancelled) return;
          if (!aRes?.data) {
            throw new Error("Asesmen pembelajaran tidak ditemukan.");
          }
          const asmtData = aRes.data;
          setAssessment(asmtData);

          const activeAttId = asmtData.learner_status?.active_attempt_id || null;
          if (activeAttId) {
            setAttempt({ id: activeAttId, assessment_id: assessmentId, status: "IN_PROGRESS" });
          }
          const qRes = await assessmentsApi.getQuestions(assessmentId, activeAttId);
          if (cancelled) return;
          const rawList = Array.isArray(qRes?.data) ? qRes.data : [];
          const qList = rawList.filter((q) => q.type !== "ESSAY");
          setQuestions(qList);

          if (qList.length === 0) {
            throw new Error("Asesmen ini belum memiliki pertanyaan non-esai yang tersedia untuk dikerjakan.");
          }
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(err.message || "Gagal memuat data asesmen.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    initAssessment();
    return () => {
      cancelled = true;
    };
  }, [assessmentId, diagnosticId, actionId, isVerification, isPractice, isReassessment]);

  // Start or resume attempt
  const handleStartAttempt = async () => {
    if (!assessment) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await assessmentsApi.startAttempt(assessment.id);
      if (!res?.data?.id) {
        throw new Error("Gagal memulai sesi pengerjaan asesmen.");
      }
      const newAttempt = res.data;
      setAttempt(newAttempt);

      // Re-fetch questions using attemptId to ensure exact snapshot & randomized order
      const qRes = await assessmentsApi.getQuestions(assessment.id, newAttempt.id);
      const rawList = Array.isArray(qRes?.data) ? qRes.data : [];
      const qList = rawList.filter((q) => q.type !== "ESSAY");
      if (qList.length > 0) {
        setQuestions(qList);
      }

      setIsStarted(true);
      setIsReviewing(false);

      const targetFirstQ = qList.length > 0 ? qList[0] : (questions.length > 0 ? questions[0] : null);
      if (targetFirstQ) {
        setStartTimes({ [targetFirstQ.id]: Date.now() });
      }
    } catch (err) {
      setSubmitError(err.message || "Gagal memulai pengerjaan asesmen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartVerificationSession = () => {
    if (!attempt || !questions.length) return;
    setIsStarted(true);
    setIsReviewing(false);
    setStartTimes({ [questions[0].id]: Date.now() });
  };

  const handleStartPracticeSession = () => {
    if (!attempt || !questions.length) return;
    setIsStarted(true);
    setIsReviewing(false);
    setStartTimes({ [questions[0].id]: Date.now() });
  };

  const recordTimeSpent = (questionId) => {
    const started = startTimes[questionId];
    if (!started) return 0;
    return Math.max(1, Math.round((Date.now() - started) / 1000));
  };

  const handleSelectOption = (questionId, optionLetter) => {
    if (submitError) setSubmitError(null);
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  const handleAssignDragItem = (questionId, itemId, targetId) => {
    if (submitError) setSubmitError(null);
    setAnswers((prev) => {
      const existing = typeof prev[questionId] === "object" && prev[questionId] ? { ...prev[questionId] } : {};
      Object.keys(existing).forEach((k) => {
        if (existing[k] === targetId) delete existing[k];
      });
      existing[itemId] = targetId;
      return {
        ...prev,
        [questionId]: existing,
      };
    });
  };

  const handleRemoveDragItem = (questionId, itemId) => {
    if (submitError) setSubmitError(null);
    setAnswers((prev) => {
      const existing = typeof prev[questionId] === "object" && prev[questionId] ? { ...prev[questionId] } : {};
      delete existing[itemId];
      return {
        ...prev,
        [questionId]: existing,
      };
    });
  };

  const handleResetDragItems = (questionId) => {
    if (submitError) setSubmitError(null);
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  const handleNext = () => {
    if (submitError) setSubmitError(null);
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      const nextQ = questions[nextIdx];
      if (nextQ && !startTimes[nextQ.id]) {
        setStartTimes((prev) => ({ ...prev, [nextQ.id]: Date.now() }));
      }
      setCurrentIndex(nextIdx);
    } else {
      setIsReviewing(true);
    }
  };

  const handlePrev = () => {
    if (submitError) setSubmitError(null);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleJumpToQuestion = (idx) => {
    if (submitError) setSubmitError(null);
    if (idx >= 0 && idx < questions.length) {
      const targetQ = questions[idx];
      if (targetQ && !startTimes[targetQ.id]) {
        setStartTimes((prev) => ({ ...prev, [targetQ.id]: Date.now() }));
      }
      setCurrentIndex(idx);
      setIsReviewing(false);
    }
  };

  // Final Submit Action
  const handleConfirmSubmit = async () => {
    if (!attempt?.id) {
      setSubmitError("ID sesi pengerjaan tidak valid.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setShowConfirmModal(false);

    try {
      const formattedAnswers = questions
        .map((q) => {
          const rawAns = answers[q.id];
          if (rawAns === undefined || rawAns === null || rawAns === "") {
            return null;
          }

          let selectedVal = null;
          let answerText = null;

          if (q.type === "DRAG_DROP") {
            if (typeof rawAns === "object" && Object.keys(rawAns).length > 0) {
              selectedVal = rawAns;
              answerText = JSON.stringify(rawAns);
            } else {
              return null;
            }
          } else {
            selectedVal = String(rawAns).trim();
            answerText = selectedVal;
          }

          return {
            question_id: q.id,
            selected: selectedVal,
            answer: selectedVal,
            answer_text: answerText,
            time_spent_seconds: recordTimeSpent(q.id),
          };
        })
        .filter(Boolean);

      const res = await assessmentsApi.submitAttempt(attempt.id, formattedAnswers);

      const targetAttemptId = res?.data?.attemptId || res?.data?.id || attempt.id;
      navigate(`/assessments/result/${targetAttemptId}`);
    } catch (err) {
      setSubmitError(err.message || "Gagal mengumpulkan jawaban asesmen.");
      setIsSubmitting(false);
    }
  };

  // Counts of answered questions
  const answeredTotal = useMemo(() => {
    return questions.filter((q) => {
      const val = answers[q.id];
      if (!val) return false;
      if (typeof val === "object") return Object.keys(val).length > 0;
      return String(val).trim() !== "";
    }).length;
  }, [questions, answers]);

  const unansweredTotal = questions.length - answeredTotal;

  if (isLoading) {
    return (
      <PageContainer maxWidth="normal">
        <LoadingState message="Memuat instrumen asesmen pembelajaran..." />
      </PageContainer>
    );
  }

  if (loadError || !assessment) {
    const isAuthError = loadError && (
      loadError.includes("bearer token") ||
      loadError.includes("token") ||
      loadError.includes("Unauthorized") ||
      loadError.includes("401") ||
      loadError.includes("expired session")
    );
    const isForbidden = loadError && (
      loadError.includes("403") ||
      loadError.includes("belum terbuka") ||
      loadError.includes("Forbidden")
    );
    const isStockEmpty = loadError && (
      loadError.includes("Stok") ||
      loadError.includes("belum memiliki pertanyaan")
    );

    let errorTitle = "Asesmen Tidak Tersedia";
    let errorMessage = loadError || "Asesmen tidak ditemukan.";
    let retryAction = () => navigate("/assessments");
    let retryText = "Kembali ke Daftar Asesmen";

    if (isAuthError) {
      errorTitle = "Sesi Belum Terautentikasi";
      errorMessage = "Sesi belajar Anda telah berakhir atau belum terautentikasi. Silakan masuk kembali.";
      retryAction = () => navigate("/login");
      retryText = "Masuk Kembali";
    } else if (isForbidden) {
      errorTitle = "Akses Belum Terbuka";
      errorMessage = loadError;
      retryAction = () => navigate("/assessments");
      retryText = "Kembali ke Daftar Asesmen";
    } else if (isStockEmpty) {
      errorTitle = "Bank Soal Belum Tersedia";
      errorMessage = loadError;
      retryAction = () => navigate("/assessments");
      retryText = "Kembali ke Daftar Asesmen";
    }

    return (
      <PageContainer maxWidth="normal">
        <ErrorState
          title={errorTitle}
          message={errorMessage}
          onRetry={retryAction}
          retryLabel={retryText}
        />
      </PageContainer>
    );
  }

  const isLocked = assessment.learner_status?.is_locked === true;
  const hasActiveSession = Boolean(assessment.learner_status?.active_attempt_id || attempt?.id);
  const coveredTopics = Array.isArray(assessment.covered_topics) ? assessment.covered_topics : [];

  // ============================================================
  // STAGE 1: PRE-START INSTRUCTION VIEW
  // ============================================================
  if (!isStarted) {
    const difficultyLabel = {
      EASY: "Mudah",
      MEDIUM: "Menengah",
      HARD: "Sulit",
    }[(assessment.level_difficulty || "EASY").toUpperCase()] || "Mudah";

    const typeLabel = isVerification
      ? "Verifikasi Diagnostik"
      : isPractice
      ? "Latihan Remediasi"
      : isReassessment
      ? "Uji Ulang (Re-Assessment)"
      : assessment.type === "DIAGNOSTIC"
      ? "Asesmen Campuran"
      : "Asesmen Materi";

    return (
      <PageContainer maxWidth="narrow">
        <PageHeader
          badge={
            <div className="flex flex-wrap items-center gap-3">
              <MicroMeta>{assessment.subject_name || "Materi Pembelajaran"}</MicroMeta>
              <span className={MUTED} aria-hidden="true">•</span>
              <StatusBadge status={assessment.level_difficulty || "EASY"} label={`Tingkat ${difficultyLabel}`} />
              {typeLabel && (
                <>
                  <span className={MUTED} aria-hidden="true">•</span>
                  <MicroMeta>{typeLabel}</MicroMeta>
                </>
              )}
            </div>
          }
          title={assessment.title}
          description="Pilihlah satu jawaban yang paling tepat untuk setiap soal. Anda dapat berpindah nomor soal kapan saja dan meninjau kelengkapan jawaban sebelum mengumpulkan hasil akhir."
        />

        {/* Quick Metrics (Only if available) */}
        <Grid cols={3} className="mt-8">
          {questions.length > 0 && (
            <GridCell className="flex flex-col gap-2">
              <MicroMeta className="flex items-center gap-1.5">
                <IconBook size={13} />
                Jumlah Soal
              </MicroMeta>
              <span className={cx("text-sm font-bold", INK)}>{questions.length} Soal</span>
            </GridCell>
          )}
          {assessment.duration_minutes ? (
            <GridCell className="flex flex-col gap-2">
              <MicroMeta className="flex items-center gap-1.5">
                <IconClock size={13} />
                Durasi Waktu
              </MicroMeta>
              <span className={cx("text-sm font-bold", INK)}>{assessment.duration_minutes} Menit</span>
            </GridCell>
          ) : null}
          {assessment.passing_score ? (
            <GridCell className="flex flex-col gap-2">
              <MicroMeta className="flex items-center gap-1.5">
                <IconTarget size={13} />
                Standar Kelulusan
              </MicroMeta>
              <span className={cx("text-sm font-bold", INK)}>{Math.round(assessment.passing_score)}%</span>
            </GridCell>
          ) : null}
        </Grid>

        {isLocked && (
          <Alert tone="info">
            <span className="flex items-start gap-2">
              <IconLock size={16} className="mt-0.5 shrink-0" />
              <span>
                <strong>Asesmen Terkunci:</strong>{" "}
                {assessment.learner_status?.lock_reason || "Selesaikan asesmen tingkat sebelumnya terlebih dahulu."}
              </span>
            </span>
          </Alert>
        )}

        {submitError && <Alert tone="error">{submitError}</Alert>}

        <GlassPanel
          className={cx(
            "mt-8 flex flex-col gap-3 border-t pt-6 md:flex-row md:items-center md:justify-between",
            HAIRLINE
          )}
        >
          <OutlineButton onClick={() => navigate("/assessments")}>
            Kembali ke Daftar
          </OutlineButton>

          {isLocked ? (
            <Button disabled variant="outline" icon={<IconLock size={16} />}>
              Belum Terbuka
            </Button>
          ) : (
            <PrimaryButton
              size="lg"
              onClick={
                isVerification
                  ? handleStartVerificationSession
                  : isPractice || isReassessment
                  ? handleStartPracticeSession
                  : handleStartAttempt
              }
              disabled={isSubmitting}
              loading={isSubmitting}
              iconRight={<IconArrowRight size={16} />}
            >
              {hasActiveSession ? "Lanjutkan Mengerjakan" : "Mulai Mengerjakan"}
            </PrimaryButton>
          )}
        </GlassPanel>
      </PageContainer>
    );
  }

  // ============================================================
  // STAGE 3: REVIEW SCREEN BEFORE FINAL SUBMISSION
  // ============================================================
  if (isReviewing) {
    return (
      <PageContainer maxWidth="normal">
        <GlassPanel variant="subtle" className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className={cx("text-xl font-extrabold tracking-tight md:text-2xl", INK)}>
                Tinjau Jawaban Asesmen
              </h2>
              <p className={cx("mt-1 text-[13px] leading-relaxed", MUTED)}>
                {assessment.title} • Periksa kembali jawaban Anda sebelum mengirimkan hasil akhir.
              </p>
            </div>
            <StatusBadge status={assessment.level_difficulty || "EASY"} />
          </div>
        </GlassPanel>

        {/* Stat Summary Box */}
        <Grid cols={2} className="mt-8">
          <GridCell className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <MicroMeta>Sudah Dijawab</MicroMeta>
              <span className={cx("text-2xl font-extrabold tracking-tight md:text-3xl", INK)}>
                {answeredTotal} Soal
              </span>
            </div>
            <StatusBadge variant="success" label="Lengkap" dot />
          </GridCell>

          <GridCell className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <MicroMeta>Belum Dijawab</MicroMeta>
              <span
                className={cx(
                  "text-2xl font-extrabold tracking-tight md:text-3xl",
                  unansweredTotal > 0 ? "text-accent" : MUTED
                )}
              >
                {unansweredTotal} Soal
              </span>
            </div>
            <StatusBadge
              variant={unansweredTotal > 0 ? "warning" : "success"}
              label={unansweredTotal > 0 ? "Belum Selesai" : "Semua Terjawab"}
            />
          </GridCell>
        </Grid>

        {/* Unanswered Alert Warning */}
        {unansweredTotal > 0 && (
          <Alert tone="info">
            <span className="flex items-start gap-2">
              <IconAlertTriangle size={18} className="mt-0.5 shrink-0 text-accent" />
              <span>
                <strong>Perhatian:</strong> Masih terdapat <strong>{unansweredTotal} soal</strong> yang belum Anda jawab. Soal yang kosong tidak akan mendapatkan poin.
              </span>
            </span>
          </Alert>
        )}

        {submitError && <Alert tone="error">{submitError}</Alert>}

        {/* Questions Grid Overview */}
        <div className={cx("mt-12 flex items-center justify-between gap-3 border-t pt-6", HAIRLINE)}>
          <h3 className={cx("text-[13px] font-extrabold uppercase tracking-[0.14em]", INK)}>
            Daftar Soal &amp; Jawaban Anda:
          </h3>
          <MicroMeta>{questions.length} SOAL</MicroMeta>
        </div>

        <Grid cols={3}>
          {questions.map((q, idx) => {
            const ans = answers[q.id];
            const isAnswered = ans && typeof ans === "object" ? Object.keys(ans).length > 0 : Boolean(ans);
            let answerDisplay = "Belum dijawab";

            if (isAnswered) {
              if (q.type === "DRAG_DROP") {
                answerDisplay = `${Object.keys(ans).length} item terpasang`;
              } else {
                answerDisplay = `Pilihan: ${ans}`;
              }
            }

            return (
              <GridCell
                key={q.id}
                className="flex cursor-pointer flex-col gap-3 hover:bg-cell dark:hover:bg-cell-dark"
                onClick={() => handleJumpToQuestion(idx)}
                role="button"
                tabIndex={0}
                title="Klik untuk membuka soal ini"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="tabular-nums text-[12px] font-bold uppercase tracking-widest text-accent">
                    Soal #{idx + 1}
                  </span>
                  <StatusBadge
                    variant={isAnswered ? "success" : "neutral"}
                    label={isAnswered ? "Terjawab" : "Kosong"}
                    dot={isAnswered}
                  />
                </div>
                <p className={cx("text-[13px] leading-relaxed", INK)}>
                  <strong>Jawaban:</strong> {answerDisplay}
                </p>
                <span className="mt-auto text-right text-[12px] font-bold text-accent">
                  Buka Soal →
                </span>
              </GridCell>
            );
          })}
        </Grid>

        {/* Review Bottom Actions */}
        <GlassPanel
          className={cx(
            "mt-8 flex flex-wrap items-center justify-between gap-3 border-t pt-6",
            HAIRLINE
          )}
        >
          <OutlineButton
            onClick={() => setIsReviewing(false)}
            icon={<IconArrowLeft size={16} />}
          >
            Kembali Mengerjakan
          </OutlineButton>

          <PrimaryButton
            size="lg"
            onClick={() => setShowConfirmModal(true)}
            disabled={isSubmitting}
            loading={isSubmitting}
            iconRight={<IconCheck size={16} />}
          >
            Kumpulkan Jawaban
          </PrimaryButton>
        </GlassPanel>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4" onClick={() => setShowConfirmModal(false)}>
            <div className={cx("w-full max-w-lg overflow-hidden rounded-3xl border bg-canvas dark:bg-canvas-dark", HAIRLINE)} onClick={(e) => e.stopPropagation()}>
              <h3 className={cx("border-b px-4 py-3 text-[13px] font-extrabold uppercase tracking-[0.14em] md:px-6", HAIRLINE, INK)}>
                Konfirmasi Pengumpulan Jawaban
              </h3>
              <div className="flex flex-col gap-4 p-4 md:px-6">
                <p className={cx("text-[13px] leading-relaxed", MUTED)}>
                  Apakah Anda yakin ingin mengumpulkan asesmen ini sekarang? Setelah dikumpulkan, hasil akan langsung dihitung dan jawaban tidak dapat diubah kembali.
                </p>

                {unansweredTotal > 0 && (
                  <Alert tone="info" className="border">
                    <span className="flex items-start gap-2">
                      <IconAlertTriangle size={16} className="mt-0.5 shrink-0 text-accent" />
                      <span>
                        Masih ada <strong>{unansweredTotal} soal belum dijawab</strong>. Jawaban yang kosong akan dihitung bernilai 0.
                      </span>
                    </span>
                  </Alert>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <OutlineButton
                    onClick={() => setShowConfirmModal(false)}
                    disabled={isSubmitting}
                  >
                    Periksa Kembali
                  </OutlineButton>
                  <PrimaryButton
                    onClick={handleConfirmSubmit}
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    iconRight={<IconCheck size={16} />}
                  >
                    Ya, Kumpulkan Sekarang
                  </PrimaryButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    );
  }

  // ============================================================
  // STAGE 2: ACTIVE QUESTION VIEW
  // ============================================================
  const currentQ = questions[currentIndex];
  const selectedChoice = answers[currentQ.id];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  // Drag & drop data helpers
  const currentMatches = (currentQ.type === "DRAG_DROP" && answers[currentQ.id] && typeof answers[currentQ.id] === "object")
    ? answers[currentQ.id]
    : {};
  const currentItems = Array.isArray(currentQ.items) ? currentQ.items : [];
  const currentTargets = Array.isArray(currentQ.targets) ? currentQ.targets : [];
  const availableItems = currentItems.filter((item) => !currentMatches[item.id]);

  const renderQuestionText = (text) => {
    if (!text) return null;
    if (!text.includes("```")) {
      return (
        <h2 className={cx("text-lg font-extrabold leading-snug tracking-tight md:text-xl", INK)}>
          {text}
        </h2>
      );
    }
    const parts = text.split(/(```[\s\S]*?```)/g);
    return (
      <div className="flex flex-col gap-3">
        {parts.map((part, idx) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const raw = part.slice(3, -3).trim();
            const newlineIdx = raw.indexOf("\n");
            let code = raw;
            if (newlineIdx !== -1) {
              const firstLine = raw.slice(0, newlineIdx).trim();
              if (/^[a-z0-9_-]+$/i.test(firstLine)) {
                code = raw.slice(newlineIdx + 1);
              }
            }
            return (
              <pre
                key={idx}
                className={cx(
                  "overflow-x-auto rounded-2xl border p-3 font-mono text-[12px] leading-relaxed bg-cell text-ink dark:bg-cell-dark dark:text-ink-dark",
                  HAIRLINE
                )}
              >
                <code>{code}</code>
              </pre>
            );
          }
          const trimmed = part.trim();
          if (!trimmed) return null;
          return (
            <h2
              key={idx}
              className={cx("text-lg font-extrabold leading-snug tracking-tight md:text-xl", INK)}
            >
              {trimmed}
            </h2>
          );
        })}
      </div>
    );
  };

  const renderOptionText = (text) => {
    if (!text) return null;
    if (typeof text !== "string") return text;
    if (!text.includes("`")) return text;
    const parts = text.split(/(`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={idx}
            className="rounded-md bg-cell px-1 py-0.5 font-mono text-[0.92em] text-accent dark:bg-cell-dark"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <PageContainer maxWidth="normal">
      {/* Top Header Bar Progress */}
      <GlassPanel variant="subtle" className="p-5 md:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <span className={cx("truncate text-sm font-bold", INK)}>{assessment.title}</span>
            <StatusBadge status={assessment.level_difficulty || "EASY"} />
          </div>
          <MicroMeta>
            Soal {currentIndex + 1} dari {questions.length}
          </MicroMeta>
        </div>
        <ProgressBar value={progressPercent} showPercent={false} className="mt-3" />
      </GlassPanel>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main Question Card */}
        <GlassPanel className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant="primary" label={`Soal #${currentIndex + 1}`} />
            <StatusBadge variant="neutral" label={`${currentQ.points} Poin`} />
            {currentQ.type === "DRAG_DROP" && (
              <StatusBadge variant="warning" label="Memasangkan Item" />
            )}
          </div>

          {renderQuestionText(currentQ.question_text)}

          {/* Multiple Choice Options */}
          {currentQ.type === "MULTIPLE_CHOICE" && Array.isArray(currentQ.options) && (
            <div className="flex flex-col gap-2">
              {currentQ.options.map((optText, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isSelected = selectedChoice === letter;
                return (
                  <div
                    key={letter}
                    className={cx(
                      "flex min-h-[44px] w-full cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                      isSelected
                        ? "border-brand text-accent"
                        : "border-hairline text-ink hover:bg-cell dark:border-hairline-dark dark:text-ink-dark dark:hover:bg-cell-dark"
                    )}
                    onClick={() => handleSelectOption(currentQ.id, letter)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelectOption(currentQ.id, letter);
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name={`question_${currentQ.id}`}
                      value={letter}
                      checked={isSelected}
                      readOnly
                      tabIndex={-1}
                      className="sr-only"
                    />
                    <span
                      className={cx(
                        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border tabular-nums text-[11px] font-bold uppercase",
                        isSelected
                          ? "border-brand bg-brand text-white"
                          : "border-hairline text-ink dark:border-hairline-dark dark:text-ink-dark"
                      )}
                    >
                      {letter}
                    </span>
                    <span className="min-w-0 flex-1 text-[13px] leading-relaxed">
                      {renderOptionText(optText)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Drag & Drop Interactive Question */}
          {currentQ.type === "DRAG_DROP" && (
            <div className="flex flex-col gap-5">
              <div className={cx("flex items-start gap-2 rounded-2xl border p-4", HAIRLINE)}>
                <IconInfo size={16} className="mt-0.5 shrink-0 text-accent" />
                <p className={cx("text-[13px] leading-relaxed", INK)}>
                  <strong>Petunjuk:</strong> Klik atau tarik kartu item yang tersedia, lalu letakkan di kotak target yang sesuai.
                </p>
              </div>

              {/* Pool of Available Items */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className={cx("text-[13px] font-extrabold uppercase tracking-[0.14em]", INK)}>
                    Item yang Tersedia:
                  </h4>
                  <StatusBadge variant="neutral" label={`${availableItems.length} belum terpasang`} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableItems.length === 0 ? (
                    <div className="flex items-center gap-2 text-[13px] text-ink dark:text-ink-dark">
                      <IconCheck size={14} className="shrink-0 text-accent" />
                      <span>
                        Semua item telah dipasangkan. Tekan tombol lepas pada kotak target jika ingin mengubah pasangan.
                      </span>
                    </div>
                  ) : (
                    availableItems.map((item) => (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", item.id);
                          setSelectedDragItemId(item.id);
                        }}
                        onClick={() => setSelectedDragItemId(selectedDragItemId === item.id ? null : item.id)}
                        className={cx(
                          "inline-flex min-h-[44px] cursor-pointer select-none items-center rounded-full border px-4 py-2 text-[13px] font-bold transition-colors",
                          selectedDragItemId === item.id
                            ? "border-brand text-accent"
                            : "border-hairline text-ink hover:bg-cell dark:border-hairline-dark dark:text-ink-dark dark:hover:bg-cell-dark"
                        )}
                        title="Klik untuk memilih lalu klik target"
                      >
                        <span>{item.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Target Drop Zones */}
              <div className="flex flex-col gap-3">
                <h4 className={cx("text-[13px] font-extrabold uppercase tracking-[0.14em]", INK)}>
                  Kotak Target Pasangan:
                </h4>
                {currentTargets.map((tg) => {
                  const assignedItemId = currentMatches[tg.id] || Object.keys(currentMatches).find((k) => currentMatches[k] === tg.id);
                  const assignedItem = currentItems.find((it) => it.id === assignedItemId);

                  return (
                    <div
                      key={tg.id}
                      className={cx(
                        "flex min-h-[44px] flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3",
                        assignedItem
                          ? "border-brand"
                          : cx(
                              "border-hairline dark:border-hairline-dark",
                              selectedDragItemId ? "cursor-pointer hover:bg-cell dark:hover:bg-cell-dark" : ""
                            )
                      )}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const itemId = e.dataTransfer.getData("text/plain") || selectedDragItemId;
                        if (itemId) {
                          handleAssignDragItem(currentQ.id, itemId, tg.id);
                          setSelectedDragItemId(null);
                        }
                      }}
                      onClick={() => {
                        if (selectedDragItemId) {
                          handleAssignDragItem(currentQ.id, selectedDragItemId, tg.id);
                          setSelectedDragItemId(null);
                        }
                      }}
                    >
                      <strong className={cx("text-[13px] font-bold", INK)}>{tg.label}</strong>
                      {assignedItem ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand px-3 py-1 tabular-nums text-[10px] font-bold uppercase tracking-widest text-accent md:text-[11px]">
                            {assignedItem.label}
                          </span>
                          <button
                            type="button"
                            className={cx(
                              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-ink transition-colors hover:border-brand hover:text-accent dark:text-ink-dark",
                              HAIRLINE
                            )}
                            title="Lepaskan item"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveDragItem(currentQ.id, assignedItem.id);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <span className={cx("text-[12px]", MUTED)}>
                          {selectedDragItemId ? "Klik untuk pasang item terpilih" : "Letakkan item di sini"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {Object.keys(currentMatches).length > 0 && (
                <div className="flex justify-end">
                  <OutlineButton
                    size="sm"
                    onClick={() => handleResetDragItems(currentQ.id)}
                  >
                    Reset Pasangan Soal Ini
                  </OutlineButton>
                </div>
              )}
            </div>
          )}

          {submitError && <Alert tone="error" className="border">{submitError}</Alert>}

          {/* Navigation Controls Footer */}
          <div className={cx("flex flex-wrap items-center justify-between gap-3 border-t pt-4", HAIRLINE)}>
            <OutlineButton
              onClick={handlePrev}
              disabled={currentIndex === 0}
              icon={<IconArrowLeft size={16} />}
            >
              Sebelumnya
            </OutlineButton>

            <div className="flex flex-wrap items-center gap-3">
              {currentIndex < questions.length - 1 ? (
                <PrimaryButton
                  onClick={handleNext}
                  iconRight={<IconArrowRight size={16} />}
                >
                  Selanjutnya
                </PrimaryButton>
              ) : (
                <PrimaryButton
                  onClick={() => setIsReviewing(true)}
                  iconRight={<IconCheck size={16} />}
                >
                  Tinjau Jawaban
                </PrimaryButton>
              )}
            </div>
          </div>
        </GlassPanel>

        {/* Sidebar Question Palette */}
        <GlassPanel variant="subtle" className="flex flex-col gap-4 p-5 md:p-6">
          <div className="flex flex-col gap-1">
            <h3 className={cx("text-[13px] font-extrabold uppercase tracking-[0.14em]", INK)}>
              Navigasi Soal
            </h3>
            <p className={cx("text-[12px] leading-relaxed", MUTED)}>
              Klik nomor untuk melompat ke soal
            </p>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const ans = answers[q.id];
              const isAnswered = ans && typeof ans === "object" ? Object.keys(ans).length > 0 : Boolean(ans);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  className={cx(
                    "inline-flex aspect-square w-full items-center justify-center rounded-full border tabular-nums text-[13px] font-bold transition-colors",
                    isCurrent
                      ? "border-brand bg-brand text-white"
                      : isAnswered
                      ? "border-brand text-accent hover:bg-cell dark:hover:bg-cell-dark"
                      : "border-rule text-ink hover:bg-cell dark:border-rule-dark dark:text-ink-dark dark:hover:bg-cell-dark"
                  )}
                  onClick={() => handleJumpToQuestion(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand" aria-hidden="true" />
              <MicroMeta>Sudah dijawab ({answeredTotal})</MicroMeta>
            </div>
            <div className="flex items-center gap-2">
              <span className={cx("h-2.5 w-2.5 shrink-0 rounded-full border", HAIRLINE)} aria-hidden="true" />
              <MicroMeta>Belum dijawab ({questions.length - answeredTotal})</MicroMeta>
            </div>
          </div>

          <div className="mt-auto pt-2">
            <PrimaryButton
              fullWidth
              onClick={() => setIsReviewing(true)}
              iconRight={<IconCheck size={16} />}
            >
              Tinjau Jawaban
            </PrimaryButton>
          </div>
        </GlassPanel>
      </div>
    </PageContainer>
  );
}
