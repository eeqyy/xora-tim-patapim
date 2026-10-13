// ============================================================
// XOLEARN — ProgressBar (Editorial System v2)
// frontend/src/components/ProgressBar.jsx
// ------------------------------------------------------------
// Batang pil (rounded-full), tanpa shadow. Label mikro,
// isian aksen cobalt.
// ============================================================

import React from "react";
import { MicroMeta, cx } from "./ui";

const HEIGHT = {
  sm: "h-1.5",
  md: "h-2",
  lg: "h-3",
};

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
  const percent = Math.min(
    100,
    Math.max(0, Math.round((Number(value || 0) / Number(max || 100)) * 100))
  );

  const fillClass = variant === "primary" ? "bg-brand" : "bg-ink dark:bg-ink-dark";

  return (
    <div className={cx("w-full", className)} style={style}>
      {(label || showPercent) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {label ? <MicroMeta>{label}</MicroMeta> : <span />}
          {showPercent ? (
            <span className="text-[12px] font-bold tabular-nums text-ink dark:text-ink-dark">
              {percent}%
            </span>
          ) : null}
        </div>
      )}
      <div
        className={cx(
          "w-full overflow-hidden rounded-full bg-cell dark:bg-cell-dark",
          HEIGHT[size] || HEIGHT.md
        )}
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cx("h-full rounded-full transition-[width] duration-500", fillClass)}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
