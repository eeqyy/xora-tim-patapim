// ============================================================
// XORA — Map status & label (ID) untuk domain adaptive
// frontend/src/lib/statusMaps.js
// ============================================================

export const GAP_LABELS = {
  INSUFFICIENT_EVIDENCE: "Bukti Belum Cukup",
  POSSIBLE_GAP: "Gap Terduga",
  VERIFICATION: "Perlu Verifikasi",
  CONFIRMED: "Gap Terkonfirmasi",
  REJECTED: "Gap Ditolak",
  INCONCLUSIVE: "Belum Konklusif",
  IN_PRACTICE: "Sedang Dilatih",
  MASTERED: "Mastered",
  NO_GAP: "Tidak Ada Gap",
  RESOLVED: "Teratasi",
  FAILED_VERIFICATION: "Verifikasi Gagal",
};

export const ACTION_LABELS = {
  RECOMMENDED: "Direkomendasikan",
  IN_PROGRESS: "Sedang Berjalan",
  COMPLETED: "Selesai",
  SKIPPED: "Dilewati",
};

export const PRACTICE_TYPE_LABELS = {
  PREREQUISITE_PRACTICE: "Pratinjau Prasyarat",
  TARGETED_PRACTICE: "Latihan Tertarget",
  COLLECT_MORE_EVIDENCE: "Kumpulkan Bukti",
  ADVANCE: "Lanjutkan",
};

export const ACTION_TYPE_LABELS = {
  RUN_DIAGNOSTIC: "Diagnostik Konfirmasi",
  ...PRACTICE_TYPE_LABELS,
};

export const ASSESSMENT_TYPE_LABELS = {
  PREREQUISITE: "Cek Prasyarat",
  PRACTICE: "Latihan",
  REASSESSMENT: "Re-assessment",
  DIAGNOSTIC: "Diagnostik",
  INITIAL: "Asesmen Awal",
};

export const DIFFICULTY_LABELS = {
  EASY: "Mudah",
  MEDIUM: "Sedang",
  HARD: "Sulit",
};

export const PLAN_STATUS_LABELS = {
  ACTIVE: "Aktif",
  ARCHIVED: "Diarsipkan",
};

export const EVENT_LABELS = {
  ASSESSMENT_STARTED: "Asesmen dimulai",
  ASSESSMENT_COMPLETED: "Asesmen selesai",
  PRACTICE_STARTED: "Latihan dimulai",
  PRACTICE_COMPLETED: "Latihan selesai",
  DIAGNOSTIC_VERIFIED: "Gap terverifikasi",
  RECOMMENDATION_COMPLETED: "Rekomendasi selesai",
  REASSESSMENT_COMPLETED: "Re-assessment selesai",
  LEARNING_PATH_UPDATED: "Learning path diperbarui",
  ONBOARDING_COMPLETED: "Onboarding selesai",
  PROFILE_UPDATED: "Profil diperbarui",
};

export function labelOf(map, value) {
  return value && map[value] ? map[value] : value || "-";
}

function toneFor(labels, tones, value, fallback = "neutral") {
  if (!value) return { label: "-", tone: fallback };
  return { label: labels[value] || value, tone: tones[value] || fallback };
}

export function gapStatusMeta(status) {
  return toneFor(
    GAP_LABELS,
    {
      MASTERED: "success",
      NO_GAP: "success",
      RESOLVED: "success",
      POSSIBLE_GAP: "warning",
      VERIFICATION: "warning",
      INCONCLUSIVE: "warning",
      CONFIRMED: "error",
      FAILED_VERIFICATION: "error",
      IN_PRACTICE: "indigo",
      REJECTED: "neutral",
      INSUFFICIENT_EVIDENCE: "outline",
    },
    status,
    "neutral"
  );
}

export function actionStatusMeta(status) {
  return toneFor(
    ACTION_LABELS,
    {
      COMPLETED: "success",
      IN_PROGRESS: "indigo",
      RECOMMENDED: "warning",
      SKIPPED: "outline",
    },
    status,
    "neutral"
  );
}

export function practiceTypeMeta(type) {
  return toneFor(
    PRACTICE_TYPE_LABELS,
    {
      TARGETED_PRACTICE: "indigo",
      COLLECT_MORE_EVIDENCE: "warning",
      PREREQUISITE_PRACTICE: "cyan",
      ADVANCE: "success",
    },
    type,
    "neutral"
  );
}

export function difficultyMeta(value) {
  return toneFor(DIFFICULTY_LABELS, { EASY: "success", MEDIUM: "warning", HARD: "error" }, value, "neutral");
}

export function actionTypeMeta(value) {
  if (value === "RUN_DIAGNOSTIC") return { label: ACTION_TYPE_LABELS.RUN_DIAGNOSTIC, tone: "warning" };
  return practiceTypeMeta(value);
}

export function assessmentTypeMeta(value) {
  return toneFor(ASSESSMENT_TYPE_LABELS, { TOPIC: "neutral", LEVEL_FINAL: "warning", PRACTICE: "success" }, value, "neutral");
}

export const CATEGORY_LABELS = {
  CONCEPTUAL: "Konseptual",
  TRUE_FALSE: "Benar / Salah",
  CODE_INTERPRETATION: "Interpretasi Kode",
  SCENARIO: "Skenario",
};

export function categoryMeta(value) {
  return toneFor(
    CATEGORY_LABELS,
    {
      TRUE_FALSE: "neutral",
      CODE_INTERPRETATION: "warning",
      SCENARIO: "success",
      CONCEPTUAL: "neutral",
    },
    value,
    "neutral"
  );
}

export const MATERIAL_TYPE_LABELS = {
  ARTICLE: "Artikel",
  VIDEO: "Video",
  CODE_EXAMPLE: "Contoh Kode",
  DOCUMENT: "Dokumen",
  LINK: "Tautan",
};

export function materialTypeMeta(value) {
  return toneFor(MATERIAL_TYPE_LABELS, { VIDEO: "cyan", CODE_EXAMPLE: "indigo", ARTICLE: "neutral" }, value, "neutral");
}

export const DIAGNOSTIC_LABELS = {
  PENDING: "Menunggu",
  HYPOTHESIS: "Hipotesis",
  VERIFIED: "Terverifikasi",
  FAILED: "Gagal",
};