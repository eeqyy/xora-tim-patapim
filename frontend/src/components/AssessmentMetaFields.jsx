// ============================================================
// XORA — Form fields untuk meta asesmen (dipakai admin)
// frontend/src/components/AssessmentMetaFields.jsx
// ============================================================
// Menyediakan: judul, tipe, subjek, level, topik, durasi, passing score.
// Cascading: subjek -> level -> topik, dan tipe menentukan field wajib
// (TOPIC butuh topik, LEVEL_FINAL butuh level — aturan CHECK di schema).
// ============================================================

import React from "react";

export const ASSESSMENT_TYPES = [
  { value: "PRACTICE", label: "Latihan" },
  { value: "TOPIC", label: "Topik" },
  { value: "LEVEL_FINAL", label: "Ujian Level" },
  { value: "MIXED", label: "Campuran" },
  { value: "REASSESSMENT", label: "Remedial" },
];

export default function AssessmentMetaFields({
  form,
  onChange,
  errors = {},
  subjects = [],
  levels = [],
  topics = [],
  idPrefix = "meta",
}) {
  const id = (key) => `${idPrefix}-${key}`;
  const errId = (key) => `${id(key)}-err`;

  // Filter bertingkat sesuai pilihan saat ini
  const subjectLevels = levels.filter((l) => !form.subjectId || l.subject_id === form.subjectId);
  const levelTopics = topics.filter((t) => !form.levelId || t.level_id === form.levelId);

  // Saat subjek diganti, level & topik ikut di-reset (cascade)
  const handleSubject = (value) => onChange({ subjectId: value, levelId: "", topicId: "" });
  // Saat level diganti, topik di-reset
  const handleLevel = (value) => onChange({ levelId: value, topicId: "" });

  const invalid = (key) => (errors[key] ? "true" : undefined);
  const describedBy = (key, hintId) =>
    [errors[key] ? errId(key) : null, hintId || null].filter(Boolean).join(" ") || undefined;

  return (
    <div className="admin-form-grid">
      <div className="form-group">
        <label htmlFor={id("title")}>Judul Asesmen *</label>
        <input
          id={id("title")}
          type="text"
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Mis. Latihan: Struktur Dokumen"
          aria-invalid={invalid("title")}
          aria-describedby={errors.title ? errId("title") : undefined}
        />
        {errors.title && (
          <p id={errId("title")} className="field-error" role="alert">
            {errors.title}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={id("type")}>Tipe *</label>
        <select id={id("type")} value={form.type} onChange={(e) => onChange({ type: e.target.value })}>
          {ASSESSMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {form.type === "TOPIC" && (
          <p className="field-hint">Tipe Topik mewajibkan pemilihan topik di bawah.</p>
        )}
        {form.type === "LEVEL_FINAL" && (
          <p className="field-hint">Tipe Ujian Level mewajibkan pemilihan level di bawah.</p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={id("subject")}>Subjek *</label>
        <select
          id={id("subject")}
          value={form.subjectId}
          onChange={(e) => handleSubject(e.target.value)}
          aria-invalid={invalid("subjectId")}
          aria-describedby={describedBy("subjectId")}
        >
          <option value="">— Pilih subjek —</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.subjectId && (
          <p id={errId("subjectId")} className="field-error" role="alert">
            {errors.subjectId}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={id("level")}>
          Level {form.type === "LEVEL_FINAL" ? "*" : "(opsional)"}
        </label>
        <select
          id={id("level")}
          value={form.levelId}
          onChange={(e) => handleLevel(e.target.value)}
          aria-invalid={invalid("levelId")}
          aria-describedby={describedBy("levelId")}
        >
          <option value="">— Pilih level —</option>
          {subjectLevels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        {errors.levelId && (
          <p id={errId("levelId")} className="field-error" role="alert">
            {errors.levelId}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={id("topic")}>
          Topik {form.type === "TOPIC" ? "*" : "(opsional)"}
        </label>
        <select
          id={id("topic")}
          value={form.topicId}
          onChange={(e) => onChange({ topicId: e.target.value })}
          aria-invalid={invalid("topicId")}
          aria-describedby={describedBy("topicId", `${id("topic")}-hint`)}
        >
          <option value="">— Pilih topik —</option>
          {levelTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <p id={`${id("topic")}-hint`} className="field-hint">
          Pilih level dulu agar daftar topik sesuai.
        </p>
        {errors.topicId && (
          <p id={errId("topicId")} className="field-error" role="alert">
            {errors.topicId}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={id("duration")}>Durasi (menit, opsional)</label>
        <input
          id={id("duration")}
          type="number"
          min="1"
          inputMode="numeric"
          value={form.durationMinutes}
          onChange={(e) => onChange({ durationMinutes: e.target.value })}
          aria-describedby={describedBy("durationMinutes", `${id("duration")}-hint`)}
        />
        <p id={`${id("duration")}-hint`} className="field-hint">
          Kosongkan bila tanpa batas waktu.
        </p>
        {errors.durationMinutes && (
          <p id={errId("durationMinutes")} className="field-error" role="alert">
            {errors.durationMinutes}
          </p>
        )}
      </div>

      <div className="form-group">
        <label htmlFor={id("passing")}>Passing score (% , opsional)</label>
        <input
          id={id("passing")}
          type="number"
          min="0"
          max="100"
          inputMode="numeric"
          value={form.passingScore}
          onChange={(e) => onChange({ passingScore: e.target.value })}
          aria-describedby={describedBy("passingScore")}
        />
        {errors.passingScore && (
          <p id={errId("passingScore")} className="field-error" role="alert">
            {errors.passingScore}
          </p>
        )}
      </div>
    </div>
  );
}
