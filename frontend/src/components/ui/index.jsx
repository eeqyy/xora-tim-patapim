// ============================================================
// XOLEARN — Editorial UI Primitives v2
// frontend/src/components/ui/index.jsx
// ------------------------------------------------------------
// Bahasa visual: tipografi Manrope, sudut pil untuk elemen
// interaktif, garis horizontal (hairline) + ruang kosong sebagai
// pemisah. Semua primitif mobile-first & ramah target sentuh
// (>=44px). Tidak ada grid kotak 1px.
// ============================================================

import React from "react";

export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------
   Token kelas yang dipakai berulang
   ------------------------------------------------------------ */
export const HAIRLINE = "border-hairline dark:border-hairline-dark";
/* Garis batas section — satu tingkat lebih tegas dari HAIRLINE. */
export const RULE = "border-rule dark:border-rule-dark";
export const SURFACE = "bg-canvas dark:bg-canvas-dark";
export const CELL = "bg-cell dark:bg-cell-dark";
export const INK = "text-ink dark:text-ink-dark";
export const MUTED = "text-muted dark:text-muted-dark";

/* Pil filter / chip (target sentuh >=44px). */
export const CHIP_CLASS =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-5 text-[13px] font-semibold transition-colors";
export const CHIP_INACTIVE =
  "border-hairline bg-transparent text-ink hover:border-brand hover:text-accent dark:border-hairline-dark dark:text-ink-dark dark:hover:border-brand dark:hover:text-accent";
export const CHIP_ACTIVE = "border-brand bg-brand text-white hover:bg-brand-hover";

/* ------------------------------------------------------------
   Teks editorial
   ------------------------------------------------------------ */
