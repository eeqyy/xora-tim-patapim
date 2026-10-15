// ============================================================
// XOLEARN — PageHeader (Editorial System v2)
// frontend/src/components/PageHeader.jsx
// ------------------------------------------------------------
// Band judul halaman: eyebrow, judul display besar, lede, aksi.
// Dipisahkan dari konten oleh satu garis horizontal.
// ============================================================

import React from "react";
import { Eyebrow, DisplayHeading, MUTED, RULE, cx } from "./ui";

export default function PageHeader({
  badge,
  title,
  description,
  actions,
  className = "",
}) {
  return (
    <header
      className={cx(
        // Garis bawah dibuat full-bleed ke tepi PageContainer dan memakai
        // RULE (sama seperti SectionHeader) supaya kedua garis yang
        // berurutan di satu halaman punya panjang + warna yang identik.
        "-mx-5 border-b px-5 pb-8 md:-mx-8 md:px-8 md:pb-10 xl:-mx-10 xl:px-10",
        RULE,
        className
      )}
    >
      {badge
        ? typeof badge === "string"
          ? <Eyebrow className="enter-rise" style={{ "--i": 0 }}>{badge}</Eyebrow>
          : badge
        : null}
      {title ? (
        <DisplayHeading
          className={cx("enter-rise max-w-4xl text-display", badge ? "mt-4" : "")}
          style={{ "--i": 1 }}
        >
          {title}
        </DisplayHeading>
      ) : null}
      {description ? (
        <p
          className={cx("enter-rise mt-5 max-w-2xl text-[15px] leading-relaxed md:text-[16px]", MUTED)}
          style={{ "--i": 2 }}
        >
          {description}
        </p>
      ) : null}
      {actions ? (
        <div className="mt-7 flex flex-wrap items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
