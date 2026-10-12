// ============================================================
// XORA — Reusable Button Components
// frontend/src/components/Button.jsx
// ============================================================

import React from "react";

function BaseButton({
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
  const sizeClass = size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "";
  const variantClass = `btn-${variant}`;
  const widthClass = fullWidth ? "btn-block" : "";

  return (
    <button
      type={type}
      className={`btn ${variantClass} ${sizeClass} ${widthClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="btn-spinner" aria-hidden="true"></span>
      ) : (
        icon && <span className="btn-icon-left">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="btn-icon-right">{iconRight}</span>}
    </button>
  );
}

export function PrimaryButton(props) {
  return <BaseButton variant="primary" {...props} />;
}

export function SecondaryButton(props) {
  return <BaseButton variant="secondary" {...props} />;
}

export function OutlineButton(props) {
  return <BaseButton variant="outline" {...props} />;
}

export default BaseButton;
