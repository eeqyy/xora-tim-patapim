// ============================================================
// XORA — ProgressBar Component
// frontend/src/components/ProgressBar.jsx
// ============================================================

import React from "react";

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  showPercent = true,
  variant = "primary", // "primary" | "success" | "warning" | "error"
  size = "md", // "sm" | "md" | "lg"
  className = "",
  style,
}) {
  const percent = Math.min(100, Math.max(0, Math.round((Number(value || 0) / Number(max || 100)) * 100)));
  const sizeClass = `progress-bar-${size}`;
  const variantClass = `progress-bar-${variant}`;

  return (
    <div className={`progress-bar-wrapper ${className}`} style={style}>
      {(label || showPercent) && (
        <div className="progress-bar-header">
          {label && <span className="progress-bar-label">{label}</span>}
          {showPercent && <span className="progress-bar-percent">{percent}%</span>}
        </div>
      )}
      <div
        className={`progress-bar-track ${sizeClass}`}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`progress-bar-fill ${variantClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
