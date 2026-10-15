// ============================================================
// XOLEARN — ToastContext (notifikasi ringan)
// frontend/src/context/ToastContext.jsx
// ------------------------------------------------------------
// Pesan singkat di pojok bawah: menggantikan window.alert dan
// memberi umpan balik setelah aksi berhasil/gagal.
//
//   const { success, error, info } = useToast();
//   success("Password berhasil diubah.");
//
// Area toast tidak menangkap klik (pointer-events-none) dan
// berada di bawah lapisan transisi pixel, jadi tidak pernah
// menghalangi interaksi.
// ============================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cx, HAIRLINE } from "../components/ui";

const ToastContext = createContext(null);

const TONE_CLASSES = {
  info: "bg-cell text-ink dark:bg-cell-dark dark:text-ink-dark",
  success: "bg-positive-soft text-positive-strong",
  error: "bg-error-soft text-error-ink",
};

const DEFAULT_DURATION = 4000;

function ToastItem({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast.duration) return undefined;
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="status"
      className={cx(
        "toast-item pointer-events-auto flex w-full items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] leading-snug",
        HAIRLINE,
        TONE_CLASSES[toast.tone] || TONE_CLASSES.info
      )}
    >
      <span className="min-w-0 flex-1">{toast.message}</span>
      <button
        type="button"
        aria-label="Tutup notifikasi"
        onClick={() => onDismiss(toast.id)}
        className="-mr-1 -mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[15px] leading-none opacity-70 transition-opacity hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((message, options = {}) => {
    if (!message) return null;
    const id = (idRef.current += 1);
    const duration = options.duration === undefined ? DEFAULT_DURATION : options.duration;
    setToasts((list) => [...list.slice(-2), { id, message, tone: options.tone || "info", duration }]);
    return id;
  }, []);

  const api = useMemo(
    () => ({
      show,
      dismiss,
      success: (message, options) => show(message, { ...options, tone: "success" }),
      error: (message, options) => show(message, { ...options, tone: "error" }),
      info: (message, options) => show(message, { ...options, tone: "info" }),
    }),
    [show, dismiss]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:items-end md:pb-6 md:pr-6"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="w-full max-w-sm">
            <ToastItem toast={toast} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* Fallback aman di luar provider. */
export function useToast() {
  const ctx = useContext(ToastContext);
  return (
    ctx || {
      show: () => null,
      dismiss: () => {},
      success: () => null,
      error: () => null,
      info: () => null,
    }
  );
}
