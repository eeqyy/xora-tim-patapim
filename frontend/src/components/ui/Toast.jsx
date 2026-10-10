// ============================================================
// XORA — Toast ringan (sukses/error/info)
// frontend/src/components/ui/Toast.jsx
// ============================================================

import React, { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);
let counter = 0;

const ICONS = {
  success: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M12 12v4" />
    </svg>
  ),
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const push = useCallback(({ title, message, tone = "info", duration = 4000 }) => {
    const id = ++counter;
    setToasts((list) => [...list.slice(-2), { id, title, message, tone }]);
    if (duration) timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast: push, dismiss }}>
      {children}
      <div className="ui-toast-wrap" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={["ui-toast", `ui-toast-${t.tone}`].filter(Boolean).join(" ")}>
            <span className="ui-toast-ico" aria-hidden="true">
              {ICONS[t.tone] || ICONS.info}
            </span>
            <div className="ui-toast-body">
              {t.title && <div className="ui-toast-title">{t.title}</div>}
              {t.message && <div className="ui-toast-msg">{t.message}</div>}
            </div>
            <button type="button" className="ui-toast-close" onClick={() => dismiss(t.id)} aria-label="Tutup">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

export default ToastProvider;