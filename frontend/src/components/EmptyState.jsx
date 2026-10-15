// ============================================================
// XOLEARN — EmptyState (Editorial System v2)
// frontend/src/components/EmptyState.jsx
// ============================================================

import { IconInfo } from "./Icons";
import { INK, MUTED, cx } from "./ui";

export default function EmptyState({
  icon,
  title = "Belum Ada Data",
  description = "Belum ada informasi yang dapat ditampilkan saat ini.",
  action,
  className = "",
  style,
}) {
  return (
    <div
      className={cx("flex flex-col items-start gap-3 py-10", className)}
      style={style}
    >
      <span className={cx("text-muted dark:text-muted-dark")}>
        {icon || <IconInfo size={28} />}
      </span>
      <h3 className={cx("text-lg font-bold tracking-tight md:text-xl", INK)}>
        {title}
      </h3>
      {description ? (
        <p className={cx("max-w-xl text-[13px] leading-relaxed", MUTED)}>
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-1 flex flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
