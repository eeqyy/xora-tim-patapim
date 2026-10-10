// ============================================================
// XORA — Admin: Editor asesmen (detail meta + CRUD soal)
// frontend/src/pages/AdminAssessmentEditorPage.jsx
// ============================================================
// Dua mode lewat satu komponen:
//   assessmentId === "new"  -> hanya form meta, setelah sukses navigate
//                              ke /admin/assessments/<id baru>
//   assessmentId lain       -> ubah meta + kelola soal
//
// Bentuk respons admin sudah camelCase (lihat assessmentService
// toPublicAssessment dan questionService toFullQuestion).
// Kunci jawaban (correctAnswer) ikut dikirim ke server HANYA lewat
// endpoint admin — halaman peserta tetap memakai assessmentsApi.getQuestions
// yang menyembunyikan kunci.
// ============================================================

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  subjectsApi,
  referenceApi,
  adminAssessmentsApi,
  adminQuestionsApi,
} from "../services/api";
import { useRouter } from "../context/RouterContext";
import AssessmentMetaFields from "../components/AssessmentMetaFields";
import AdminNav from "../components/ui/AdminNav";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const Q_TYPE_LABELS = {
  MULTIPLE_CHOICE: "Pilihan ganda",
  ESSAY: "Esai",
  DRAG_DROP: "Seret & letakkan",
  CODE: "Kode",
};

const DIFF_LABELS = { EASY: "Mudah", MEDIUM: "Sedang", HARD: "Sulit" };

const EMPTY_META = {
  title: "",
  type: "PRACTICE",
  subjectId: "",
  levelId: "",
  topicId: "",
  durationMinutes: "",
  passingScore: "",
};

const EMPTY_Q = {
  conceptId: "",
  type: "MULTIPLE_CHOICE",
  difficulty: "MEDIUM",
  points: "5",
  questionText: "",
  optionsText: "",
  correctLetter: "A",
  criteriaText: "",
  expectedText: "",
  itemsText: "",
  targetsText: "",
  mapping: {},
};

// Satu baris = satu entri, baris kosong diabaikan.
const toLines = (value) =>
  String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

function toMetaForm(a) {
  return {
    title: a.title || "",
    type: a.type || "PRACTICE",
    subjectId: a.subjectId || "",
    levelId: a.levelId || "",
    topicId: a.topicId || "",
    durationMinutes: a.durationMinutes == null ? "" : String(a.durationMinutes),
    passingScore: a.passingScore == null ? "" : String(a.passingScore),
  };
}

// Balik kembali bentuk correct_answer menjadi isian form per tipe soal.
function toQuestionForm(q) {
  const ca = q.correctAnswer || {};
  const form = {
    conceptId: q.conceptId || "",
    type: q.type,
    difficulty: q.difficulty || "MEDIUM",
    points: String(q.points ?? 5),
    questionText: q.questionText || "",
    optionsText: "",
    correctLetter: "A",
    criteriaText: "",
    expectedText: "",
    itemsText: "",
    targetsText: "",
    mapping: {},
  };

  if (q.type === "MULTIPLE_CHOICE") {
    form.optionsText = Array.isArray(ca.options) ? ca.options.join("\n") : "";
    const letter = String(ca.correct || "A").toUpperCase();
    form.correctLetter = LETTERS.includes(letter) ? letter : "A";
  } else if (q.type === "ESSAY") {
    form.criteriaText = Array.isArray(ca.criteria) ? ca.criteria.join("\n") : "";
  } else if (q.type === "CODE") {
    form.expectedText = ca.expected || "";
    form.criteriaText = Array.isArray(ca.criteria) ? ca.criteria.join("\n") : "";
  } else if (q.type === "DRAG_DROP") {
    form.itemsText = Array.isArray(ca.items) ? ca.items.map((it) => it.label).join("\n") : "";
    form.targetsText = Array.isArray(ca.targets) ? ca.targets.map((tg) => tg.label).join("\n") : "";
    if (ca.correct && typeof ca.correct === "object") {
      Object.entries(ca.correct).forEach(([key, value]) => {
        const itemIndex = parseInt(String(key).replace(/^item-/, ""), 10);
        const targetIndex = parseInt(String(value).replace(/^target-/, ""), 10);
        if (Number.isInteger(itemIndex) && Number.isInteger(targetIndex)) {
          form.mapping[itemIndex - 1] = targetIndex - 1;
        }
      });
    }
  }
  return form;
}

