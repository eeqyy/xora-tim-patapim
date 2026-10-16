// ============================================================
// XOLEARN — StatusBadge (Editorial System v2)
// frontend/src/components/StatusBadge.jsx
// ------------------------------------------------------------
// Badge pil (sans, uppercase, tracking lebar). Palet mono +
// aksen azure: butuh perhatian = aksen, positif = ink,
// netral = muted.
// ============================================================

import { cx } from "./ui";

const STATUS_CONFIGS = {
  MASTERED: { label: "Dikuasai", variant: "success", dot: true },
  IN_PRACTICE: { label: "Sedang Latihan", variant: "info", dot: true },
  CONFIRMED_GAP: { label: "Kesenjangan Terkonfirmasi", variant: "error", dot: true },
  POSSIBLE_GAP: { label: "Perlu Verifikasi", variant: "warning", dot: true },
  NOT_ASSESSED: { label: "Belum Dinilai", variant: "neutral", dot: true },
  LOCKED: { label: "Belum Terbuka", variant: "neutral", dot: false },
  AVAILABLE: { label: "Tersedia", variant: "primary", dot: false },
  PASSED: { label: "Sudah Lulus", variant: "success", dot: true },
  NEEDS_PRACTICE: { label: "Perlu Latihan", variant: "error", dot: true },
  MIXED: { label: "Campuran", variant: "accent", dot: false },
  NO_GAP: { label: "Tuntas", variant: "success", dot: true },
  REJECTED: { label: "Hipotesis Ditolak", variant: "neutral", dot: true },
  TOPIC: { label: "Topik", variant: "primary", dot: false },
  LEVEL_FINAL: { label: "Ujian Level", variant: "accent", dot: false },
  PRACTICE: { label: "Latihan", variant: "info", dot: false },
  EASY: { label: "Mudah", variant: "success", dot: false },
  MEDIUM: { label: "Menengah", variant: "warning", dot: false },
  HARD: { label: "Sulit", variant: "error", dot: false },
  ACTIVE: { label: "Aktif", variant: "success", dot: true },
  INACTIVE: { label: "Nonaktif", variant: "neutral", dot: true },
  LEARNER: { label: "Learner", variant: "primary", dot: false },
  ADMIN: { label: "Admin", variant: "accent", dot: false },
};

const VARIANT_CLASSES = {
  success: "border-positive-strong bg-positive-soft text-positive-strong",
  warning: "border-warning-strong bg-warning-soft text-warning-ink",
  error: "border-error-strong bg-error-soft text-error-ink",
  info: "border-hairline text-ink dark:border-hairline-dark dark:text-ink-dark",
  neutral: "border-hairline text-muted dark:border-hairline-dark dark:text-muted-dark",
  primary: "border-brand text-accent",
  accent:
    "border-ink bg-ink text-white dark:border-ink-dark dark:bg-ink-dark dark:text-canvas-dark",
};

export default function StatusBadge({
  status,
  label,
  variant,
  dot = false,
  className = "",
  style,
}) {
  const config = STATUS_CONFIGS[status] || {};
  const effectiveVariant = variant || config.variant || "neutral";
  const effectiveLabel = label || config.label || status || "Status";
  const showDot = dot || config.dot;

  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
        VARIANT_CLASSES[effectiveVariant] || VARIANT_CLASSES.neutral,
        className
      )}
      style={style}
    >
      {showDot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
      <span>{effectiveLabel}</span>
    </span>
  );
}
