// ============================================================
// XORA — PageContainer (Editorial System v2)
// frontend/src/components/PageContainer.jsx
// ------------------------------------------------------------
// Bingkai halaman: lebar maksimum + padding responsif.
// Pemisah antar bagian memakai garis horizontal (SectionHeader),
// bukan lagi grid kotak ber-`border-l`.
// ============================================================

import React from "react";
import { cx } from "./ui";

const MAX_WIDTH = {
  narrow: "max-w-[720px]",
  normal: "max-w-[1200px]",
  wide: "max-w-[1200px]",
  full: "max-w-none",
};

export default function PageContainer({
  children,
  maxWidth = "normal",
  className = "",
  ...props
}) {
  return (
    <div
      className={cx(
        "mx-auto w-full px-5 pb-16 pt-10 md:px-8 md:pt-14",
        MAX_WIDTH[maxWidth] || MAX_WIDTH.normal,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
