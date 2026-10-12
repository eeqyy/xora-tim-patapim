// ============================================================
// XORA — ErrorState Component
// frontend/src/components/ErrorState.jsx
// ============================================================

import React from "react";
import { IconAlertTriangle, IconRefresh } from "./Icons";
import { PrimaryButton } from "./Button";

export default function ErrorState({
  title = "Terjadi Kesalahan",
  message = "Gagal memproses permintaan. Silakan coba kembali.",
  onRetry,
  retryLabel = "Coba Lagi",
  className = "",
  style,
}) {
  return (
    <div className={`error-state-card glass-panel glass-panel-highlight ${className}`} style={style}>
      <div className="error-state-icon-wrap">
        <IconAlertTriangle size={32} className="error-state-icon" />
      </div>
      <h3 className="error-state-title">{title}</h3>
      <p className="error-state-message">{message}</p>
      {onRetry && (
        <div className="error-state-actions">
          <PrimaryButton
            size="sm"
            onClick={onRetry}
            icon={<IconRefresh size={14} />}
          >
            {retryLabel}
          </PrimaryButton>
        </div>
      )}
    </div>
  );
}
