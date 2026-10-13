// ============================================================
// XOLEARN — PageHeader (Editorial System v2)
// frontend/src/components/PageHeader.jsx
// ------------------------------------------------------------
// Band judul halaman: eyebrow, judul display besar, lede, aksi.
// Dipisahkan dari konten oleh satu garis horizontal.
// ============================================================

import React from "react";
import { Eyebrow, DisplayHeading, MUTED, HAIRLINE, cx } from "./ui";

export default function PageHeader({
  badge,
  title,
  description,
  actions,
  className = "",
}) {
  return (
    <header className={cx("border-b pb-8 md:pb-10", HAIRLINE, className)}>
      {badge
        ? typeof badge === "string"
          ? <Eyebrow>{badge}</Eyebrow>
          : badge
        : null}
      {title ? (
        <DisplayHeading
          className={cx("max-w-4xl text-display", badge ? "mt-4" : "")}
        >
          {title}
        </DisplayHeading>
      ) : null}
      {description ? (
        <p className={cx("mt-5 max-w-2xl text-[15px] leading-relaxed md:text-[16px]", MUTED)}>
          {description}
        </p>
      ) : null}
      {actions ? (
        <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
