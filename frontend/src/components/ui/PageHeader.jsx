// ============================================================
// XORA — Header halaman dengan eyebrow (khas halaman detail)
// frontend/src/components/ui/PageHeader.jsx
// ============================================================

import React from "react";

export default function PageHeader({ eyebrow, title, desc, actions }) {
  return (
    <header className="ui-page-header">
      {eyebrow && <div className="ui-eyebrow">{eyebrow}</div>}
      <div className="ui-page-title-row">
        <h1 className="ui-page-title">{title}</h1>
        {actions && <div className="ui-page-actions">{actions}</div>}
      </div>
      {desc && <p className="ui-page-desc">{desc}</p>}
    </header>
  );
}