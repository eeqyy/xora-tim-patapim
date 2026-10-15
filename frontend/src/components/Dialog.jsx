// ============================================================
// XOLEARN — Dialog (kerangka modal bertema)
// frontend/src/components/Dialog.jsx
// ------------------------------------------------------------
// Memakai elemen <dialog> native + showModal(), sehingga fokus
// otomatis terkurung di dalam modal, latar belakang inert, dan
// tombol Escape bekerja tanpa kode tambahan.
//
// Komponen ini murni tampilan; yang mengatur antrean permintaan
// adalah DialogContext (confirm / prompt).
// ============================================================

import React, { useEffect, useId, useRef } from "react";
import { cx, HAIRLINE, INK, MUTED } from "./ui";

export default function Dialog({
  open = false,
  onClose,
  title,
  description,
  children,
  footer,
  className = "",
}) {
  const ref = useRef(null);
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = `${uid}-desc`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (open && !el.open) {
      if (typeof el.showModal === "function") el.showModal();
      else el.setAttribute("open", "");
      // Fokuskan bidang isian lebih dulu (kalau ada) supaya pengguna
      // bisa langsung mengetik tanpa klik.
      const field = el.querySelector("input, textarea, select");
      if (field) field.focus();
    } else if (!open && el.open) {
      if (typeof el.close === "function") el.close();
      else el.removeAttribute("open");
    }
  }, [open]);

  // Escape bawaan <dialog> memicu `cancel`; teruskan ke pemanggil.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const handleCancel = (event) => {
      event.preventDefault();
      if (onClose) onClose();
    };
    el.addEventListener("cancel", handleCancel);
    return () => el.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      className={cx(
        "dialog-panel w-[calc(100vw-2rem)] max-w-md rounded-2xl border bg-canvas p-0 text-ink dark:bg-canvas-dark dark:text-ink-dark",
        HAIRLINE,
        className
      )}
      onMouseDown={(event) => {
        if (event.target === ref.current && onClose) onClose();
      }}
    >
      <div className="p-5 md:p-6">
        {title ? (
          <h2 id={titleId} className={cx("text-[17px] font-bold leading-snug", INK)}>
            {title}
          </h2>
        ) : null}
        {description ? (
          <p id={descId} className={cx("mt-2 text-[13px] leading-relaxed", MUTED)}>
            {description}
          </p>
        ) : null}
        {children}
      </div>
      {footer ? (
        <div className={cx("flex flex-wrap justify-end gap-2 border-t px-5 py-4 md:px-6", HAIRLINE)}>
          {footer}
        </div>
      ) : null}
    </dialog>
  );
}
