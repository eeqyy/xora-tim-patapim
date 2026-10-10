// ============================================================
// XORA — Card (variants ui-card-*)
// frontend/src/components/ui/Card.jsx
// ============================================================

import React from "react";

export default function Card({
  surface = false,
  elevated = false,
  hoverable = false,
  sheen = false,
  padded = true,
  className = "",
  children,
  ...rest
}) {
  const cls = [
    "ui-card",
    surface ? "ui-card-surface" : "",
    elevated ? "ui-card-elevated" : "",
    hoverable ? "ui-card-hoverable" : "",
    sheen ? "ui-card-sheen" : "",
    padded ? "ui-card-pad" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}