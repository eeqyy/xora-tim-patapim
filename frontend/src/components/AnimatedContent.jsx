// ============================================================
// XOLEARN — AnimatedContent (port dari ReactBits)
// frontend/src/components/AnimatedContent.jsx
// ------------------------------------------------------------
// Sumber: ReactBits — "AnimatedContent"
// (github.com/DavidHDev/react-bits, lisensi MIT), yang aslinya
// memakai gsap + ScrollTrigger. Di sini tanpa dependency tambahan:
// saat elemen masuk viewport, kelas keadaan dipasang dari JS lalu
// CSS mengerjakan sisanya — sama seperti ScrollText / enter-rise.
//
// Yang dipertahankan dari aslinya:
//   • `distance` geser (default asli 100px) + `direction`/`reverse`;
//   • `duration` + easing `power3.out`;
//   • `initialOpacity` + `animateOpacity`, `scale`, `blur`;
//   • `threshold` observer, `delay` jeda mulai;
//   • sekali jalan lalu bersih (`once: true` di aslinya juga).
// Yang dibuang (tidak kita pakai): stagger/staggerFrom (butuh
// kloning tiap anak → struktur DOM berubah), wipe, rotate, tilt,
// scrub, disappearAfter, trigger mount/hover/click, container,
// callback onStart/onComplete. Lihat EDITORIAL.md.
//
// Aturan proyek yang dipakai di sini:
//   • transisi HANYA di keadaan akhir (`.is-in`) — keadaan awal
//     tanpa transisi supaya animasinya terlihat;
//   • konten TIDAK pernah disembunyikan: `initialOpacity` memakai
//     `.3` (aslinya `0`) dan keadaan awal hanya hidup selama
//     animasi berjalan; kelas dilepas setelah selesai sehingga DOM
//     kembali jadi markup biasa (aman untuk screenshot penuh);
//   • `prefers-reduced-motion` → CSS tidak berlaku, teks tampil
//     apa adanya.
// ============================================================

import React from "react";
import { cx } from "./ui";

export default function AnimatedContent({
  children,
  distance = 100,
  direction = "vertical",
  reverse = false,
  duration = 800,
  initialOpacity = 0.3,
  animateOpacity = true,
  scale = 1,
  blur = 0,
  threshold = 0.1,
  delay = 0,
  as: Tag = "div",
  className = "",
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  const timer = React.useRef(0);

  const geser =
    direction === "horizontal"
      ? `translateX(${distance * (reverse ? -1 : 1)}px)`
      : `translateY(${distance * (reverse ? -1 : 1)}px)`;

  const vars = {
    ...style,
    "--ac-dur": `${duration}ms`,
    "--ac-delay": `${delay}ms`,
    "--ac-ease": "cubic-bezier(0.215, 0.61, 0.355, 1)", // power3.out
    "--ac-from": `${geser}${scale !== 1 ? ` scale(${scale})` : ""}`,
    ...(animateOpacity ? { "--ac-from-o": `${initialOpacity}` } : null),
    ...(blur > 0 ? { "--ac-blur": `blur(${blur}px)` } : null),
  };

  const ms = Math.round(delay + duration + 60);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return undefined;
    const lama = Number(el.dataset.acMs || 0);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          el.classList.add("is-run");
          void el.offsetHeight; // paksa gaya "awal" terhitung dulu
          el.classList.add("is-in");
          timer.current = window.setTimeout(() => {
            el.classList.remove("is-run");
            el.classList.remove("is-in");
          }, lama);
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
    <Tag ref={ref} data-ac-ms={ms} className={cx("ac", className)} style={vars} {...rest}>
      {children}
    </Tag>
  );
}
