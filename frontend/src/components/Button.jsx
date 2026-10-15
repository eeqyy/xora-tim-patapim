// ============================================================
// XOLEARN — Button (Editorial System v2)
// frontend/src/components/Button.jsx
// ------------------------------------------------------------
// Sudut pil (rounded-full), tanpa shadow. Semua ukuran >=44px
// agar ramah target sentuh. Warna mono + aksen azure.
// ============================================================

import { cx } from "./ui";

const VARIANT_CLASSES = {
  primary: "bg-brand text-white hover:bg-brand-hover active:scale-[.98]",
  secondary:
    "border border-hairline text-ink hover:border-brand hover:text-accent active:scale-[.98] dark:border-hairline-dark dark:text-ink-dark dark:hover:border-brand dark:hover:text-accent",
  outline:
    "border border-hairline text-ink hover:border-brand hover:text-accent active:scale-[.98] dark:border-hairline-dark dark:text-ink-dark dark:hover:border-brand dark:hover:text-accent",
  danger: "border border-error-strong text-error-ink hover:bg-error-soft active:scale-[.98]",
  ghost: "text-accent hover:underline px-0",
};

const SIZE_CLASSES = {
  sm: "min-h-[44px] px-4 text-[13px]",
  md: "min-h-[48px] px-5 text-[14px]",
  lg: "min-h-[56px] px-7 text-[15px]",
};

export default function Button({
  children,
  variant = "primary", // "primary" | "secondary" | "outline" | "danger" | "ghost"
  size = "md", // "sm" | "md" | "lg"
  icon,
  iconRight,
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;

  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,border-color,color,transform] duration-150 ease-out",
        "disabled:cursor-not-allowed disabled:opacity-50",
        sizeClass,
        variantClass,
        fullWidth && "w-full",
        className
      )}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        icon && <span className="shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}

export function PrimaryButton(props) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props) {
  return <Button variant="secondary" {...props} />;
}

export function OutlineButton(props) {
  return <Button variant="outline" {...props} />;
}
