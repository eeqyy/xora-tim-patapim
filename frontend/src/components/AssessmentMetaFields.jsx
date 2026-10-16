// ============================================================
// XOLEARN — Form fields untuk meta asesmen (dipakai admin)
// frontend/src/components/AssessmentMetaFields.jsx
// ------------------------------------------------------------
// Menyediakan: judul, tipe, subjek, level, topik, durasi, passing score.
// Cascading: subjek -> level -> topik, dan tipe menentukan field wajib
// (TOPIC butuh topik, LEVEL_FINAL butuh level — aturan CHECK di schema).
// ============================================================

import { Field, Input, Select } from "./ui";

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

  // Filter bertingkat sesuai pilihan saat ini
  const subjectLevels = levels.filter((l) => !form.subjectId || l.subject_id === form.subjectId);
  const levelTopics = topics.filter((t) => !form.levelId || t.level_id === form.levelId);

  // Saat subjek diganti, level & topik ikut di-reset (cascade)
  const handleSubject = (value) => onChange({ subjectId: value, levelId: "", topicId: "" });
  // Saat level diganti, topik di-reset
  const handleLevel = (value) => onChange({ levelId: value, topicId: "" });

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Field label="Judul Asesmen" htmlFor={id("title")} required error={errors.title}>
        <Input
          id={id("title")}
          type="text"
          value={form.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Mis. Latihan: Struktur Dokumen"
          aria-invalid={errors.title ? "true" : undefined}
        />
      </Field>

      <Field
        label="Tipe"
        htmlFor={id("type")}
        required
        hint={
          form.type === "TOPIC"
            ? "Tipe Topik mewajibkan pemilihan topik di bawah."
            : form.type === "LEVEL_FINAL"
              ? "Tipe Ujian Level mewajibkan pemilihan level di bawah."
              : undefined
        }
      >
        <Select
          id={id("type")}
          value={form.type}
          onChange={(e) => onChange({ type: e.target.value })}
        >
          {ASSESSMENT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Subjek" htmlFor={id("subject")} required error={errors.subjectId}>
        <Select
          id={id("subject")}
          value={form.subjectId}
          onChange={(e) => handleSubject(e.target.value)}
          aria-invalid={errors.subjectId ? "true" : undefined}
        >
          <option value="">— Pilih subjek —</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={`Level ${form.type === "LEVEL_FINAL" ? "" : "(opsional)"}`}
        htmlFor={id("level")}
        required={form.type === "LEVEL_FINAL"}
        error={errors.levelId}
      >
        <Select
          id={id("level")}
          value={form.levelId}
          onChange={(e) => handleLevel(e.target.value)}
          aria-invalid={errors.levelId ? "true" : undefined}
        >
          <option value="">— Pilih level —</option>
          {subjectLevels.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label={`Topik ${form.type === "TOPIC" ? "" : "(opsional)"}`}
        htmlFor={id("topic")}
        required={form.type === "TOPIC"}
        hint="Pilih level dulu agar daftar topik sesuai."
        error={errors.topicId}
      >
        <Select
          id={id("topic")}
          value={form.topicId}
          onChange={(e) => onChange({ topicId: e.target.value })}
          aria-invalid={errors.topicId ? "true" : undefined}
        >
          <option value="">— Pilih topik —</option>
          {levelTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Durasi (menit, opsional)"
        htmlFor={id("duration")}
        hint="Kosongkan bila tanpa batas waktu."
        error={errors.durationMinutes}
      >
        <Input
          id={id("duration")}
          type="number"
          min="1"
          inputMode="numeric"
          value={form.durationMinutes}
          onChange={(e) => onChange({ durationMinutes: e.target.value })}
        />
      </Field>

      <Field
        label="Passing score (%, opsional)"
        htmlFor={id("passing")}
        error={errors.passingScore}
      >
        <Input
          id={id("passing")}
          type="number"
          min="0"
          max="100"
          inputMode="numeric"
          value={form.passingScore}
          onChange={(e) => onChange({ passingScore: e.target.value })}
        />
      </Field>
    </div>
  );
}
