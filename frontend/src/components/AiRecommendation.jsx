// ============================================================
// XOLEARN — AiRecommendation (band sorotan rekomendasi belajar)
// frontend/src/components/AiRecommendation.jsx
// ------------------------------------------------------------
// Satu-satunya pesan inti aplikasi: langkah belajar yang
// disarankan AI. Dipakai di awal bagian Ringkasan (Dashboard)
// dan di atas tab (Progres) supaya terlihat tanpa perlu
// membuka tab tertentu. Warna memakai token `brand-soft`
// (light) yang otomatis jadi indigo gelap di mode gelap.
// ============================================================

import React from "react";
import GlassPanel from "./GlassPanel";
import StatusBadge from "./StatusBadge";
import { PrimaryButton } from "./Button";
import { MicroMeta, INK, MUTED, cx } from "./ui";

export default function AiRecommendation({
  label = "Rekomendasi AI",
  title,
  reason,
  meta,
  actionLabel,
  onAction,
  iconRight,
  className = "",
}) {
  return (
    <GlassPanel variant="brand" className={cx("p-5 md:p-6", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusBadge variant="accent" label={label} />
        {meta ? <MicroMeta>{meta}</MicroMeta> : null}
      </div>
      {title ? (
        <h2
          className={cx(
            "mt-3 text-[19px] font-extrabold leading-snug tracking-tight md:text-[22px]",
            INK
          )}
        >
          {title}
        </h2>
      ) : null}
      {reason ? (
        <p className={cx("mt-2 max-w-2xl text-[13px] leading-relaxed", MUTED)}>{reason}</p>
      ) : null}
      {actionLabel ? (
        <div className="mt-5">
          <PrimaryButton onClick={onAction} iconRight={iconRight}>
            {actionLabel}
          </PrimaryButton>
        </div>
      ) : null}
    </GlassPanel>
  );
}