function validateMeta(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Judul wajib diisi";
  if (!form.subjectId) errors.subjectId = "Subjek wajib dipilih";
  if (form.type === "TOPIC" && !form.topicId) {
    errors.topicId = "Tipe Topik wajib memilih topik";
  }
  if (form.type === "LEVEL_FINAL" && !form.levelId) {
    errors.levelId = "Tipe Ujian Level wajib memilih level";
  }
  if (form.durationMinutes !== "" && !/^[1-9]\d*$/.test(form.durationMinutes.trim())) {
    errors.durationMinutes = "Durasi harus bilangan bulat lebih dari 0";
  }
  if (form.passingScore !== "") {
    const score = Number(form.passingScore);
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      errors.passingScore = "Passing score harus 0 sampai 100";
    }
  }
  return errors;
}

function validateQuestion(form) {
  const errors = {};
  const type = form.type;
  const points = Number(form.points);

  if (!form.questionText.trim()) errors.questionText = "Pertanyaan wajib diisi";
  if (!form.conceptId) errors.conceptId = "Konsep wajib dipilih";
  if (!Number.isFinite(points) || points < 0 || points > 999.99) {
    errors.points = "Poin harus 0 sampai 999,99";
  }

  if (type === "MULTIPLE_CHOICE") {
    const options = toLines(form.optionsText);
    if (options.length < 2) {
      errors.optionsText = "Minimal 2 pilihan (satu pilihan per baris)";
    } else if (options.length > LETTERS.length) {
      errors.optionsText = `Maksimal ${LETTERS.length} pilihan`;
    }
    const index = LETTERS.indexOf(form.correctLetter);
    if (index < 0 || index >= options.length) {
      errors.correctLetter = "Kunci jawaban harus ada di daftar pilihan";
    }
  } else if (type === "ESSAY") {
    if (toLines(form.criteriaText).length === 0) {
      errors.criteriaText = "Minimal 1 kriteria penilaian";
    }
  } else if (type === "CODE") {
    if (!form.expectedText.trim()) errors.expectedText = "Jawaban yang benar wajib diisi";
  } else if (type === "DRAG_DROP") {
    if (toLines(form.itemsText).length === 0) errors.itemsText = "Minimal 1 item";
    if (toLines(form.targetsText).length === 0) errors.targetsText = "Minimal 1 tujuan";
  }

  return errors;
}

// Susun object correct_answer sesuai kontrak grader (backend/utils/grading.js
// dan assessmentService.submitAttempt).
function buildCorrectAnswer(form) {
  if (form.type === "MULTIPLE_CHOICE") {
    return { correct: form.correctLetter, options: toLines(form.optionsText) };
  }
  if (form.type === "ESSAY") {
    return { criteria: toLines(form.criteriaText) };
  }
  if (form.type === "CODE") {
    const answer = { expected: form.expectedText };
    const criteria = toLines(form.criteriaText);
    if (criteria.length > 0) answer.criteria = criteria;
    return answer;
  }

  // DRAG_DROP: items + targets untuk tampilan peserta, correct = pemetaan
  const items = toLines(form.itemsText);
  const targets = toLines(form.targetsText);
  const correct = {};
  items.forEach((label, index) => {
    const chosen = Number(form.mapping[index]);
    const targetIndex =
      Number.isInteger(chosen) && chosen >= 0 && chosen < targets.length
        ? chosen
        : Math.min(index, targets.length - 1);
    correct[`item-${index + 1}`] = `target-${targetIndex + 1}`;
  });
  return {
    items: items.map((label, index) => ({ id: `item-${index + 1}`, label })),
    targets: targets.map((label, index) => ({ id: `target-${index + 1}`, label })),
    correct,
  };
}

