// ============================================================
// XOLEARN — DialogContext (confirm & prompt bertema)
// frontend/src/context/DialogContext.jsx
// ------------------------------------------------------------
// Menggantikan window.confirm / window.prompt / window.alert
// dengan modal yang ikut tema aplikasi.
//
// API-nya berbasis Promise, jadi pemakaiannya:
//     const ok = await confirm({ title, description });
//     if (!ok) return;
//     const value = await prompt({ title, minLength: 8 });
//     if (value === null) return;   // dibatalkan
//
// Hanya satu dialog yang tampil pada satu waktu (permintaan
// terbaru menimpa yang belum dijawab akan tetap diselesaikan
// sebagai "dibatalkan" lewat pergantian permintaan).
// ============================================================

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Dialog from "../components/Dialog";
import Button from "../components/Button";
import { cx, INPUT_CLASS, MUTED } from "../components/ui";

const DialogContext = createContext(null);

const CANCEL_LABEL = "Batal";

export function DialogProvider({ children }) {
  const [request, setRequest] = useState(null);
  const [value, setValue] = useState("");
  const resolveRef = useRef(null);

  const open = useCallback((next) => {
    return new Promise((resolve) => {
      const previous = resolveRef.current;
      resolveRef.current = resolve;
      if (previous) previous(null);
      setValue(next.defaultValue ?? "");
      setRequest(next);
    });
  }, []);

  const finish = useCallback((result) => {
    const resolve = resolveRef.current;
    resolveRef.current = null;
    setRequest(null);
    if (resolve) resolve(result);
  }, []);

  const confirm = useCallback(
    (options = {}) =>
      open({
        kind: "confirm",
        title: options.title || "Lanjutkan?",
        description: options.description,
        confirmLabel: options.confirmLabel || "Lanjutkan",
        cancelLabel: options.cancelLabel || CANCEL_LABEL,
        tone: options.tone === "danger" ? "danger" : "primary",
      }),
    [open]
  );

  const prompt = useCallback(
    (options = {}) =>
      open({
        kind: "prompt",
        title: options.title || "Masukkan nilai",
        description: options.description,
        label: options.label,
        confirmLabel: options.confirmLabel || "Simpan",
        cancelLabel: options.cancelLabel || CANCEL_LABEL,
        placeholder: options.placeholder,
        defaultValue: options.defaultValue,
        minLength: typeof options.minLength === "number" ? options.minLength : 0,
      }),
    [open]
  );

  const api = useMemo(() => ({ confirm, prompt }), [confirm, prompt]);

  const isPrompt = request?.kind === "prompt";
  const minLength = isPrompt ? request.minLength : 0;
  const tooShort = isPrompt && minLength > 0 && String(value).length < minLength;
  const cancel = useCallback(() => finish(isPrompt ? null : false), [finish, isPrompt]);
  const accept = useCallback(() => {
    if (tooShort) return;
    finish(isPrompt ? value : true);
  }, [finish, isPrompt, tooShort, value]);

  return (
    <DialogContext.Provider value={api}>
      {children}

      <Dialog
        open={request !== null}
        onClose={cancel}
        title={request?.title}
        description={request?.description}
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={cancel}>
              {request?.cancelLabel || CANCEL_LABEL}
            </Button>
            <Button
              variant={request?.tone === "danger" ? "danger" : "primary"}
              size="sm"
              onClick={accept}
              disabled={tooShort}
            >
              {request?.confirmLabel || "Lanjutkan"}
            </Button>
          </>
        }
      >
        {isPrompt ? (
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              accept();
            }}
          >
            {request.label ? (
              <label htmlFor="xolearn-dialog-input" className={cx("block text-[12px] font-semibold", MUTED)}>
                {request.label}
              </label>
            ) : null}
            <input
              id="xolearn-dialog-input"
              className={cx(INPUT_CLASS, "mt-2")}
              type="text"
              value={value}
              placeholder={request.placeholder}
              autoComplete="off"
              onChange={(event) => setValue(event.target.value)}
            />
            {tooShort ? (
              <p className="mt-2 text-[12px] text-error-ink">
                Minimal {minLength} karakter.
              </p>
            ) : null}
          </form>
        ) : null}
      </Dialog>
    </DialogContext.Provider>
  );
}

/* Fallback aman: di luar provider, dialog memakai cara bawaan
   browser supaya aksi tidak pernah diam-diam tidak terjadi. */
export function useDialog() {
  const ctx = useContext(DialogContext);
  return (
    ctx || {
      confirm: async (options = {}) =>
        typeof window !== "undefined"
          ? window.confirm([options.title, options.description].filter(Boolean).join("\n\n"))
          : true,
      prompt: async (options = {}) =>
        typeof window !== "undefined" ? window.prompt(options.title || "") : null,
    }
  );
}
