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
  const [answers, setAnswers] = useState({}); // { [question_id]: "A" | { [itemId]: targetId } }
  const [selectedDragItemId, setSelectedDragItemId] = useState(null);
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

  // 3b. Drag & Drop handlers
  const handleAssignDragItem = (questionId, itemId, targetId) => {
    setAnswers((prev) => {
      const current = prev[questionId] && typeof prev[questionId] === "object" ? { ...prev[questionId] } : {};
      // Jika target ini sudah terisi oleh item lain, lepaskan item lama tersebut
      for (const [k, v] of Object.entries(current)) {
        if (v === targetId) delete current[k];
      }
      current[itemId] = targetId;
      return {
        ...prev,
        [questionId]: current,
      };
    });
  };

  const handleRemoveDragItem = (questionId, itemId) => {
    setAnswers((prev) => {
      const current = prev[questionId] && typeof prev[questionId] === "object" ? { ...prev[questionId] } : {};
      delete current[itemId];
      return {
        ...prev,
        [questionId]: current,
      };
    });
  };

  const handleResetDragItems = (questionId) => {
    setAnswers((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
    setSelectedDragItemId(null);
  };

  // 4. Navigation
  const handleNext = () => {
    setSelectedDragItemId(null);
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      if (!startTimes[questions[nextIdx]?.id]) {
        setStartTimes((prev) => ({ ...prev, [questions[nextIdx]?.id]: Date.now() }));
      }
    }
  };

  const handlePrev = () => {
    setSelectedDragItemId(null);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleJumpToQuestion = (index) => {
    setSelectedDragItemId(null);
    setCurrentIndex(index);
    if (!startTimes[questions[index]?.id]) {
      setStartTimes((prev) => ({ ...prev, [questions[index]?.id]: Date.now() }));
    }
  };

  // 5. Submit attempt
  const handleSubmit = async () => {
    if (!attempt?.id) return;

    const answeredCount = Object.entries(answers).filter(([_, val]) => {
      if (!val) return false;
      if (typeof val === "object") return Object.keys(val).length > 0;
      return String(val).trim() !== "";
    }).length;

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
  const answeredTotal = Object.entries(answers).filter(([_, val]) => {
    if (!val) return false;
    if (typeof val === "object") return Object.keys(val).length > 0;
    return String(val).trim() !== "";
  }).length;
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  // Drag & drop data helpers
  const currentMatches = (currentQ.type === "DRAG_DROP" && answers[currentQ.id] && typeof answers[currentQ.id] === "object")
    ? answers[currentQ.id]
    : {};
  const currentItems = Array.isArray(currentQ.items) ? currentQ.items : [];
  const currentTargets = Array.isArray(currentQ.targets) ? currentQ.targets : [];
  const availableItems = currentItems.filter((item) => !currentMatches[item.id]);

  // Helper to format code blocks in question text
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
            {currentQ.concept && (
              <span className="badge badge-role">{currentQ.concept}</span>
            )}
            {currentQ.type === "DRAG_DROP" && (
              <span className="badge badge-difficulty badge-hard">Drag &amp; Drop</span>
            )}
            {currentQ.category === "TRUE_FALSE" && (
              <span className="badge badge-difficulty badge-medium">Benar / Salah</span>
            )}
            {currentQ.category === "CODE_INTERPRETATION" && (
              <span className="badge badge-difficulty badge-hard">Interpretasi Kode</span>
            )}
            {currentQ.category === "SCENARIO" && (
              <span className="badge badge-difficulty badge-medium">Kasus / Skenario</span>
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

          {/* Drag & Drop Interactive Question */}
          {currentQ.type === "DRAG_DROP" && (
            <div className="quiz-drag-drop-container">
              <div className="drag-instructions-banner">
                <span className="drag-info-icon">💡</span>
                <p>
                  <strong>Petunjuk:</strong> Tarik (drag) kartu item dan lepaskan di kotak target yang sesuai, atau klik kartu item di bawah lalu klik kotak target tujuannya.
                </p>
              </div>

              {/* Pool of Available Items */}
              <div className="drag-source-section">
                <div className="drag-section-header">
                  <h4 className="drag-section-title">Item yang Tersedia:</h4>
                  <span className="drag-count-badge">
                    {availableItems.length} belum terpasang
                  </span>
                </div>
                <div className="drag-source-pool">
                  {availableItems.length === 0 ? (
                    <div className="drag-pool-empty">
                      ✓ Semua item telah dipasangkan. Tekan tanda ✕ pada kotak target jika ingin mengubah pasangan.
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
                        className={`drag-item-chip ${selectedDragItemId === item.id ? "drag-item-selected" : ""}`}
                        title="Klik untuk memilih lalu klik target, atau tarik ke kotak target"
                      >
                        <span className="drag-handle-icon">⠿</span>
                        <span className="drag-item-text">{item.label}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Target Drop Zones */}
              <div className="drag-targets-section">
                <div className="drag-section-header">
                  <h4 className="drag-section-title">Kotak Target Pasangan:</h4>
                </div>
                <div className="drag-targets-grid">
                  {currentTargets.map((tg) => {
                    const assignedItemId = currentMatches[tg.id] || Object.keys(currentMatches).find((k) => currentMatches[k] === tg.id);
                    const assignedItem = currentItems.find((it) => it.id === assignedItemId);

                    return (
                      <div
                        key={tg.id}
                        className={`drag-target-card ${assignedItem ? "drag-target-filled" : ""} ${
                          selectedDragItemId && !assignedItem ? "drag-target-droppable" : ""
                        }`}
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
                        <div className="drag-target-header">
                          <span className="drag-target-label">{tg.label}</span>
                        </div>
                        <div className="drag-target-dropzone">
                          {assignedItem ? (
                            <div className="assigned-item-pill">
                              <span className="assigned-item-text">{assignedItem.label}</span>
                              <button
                                type="button"
                                className="drag-remove-btn"
                                title="Lepaskan pasangan"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveDragItem(currentQ.id, assignedItem.id);
                                }}
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className="dropzone-placeholder">
                              {selectedDragItemId ? "Klik di sini untuk pasangkan item terpilih" : "Tarik & lepaskan item di sini"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reset button */}
              {Object.keys(currentMatches).length > 0 && (
                <div className="drag-actions-bar">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => handleResetDragItems(currentQ.id)}
                  >
                    Reset Pasangan Soal Ini
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Fallback for other question types */}
          {currentQ.type !== "MULTIPLE_CHOICE" && currentQ.type !== "DRAG_DROP" && (
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
