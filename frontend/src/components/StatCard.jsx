// ============================================================
// XOLEARN — StatCard (Editorial System v2)
// frontend/src/components/StatCard.jsx
// ------------------------------------------------------------
// Sel metrik: label mikro, angka besar, keterangan kecil.
// Dipisahkan oleh garis horizontal (border-t), tanpa kotak.
// ============================================================

import React from "react";
import { MicroMeta, INK, MUTED, cx, HAIRLINE } from "./ui";

export default function StatCard({
  label,
  value,
  secondary,
  variant = "default", // "default" | "success" | "warning" | "error" | "info" | "neutral"
  className = "",
  style,
  ...props
}) {
  const valueAccent = variant === "error" || variant === "warning";

  return (
    <div
      className={cx(
        "flex min-h-[104px] min-w-0 flex-col justify-between gap-3 border-t pt-5",
        HAIRLINE,
        className
      )}
      style={style}
      {...props}
    >
      <MicroMeta>{label}</MicroMeta>
      <span
        className={cx(
          "text-4xl font-semibold leading-none tracking-[-0.02em] tabular-nums md:text-5xl",
          valueAccent ? "text-brand" : INK
        )}
      >
        {value}
      </span>
      {secondary ? (
        <span className={cx("text-[12px] leading-snug", MUTED)}>{secondary}</span>
      ) : null}
    </div>
  );
}
