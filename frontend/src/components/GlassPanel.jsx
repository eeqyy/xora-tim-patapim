// ============================================================
// XORA — GlassPanel Component
// frontend/src/components/GlassPanel.jsx
// ============================================================

import React from "react";

export default function GlassPanel({
  children,
  variant = "default", // "default" | "elevated" | "subtle" | "highlight" | "interactive"
  className = "",
  style,
  onClick,
  ...props
}) {
  const variantClass = `glass-panel-${variant}`;

  return (
    <div
      className={`glass-panel ${variantClass} ${className}`}
      onClick={onClick}
      style={style}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } } : undefined}
      {...props}
    >
      {children}
    </div>
  );
}
