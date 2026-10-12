// ============================================================
// XORA — StatusBadge Component
// frontend/src/components/StatusBadge.jsx
// ============================================================

import React from "react";

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

export default function StatusBadge({
  status,
  label,
  variant, // "success" | "warning" | "error" | "info" | "neutral" | "primary" | "accent"
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
      className={`status-badge status-badge-${effectiveVariant} ${className}`}
      style={style}
    >
      {showDot && <span className="status-badge-dot" aria-hidden="true" />}
      <span>{effectiveLabel}</span>
    </span>
  );
}
