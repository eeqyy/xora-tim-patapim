// ============================================================
// XOLEARN — ErrorState (Editorial System v2)
// frontend/src/components/ErrorState.jsx
// ============================================================

import React from "react";
import { IconAlertTriangle, IconRefresh } from "./Icons";
import Button from "./Button";
import { INK, MUTED, cx } from "./ui";

export default function ErrorState({
  title = "Terjadi Kesalahan",
  message = "Gagal memproses permintaan. Silakan coba kembali.",
  onRetry,
  retryLabel = "Coba Lagi",
  className = "",
  style,
}) {
  return (
    <div className={cx("flex flex-col items-start gap-3 py-10", className)} style={style}>
      <span className="text-error-strong">
        <IconAlertTriangle size={28} />
      </span>
      <h3 className={cx("text-lg font-bold tracking-tight md:text-xl", INK)}>
        {title}
      </h3>
      <p className={cx("max-w-xl text-[13px] leading-relaxed", MUTED)}>{message}</p>
      {onRetry ? (
        <div className="mt-1 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onRetry} icon={<IconRefresh size={16} />}>
            {retryLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
