// ============================================================
// XORA — Assessment Page (Pengerjaan Asesmen)
// Premium Light Glassmorphism · Minimal · Reusable
// frontend/src/pages/AssessmentPage.jsx
// ============================================================

import React, { useEffect, useState, useMemo } from "react";
import { assessmentsApi, diagnosticsApi, recommendationsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";
import {
  PageContainer,
  GlassPanel,
  StatusBadge,
  PrimaryButton,
  OutlineButton,
  Button,
  ProgressBar,
  LoadingState,
  ErrorState,
} from "../components";
import {
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconClock,
  IconBook,
  IconTarget,
  IconRefresh,
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
    async function initAssessment() {
      setIsLoading(true);
      setLoadError(null);
      try {
        if (isVerification || diagnosticId) {
          const vRes = await diagnosticsApi.startVerification(diagnosticId);
          if (!vRes?.data?.assessment?.id || !vRes?.data?.attempt?.id) {
            throw new Error("Gagal menginisiasi sesi verifikasi diagnostik.");
          }
          const vData = vRes.data;
          setVerificationData(vData);
          setAssessment(vData.assessment);
          setAttempt(vData.attempt);

          const qRes = await assessmentsApi.getQuestions(vData.assessment.id);
          const rawList = Array.isArray(qRes?.data) ? qRes.data : [];
          // Filter out essay questions
          const qList = rawList.filter((q) => q.type !== "ESSAY");
          setQuestions(qList);

          if (qList.length === 0) {
            throw new Error("Asesmen verifikasi ini belum memiliki pertanyaan yang tersedia untuk dikerjakan.");
          }
        } else if (isPractice || actionId) {
          const pRes = await recommendationsApi.start(actionId);
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
            rawList = Array.isArray(qRes?.data) ? qRes.data : [];
          }
          const qList = rawList.filter((q) => q.type !== "ESSAY");
          setQuestions(qList);

          if (qList.length === 0) {
            throw new Error("Asesmen latihan ini belum memiliki pertanyaan yang tersedia untuk dikerjakan.");
          }
        } else if (isReassessment && assessmentId) {
          const rRes = await assessmentsApi.reassess(assessmentId);
          if (!rRes?.data?.assessment?.id || !rRes?.data?.attempt?.id) {
            throw new Error("Gagal menginisiasi sesi uji ulang (re-assessment).");
          }
          const rData = rRes.data;
          setAssessment(rData.assessment);
          setAttempt(rData.attempt);

          let rawList = Array.isArray(rData.questions) ? rData.questions : [];
          if (rawList.length === 0) {
            const qRes = await assessmentsApi.getQuestions(rData.assessment.id);
            rawList = Array.isArray(qRes?.data) ? qRes.data : [];
          }
          const qList = rawList.filter((q) => q.type !== "ESSAY");
          setQuestions(qList);

          if (qList.length === 0) {
            throw new Error("Asesmen uji ulang ini belum memiliki pertanyaan yang tersedia untuk dikerjakan.");
          }
        } else if (assessmentId) {
          const aRes = await assessmentsApi.getById(assessmentId);
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
          const rawList = Array.isArray(qRes?.data) ? qRes.data : [];
          const qList = rawList.filter((q) => q.type !== "ESSAY");
          setQuestions(qList);

          if (qList.length === 0) {
            throw new Error("Asesmen ini belum memiliki pertanyaan non-esai yang tersedia untuk dikerjakan.");
          }
        }
      } catch (err) {
        setLoadError(err.message || "Gagal memuat data asesmen.");
      } finally {
        setIsLoading(false);
      }
    }

    initAssessment();
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
        <GlassPanel variant="elevated" className="quiz-start-card">
          {/* Header Metadata */}
          <div className="quiz-start-meta">
            <span className="quiz-start-subject">{assessment.subject_name || "Materi Pembelajaran"}</span>
            <span className="quiz-start-dot">•</span>
            <StatusBadge status={assessment.level_difficulty || "EASY"} label={`Tingkat ${difficultyLabel}`} />
            {typeLabel && (
              <>
                <span className="quiz-start-dot">•</span>
                <span className="quiz-start-type">{typeLabel}</span>
              </>
            )}
          </div>

          <h1 className="quiz-start-title">{assessment.title}</h1>

          {/* Quick Metrics (Only if available) */}
          <div className="quiz-start-specs">
            {questions.length > 0 && (
              <div className="quiz-start-spec-item">
                <span className="spec-label">Jumlah Soal</span>
                <span className="spec-val">{questions.length} Soal</span>
              </div>
            )}
            {assessment.duration_minutes ? (
              <div className="quiz-start-spec-item">
                <span className="spec-label">Durasi Waktu</span>
                <span className="spec-val">{assessment.duration_minutes} Menit</span>
              </div>
            ) : null}
            {assessment.passing_score ? (
              <div className="quiz-start-spec-item">
                <span className="spec-label">Standar Kelulusan</span>
                <span className="spec-val">{Math.round(assessment.passing_score)}%</span>
              </div>
            ) : null}
          </div>

          {/* Brief Context & Instruction (Max 2-3 lines) */}
          <p className="quiz-start-instruction">
            Pilihlah satu jawaban yang paling tepat untuk setiap soal. Anda dapat berpindah nomor soal kapan saja dan meninjau kelengkapan jawaban sebelum mengumpulkan hasil akhir.
          </p>

          {isLocked && (
            <div className="alert alert-warning" style={{ marginBottom: "1rem" }}>
              <IconLock size={16} />
              <span>
                <strong>Asesmen Terkunci:</strong>{" "}
                {assessment.learner_status?.lock_reason || "Selesaikan asesmen tingkat sebelumnya terlebih dahulu."}
              </span>
            </div>
          )}

          {submitError && (
            <div className="alert alert-error" style={{ marginBottom: "1rem" }}>
              <span>{submitError}</span>
            </div>
          )}

          <div className="quiz-start-actions">
            <OutlineButton onClick={() => navigate("/assessments")}>
              Kembali ke Daftar
            </OutlineButton>

            {isLocked ? (
              <Button disabled variant="outline" iconLeft={<IconLock size={16} />}>
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
          </div>
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
        <div className="quiz-review-container">
          <GlassPanel variant="elevated">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-text-main)", marginBottom: "0.25rem" }}>
                  Tinjau Jawaban Asesmen
                </h2>
                <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                  {assessment.title} • Periksa kembali jawaban Anda sebelum mengirimkan hasil akhir.
                </p>
              </div>
              <StatusBadge status={assessment.level_difficulty || "EASY"} />
            </div>

            {/* Stat Summary Box */}
            <div className="quiz-review-stats" style={{ marginBottom: "1.5rem" }}>
              <div className="quiz-review-stat-box stat-answered">
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                    Sudah Dijawab
                  </span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--color-success)" }}>
                    {answeredTotal} Soal
                  </div>
                </div>
                <StatusBadge variant="success" label="Lengkap" dot />
              </div>

              <div className="quiz-review-stat-box stat-unanswered">
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
                    Belum Dijawab
                  </span>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800, color: unansweredTotal > 0 ? "var(--color-warning)" : "var(--color-text-muted)" }}>
                    {unansweredTotal} Soal
                  </div>
                </div>
                <StatusBadge
                  variant={unansweredTotal > 0 ? "warning" : "success"}
                  label={unansweredTotal > 0 ? "Belum Selesai" : "Semua Terjawab"}
                />
              </div>
            </div>

            {/* Unanswered Alert Warning */}
            {unansweredTotal > 0 && (
              <div className="alert alert-warning" style={{ marginBottom: "1.5rem" }}>
                <IconAlertTriangle size={18} />
                <span>
                  <strong>Perhatian:</strong> Masih terdapat <strong>{unansweredTotal} soal</strong> yang belum Anda jawab. Soal yang kosong tidak akan mendapatkan poin.
                </span>
              </div>
            )}

            {submitError && (
              <div className="alert alert-error" style={{ marginBottom: "1.5rem" }}>
                <span>{submitError}</span>
              </div>
            )}

            {/* Questions Grid Overview */}
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "0.85rem" }}>
              Daftar Soal &amp; Jawaban Anda:
            </h3>

            <div className="quiz-review-grid" style={{ marginBottom: "2rem" }}>
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
                  <div
                    key={q.id}
                    className="quiz-review-card"
                    onClick={() => handleJumpToQuestion(idx)}
                    role="button"
                    tabIndex={0}
                    title="Klik untuk membuka soal ini"
                  >
                    <div className="quiz-review-card-header">
                      <span className="quiz-review-card-num">Soal #{idx + 1}</span>
                      <StatusBadge
                        variant={isAnswered ? "success" : "neutral"}
                        label={isAnswered ? "Terjawab" : "Kosong"}
                        dot={isAnswered}
                      />
                    </div>
                    <div className="quiz-review-card-ans">
                      <strong>Jawaban:</strong> {answerDisplay}
                    </div>
                    <div style={{ marginTop: "auto", textAlign: "right", fontSize: "0.78rem", color: "var(--color-primary)", fontWeight: 600 }}>
                      Buka Soal →
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Review Bottom Actions */}
            <div className="quiz-review-actions-bar">
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
            </div>
          </GlassPanel>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="quiz-modal-backdrop" onClick={() => setShowConfirmModal(false)}>
            <div className="quiz-modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="quiz-modal-title">Konfirmasi Pengumpulan Jawaban</h3>
              <p className="quiz-modal-desc">
                Apakah Anda yakin ingin mengumpulkan asesmen ini sekarang? Setelah dikumpulkan, hasil akan langsung dihitung dan jawaban tidak dapat diubah kembali.
              </p>

              {unansweredTotal > 0 && (
                <div className="alert alert-warning" style={{ fontSize: "0.85rem" }}>
                  <IconAlertTriangle size={16} />
                  <span>
                    Masih ada <strong>{unansweredTotal} soal belum dijawab</strong>. Jawaban yang kosong akan dihitung bernilai 0.
                  </span>
                </div>
              )}

              <div className="quiz-modal-actions">
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
      return <h2 className="quiz-question-text">{text}</h2>;
    }
    const parts = text.split(/(```[\s\S]*?```)/g);
    return (
      <div className="quiz-question-formatted">
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
              <pre key={idx} className="quiz-code-snippet">
                <code>{code}</code>
              </pre>
            );
          }
          const trimmed = part.trim();
          if (!trimmed) return null;
          return (
            <h2 key={idx} className="quiz-question-text" style={{ marginBottom: "0.75rem" }}>
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
            style={{
              backgroundColor: "var(--color-bg-subtle)",
              padding: "0.15rem 0.35rem",
              borderRadius: "4px",
              fontFamily: "var(--font-mono, monospace)",
              fontSize: "0.92em",
              color: "var(--color-primary)",
            }}
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
      <div className="assessment-quiz-header">
        <div className="quiz-header-info">
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
            <span className="quiz-title-tag">{assessment.title}</span>
            <StatusBadge status={assessment.level_difficulty || "EASY"} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span className="quiz-progress-text">
              Soal {currentIndex + 1} dari {questions.length}
            </span>
          </div>
        </div>

        <div className="quiz-progress-bar">
          <div
            className="quiz-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="quiz-layout">
        {/* Main Question Card */}
        <GlassPanel variant="elevated" className="quiz-main-card">
          <div className="quiz-question-meta">
            <StatusBadge variant="primary" label={`Soal #${currentIndex + 1}`} />
            <StatusBadge variant="neutral" label={`${currentQ.points} Poin`} />
            {currentQ.type === "DRAG_DROP" && (
              <StatusBadge variant="warning" label="Memasangkan Item" />
            )}
          </div>

          {renderQuestionText(currentQ.question_text)}

          {/* Multiple Choice Options */}
          {currentQ.type === "MULTIPLE_CHOICE" && Array.isArray(currentQ.options) && (
            <div className="quiz-options-list">
              {currentQ.options.map((optText, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isSelected = selectedChoice === letter;
                return (
                  <div
                    key={letter}
                    className={`quiz-option-item ${isSelected ? "quiz-option-selected" : ""}`}
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
                      className="quiz-radio"
                    />
                    <span className="quiz-option-letter">{letter}</span>
                    <span className="quiz-option-label">{renderOptionText(optText)}</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Drag & Drop Interactive Question */}
          {currentQ.type === "DRAG_DROP" && (
            <div className="quiz-drag-drop-container">
              <div className="drag-instructions-banner">
                <IconInfo size={16} />
                <p>
                  <strong>Petunjuk:</strong> Klik atau tarik kartu item yang tersedia, lalu letakkan di kotak target yang sesuai.
                </p>
              </div>

              {/* Pool of Available Items */}
              <div className="drag-source-section">
                <div className="drag-section-header">
                  <h4 className="drag-section-title">Item yang Tersedia:</h4>
                  <span className="badge badge-subtle">
                    {availableItems.length} belum terpasang
                  </span>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                  {availableItems.length === 0 ? (
                    <div style={{ fontSize: "0.85rem", color: "var(--color-success)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <IconCheck size={14} />
                      Semua item telah dipasangkan. Tekan tombol lepas pada kotak target jika ingin mengubah pasangan.
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
                        className={`drag-chip ${selectedDragItemId === item.id ? "drag-chip-selected" : ""}`}
                        title="Klik untuk memilih lalu klik target"
                      >
                        <span>{item.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Target Drop Zones */}
              <div className="drag-targets-list">
                <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--color-text-main)" }}>
                  Kotak Target Pasangan:
                </h4>
                {currentTargets.map((tg) => {
                  const assignedItemId = currentMatches[tg.id] || Object.keys(currentMatches).find((k) => currentMatches[k] === tg.id);
                  const assignedItem = currentItems.find((it) => it.id === assignedItemId);

                  return (
                    <div
                      key={tg.id}
                      className={`drag-target-slot ${assignedItem ? "drag-target-filled" : ""}`}
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
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "0.9rem", color: "var(--color-text-main)" }}>{tg.label}</strong>
                        {assignedItem ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span className="badge badge-success">{assignedItem.label}</span>
                            <button
                              type="button"
                              className="drag-remove-btn"
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
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-dim)" }}>
                            {selectedDragItemId ? "Klik untuk pasang item terpilih" : "Letakkan item di sini"}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {Object.keys(currentMatches).length > 0 && (
                <div style={{ textAlign: "right" }}>
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

          {submitError && (
            <div className="alert alert-error" style={{ marginTop: "1.5rem" }}>
              <span>{submitError}</span>
            </div>
          )}

          {/* Navigation Controls Footer */}
          <div className="quiz-controls">
            <OutlineButton
              onClick={handlePrev}
              disabled={currentIndex === 0}
              icon={<IconArrowLeft size={16} />}
            >
              Sebelumnya
            </OutlineButton>

            <div className="quiz-controls-right">
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
        <GlassPanel variant="default" className="quiz-sidebar-card">
          <h3 className="palette-title">Navigasi Soal</h3>
          <p className="palette-subtitle">Klik nomor untuk melompat ke soal</p>

          <div className="palette-grid">
            {questions.map((q, idx) => {
              const ans = answers[q.id];
              const isAnswered = ans && typeof ans === "object" ? Object.keys(ans).length > 0 : Boolean(ans);
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  className={`palette-num-btn ${isCurrent ? "palette-active" : ""} ${
                    isAnswered ? "palette-answered" : ""
                  }`}
                  onClick={() => handleJumpToQuestion(idx)}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="palette-legend">
            <div className="legend-item">
              <span className="legend-dot legend-dot-answered" />
              <span>Sudah dijawab ({answeredTotal})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-dot-unanswered" />
              <span>Belum dijawab ({questions.length - answeredTotal})</span>
            </div>
          </div>

          <div className="palette-submit-section">
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
