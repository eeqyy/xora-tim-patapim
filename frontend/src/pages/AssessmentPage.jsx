// ============================================================
// XORA — Assessment Taking Page
// frontend/src/pages/AssessmentPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { assessmentsApi } from "../services/api";
import { useRouter } from "../context/RouterContext";

export default function AssessmentPage({ assessmentId }) {
  const { navigate } = useRouter();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);

  const [isStarted, setIsStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [question_id]: "A" }
  const [startTimes, setStartTimes] = useState({}); // { [question_id]: timestamp }

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // 1. Load assessment metadata & sanitized questions
  useEffect(() => {
    async function initAssessment() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [aRes, qRes] = await Promise.all([
          assessmentsApi.getById(assessmentId),
          assessmentsApi.getQuestions(assessmentId),
        ]);

        if (!aRes?.data) {
          throw new Error("Asesmen tidak ditemukan.");
        }

        setAssessment(aRes.data);
        const qList = Array.isArray(qRes?.data) ? qRes.data : [];
        setQuestions(qList);

        if (qList.length === 0) {
          throw new Error("Asesmen ini belum memiliki pertanyaan yang tersedia.");
        }
      } catch (err) {
        setLoadError(err.message || "Gagal memuat asesmen.");
      } finally {
        setIsLoading(false);
      }
    }

    if (assessmentId) {
      initAssessment();
    }
  }, [assessmentId]);

  // 2. Start attempt
  const handleStartAttempt = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await assessmentsApi.startAttempt(assessmentId);
      if (!res?.data?.id) {
        throw new Error("Gagal memulai sesi attempt asesmen.");
      }
      setAttempt(res.data);
      setIsStarted(true);
      setCurrentIndex(0);
      setStartTimes({ [questions[0]?.id]: Date.now() });
    } catch (err) {
      setSubmitError(err.message || "Gagal membuat sesi asesmen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Option selection
  const handleSelectOption = (questionId, optionLetter) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionLetter,
    }));
  };

  // 4. Navigation
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (!startTimes[questions[nextIdx]?.id]) {
        setStartTimes((prev) => ({ ...prev, [questions[nextIdx]?.id]: Date.now() }));
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    setCurrentIndex(index);
    if (!startTimes[questions[index]?.id]) {
      setStartTimes((prev) => ({ ...prev, [questions[index]?.id]: Date.now() }));
    }
  };

  // 5. Submit attempt
  const handleSubmit = async () => {
    if (!attempt?.id) return;

    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      const confirmSubmit = window.confirm(
        `Anda baru menjawab ${answeredCount} dari ${questions.length} soal. Yakin ingin mengumpulkan sekarang?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payloadAnswers = Object.entries(answers).map(([qid, sel]) => {
        const startTime = startTimes[qid];
        const elapsed = startTime ? Math.round((Date.now() - startTime) / 1000) : null;
        return {
          question_id: qid,
          selected: sel,
          response_time_seconds: elapsed,
        };
      });

      const res = await assessmentsApi.submitAttempt(attempt.id, payloadAnswers);
      const attemptResult = res?.data;
      if (attemptResult?.id) {
        navigate(`/assessments/result/${attemptResult.id}`);
      } else {
        navigate("/assessments");
      }
    } catch (err) {
      setSubmitError(err.message || "Gagal mengirimkan jawaban asesmen.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="assessment-container">
        <div className="card loading-card">
          <p>Memuat lembar asesmen...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="assessment-container">
        <div className="card alert-card alert-error">
          <p>{loadError}</p>
          <div style={{ marginTop: "1rem" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/assessments")}
            >
              ← Kembali ke Daftar Asesmen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Instructions screen before starting
  if (!isStarted) {
    return (
      <div className="assessment-container">
        <div className="card assessment-instruction-card">
          <div className="instruction-badge">PETUNJUK ASESMEN</div>
          <h1 className="instruction-title">{assessment.title}</h1>
          <p className="instruction-subject">
            Mata Pelajaran: <strong>{assessment.subject_name}</strong>
            {assessment.level_name && <> • Level: <strong>{assessment.level_name}</strong></>}
          </p>

          <div className="instruction-details">
            <div className="instruction-item">
              <span className="inst-icon">📋</span>
              <div>
                <strong>{questions.length} Pertanyaan</strong>
                <p>Tipe pilihan ganda (Multiple Choice) terstandarisasi.</p>
              </div>
            </div>
            <div className="instruction-item">
              <span className="inst-icon">⏱️</span>
              <div>
                <strong>Durasi: {assessment.duration_minutes ? `${assessment.duration_minutes} Menit` : "Fleksibel"}</strong>
                <p>Waktu pengerjaan disarankan untuk hasil optimal.</p>
              </div>
            </div>
            <div className="instruction-item">
              <span className="inst-icon">🎯</span>
              <div>
                <strong>Kriteria Kelulusan (KKM): {assessment.passing_score ? `${Math.round(assessment.passing_score)}%` : "70%"}</strong>
                <p>Skor dihitung secara otomatis oleh server dari bukti jawaban.</p>
              </div>
            </div>
          </div>

          <div className="instruction-notes">
            <h4>Aturan & Ketentuan:</h4>
            <ul>
              <li>Pilihlah satu jawaban yang menurut Anda paling tepat untuk setiap soal.</li>
              <li>Anda dapat berpindah antar soal menggunakan tombol navigasi atau nomor soal.</li>
              <li>Jawaban yang sudah dipilih tersimpan secara otomatis selama sesi aktif.</li>
              <li>Setelah tombol "Kumpulkan Asesmen" ditekan, jawaban tidak dapat diubah lagi.</li>
            </ul>
          </div>

          {submitError && (
            <div className="alert-card alert-error" style={{ marginBottom: "1.5rem" }}>
              <p>{submitError}</p>
            </div>
          )}

          <div className="instruction-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate("/assessments")}
            >
              Kembali
            </button>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleStartAttempt}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Menyiapkan Sesi..." : "Mulai Asesmen Sekarang →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Question View
  const currentQ = questions[currentIndex];
  const selectedChoice = answers[currentQ.id];
  const answeredTotal = Object.keys(answers).length;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="assessment-container">
      {/* Top Bar Progress */}
      <div className="assessment-quiz-header">
        <div className="quiz-header-info">
          <span className="quiz-title-tag">{assessment.title}</span>
          <span className="quiz-progress-text">
            Soal {currentIndex + 1} dari {questions.length} ({answeredTotal} dijawab)
          </span>
        </div>
        <div className="quiz-progress-bar">
          <div
            className="quiz-progress-fill"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      <div className="quiz-layout">
        {/* Main Question Box */}
        <div className="card quiz-main-card">
          <div className="quiz-question-meta">
            <span className="badge badge-topic">Soal #{currentQ.order_index}</span>
            <span className="badge badge-difficulty badge-easy">{currentQ.points} Poin</span>
            <span className="badge badge-role">{currentQ.type}</span>
          </div>

          <h2 className="quiz-question-text">{currentQ.question_text}</h2>

          {/* Multiple Choice Options */}
          {currentQ.type === "MULTIPLE_CHOICE" && Array.isArray(currentQ.options) && (
            <div className="quiz-options-list">
              {currentQ.options.map((optText, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isSelected = selectedChoice === letter;
                return (
                  <label
                    key={letter}
                    className={`quiz-option-item ${isSelected ? "quiz-option-selected" : ""}`}
                    onClick={() => handleSelectOption(currentQ.id, letter)}
                  >
                    <input
                      type="radio"
                      name={`question_${currentQ.id}`}
                      value={letter}
                      checked={isSelected}
                      onChange={() => handleSelectOption(currentQ.id, letter)}
                      className="quiz-radio"
                    />
                    <span className="quiz-option-letter">{letter}</span>
                    <span className="quiz-option-label">{optText}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* Fallback for other question types */}
          {currentQ.type !== "MULTIPLE_CHOICE" && (
            <div className="quiz-other-type-box">
              <p className="quiz-other-desc">
                Soal tipe {currentQ.type}. Masukkan jawaban atau kode Anda:
              </p>
              <textarea
                className="quiz-textarea"
                rows={4}
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                placeholder="Ketikkan jawaban Anda di sini..."
              />
            </div>
          )}

          {submitError && (
            <div className="alert-card alert-error" style={{ marginTop: "1.5rem" }}>
              <p>{submitError}</p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="quiz-controls">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              ← Sebelumnya
            </button>

            <div className="quiz-controls-right">
              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleNext}
                >
                  Selanjutnya →
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary btn-success-tint"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Mengumpulkan..." : "Kumpulkan Asesmen ✓"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Question Palette */}
        <div className="card quiz-sidebar-card">
          <h3 className="palette-title">Navigasi Soal</h3>
          <p className="palette-subtitle">Klik nomor untuk melompat ke soal</p>

          <div className="palette-grid">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(answers[q.id]);
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
              <span className="legend-dot legend-dot-answered"></span>
              <span>Sudah dijawab ({answeredTotal})</span>
            </div>
            <div className="legend-item">
              <span className="legend-dot legend-dot-unanswered"></span>
              <span>Belum dijawab ({questions.length - answeredTotal})</span>
            </div>
          </div>

          <div className="palette-submit-section">
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Mengumpulkan..." : "Kumpulkan Sekarang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
