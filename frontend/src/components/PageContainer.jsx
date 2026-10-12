// ============================================================
// XORA — PageContainer Component
// frontend/src/components/PageContainer.jsx
// ============================================================

import React from "react";

export default function PageContainer({
  children,
  maxWidth = "normal", // "narrow" (720px) | "normal" (1080px) | "wide" (1280px) | "full"
  className = "",
  style,
  ...props
}) {
  let maxWidthStyle = "1080px";
  if (maxWidth === "narrow") maxWidthStyle = "760px";
  if (maxWidth === "wide") maxWidthStyle = "1240px";
  if (maxWidth === "full") maxWidthStyle = "100%";

  return (
    <div
      className={`page-container ${className}`}
      style={{
        maxWidth: maxWidthStyle,
        width: "100%",
        margin: "0 auto",
        padding: "2rem 1.25rem 3.5rem 1.25rem",
        boxSizing: "border-box",
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
