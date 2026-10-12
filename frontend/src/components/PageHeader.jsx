// ============================================================
// XORA — PageHeader Component
// frontend/src/components/PageHeader.jsx
// ============================================================

import React from "react";

export default function PageHeader({
  badge,
  title,
  description,
  actions,
  className = "",
  style,
}) {
  return (
    <div className={`page-header ${className}`} style={{ marginBottom: "1.75rem", ...style }}>
      <div className="page-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
        <div className="page-header-main" style={{ flex: "1 1 300px" }}>
          {badge && (
            <div className="page-header-badge-wrap" style={{ marginBottom: "0.5rem" }}>
              {typeof badge === "string" ? (
                <span className="badge badge-subtle">{badge}</span>
              ) : (
                badge
              )}
            </div>
          )}
          {title && <h1 className="page-title">{title}</h1>}
          {description && <p className="page-description">{description}</p>}
        </div>
        {actions && (
          <div className="page-header-actions" style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
