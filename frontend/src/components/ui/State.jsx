// ============================================================
// XORA — Empty & Error state blocks
// frontend/src/components/ui/State.jsx
// ============================================================

import React from "react";
import Button from "./Button";

export function EmptyState({ title = "Belum ada data", desc, action }) {
  return (
    <div className="ui-empty">
      <div className="ui-empty-ico" aria-hidden="true" />
      <div className="ui-empty-title">{title}</div>
      {desc && <div className="ui-empty-desc">{desc}</div>}
      {action && <div className="ui-empty-action">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = "Terjadi kesalahan", detail, onRetry, retryLabel = "Coba lagi" }) {
  return (
    <div className="ui-error-box" role="alert">
      <div className="ui-error-box-ico" aria-hidden="true" />
      <div className="ui-error-box-msg">{message}</div>
      {detail && <div className="ui-error-box-detail">{detail}</div>}
      {onRetry && (
        <div className="ui-error-retry">
          <Button variant="subtle" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export default EmptyState;