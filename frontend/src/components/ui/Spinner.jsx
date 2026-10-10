// ============================================================
// XORA — Spinner
// frontend/src/components/ui/Spinner.jsx
// ============================================================

import React from "react";

export default function Spinner({ size = "md", className = "" }) {
  const cls = ["ui-spinner", size === "sm" ? "ui-spinner-sm" : "", size === "lg" ? "ui-spinner-lg" : "", className]
    .filter(Boolean)
    .join(" ");
  return <span className={cls} role="status" aria-label="Memuat" aria-busy="true" />;
}