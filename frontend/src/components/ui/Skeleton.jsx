// ============================================================
// XORA — Skeleton loading
// frontend/src/components/ui/Skeleton.jsx
// ============================================================

import React from "react";

export default function Skeleton({ variant = "text", className = "", style }) {
  const cls = ["ui-skeleton", `ui-skeleton-${variant}`, className].filter(Boolean).join(" ");
  return <div className={cls} style={style} aria-hidden="true" />;
}

export function SkeletonList({ count = 3, variant = "card", className = "" }) {
  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} style={{ marginBottom: 12 }}>
          <Skeleton variant={variant} />
        </div>
      ))}
    </div>
  );
}