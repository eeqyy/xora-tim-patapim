
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
  duration = 0.6,
  stagger = 0.025,
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

  // Kelompokkan token: kata (dipertahankan utuh dalam span ft-word) dan spasi (ft-space).
  // Mencegah pemotongan kata di tengah huruf saat text wrapping.
  const tokens = React.useMemo(() => {
    if (!src) return [];
    if (splitBy === "word") {
      return src.split(/(\s+)/).map((t, idx) => ({
        type: /^\s+$/.test(t) ? "space" : "word",
        value: t,
        chars: [t],
        key: `w-${idx}`,
      }));
    }
    return src.split(/(\s+)/).map((t, idx) => ({
      type: /^\s+$/.test(t) ? "space" : "word",
      value: t,
      chars: Array.from(t),
      key: `t-${idx}`,
    }));
  }, [src, splitBy]);

  // Total unit karakter untuk stagger
  const totalUnits = React.useMemo(() => {
    return tokens.reduce((acc, t) => acc + (t.type === "word" ? t.chars.length : 0), 0);
  }, [tokens]);

  const n = Math.max(1, totalUnits - 1);
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
  const delayMs = (i) => Math.max(0, weight(i) * totalUnits * stagger * 1000);

  const hingeOrigin =
    hinge === "bottom" ? "bottom"
    : hinge === "left" ? "left"
    : hinge === "right" ? "right"
    : "top";

  const durMs = Math.round(duration * 1000);
  const maxDelay = totalUnits > 0 ? Math.max(...Array.from({ length: totalUnits }, (_, i) => delayMs(i))) : 0;
  const ms = durMs + maxDelay + 80;

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
    if (!el) return undefined;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-in");
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          el.classList.add("is-in");
        });
      },
      { rootMargin: "0px 0px -5% 0px", threshold }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  let globalCharIdx = 0;

  return (
    <span
      ref={ref}
      data-ft-ms={ms}
      className={cx("ft", className)}
      style={vars}
      {...rest}
    >
      <span className="ft-inner" aria-label={src}>
        {tokens.map((token) => {
          if (token.type === "space") {
            return (
              <span key={token.key} className="ft-space">
                {token.value}
              </span>
            );
          }
          return (
            <span key={token.key} className="ft-word">
              {token.chars.map((c, cIdx) => {
                const charIdx = globalCharIdx++;
                const delay = delayMs(charIdx);
                return (
                  <span
                    key={`${token.key}-${cIdx}`}
                    className="ft-char"
                    data-i={charIdx}
                    style={{ "--ft-delay": `${delay}ms`, animationDelay: `${delay}ms` }}
                    aria-hidden="true"
                  >
                    {c}
                  </span>
                );
              })}
            </span>
          );
        })}
      </span>
    </span>
  );
}
