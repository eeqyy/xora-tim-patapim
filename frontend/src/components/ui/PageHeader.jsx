// ============================================================
// XORA — Header halaman dengan eyebrow (khas halaman detail)
// frontend/src/components/ui/PageHeader.jsx
// ============================================================

import React from "react";

export default function PageHeader({ eyebrow, title, desc, actions, backLabel, onBack }) {
  return (
    <header className="ui-page-header">
      {eyebrow && <div className="ui-eyebrow">{eyebrow}</div>}
      <div className="ui-page-title-row">
        {onBack && (
          <button type="button" className="ui-back" onClick={onBack} aria-label={backLabel || "Kembali"}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}
        <h1 className="ui-page-title">{title}</h1>
        {actions && <div className="ui-page-actions">{actions}</div>}
      </div>
      {desc && <p className="ui-page-desc">{desc}</p>}
    </header>
  );
}