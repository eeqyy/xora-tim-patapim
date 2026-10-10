// ============================================================
// XORA — Tombol (variants ui-btn-*)
// frontend/src/components/ui/Button.jsx
// ============================================================

import React from "react";
import { Link } from "../../context/RouterContext";
import Spinner from "./Spinner";

const VARIANTS = {
  primary: "ui-btn-primary",
  ghost: "ui-btn-ghost",
  subtle: "ui-btn-subtle",
  danger: "ui-btn-danger",
};

export default function Button({
  variant = "primary",
  size,
  block = false,
  loading = false,
  disabled = false,
  to,
  className = "",
  children,
  ...rest
}) {
  const cls = [
    "ui-btn",
    VARIANTS[variant] || VARIANTS.primary,
    size ? `ui-btn-${size}` : "",
    block ? "ui-btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const inner = loading ? (
    <>
      <Spinner size="sm" className="ui-spinner-on-inverse" />
      <span className="ui-sr-only">Memuat...</span>
      {children}
    </>
  ) : (
    children
  );

  if (to) {
    return (
      <Link to={to} className={cls} aria-disabled={disabled || loading}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={rest.type || "button"} className={cls} disabled={disabled || loading} {...rest}>
      {inner}
    </button>
  );
}