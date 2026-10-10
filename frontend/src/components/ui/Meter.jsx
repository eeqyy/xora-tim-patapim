// ============================================================
// XORA — Meter/progress bar tipis (Linear-style)
// frontend/src/components/ui/Meter.jsx
// ============================================================

import React from "react";

export default function Meter({ value, max = 100, label, display, tone = "", className = "" }) {
  const safe = Number.isFinite(value) ? value : 0;
  const pct = Math.max(0, Math.min(100, max > 0 ? (safe / max) * 100 : 0));
  return (
    <div className={["ui-meter", className].filter(Boolean).join(" ")}>
      {(label || display !== undefined) && (
        <div className="ui-meter-top">
          {label && <span className="ui-meter-label">{label}</span>}
          <span className="ui-meter-value">{display !== undefined ? display : Math.round(safe)}</span>
        </div>
      )}
      <div
        className="ui-meter-track"
        role="progressbar"
        aria-valuenow={Math.round(safe)}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={["ui-meter-fill", tone ? `ui-meter-fill-${tone}` : ""].filter(Boolean).join(" ")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}