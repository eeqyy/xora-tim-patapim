
// ============================================================
// XOLEARN — Fold Text (animasi lipat kertas, port CSS+JS)
// frontend/src/components/FoldText.jsx
// ------------------------------------------------------------
// Sumber inspirasi: komponen "Fold Text" (props: foldStyle, hinge,
// trigger, foldAngle, duration, stagger, ease, perspective,
// creaseShading, ...). Di sini tanpa dependency tambahan: tiap
// huruf dibungkus span, lalu CSS + IntersectionObserver
// melakukan lipatan sekali jalan saat masuk viewport.
// Hanya lipatan masuk (bukan loop/hover-refold) sesuai keputusan.
// Konten TIDAK pernah disembunyikan: keadaan terlipat hanya
// hidup selama animasi; kelas dilepas setelah selesai.
// ============================================================

import React from "react";
import { cx } from "./ui";

export default function FoldText({
  children,
  text,
  splitBy = "char",
  hinge = "top",
  foldAngle = 90,
  duration = 0.65,
  stagger = 0.045,
  staggerFrom = "start",
  perspective = 700,
  creaseShading = 0.55,
  fontSize,
  fontWeight,
  className = "",
  style,
  threshold = 0.1,
  ...rest
}) {
  const ref = React.useRef(null);
  const timer = React.useRef(0);

  const src = text ?? (typeof children === "string" ? children : String(children ?? ""));

  // Cacah huruf / kata
  const chars = splitBy === "word" ? src.split(/(\s+)/) : Array.from(src);

  // Bobot stagger berdasarkan staggerFrom
  const n = Math.max(1, chars.length - 1);
  const weight = (i) => {
    const x = i / n;
    switch (staggerFrom) {
      case "end":
        return 1 - x;
      case "center":
        return 1 - Math.abs(x - 0.5) * 2;
      case "edges":
        return Math.abs(x - 0.5) * 2;
      default:
        return x;
    }
  };
  const delayMs = (i) => Math.max(0, weight(i) * chars.length * stagger * 1000);

  const hingeOrigin =
    hinge === "bottom" ? "bottom"
    : hinge === "left" ? "left"
    : hinge === "right" ? "right"
    : "top";

  const durMs = Math.round(duration * 1000);
  const ms = durMs + chars.reduce((a, _, i) => Math.max(a, delayMs(i)), 0) + 80;

  const vars = {
    ...style,
    "--ft-perspective": `${perspective}px`,
    "--ft-angle": `${foldAngle}deg`,
    "--ft-dur": `${durMs}ms`,
    "--ft-ease": "cubic-bezier(0.215,0.61,0.355,1)", // power3.out
    "--ft-hinge": hingeOrigin,
    "--ft-shade": `${creaseShading}`,
    ...(fontSize != null ? { fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize } : null),
    ...(fontWeight != null ? { fontWeight } : null),
  };

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          el.classList.add("is-run");
          void el.offsetHeight;
          el.classList.add("is-in");
          timer.current = window.setTimeout(() => {
            el.classList.remove("is-run");
            el.classList.remove("is-in");
          }, ms);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <span
      ref={ref}
      data-ft-ms={ms}
      className={cx("ft", className)}
      style={vars}
      {...rest}
    >
      <span className="ft-inner" aria-label={src}>
        {chars.map((c, i) => (
          <span
            key={i}
            className="ft-char"
            data-i={i}
            style={{ "--ft-delay": `${delayMs(i)}ms`, transitionDelay: `${delayMs(i)}ms` }}
            aria-hidden="true"
          >
            {c === " " ? "\u00A0" : c}
          </span>
        ))}
      </span>
    </span>
  );
}
