// ============================================================
// XOLEARN — Skeleton (kerangka muat)
// frontend/src/components/Skeleton.jsx
// ------------------------------------------------------------
// Pengganti spinner: meniru bentuk & tinggi konten asli supaya
// tata letak tidak melompat saat data tiba.
// Denyutnya murni CSS dan mati otomatis saat prefers-reduced-motion.
// ============================================================

import React from "react";
import { cx, HAIRLINE, RULE, Grid, GridCell, TABLE_CLASS, TD_CLASS } from "./ui";

export function SkeletonBar({ className = "", style }) {
  return (
    <span
      aria-hidden="true"
      className={cx("skeleton block rounded-full", className)}
      style={style}
    />
  );
}

/* Deretan baris teks. `widths` bisa mengatur lebar tiap baris. */
export function SkeletonLines({ count = 3, widths, className = "", barClassName = "" }) {
  return (
    <div className={cx("flex flex-col gap-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBar
          key={i}
          className={cx("h-3", barClassName)}
          style={{ width: widths?.[i] ?? (i === count - 1 ? "62%" : "100%") }}
        />
      ))}
    </div>
  );
}

/* Kerangka tabel — dipakai daftar di area admin. */
export function SkeletonTable({ rows = 5, columns = 4, className = "" }) {
  return (
    <div
      className={cx("mt-8 overflow-x-auto rounded-3xl border", HAIRLINE, className)}
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Memuat data…</span>
      <table className={TABLE_CLASS} aria-hidden="true">
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className={TD_CLASS}>
                  <SkeletonBar className={cx("h-3", c === 0 ? "w-40 max-w-full" : "w-24")} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* Kerangka blok Ringkasan: band saran + tiga sel metrik.
   Memakai Grid/GridCell asli agar tinggi & garisnya identik. */
export function SkeletonSummary({ className = "" }) {
  return (
    <div className={className} role="status" aria-live="polite">
      <span className="sr-only">Memuat data…</span>
      <div className="rounded-3xl bg-brand-soft p-5 md:p-6">
        <SkeletonBar className="h-3 w-28" />
        <SkeletonBar className="mt-4 h-5 w-2/3 max-w-md" />
        <SkeletonLines count={2} className="mt-3 max-w-xl" />
        <SkeletonBar className="mt-6 h-11 w-44" />
      </div>
      <Grid cols={3} className="mt-8">
        {[0, 1, 2].map((i) => (
          <GridCell key={i} className="flex min-h-[104px] flex-col justify-between gap-3">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-8 w-20" />
            <SkeletonBar className="h-3 w-32 max-w-full" />
          </GridCell>
        ))}
      </Grid>
    </div>
  );
}

/* Kerangka satu halaman (judul + garis section + blok konten).
   Dipakai saat data awal sebuah halaman belum siap. */
export function SkeletonPage({ className = "" }) {
  return (
    <div className={className} role="status" aria-live="polite">
      <span className="sr-only">Memuat data…</span>
      <SkeletonBar className="h-3 w-32" />
      <SkeletonBar className="mt-4 h-8 w-3/4 max-w-2xl" />
      <SkeletonLines count={2} className="mt-5 max-w-2xl" />
      <div className={cx("mt-14 border-t pt-1 md:mt-20 md:pt-1.5", RULE)} />
      <Grid cols={3} className="mt-8">
        {[0, 1, 2].map((i) => (
          <GridCell key={i} className="flex min-h-[104px] flex-col justify-between gap-3">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-8 w-20" />
            <SkeletonBar className="h-3 w-32 max-w-full" />
          </GridCell>
        ))}
      </Grid>
      <SkeletonLines count={4} className="mt-14 max-w-3xl" />
    </div>
  );
}

export default SkeletonLines;