export function Eyebrow({ as: Tag = "span", className = "", children, ...rest }) {
  return (
    <Tag
      className={cx(
        "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]",
        MUTED,
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* MicroMeta — metadata mikro (sans, uppercase, tracking lebar). */
export function MicroMeta({ as: Tag = "span", className = "", children, ...rest }) {
  return (
    <Tag
      className={cx(
        "text-[11px] font-semibold uppercase tracking-[0.16em] tabular-nums",
        MUTED,
        className
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* DisplayHeading — judul besar editorial (bobot sedang, rapat). */
export function DisplayHeading({ as: Tag = "h1", className = "", children, ...rest }) {
  return (
    <Tag
      className={cx("font-medium leading-[1.08] tracking-[-0.022em]", INK, className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ------------------------------------------------------------
   SectionHeader — pemisah garis horizontal + nomor bagian
   ------------------------------------------------------------ */
export function SectionHeader({ index, title, meta, id, sticky = true, className = "" }) {
  return (
    <div
      id={id}
      className={cx(
        "border-t",
        RULE,
        sticky
          ? "-mx-5 px-5 md:-mx-8 md:px-8 xl:-mx-10 xl:px-10 sticky top-[var(--header-h,68px)] z-30 scroll-mt-[calc(var(--header-h,68px)+8px)] bg-canvas/95 backdrop-blur-sm dark:bg-canvas-dark/95 mt-14 mb-8 pt-1 md:mt-20 md:mb-10 md:pt-1.5"
          : "mt-14 mb-8 pt-6 md:mt-20 md:mb-10 md:pt-7",
        className
      )}
    >
      <div
        className={cx(
          "flex items-baseline justify-between gap-x-6",
          sticky ? "flex-nowrap" : "flex-wrap gap-y-1"
        )}
      >
        <div className="flex min-w-0 items-baseline gap-4">
          {index ? (
            <span className="text-[12px] font-bold tabular-nums text-accent">{index}</span>
          ) : null}
          <h2
            className={cx(
              "min-w-0 text-[13px] font-semibold uppercase tracking-[0.16em]",
              sticky && "truncate",
              INK
            )}
          >
            {title}
          </h2>
        </div>
        {meta ? <MicroMeta className={sticky ? "shrink-0" : ""}>{meta}</MicroMeta> : null}
      </div>
    </div>
  );
}

/* Lede — paragraf penjelas di bawah judul section. */
export function SectionLede({ className = "", children }) {
  return (
    <p className={cx("mt-4 mb-8 max-w-3xl text-[13px] leading-relaxed", MUTED, className)}>
      {children}
    </p>
  );
}

/* ------------------------------------------------------------
   Panel — kontainer datar tanpa border (pemisah = garis horizontal
   dari grid/section). Dipertahankan demi kompatibilitas impor.
   ------------------------------------------------------------ */
export function Panel({ as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag className={cx("min-w-0", className)} {...rest}>
      {children}
    </Tag>
  );
}

export function GridCell({ as: Tag = "div", className = "", children, ...rest }) {
  return (
    <Tag className={cx("min-w-0 border-t pt-5", HAIRLINE, className)} {...rest}>
      {children}
    </Tag>
  );
}

/* Grid — kolom responsif dengan jarak lega. */
export function Grid({ cols = 1, className = "", children, ...rest }) {
  const colsClass =
    {
      1: "grid-cols-1",
      2: "grid-cols-1 sm:grid-cols-2",
      3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
      4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
      6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
    }[cols] || "grid-cols-1";

  return (
    <div className={cx("grid gap-x-8 gap-y-10", colsClass, className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------
   MetricCell — angka metrik besar + label mikro
   ------------------------------------------------------------ */
export function MetricCell({ label, value, hint, className = "" }) {
  return (
    <div
      className={cx(
        "flex min-h-[104px] min-w-0 flex-col justify-between gap-3 border-t pt-5",
        HAIRLINE,
        className
      )}
    >
      <MicroMeta>{label}</MicroMeta>
      <span
        className={cx(
          "text-4xl font-semibold leading-none tracking-[-0.02em] tabular-nums md:text-5xl",
          INK
        )}
      >
        {value}
      </span>
      {hint ? <span className={cx("text-[12px] leading-snug", MUTED)}>{hint}</span> : null}
    </div>
  );
}

/* ------------------------------------------------------------
   SeverityBadge — indikator tingkat keparahan (pil)
   ------------------------------------------------------------ */
const SEVERITY_STYLES = {
  high: "border border-error-strong bg-error-soft text-error-ink",
  medium: "border border-warning-strong bg-warning-soft text-warning-ink",
  low: "border border-hairline text-muted dark:border-hairline-dark dark:text-muted-dark",
  neutral:
    "border border-hairline text-muted dark:border-hairline-dark dark:text-muted-dark",
};

export function SeverityBadge({ tone = "neutral", className = "", children }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]",
        SEVERITY_STYLES[tone] || SEVERITY_STYLES.neutral,
        className
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------
   PrimaryButton — CTA utama (pil, >=48px, full-width opsional)
   ------------------------------------------------------------ */
export function PrimaryButton({ className = "", fullWidth = false, children, ...rest }) {
  return (
    <button
      className={cx(
        "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-brand px-6 text-[14px] font-semibold text-white transition-colors",
        "hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50",
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* GhostButton — aksi sekunder (pil, garis tipis) */
export function GhostButton({ className = "", children, ...rest }) {
  return (
    <button
      className={cx(
        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border px-5 text-[14px] font-semibold transition-colors",
        "border-hairline text-ink hover:border-brand hover:text-accent",
        "dark:border-hairline-dark dark:text-ink-dark dark:hover:border-brand dark:hover:text-accent",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------
   ProgressBar — batang pil (isi aksen azure)
   ------------------------------------------------------------ */
export function ProgressBar({ value = 0, className = "" }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      className={cx("h-2 w-full overflow-hidden rounded-full bg-cell dark:bg-cell-dark", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-brand transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------
   AccordionRow — baris akordeon dipisah garis horizontal
   ------------------------------------------------------------ */
export function AccordionRow({
  open,
  onToggle,
  summary,
  trailing,
  children,
  className = "",
}) {
  return (
    <div className={cx("border-t", HAIRLINE, className)}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex min-h-[64px] w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="min-w-0 flex-1">{summary}</span>
        <span className="flex shrink-0 items-center gap-3">{trailing}</span>
      </button>
      {open ? <div className="pb-6">{children}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------
   ChecklistRow — baris rencana remediasi (pil nomor)
   ------------------------------------------------------------ */
export function ChecklistRow({ marker, title, description, children, className = "" }) {
  return (
    <div className={cx("border-t py-6", HAIRLINE, className)}>
      <div className="flex items-start gap-4">
        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[12px] font-bold tabular-nums text-accent">
          {marker}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className={cx("text-[15px] font-bold leading-snug", INK)}>{title}</h3>
          {description ? (
            <p className={cx("mt-1.5 text-[13px] leading-relaxed", MUTED)}>{description}</p>
          ) : null}
        </div>
      </div>
      {children ? <div className="mt-5">{children}</div> : null}
    </div>
  );
}

/* ------------------------------------------------------------
   DataRow — baris data generik (garis horizontal)
   ------------------------------------------------------------ */
export function DataRow({ className = "", children, ...rest }) {
  return (
    <div className={cx("border-t py-4", HAIRLINE, className)} {...rest}>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------
   Kelas bidang formulir & tabel (dipakai lintas halaman)
   ------------------------------------------------------------ */
export const INPUT_CLASS =
  "block w-full min-h-[48px] rounded-2xl border border-hairline bg-canvas px-4 py-2.5 text-[14px] text-ink placeholder:text-muted focus:border-accent focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-hairline-dark dark:bg-canvas-dark dark:text-ink-dark dark:placeholder:text-muted-dark";

export const TH_CLASS = cx(
  "border-b px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.16em] tabular-nums align-bottom",
  HAIRLINE,
  MUTED
);

export const TD_CLASS = cx("border-b px-3 py-4 align-top text-[13px]", HAIRLINE, INK);

export const TABLE_CLASS = "w-full border-collapse text-left";

/* ------------------------------------------------------------
   Field — pembungkus label + kontrol + hint/error
   ------------------------------------------------------------ */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required = false,
  className = "",
  children,
}) {
  return (
    <div className={cx("flex flex-col gap-2", className)}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className={cx("text-[12px] font-semibold uppercase tracking-[0.14em]", MUTED)}
        >
          {label}
        </label>
      ) : null}
      {children}
      {hint ? <p className={cx("text-[12px] leading-snug", MUTED)}>{hint}</p> : null}
      {error ? (
        <p className="text-[12px] font-semibold text-error-strong" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* Kelas kontrol form siap pakai (dipakai lewat <input className={INPUT_CLASS} />) */
export const Select = React.forwardRef(({ className = "", children, ...rest }, ref) => (
  <select ref={ref} className={cx(INPUT_CLASS, className)} {...rest}>
    {children}
  </select>
));
Select.displayName = "Select";

export const Input = React.forwardRef(({ className = "", ...rest }, ref) => (
  <input ref={ref} className={cx(INPUT_CLASS, className)} {...rest} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef(({ className = "", ...rest }, ref) => (
  <textarea ref={ref} className={cx(INPUT_CLASS, "min-h-[96px] py-3", className)} {...rest} />
));
Textarea.displayName = "Textarea";

/* ------------------------------------------------------------
   Alert — pemberitahuan (sudut lembut, aksen sesuai tone)
   ------------------------------------------------------------ */
const ALERT_STYLES = {
  success: "border-positive/30 bg-positive-soft text-ink dark:text-ink-dark",
  error: "border-error-strong bg-error-soft text-error-ink",
  info: "border-hairline bg-cell text-ink dark:border-hairline-dark dark:bg-cell-dark dark:text-ink-dark",
  neutral:
    "border-hairline bg-cell text-ink dark:border-hairline-dark dark:bg-cell-dark dark:text-ink-dark",
};

export function Alert({ tone = "info", className = "", children }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cx(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 text-[13px] leading-relaxed",
        ALERT_STYLES[tone] || ALERT_STYLES.info,
        className
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------
   Avatar — lingkaran inisial
   ------------------------------------------------------------ */
export function Avatar({ name, size = 44, className = "" }) {
  const initials = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-cell font-semibold text-ink dark:bg-cell-dark dark:text-ink-dark",
        className
      )}
      style={{ width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.34)) }}
      aria-hidden="true"
    >
      {initials || "?"}
    </span>
  );
}

/* ------------------------------------------------------------
   FilterChips — deretan pil filter
   ------------------------------------------------------------ */
export function FilterChips({ options = [], value, onChange, className = "", ariaLabel }) {
  return (
    <div className={cx("flex flex-wrap gap-2", className)} role="group" aria-label={ariaLabel}>
      {options.map((opt) => {
        const optValue = opt.value ?? opt.key;
        const active = optValue === value;
        return (
          <button
            key={optValue}
            type="button"
            aria-pressed={active}
            onClick={() => onChange && onChange(optValue)}
            className={cx(CHIP_CLASS, active ? CHIP_ACTIVE : CHIP_INACTIVE)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------
   Reveal — animasi masuk ringan (IntersectionObserver + CSS)
   ------------------------------------------------------------ */
export function Reveal({
  as: Tag = "div",
  delay = 0,
  className = "",
  children,
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  const [seen, setSeen] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setSeen(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      data-seen={seen ? "true" : undefined}
      className={cx("reveal", className)}
      style={{ "--i": delay, ...style }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
