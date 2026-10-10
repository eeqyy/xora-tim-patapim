// ============================================================
// XORA — Assessment Taking (runner: MC, drag-drop, textarea)
// frontend/src/pages/AssessmentPage.jsx
// ============================================================

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { assessmentsApi } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import Meter from "../components/ui/Meter";
import { SkeletonList } from "../components/ui/Skeleton";
import { ErrorState } from "../components/ui/State";
import { CATEGORY_LABELS, categoryMeta } from "../lib/statusMaps";
import { formatClock } from "../lib/formatters";

const isAnswered = (val) => {
  if (!val) return false;
  if (typeof val === "object") return Object.keys(val).length > 0;
  return String(val).trim() !== "";
};

export default function AssessmentPage({ assessmentId }) {
  const { token } = useAuth();
  const { navigate } = useRouter();

  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);

  const [isStarted, setIsStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedDragItemId, setSelectedDragItemId] = useState(null);
  const [startTimes, setStartTimes] = useState({});
  const [elapsed, setElapsed] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // 1. Load assessment metadata & sanitized questions (pakai token)
  useEffect(() => {
    async function initAssessment() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [aRes, qRes] = await Promise.all([
          assessmentsApi.getById(assessmentId, token),
          assessmentsApi.getQuestions(assessmentId, token),
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
  }, [assessmentId, token]);

  // Timer ketika mulai
  useEffect(() => {
    if (!isStarted) return undefined;
    const base = Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      setElapsed(Math.round((Date.now() - base) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isStarted]);

  const handleStartAttempt = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await assessmentsApi.startAttempt(assessmentId, token);
      if (!res?.data?.id) {
        throw new Error("Gagal memulai sesi attempt asesmen.");
      }
      setAttempt(res.data);
      setIsStarted(true);
      setCurrentIndex(0);
      setElapsed(0);
      setStartTimes({ [questions[0]?.id]: Date.now() });
    } catch (err) {
      setSubmitError(err.message || "Gagal membuat sesi asesmen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectOption = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleAssignDragItem = (questionId, itemId, targetId) => {
    setAnswers((prev) => {
      const current = prev[questionId] && typeof prev[questionId] === "object" ? { ...prev[questionId] } : {};
      for (const [k, v] of Object.entries(current)) {
        if (v === targetId) delete current[k];
      }
      current[itemId] = targetId;
      return { ...prev, [questionId]: current };
    });
  };

  const handleRemoveDragItem = (questionId, itemId) => {
    setAnswers((prev) => {
      const current = prev[questionId] && typeof prev[questionId] === "object" ? { ...prev[questionId] } : {};
      delete current[itemId];
      return { ...prev, [questionId]: current };
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
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleJumpToQuestion = (index) => {
    setSelectedDragItemId(null);
    setCurrentIndex(index);
    if (!startTimes[questions[index]?.id]) {
      setStartTimes((prev) => ({ ...prev, [questions[index]?.id]: Date.now() }));
    }
  };

  const handleSubmit = async () => {
    if (!attempt?.id) return;

    const answeredCount = questions.filter((q) => isAnswered(answers[q.id])).length;

    if (answeredCount < questions.length) {
      const ok = window.confirm(
        `Kamu baru menjawab ${answeredCount} dari ${questions.length} soal. Yakin ingin mengumpulkan sekarang?`
      );
      if (!ok) return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payloadAnswers = Object.entries(answers).map(([qid, sel]) => {
        const startTime = startTimes[qid];
        const response_time_seconds = startTime ? Math.round((Date.now() - startTime) / 1000) : null;
        return { question_id: qid, selected: sel, response_time_seconds };
      });
      const res = await assessmentsApi.submitAttempt(attempt.id, payloadAnswers, token);
      const attemptResult = res?.data;
      if (attemptResult?.id) navigate(`/assessments/result/${attemptResult.id}`);
      else navigate("/assessments");
    } catch (err) {
      setSubmitError(err.message || "Gagal mengirimkan jawaban.");
      setIsSubmitting(false);
    }
  };

  const answeredTotal = useMemo(() => questions.filter((q) => isAnswered(answers[q.id])).length, [questions, answers]);

  if (isLoading) {
    return (
      <div className="page-container">
        <SkeletonList count={5} variant="card" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="page-container">
        <Card>
          <ErrorState message={loadError} onRetry={() => window.location.reload()} />
        </Card>
        <div className="ui-pair">
          <Button to="/assessments" variant="subtle">
            ← Kembali ke Daftar
          </Button>
        </div>
      </div>
    );
  }

  // Instruksi sebelum mulai
  if (!isStarted) {
    return (
      <div className="page-container">
        <Card className="ui-instruct-card">
          <div className="ui-eyebrow">Petunjuk Asesmen</div>
          <h1 className="ui-mastery-detail-name ui-instruct-title">{assessment.title}</h1>
          <p className="ui-page-desc">
            {assessment.subject_name}
            {assessment.level_name ? ` · Level ${assessment.level_name}` : ""}
            {assessment.topic_name ? ` · ${assessment.topic_name}` : ""}
          </p>

          <div className="ui-instruct-grid">
            <div className="ui-kv">
              <span className="ui-kv-label">Soal</span>
              <span className="ui-kv-value ui-num">{questions.length}</span>
            </div>
            <div className="ui-kv">
              <span className="ui-kv-label">Durasi</span>
              <span className="ui-kv-value">{assessment.duration_minutes ? `${assessment.duration_minutes} menit` : "Fleksibel"}</span>
            </div>
            <div className="ui-kv">
              <span className="ui-kv-label">KKM</span>
              <span className="ui-kv-value ui-num">{Math.round(Number(assessment.passing_score) || 70)}%</span>
            </div>
            <div className="ui-kv">
              <span className="ui-kv-label">Skor</span>
              <span className="ui-kv-value">Dihitung server</span>
            </div>
          </div>

          <div className="ui-instruct-notes">
            <div className="ui-instruct-note">Pilih satu jawaban yang paling tepat untuk setiap soal.</div>
            <div className="ui-instruct-note">Kamu bisa melompat antar soal lewat nomor di panel navigasi.</div>
            <div className="ui-instruct-note">Jawaban tersimpan otomatis selama sesi aktif.</div>
            <div className="ui-instruct-note">Setelah dikumpulkan, jawaban tidak dapat diubah lagi.</div>
          </div>

          {submitError && <div className="form-error">{submitError}</div>}

          <div className="ui-pair">
            <Button to="/assessments" variant="ghost">
              Kembali
            </Button>
            <Button onClick={handleStartAttempt} disabled={isSubmitting}>
              {isSubmitting ? "Menyiapkan sesi…" : "Mulai Sekarang →"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const selectedChoice = answers[currentQ.id];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
  const qMeta = categoryMeta(currentQ.category);

  const currentMatches =
    currentQ.type === "DRAG_DROP" && answers[currentQ.id] && typeof answers[currentQ.id] === "object" ? answers[currentQ.id] : {};
  const currentItems = Array.isArray(currentQ.items) ? currentQ.items : [];
  const currentTargets = Array.isArray(currentQ.targets) ? currentQ.targets : [];
  const availableItems = currentItems.filter((item) => !currentMatches[item.id]);

  const renderQuestionText = (text) => {
    if (!text) return null;
    if (!text.includes("```")) return <div className="ui-question-text">{text}</div>;
    const parts = text.split(/(```[\s\S]*?```)/g);
    return (
      <div className="ui-question-text">
        {parts.map((part, idx) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const raw = part.slice(3, -3).trim();
            const newlineIdx = raw.indexOf("\n");
            let code = raw;
            if (newlineIdx !== -1 && /^[a-z0-9_-]+$/i.test(raw.slice(0, newlineIdx).trim())) {
              code = raw.slice(newlineIdx + 1);
            }
            return (
              <pre key={idx} className="ui-code-snippet">
                <code>{code}</code>
              </pre>
            );
          }
          const trimmed = part.trim();
          if (!trimmed) return null;
          return (
            <div key={idx} style={{ marginBottom: "0.75rem" }}>
              {trimmed}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="page-container ui-quiz">
      {/* Progress bar atas */}
      <div className="ui-quiz-topbar">
        <div className="ui-quiz-topbar-info">
          <span className="ui-quiz-assess">{assessment.title}</span>
          <span className="ui-mono ui-dim">
            Soal {currentIndex + 1}/{questions.length} · {answeredTotal} dijawab
          </span>
          <span className="ui-mono ui-quiz-timer">{formatClock(elapsed)}</span>
        </div>
        <Meter value={progressPercent} display={undefined} />
      </div>

      <div className="ui-quiz-layout">
        <div className="ui-quiz-main">
          <Card className="ui-quiz-card">
            <div className="ui-quiz-meta">
              <Badge variant="outline">#{currentQ.order_index}</Badge>
              <Badge variant={qMeta.tone} dot>
                {qMeta.label}
              </Badge>
              <Badge variant="outline">{currentQ.points} poin</Badge>
              {currentQ.concept && <Badge variant="outline">{currentQ.concept}</Badge>}
              {currentQ.type === "DRAG_DROP" && <Badge variant="warning">Drag &amp; Drop</Badge>}
            </div>

            {renderQuestionText(currentQ.question_text)}

            {currentQ.type === "MULTIPLE_CHOICE" && Array.isArray(currentQ.options) && (
              <div className="ui-choices">
                {currentQ.options.map((optText, optIdx) => {
                  const letter = String.fromCharCode(65 + optIdx);
                  const isSelected = selectedChoice === letter;
                  return (
                    <button
                      key={letter}
                      type="button"
                      className={`ui-choice ${isSelected ? "ui-choice-selected" : ""}`}
                      onClick={() => handleSelectOption(currentQ.id, letter)}
                    >
                      <span className="ui-choice-letter">{letter}</span>
                      <span className="ui-choice-label">{optText}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQ.type === "DRAG_DROP" && (
              <div className="ui-dd">
                <div className="ui-note">
                  Pilih kartu item lalu klik kotak target yang sesuai — atau seret kartu ke kotak target.
                </div>

                <div className="ui-dd-source">
                  <div className="ui-dd-section-head">
                    <span className="ui-dd-section-title">Item tersedia</span>
                    <span className="ui-mono ui-dim">{availableItems.length} belum terpasang</span>
                  </div>
                  <div className="ui-dd-pool">
                    {availableItems.length === 0 ? (
                      <div className="ui-note">Semua item sudah dipasang. Tekan ✕ pada target untuk melepas.</div>
                    ) : (
                      availableItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", item.id);
                            setSelectedDragItemId(item.id);
                          }}
                          onClick={() => setSelectedDragItemId(selectedDragItemId === item.id ? null : item.id)}
                          className={`ui-dd-item ${selectedDragItemId === item.id ? "ui-dd-item-selected" : ""}`}
                        >
                          {item.label}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="ui-dd-targets">
                  <div className="ui-dd-section-head">
                    <span className="ui-dd-section-title">Kotak target</span>
                  </div>
                  <div className="ui-dd-targets-grid">
                    {currentTargets.map((tg) => {
                      const assignedItemId = currentMatches[tg.id] || Object.keys(currentMatches).find((k) => currentMatches[k] === tg.id);
                      const assignedItem = currentItems.find((it) => it.id === assignedItemId);
                      return (
                        <div
                          key={tg.id}
                          className={`ui-dd-target ${assignedItem ? "ui-dd-target-filled" : ""}`}
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
                          <div className="ui-dd-target-label">{tg.label}</div>
                          <div className="ui-dd-dropzone">
                            {assignedItem ? (
                              <div className="ui-dd-assigned">
                                <span>{assignedItem.label}</span>
                                <button
                                  type="button"
                                  className="ui-dd-remove"
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
                              <span className="ui-dd-dropzone-hint">
                                {selectedDragItemId ? "Klik untuk memasang item terpilih" : "Tarik item ke sini"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {Object.keys(currentMatches).length > 0 && (
                  <div className="ui-dd-actions">
                    <Button variant="subtle" size="sm" onClick={() => handleResetDragItems(currentQ.id)}>
                      Reset pasangan soal ini
                    </Button>
                  </div>
                )}
              </div>
            )}

            {currentQ.type !== "MULTIPLE_CHOICE" && currentQ.type !== "DRAG_DROP" && (
              <div className="ui-quiz-text-type">
                <p className="ui-page-desc">Jawaban untuk tipe {currentQ.type}:</p>
                <textarea
                  className="ui-textarea"
                  rows={4}
                  value={answers[currentQ.id] || ""}
                  onChange={(e) => handleSelectOption(currentQ.id, e.target.value)}
                  placeholder="Ketikkan jawabanmu di sini…"
                />
              </div>
            )}

            {submitError && <div className="form-error">{submitError}</div>}

            <div className="ui-quiz-controls">
              <Button variant="ghost" onClick={handlePrev} disabled={currentIndex === 0}>
                ← Sebelumnya
              </Button>
              {currentIndex < questions.length - 1 ? (
                <Button onClick={handleNext}>Selanjutnya →</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Mengumpulkan…" : "Kumpulkan Asesmen ✓"}
                </Button>
              )}
            </div>
          </Card>
        </div>

        <aside className="ui-quiz-palette">
          <Card surface>
            <div className="ui-palette-head">
              <span className="ui-palette-title">Navigasi</span>
              <span className="ui-mono ui-dim">
                {answeredTotal}/{questions.length}
              </span>
            </div>
            <div className="ui-palette-grid">
              {questions.map((q, idx) => (
                <button
                  key={q.id}
                  type="button"
                  className={`ui-palette-num ${idx === currentIndex ? "ui-palette-current" : ""} ${
                    isAnswered(answers[q.id]) ? "ui-palette-answered" : ""
                  }`}
                  onClick={() => handleJumpToQuestion(idx)}
                  aria-label={`Soal ${idx + 1}${isAnswered(answers[q.id]) ? " (sudah dijawab)" : ""}`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
            <div className="ui-palette-legend">
              <span className="ui-palette-key ui-palette-key-answered">Dijawab</span>
              <span className="ui-palette-key ui-palette-key-empty">Kosong</span>
            </div>
            <Button block onClick={handleSubmit} disabled={isSubmitting} variant="subtle">
              {isSubmitting ? "Mengumpulkan…" : "Kumpulkan Sekarang"}
            </Button>
          </Card>
        </aside>
      </div>
    </div>
  );
}