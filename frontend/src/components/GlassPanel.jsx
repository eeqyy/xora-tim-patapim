// ============================================================
// XOLEARN — Panel / GlassPanel (Editorial System v2)
// frontend/src/components/GlassPanel.jsx
// ------------------------------------------------------------
// Nama `GlassPanel` dipertahankan demi kompatibilitas impor.
// Varian default = kontainer transparan (pemisah memakai garis
// horizontal). Varian surface (elevated/subtle/highlight)
// memakai sudut pil besar + latar lembut, tanpa border kotak.
// ============================================================

import React from "react";
import { cx } from "./ui";

const VARIANT_CLASSES = {
  default: "",
  elevated: "rounded-3xl bg-cell dark:bg-cell-dark",
  subtle: "rounded-3xl bg-cell dark:bg-cell-dark",
  highlight: "rounded-3xl bg-highlight",
  // `brand` = band sorotan untuk pesan inti (mis. rekomendasi AI).
  brand: "rounded-3xl bg-brand-soft",
  interactive:
    "rounded-3xl cursor-pointer transition-colors hover:bg-cell dark:hover:bg-cell-dark",
};

export default function GlassPanel({
  children,
  variant = "default",
  className = "",
  onClick,
  ...props
}) {
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.default;

  return (
    <div
      className={cx("min-w-0", variantClass, className)}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
      {...props}
    >
      {children}
    </div>
  );
}
