// ============================================================
// XORA — EmptyState Component
// frontend/src/components/EmptyState.jsx
// ============================================================

import React from "react";
import { IconInfo } from "./Icons";

export default function EmptyState({
  icon,
  title = "Belum Ada Data",
  description = "Belum ada informasi yang dapat ditampilkan saat ini.",
  action,
  className = "",
  style,
}) {
  return (
    <div className={`empty-state-card glass-panel ${className}`} style={style}>
      <div className="empty-state-icon-wrap">
        {icon || <IconInfo size={32} className="empty-state-icon" />}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
