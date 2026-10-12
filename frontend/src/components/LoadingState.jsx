// ============================================================
// XORA — LoadingState Component
// frontend/src/components/LoadingState.jsx
// ============================================================

import React from "react";

export default function LoadingState({
  message = "Memuat data...",
  className = "",
  style,
}) {
  return (
    <div className={`loading-state-card glass-panel ${className}`} style={style}>
      <div className="loading-spinner" aria-hidden="true" />
      <p className="loading-message">{message}</p>
    </div>
  );
}
