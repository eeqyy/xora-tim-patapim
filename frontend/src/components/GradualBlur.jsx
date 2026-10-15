// ============================================================
// XOLEARN — Gradual Blur (port dari ReactBits)
// frontend/src/components/GradualBlur.jsx
// ------------------------------------------------------------
// Sumber: ReactBits — "Gradual Blur" (github.com/DavidHDev/react-bits),
// varian JS + Tailwind, lisensi MIT. Tidak ada dependency tambahan.
//
// Yang dipertahankan supaya hasil visualnya sama dengan aslinya:
//   • `divCount` lapisan (div) bertumpuk, tiap lapisan punya
//     `backdrop-filter: blur()` sendiri;
//   • tiap lapisan dipotong `mask-image: linear-gradient()` yang
//     bergeser +1 langkah — makin ke tepi layar, makin banyak
//     lapisan yang menumpuk, jadi blur-nya bertambah halus;
//   • kurva `curve` + mode `exponential` untuk sebaran kekuatan blur.
// Yang dibuang (tidak kita pakai): preset, responsive, hoverIntensity,
// animated/"scroll", target parent/page. Lihat EDITORIAL.md.
//
// Dipakai sebagai pita tepi layar: konten yang bergulir keluar
// viewport melembut lebih dulu, jadi scroll terasa enak. Hanya
// hiasan — `pointer-events: none`, tidak menutup konten dari pembaca
// layar (`aria-hidden`).
// ============================================================

import { useMemo } from "react";
import { cx } from "./ui";

const CURVES = {
  linear: (p) => p,
  bezier: (p) => p * p * (3 - 2 * p),
  "ease-in": (p) => p * p,
  "ease-out": (p) => 1 - Math.pow(1 - p, 2),
  "ease-in-out": (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2),
};

export default function GradualBlur({
  position = "bottom",
  height = "6rem",
  strength = 2,
  divCount = 5,
  curve = "bezier",
  exponential = true,
  opacity = 1,
  zIndex = 30,
  className = "",
  style = {},
}) {
  const layers = useMemo(() => {
    const step = 100 / divCount;
    const curveFn = CURVES[curve] || CURVES.linear;
    // Arah rampa: `bottom` = paling blur di tepi bawah, `top` sebaliknya.
    const direction = position === "top" ? "to top" : "to bottom";

    return Array.from({ length: divCount }, (_, idx) => {
      const i = idx + 1;
      const progress = curveFn(i / divCount);
      const blurValue = exponential
        ? Math.pow(2, progress * 4) * 0.0625 * strength
        : 0.0625 * (progress * divCount + 1) * strength;
      const mask = `linear-gradient(${direction}, transparent ${step * (i - 1)}%, black ${
        step * i
      }%)`;

      return (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            maskImage: mask,
            WebkitMaskImage: mask,
            backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
            opacity,
          }}
        />
      );
    });
  }, [position, strength, divCount, curve, exponential, opacity]);

  return (
    <div
      aria-hidden="true"
      className={cx("gradual-blur pointer-events-none", className)}
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        [position]: 0,
        height,
        zIndex,
        ...style,
      }}
    >
      <div className="gradual-blur-inner">{layers}</div>
    </div>
  );
}