export default function AdminAssessmentEditorPage({ assessmentId }) {
  const { navigate } = useRouter();
  const isNew = assessmentId === "new";

  const [meta, setMeta] = useState(EMPTY_META);
  const [metaErrors, setMetaErrors] = useState({});
  const [metaNotice, setMetaNotice] = useState(null);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [metaDirty, setMetaDirty] = useState(false);

  const [subjects, setSubjects] = useState([]);
  const [levels, setLevels] = useState([]);
  const [topics, setTopics] = useState([]);
  const [concepts, setConcepts] = useState([]);

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [questionForm, setQuestionForm] = useState(EMPTY_Q);
  const [questionErrors, setQuestionErrors] = useState({});
  const [questionNotice, setQuestionNotice] = useState(null);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const questionTextRef = useRef(null);

  // Muat referensi (subjek/level/topik/konsep) + data asesmen.
  useEffect(() => {
    let alive = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const [subjectRes, levelRes, topicRes, conceptRes] = await Promise.all([
          subjectsApi.getAll(),
          referenceApi.getLevels(),
          referenceApi.getTopics(),
          referenceApi.getConcepts(),
        ]);
        if (!alive) return;
        setSubjects(Array.isArray(subjectRes?.data) ? subjectRes.data : []);
        setLevels(Array.isArray(levelRes?.data) ? levelRes.data : []);
        setTopics(Array.isArray(topicRes?.data) ? topicRes.data : []);
        setConcepts(Array.isArray(conceptRes?.data) ? conceptRes.data : []);

        if (assessmentId === "new") {
          setMeta(EMPTY_META);
          setQuestions([]);
          setMetaDirty(false);
        } else {
          const fullRes = await adminAssessmentsApi.getFull(assessmentId);
          if (!alive) return;
          const data = fullRes?.data || {};
          setMeta(toMetaForm(data));
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
          setMetaDirty(false);
        }
        setMetaErrors({});
        setMetaNotice(null);
        setQuestionNotice(null);
        setShowQuestionForm(false);
        setEditingQuestionId(null);
        setQuestionForm(EMPTY_Q);
        setQuestionErrors({});
      } catch (error) {
        if (alive) setLoadError(error.message || "Gagal memuat asesmen.");
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, [assessmentId]);

  const handleMetaChange = (patch) => {
    setMeta((prev) => ({ ...prev, ...patch }));
    setMetaErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
    setMetaNotice(null);
    setMetaDirty(true);
  };

  const handleSaveMeta = async (event) => {
    event.preventDefault();
    const errors = validateMeta(meta);
    setMetaErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMetaNotice({ type: "error", text: "Periksa kembali isian yang ditandai merah." });
      return;
    }

    const payload = {
      title: meta.title.trim(),
      type: meta.type,
      subjectId: meta.subjectId,
      levelId: meta.levelId || null,
      topicId: meta.topicId || null,
      durationMinutes: meta.durationMinutes === "" ? null : Number(meta.durationMinutes),
      passingScore: meta.passingScore === "" ? null : Number(meta.passingScore),
    };

    setIsSavingMeta(true);
    setMetaNotice(null);
    try {
      if (isNew) {
        const res = await adminAssessmentsApi.create(payload);
        const created = res?.data || {};
        setMeta(toMetaForm(created));
        setMetaDirty(false);
        navigate(`/admin/assessments/${created.id}`);
        return;
      }
      const res = await adminAssessmentsApi.update(assessmentId, payload);
      setMeta(toMetaForm(res?.data || {}));
      setMetaDirty(false);
      setMetaNotice({ type: "success", text: "Detail asesmen tersimpan." });
    } catch (error) {
      setMetaNotice({ type: "error", text: error.message || "Gagal menyimpan asesmen." });
    } finally {
      setIsSavingMeta(false);
    }
  };

  const handleQuestionChange = (patch) => {
    setQuestionForm((prev) => ({ ...prev, ...patch }));
    setQuestionErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => delete next[key]);
      return next;
    });
    setQuestionNotice(null);
  };

  const openQuestionForm = () => {
    setEditingQuestionId(null);
    setQuestionForm(EMPTY_Q);
    setQuestionErrors({});
    setQuestionNotice(null);
    setShowQuestionForm(true);
    setTimeout(() => questionTextRef.current?.focus(), 0);
  };

  const closeQuestionForm = () => {
    setShowQuestionForm(false);
    setEditingQuestionId(null);
    setQuestionForm(EMPTY_Q);
    setQuestionErrors({});
    setQuestionNotice(null);
  };

  const startEditQuestion = (question) => {
    setEditingQuestionId(question.id);
    setQuestionForm(toQuestionForm(question));
    setQuestionErrors({});
    setQuestionNotice(null);
    setShowQuestionForm(true);
    setTimeout(() => {
      questionTextRef.current?.focus();
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById("question-form")?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }, 0);
  };

  const handleSaveQuestion = async (event) => {
    event.preventDefault();
    const errors = validateQuestion(questionForm);
    setQuestionErrors(errors);
    if (Object.keys(errors).length > 0) {
      setQuestionNotice({ type: "error", text: "Periksa kembali isian yang ditandai merah." });
      return;
    }

    const payload = {
      conceptId: questionForm.conceptId,
      difficulty: questionForm.difficulty,
      type: questionForm.type,
      questionText: questionForm.questionText.trim(),
      points: Number(questionForm.points),
      correctAnswer: buildCorrectAnswer(questionForm),
    };

    setIsSavingQuestion(true);
    setQuestionNotice(null);
    try {
      if (editingQuestionId) {
        const res = await adminQuestionsApi.update(assessmentId, editingQuestionId, payload);
        const saved = res?.data || {};
        setQuestions((prev) =>
          prev.map((item) => (item.id === editingQuestionId ? { ...item, ...saved } : item))
        );
        setQuestionNotice({ type: "success", text: "Soal tersimpan." });
        closeQuestionForm();
      } else {
        const res = await adminQuestionsApi.create(assessmentId, payload);
        const created = res?.data || {};
        setQuestions((prev) => [...prev, created].sort((a, b) => a.orderIndex - b.orderIndex));
        setQuestionNotice({ type: "success", text: "Soal ditambahkan." });
        setQuestionForm({ ...EMPTY_Q, conceptId: questionForm.conceptId });
        setQuestionErrors({});
        questionTextRef.current?.focus();
      }
    } catch (error) {
      setQuestionNotice({ type: "error", text: error.message || "Gagal menyimpan soal." });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (question) => {
    const confirmed = window.confirm(
      `Hapus soal "${question.questionText.slice(0, 60)}"?\n\nSoal yang sudah dijawab peserta tidak bisa dihapus (409).`
    );
    if (!confirmed) return;

    setQuestionNotice(null);
    try {
      await adminQuestionsApi.remove(assessmentId, question.id);
      setQuestions((prev) => prev.filter((item) => item.id !== question.id));
      if (editingQuestionId === question.id) closeQuestionForm();
      setQuestionNotice({ type: "success", text: "Soal dihapus." });
    } catch (error) {
      setQuestionNotice({ type: "error", text: error.message || "Gagal menghapus soal." });
    }
  };

  const handleMoveQuestion = async (index, direction) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length || isReordering) return;

    const original = questions;
    const next = [...original];
    [next[index], next[target]] = [next[target], next[index]];

    setIsReordering(true);
    setQuestionNotice(null);
    setQuestions(next.map((item, position) => ({ ...item, orderIndex: position + 1 })));
    try {
      await adminQuestionsApi.reorder(
        assessmentId,
        next.map((item) => item.id)
      );
      setQuestionNotice({ type: "success", text: "Urutan soal diperbarui." });
    } catch (error) {
      setQuestions(original);
      setQuestionNotice({ type: "error", text: error.message || "Gagal mengubah urutan." });
    } finally {
      setIsReordering(false);
    }
  };

  const handleBack = () => {
    const hasUnsavedQuestion = showQuestionForm && questionForm.questionText.trim() !== "";
    if (metaDirty || hasUnsavedQuestion) {
      const confirmed = window.confirm("Ada perubahan yang belum disimpan. Tinggalkan halaman ini?");
      if (!confirmed) return;
    }
    navigate("/admin/assessments");
  };

  const conceptOptions = useMemo(() => {
    let list = concepts;
    if (meta.subjectId) {
      list = concepts.filter((c) => c.subject_id === meta.subjectId);
    }
    if (questionForm.conceptId && !list.some((c) => c.id === questionForm.conceptId)) {
      const selected = concepts.find((c) => c.id === questionForm.conceptId);
      if (selected) list = [selected, ...list];
    }
    return list;
  }, [concepts, meta.subjectId, questionForm.conceptId]);

  const dragItems = toLines(questionForm.itemsText);
  const dragTargets = toLines(questionForm.targetsText);
  const optionLines = toLines(questionForm.optionsText);

  const renderNotice = (notice) =>
    notice ? (
      <div
        className={`alert ${notice.type === "error" ? "alert-error" : "alert-success"}`}
        role={notice.type === "error" ? "alert" : "status"}
      >
        {notice.text}
      </div>
    ) : null;

  const renderFieldError = (key) =>
    questionErrors[key] ? (
      <p className="field-error" role="alert">
        {questionErrors[key]}
      </p>
    ) : null;

  return (
    <div className="assessment-container">
      <AdminNav />
      {/* Header */}
      <div className="card assessment-header-card">
        <div className="assessment-header-badge">ADMIN</div>
        <div className="admin-title-row">
          <div>
            <button type="button" className="btn btn-outline btn-sm admin-back-btn" onClick={handleBack}>
              Kembali
            </button>
            <h1 className="assessment-title">{isNew ? "Buat Asesmen" : "Ubah Asesmen"}</h1>
            <p className="assessment-subtitle">
              {isNew
                ? "Isi detail asesmen terlebih dahulu, lalu tambahkan soalnya di halaman berikutnya."
                : "Ubah detail asesmen dan kelola soalnya. Peserta melihat perubahan ini pada pengerjaan berikutnya."}
            </p>
          </div>
          {!isNew && <span className="badge badge-role">{questions.length} soal</span>}
        </div>
      </div>

      {isLoading && (
        <div className="card loading-card">
          <p>Memuat data asesmen...</p>
        </div>
      )}

      {loadError && !isLoading && (
        <div className="alert alert-error" role="alert">
          {loadError}
        </div>
      )}

      {!isLoading && !loadError && (
        <>
          {/* Detail asesmen */}
          <section className="card" aria-labelledby="meta-heading">
            <h2 id="meta-heading" className="admin-section-title">
              Detail asesmen
            </h2>
            {renderNotice(metaNotice)}
            <form className="admin-form" onSubmit={handleSaveMeta} noValidate>
              <AssessmentMetaFields
                form={meta}
                onChange={handleMetaChange}
                errors={metaErrors}
                subjects={subjects}
                levels={levels}
                topics={topics}
                idPrefix="meta"
              />
              <div className="admin-form-actions">
                <button type="submit" className="btn btn-primary" disabled={isSavingMeta}>
                  {isSavingMeta ? "Menyimpan..." : isNew ? "Buat Asesmen" : "Simpan perubahan"}
                </button>
                <span className="field-hint">
                  {isNew
                    ? "Setelah dibuat, Anda langsung bisa menambahkan soal."
                    : "Kosongkan durasi bila tanpa batas waktu."}
                </span>
              </div>
            </form>
          </section>

          {/* Soal — baru bisa diisi setelah asesmen punya id */}
          {!isNew && (
            <section className="card" aria-labelledby="question-heading">
              <div className="admin-title-row">
                <div>
                  <h2 id="question-heading" className="admin-section-title">
                    Daftar soal
                  </h2>
                  <p className="field-hint">
                    Setiap soal terikat ke satu konsep (penentu mastery) dan satu tingkat kesulitan.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => (showQuestionForm ? closeQuestionForm() : openQuestionForm())}
                  aria-expanded={showQuestionForm}
                  aria-controls="question-form"
                >
                  {showQuestionForm ? "Tutup form soal" : "Tambah soal"}
                </button>
              </div>

              {renderNotice(questionNotice)}

              {questions.length === 0 ? (
                <p className="empty-card">Belum ada soal. Tekan “Tambah soal” untuk memulai.</p>
              ) : (
                <div className="table-scroll">
                  <table className="admin-table">
                    <caption className="admin-caption">
                      {questions.length} soal tersusun sesuai nomor urut. Tombol naik/turun mengubah
                      urutan pengerjaan peserta.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" className="admin-col-num">
                          Urut
                        </th>
                        <th scope="col">Pertanyaan</th>
                        <th scope="col">Tipe</th>
                        <th scope="col">Konsep</th>
                        <th scope="col">Kesulitan</th>
                        <th scope="col" className="admin-col-num">
                          Poin
                        </th>
                        <th scope="col" className="admin-col-actions">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {questions.map((question, index) => (
                        <tr key={question.id}>
                          <td className="admin-cell-num">{index + 1}</td>
                          <th scope="row" className="admin-cell-title admin-cell-question">
                            {question.questionText}
                          </th>
                          <td>
                            <span className="badge badge-role">{Q_TYPE_LABELS[question.type] || question.type}</span>
                          </td>
                          <td className="admin-cell-muted">{question.conceptName || "—"}</td>
                          <td>
                            <span
                              className={`badge badge-difficulty badge-${String(
                                question.difficulty || "MEDIUM"
                              ).toLowerCase()}`}
                            >
                              {DIFF_LABELS[question.difficulty] || question.difficulty}
                            </span>
                          </td>
                          <td className="admin-cell-num">{question.points}</td>
                          <td className="admin-cell-actions">
                            <div className="btn-group">
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleMoveQuestion(index, -1)}
                                disabled={index === 0 || isReordering}
                                aria-label={`Naikkan soal nomor ${index + 1}`}
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                onClick={() => handleMoveQuestion(index, 1)}
                                disabled={index === questions.length - 1 || isReordering}
                                aria-label={`Turunkan soal nomor ${index + 1}`}
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => startEditQuestion(question)}
                              >
                                Ubah
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteQuestion(question)}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {showQuestionForm && (
                <form
                  id="question-form"
                  className="admin-question-form"
                  onSubmit={handleSaveQuestion}
                  noValidate
                >
                  <h3 className="admin-subheading">
                    {editingQuestionId ? "Ubah soal" : "Soal baru"}
                  </h3>

                  <div className="form-group">
                    <label htmlFor="question-text">Pertanyaan *</label>
                    <textarea
                      id="question-text"
                      ref={questionTextRef}
                      rows={3}
                      value={questionForm.questionText}
                      onChange={(e) => handleQuestionChange({ questionText: e.target.value })}
                      aria-invalid={questionErrors.questionText ? "true" : undefined}
                      aria-describedby={questionErrors.questionText ? "question-text-err" : undefined}
                      placeholder="Tulis pertanyaan..."
                    />
                    {questionErrors.questionText && (
                      <p id="question-text-err" className="field-error" role="alert">
                        {questionErrors.questionText}
                      </p>
                    )}
                  </div>

                  <div className="admin-form-grid">
                    <div className="form-group">
                      <label htmlFor="question-concept">Konsep (mastery) *</label>
                      <select
                        id="question-concept"
                        value={questionForm.conceptId}
                        onChange={(e) => handleQuestionChange({ conceptId: e.target.value })}
                        aria-invalid={questionErrors.conceptId ? "true" : undefined}
                        aria-describedby="question-concept-hint"
                      >
                        <option value="">— Pilih konsep —</option>
                        {conceptOptions.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <p id="question-concept-hint" className="field-hint">
                        Konsep ini yang nilai penguasaannya diperbarui saat soal dijawab.
                      </p>
                      {renderFieldError("conceptId")}
                    </div>

                    <div className="form-group">
                      <label htmlFor="question-difficulty">Kesulitan *</label>
                      <select
                        id="question-difficulty"
                        value={questionForm.difficulty}
                        onChange={(e) => handleQuestionChange({ difficulty: e.target.value })}
                      >
                        <option value="EASY">Mudah</option>
                        <option value="MEDIUM">Sedang</option>
                        <option value="HARD">Sulit</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="question-type">Tipe soal *</label>
                      <select
                        id="question-type"
                        value={questionForm.type}
                        onChange={(e) => handleQuestionChange({ type: e.target.value })}
                      >
                        <option value="MULTIPLE_CHOICE">Pilihan ganda</option>
                        <option value="ESSAY">Esai</option>
                        <option value="DRAG_DROP">Seret &amp; letakkan</option>
                        <option value="CODE">Kode</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="question-points">Poin *</label>
                      <input
                        id="question-points"
                        type="number"
                        min="0"
                        max="999.99"
                        step="0.01"
                        inputMode="decimal"
                        value={questionForm.points}
                        onChange={(e) => handleQuestionChange({ points: e.target.value })}
                        aria-invalid={questionErrors.points ? "true" : undefined}
                      />
                      {renderFieldError("points")}
                    </div>
                  </div>

                  <fieldset className="admin-fieldset">
                    <legend>Kunci jawaban — {Q_TYPE_LABELS[questionForm.type]}</legend>

                    {questionForm.type === "MULTIPLE_CHOICE" && (
                      <div className="admin-form-grid">
                        <div className="form-group">
                          <label htmlFor="question-options">Pilihan jawaban *</label>
                          <textarea
                            id="question-options"
                            rows={4}
                            value={questionForm.optionsText}
                            onChange={(e) => handleQuestionChange({ optionsText: e.target.value })}
                            aria-describedby="question-options-hint"
                            aria-invalid={questionErrors.optionsText ? "true" : undefined}
                            placeholder={"<div>\n<main>\n<section>\n<article>"}
                          />
                          <p id="question-options-hint" className="field-hint">
                            Satu pilihan per baris. Baris pertama menjadi A, baris kedua B, dan seterusnya.
                          </p>
                          {renderFieldError("optionsText")}
                        </div>
                        <div className="form-group">
                          <label htmlFor="question-correct">Kunci jawaban *</label>
                          <select
                            id="question-correct"
                            value={questionForm.correctLetter}
                            onChange={(e) => handleQuestionChange({ correctLetter: e.target.value })}
                            aria-invalid={questionErrors.correctLetter ? "true" : undefined}
                          >
                            {optionLines.length === 0 && <option value="A">A</option>}
                            {optionLines.map((option, index) => (
                              <option key={index} value={LETTERS[index]}>
                                {LETTERS[index]} — {option}
                              </option>
                            ))}
                          </select>
                          {renderFieldError("correctLetter")}
                        </div>
                      </div>
                    )}

                    {questionForm.type === "ESSAY" && (
                      <div className="form-group">
                        <label htmlFor="question-criteria">Kriteria penilaian *</label>
                        <textarea
                          id="question-criteria"
                          rows={4}
                          value={questionForm.criteriaText}
                          onChange={(e) => handleQuestionChange({ criteriaText: e.target.value })}
                          aria-describedby="question-criteria-hint"
                          aria-invalid={questionErrors.criteriaText ? "true" : undefined}
                          placeholder={"struktur header\nnav utama\nlandmark main"}
                        />
                        <p id="question-criteria-hint" className="field-hint">
                          Satu kriteria per baris. Jawaban peserta dinilai dari kunci kata/frasa ini;
                          60% kriteria terpenuhi dianggap benar.
                        </p>
                        {renderFieldError("criteriaText")}
                      </div>
                    )}

                    {questionForm.type === "CODE" && (
                      <div className="admin-form-grid">
                        <div className="form-group">
                          <label htmlFor="question-expected">Jawaban yang benar *</label>
                          <textarea
                            id="question-expected"
                            rows={5}
                            className="admin-mono"
                            value={questionForm.expectedText}
                            onChange={(e) => handleQuestionChange({ expectedText: e.target.value })}
                            aria-invalid={questionErrors.expectedText ? "true" : undefined}
                            placeholder={"const x = 1;"}
                          />
                          {renderFieldError("expectedText")}
                        </div>
                        <div className="form-group">
                          <label htmlFor="question-code-criteria">Kriteria (opsional)</label>
                          <textarea
                            id="question-code-criteria"
                            rows={5}
                            value={questionForm.criteriaText}
                            onChange={(e) => handleQuestionChange({ criteriaText: e.target.value })}
                            aria-describedby="question-code-criteria-hint"
                            placeholder={"const\nlet"}
                          />
                          <p id="question-code-criteria-hint" className="field-hint">
                            Satu kriteria per baris, untuk penilaian parsial bila jawaban tidak persis
                            sama.
                          </p>
                        </div>
                      </div>
                    )}

                    {questionForm.type === "DRAG_DROP" && (
                      <>
                        <div className="admin-form-grid">
                          <div className="form-group">
                            <label htmlFor="question-items">Item yang di-drag *</label>
                            <textarea
                              id="question-items"
                              rows={4}
                              value={questionForm.itemsText}
                              onChange={(e) => handleQuestionChange({ itemsText: e.target.value })}
                              aria-describedby="question-items-hint"
                              aria-invalid={questionErrors.itemsText ? "true" : undefined}
                              placeholder={"<nav>\nhref"}
                            />
                            <p id="question-items-hint" className="field-hint">
                              Satu item per baris, sesuai urutan tampilan peserta.
                            </p>
                            {renderFieldError("itemsText")}
                          </div>
                          <div className="form-group">
                            <label htmlFor="question-targets">Tujuan / kategori *</label>
                            <textarea
                              id="question-targets"
                              rows={4}
                              value={questionForm.targetsText}
                              onChange={(e) => handleQuestionChange({ targetsText: e.target.value })}
                              aria-describedby="question-targets-hint"
                              aria-invalid={questionErrors.targetsText ? "true" : undefined}
                              placeholder={"Elemen Navigasi Dokumen"}
                            />
                            <p id="question-targets-hint" className="field-hint">
                              Satu tujuan per baris.
                            </p>
                            {renderFieldError("targetsText")}
                          </div>
                        </div>

                        {dragItems.length > 0 && dragTargets.length > 0 && (
                          <div className="form-group">
                            <span className="admin-group-label" id="question-mapping-label">
                              Pasangan benar
                            </span>
                            <div
                              className="admin-mapping-list"
                              role="group"
                              aria-labelledby="question-mapping-label"
                            >
                              {dragItems.map((itemLabel, index) => {
                                const stored = Number(questionForm.mapping[index]);
                                const value =
                                  Number.isInteger(stored) && stored >= 0 && stored < dragTargets.length
                                    ? stored
                                    : Math.min(index, dragTargets.length - 1);
                                return (
                                  <div className="admin-mapping-row" key={index}>
                                    <span className="admin-mapping-item">{itemLabel}</span>
                                    <span aria-hidden="true">→</span>
                                    <select
                                      aria-label={`Tujuan benar untuk ${itemLabel}`}
                                      value={value}
                                      onChange={(e) =>
                                        handleQuestionChange({
                                          mapping: {
                                            ...questionForm.mapping,
                                            [index]: Number(e.target.value),
                                          },
                                        })
                                      }
                                    >
                                      {dragTargets.map((targetLabel, targetIndex) => (
                                        <option key={targetIndex} value={targetIndex}>
                                          {targetLabel}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </fieldset>

                  <div className="admin-form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={isSavingQuestion || isReordering}
                    >
                      {isSavingQuestion
                        ? "Menyimpan..."
                        : editingQuestionId
                        ? "Simpan soal"
                        : "Tambah soal"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={closeQuestionForm}
                      disabled={isSavingQuestion}
                    >
                      Batal
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
