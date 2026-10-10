// ============================================================
// XORA — Badge / pill status
// frontend/src/components/ui/Badge.jsx
// ============================================================

import React from "react";

const VARIANTS = {
  neutral: "ui-badge-neutral",
  success: "ui-badge-success",
  warning: "ui-badge-warning",
  error: "ui-badge-error",
  indigo: "ui-badge-indigo",
  cyan: "ui-badge-cyan",
  emerald: "ui-badge-emerald",
  outline: "ui-badge-outline",
};

export default function Badge({ variant = "neutral", dot = false, className = "", children, ...rest }) {
  const cls = ["ui-badge", VARIANTS[variant] || VARIANTS.neutral, className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {dot && <span className="ui-badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}