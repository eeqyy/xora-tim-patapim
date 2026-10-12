// ============================================================
// XORA — StatCard Component
// frontend/src/components/StatCard.jsx
// ============================================================

import React from "react";

export default function StatCard({
  label,
  value,
  secondary,
  icon,
  variant = "default", // "default" | "success" | "warning" | "error" | "info" | "neutral"
  className = "",
  style,
  onClick,
}) {
  return (
    <div
      className={`stat-card stat-card-${variant} ${onClick ? "stat-card-clickable" : ""} ${className}`}
      style={style}
      onClick={onClick}
    >
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {icon && <span className="stat-card-icon">{icon}</span>}
      </div>
      <div className="stat-card-value">{value}</div>
      {secondary && <div className="stat-card-secondary">{secondary}</div>}
    </div>
  );
}
