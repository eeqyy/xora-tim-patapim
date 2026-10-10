// ============================================================
// XORA — Onboarding 3 langkah (learner)
// Langkah 1 pengalaman -> 2 tujuan -> 3 subject pilihan.
// Simpan lewat PATCH /api/profile, lanjut ke konfirmasi learning path.
// frontend/src/pages/OnboardingPage.jsx
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { profileApi, subjectsApi } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { Textarea } from "../components/ui/Input";
import Skeleton, { SkeletonList } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";

const EXPERIENCE_OPTIONS = [
  { value: "NONE", label: "Baru mulai", desc: "Belum pernah belajar materi ini." },
  { value: "BEGINNER", label: "Pemula", desc: "Pernah sedikit membahas, masih dangkal." },
  { value: "INTERMEDIATE", label: "Menengah", desc: "Sudah paham dasar, butuh pendalaman." },
  { value: "ADVANCED", label: "Mahir", desc: "Sudah lancar, ingin menguji dan menunjukkan." },
];

const GOAL_SUGGESTIONS = [
  "Memahami konsep-konsep kunci dari fondasi",
  "Lancar mengerjakan soal latihan dan ujian",
  "Membangun pemahaman yang tahan lama (bukan hafalan)",
];

const STEPS = [
  { no: "01", label: "Pengalaman" },
  { no: "02", label: "Tujuan" },
  { no: "03", label: "Subject" },
];

export default function OnboardingPage() {
  const { token, user, isAdmin } = useAuth();
  const { navigate } = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [experience_level, setExperienceLevel] = useState("");
  const [learning_goal, setLearningGoal] = useState("");
  const [preferred_subject_id, setPreferredSubjectId] = useState("");
  const [subjects, setSubjects] = useState(null);
  const [subjectsError, setSubjectsError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin/assessments");
      return;
    }
    if (user && user.onboarding && user.onboarding.completed === true) {
      navigate("/profile");
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    let active = true;
    subjectsApi
      .getAll()
      .then((json) => {
        if (active) setSubjects(json?.data || json || []);
      })
      .catch((err) => {
        if (active) setSubjectsError(err.message || "Gagal memuat daftar subject.");
      });
    return () => {
      active = false;
    };
  }, []);

  if (isAdmin) return null;

  const canNext =
    step === 1 ? Boolean(experience_level) : step === 2 ? Boolean(learning_goal.trim()) : Boolean(preferred_subject_id);

  const handleNext = () => {
    setFormError(null);
    if (!canNext) {
      setFormError(
        step === 3
          ? "Pilih satu subject untuk jalur belajar kamu."
          : step === 2
            ? "Tulis dulu tujuan belajar kamu."
            : "Pilih tingkat pengalaman kamu."
      );
      return;
    }
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      handleSave();
    }
  };

  const handleBack = () => {
    setFormError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    try {
      await profileApi.updateProfile(
        { learning_goal: learning_goal.trim(), experience_level, preferred_subject_id },
        token
      );
      navigate("/learning-path/confirm");
    } catch (err) {
      setFormError(err.message || "Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-container">
      <Card surface className="ui-auth-card ui-onboard-card">
        <div className="ui-onboard-head">
          <div className="ui-eyebrow">Penyetelan awal</div>
          <h2 className="auth-title">Kenali dulu posisimu</h2>
          <p className="auth-subtitle">
            3 langkah singkat — jawabanmu dipakai untuk menyusun learning map.
          </p>
        </div>

        <div className="ui-steps" aria-label="Langkah onboarding">
          {STEPS.map((s) => (
            <div
              key={s.no}
              className={[
                "ui-step",
                step === Number(s.no) ? "ui-step-active" : "",
                step > Number(s.no) ? "ui-step-done" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="ui-step-no">{s.no}</span>
              <span className="ui-step-label">{s.label}</span>
            </div>
          ))}
        </div>

        {formError && (
          <div className="ui-form-error" role="alert">
            {formError}
          </div>
        )}

        {step === 1 && (
          <div className="ui-stack">
            <p className="ui-field-label-text">Seberapa paham kamu dengan materi ini?</p>
            <div className="ui-option-grid">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={["ui-card ui-option", experience_level === opt.value ? "ui-option-active" : ""]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setExperienceLevel(opt.value)}
                >
                  <span className="ui-option-label">{opt.label}</span>
                  <span className="ui-option-desc">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="ui-stack">
            <Textarea
              id="onboard-goal"
              label="Apa tujuan belajarmu?"
              placeholder="Contoh: Saya ingin memahami turunan dan integral untuk bisa menganalisis pertumbuhan."
              value={learning_goal}
              onChange={(e) => setLearningGoal(e.target.value)}
              rows={4}
              required
            />
            <div className="ui-chip-row">
              {GOAL_SUGGESTIONS.map((g) => (
                <button
                  key={g}
                  type="button"
                  className="ui-chip"
                  onClick={() => setLearningGoal(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="ui-stack">
            <p className="ui-field-label-text">Pilih mata pelajaran yang akan kamu pelajari:</p>
            {subjectsError ? (
              <div className="ui-form-error" role="alert">
                {subjectsError}
              </div>
            ) : subjects === null ? (
              <SkeletonList count={3} variant="card" />
            ) : (
              <div className="ui-option-grid">
                {subjects.map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    className={["ui-card ui-option", preferred_subject_id === sub.id ? "ui-option-active" : ""]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setPreferredSubjectId(sub.id)}
                  >
                    <span className="ui-option-label">{sub.name}</span>
                    {sub.description && <span className="ui-option-desc">{sub.description}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="ui-onboard-actions">
          {step > 1 && (
            <Button variant="ghost" onClick={handleBack} disabled={saving}>
              Kembali
            </Button>
          )}
          <Button
            type="button"
            onClick={handleNext}
            loading={saving}
            disabled={step === 3 && subjects === null}
            className={step > 1 ? "" : "ui-btn-grow"}
          >
            {step < 3 ? "Lanjutkan" : "Simpan & Lanjut"}
          </Button>
        </div>
      </Card>
    </div>
  );
}