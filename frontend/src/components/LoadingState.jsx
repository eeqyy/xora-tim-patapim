// ============================================================
// XOLEARN — LoadingState (Editorial System v2)
// frontend/src/components/LoadingState.jsx
// ============================================================

import { MicroMeta, cx } from "./ui";

export default function LoadingState({ message = "Memuat data...", className = "", style }) {
  return (
    <div
      className={cx("flex items-center gap-3 py-8", className)}
      style={style}
      role="status"
      aria-live="polite"
    >
      <span
        className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent"
        aria-hidden="true"
      />
      <MicroMeta>{message}</MicroMeta>
    </div>
  );
}
