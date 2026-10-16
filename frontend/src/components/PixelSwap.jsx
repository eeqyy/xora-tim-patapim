// ============================================================
// XOLEARN — PixelSwap
// frontend/src/components/PixelSwap.jsx
// ------------------------------------------------------------
// Diadaptasi dari komponen "PixelSwap" (ReactBits, registry
// @react-bits/PixelSwap-JS-CSS). Matematika grid, pattern,
// easing, dan cara animasinya (Web Animations API, satu elemen
// DOM per pixel) dipertahankan sama.
//
// YANG DIUBAH dari versi asli
//   Versi ReactBits adalah KOTAK dengan aspectRatio (bawaan 16/10)
//   yang menukar dua isi di dalamnya. Tiap pixel adalah jendela
//   yang meng-clone konten masuk, dan setelah pixel menutup penuh
//   gridnya langsung dibuang — jadi tidak ada fase membuka.
//
//   Di sini dipakai sebagai OVERLAY layar penuh untuk ganti tema:
//     • pixel tidak membawa konten clone, hanya DUA warna penutup yang
//       dipilih acak per pixel, diambil dari TEMA TUJUAN
//       (`--color-canvas(-dark)` + variannya `TONE_MIX` ke arah
//       `--color-ink(-dark)`), jadi panel penutup sudah sewarna dengan
//       tema yang akan muncul;
//     • fase diatur dari luar lewat prop `phase`:
//         `cover`  → pixel tumbuh dari `pixelScale` hingga menutup
//                    SELURUH layar (selesai di `duration` ms);
//         `reveal` → pixel menyusut lagi (animasi dibalik) sehingga
//                    isi halaman terlihat mulus;
//         `idle`   → grid dibuang.
//     • pixel dibuat sedikit lebih besar dari selnya (BLEED) supaya
//       tidak ada celah rambut di antara pixel saat menutup penuh.
//   Karena fase `cover` berakhir dengan layar tertutup penuh,
//   TransitionContext aman mengganti tema tepat di momen itu.
// ============================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./PixelSwap.css";

// Every pixel is a window onto its own copy of the incoming content, so the
// grid stays bounded no matter how small the requested pixel size is.
const MAX_PIXELS = 220;
const KEYFRAME_STEPS = 14;

// Pixel digambar sedikit lebih besar dari selnya agar sisi yang bertemu
// tidak menyisakan garis rambut saat layar harus tertutup penuh.
const BLEED = 1.02;

/* Palet penutup memakai DUA warna (seperti transisi pixel sebelumnya):
   warna dasar + variannya yang digeser `TONE_MIX` ke arah warna teks.
   Tiap pixel dipilih acak 50/50, jadi penutupnya berbutir — bukan rata
   satu warna. Naikkan angkanya kalau ingin kontras dua warna lebih kuat. */
const TONE_MIX = 0.18;

const PATTERNS = {
  random: () => null,
  center: (x, y) => Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2,
  edges: (x, y) => Math.min(x, 1 - x, y, 1 - y) * 2,
  "left-to-right": (x) => x,
  "right-to-left": (x) => 1 - x,
  "top-to-bottom": (_x, y) => y,
  "bottom-to-top": (_x, y) => 1 - y,
  diagonal: (x, y) => (x + y) / 2,
  spiral: (x, y) => {
    const angle = (Math.atan2(y - 0.5, x - 0.5) + Math.PI) / (Math.PI * 2);
    const radius = Math.hypot(x - 0.5, y - 0.5) / Math.SQRT1_2;
    return (angle + radius) % 1;
  },
};

const EASINGS = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/* --- Utilitas warna (untuk palet dua warna) --- */
const parseHex = (value) => {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value || "").trim());
  if (!match) return null;
  const hex = match[1].length === 3 ? match[1].split("").map((c) => c + c).join("") : match[1];
  return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
};

const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

const toCss = (rgb) => `rgb(${rgb.map((n) => Math.round(n)).join(", ")})`;

const noise = (seed) => {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
};

const makeEasing = (value) => {
  const match = /cubic-bezier\(([^)]+)\)/.exec(value);
  const points = match ? match[1].split(",").map(Number) : EASINGS[value];
  if (!points || points.length !== 4 || points.some(Number.isNaN)) return makeEasing("ease");

  const [x1, y1, x2, y2] = points;
  if (x1 === y1 && x2 === y2) return (progress) => progress;

  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  return (progress) => {
    let t = progress;
    for (let i = 0; i < 5; i += 1) {
      const slope = (3 * ax * t + 2 * bx) * t + cx;
      if (!slope) break;
      t -= (((ax * t + bx) * t + cx) * t - progress) / slope;
    }
    t = clamp(t, 0, 1);
    return ((ay * t + by) * t + cy) * t;
  };
};

// Pixels grow slightly past their own box so gaps and rounded corners close
// completely by the end.
const coverScale = (size, gap, radius) => {
  const p = clamp(radius, 0, 50) / 100;
  const corner = Math.SQRT1_2 / (Math.SQRT2 * (0.5 - p) + p);
  return ((size + gap) / size) * Math.max(1, corner);
};

const buildGrid = ({ width, height, pixelSize, gap, pattern, randomness }) => {
  let size = pixelSize;
  let columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
  let rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));

  if (columns * rows > MAX_PIXELS) {
    size = Math.ceil(size * Math.sqrt((columns * rows) / MAX_PIXELS));
    columns = Math.max(1, Math.ceil((width + gap) / (size + gap)));
    rows = Math.max(1, Math.ceil((height + gap) / (size + gap)));
  }

  // Overhang the box so edge pixels stay square instead of being cut short.
  const stride = size + gap;
  const originX = (width - (columns * stride - gap)) / 2;
  const originY = (height - (rows * stride - gap)) / 2;
  const order = PATTERNS[pattern] ?? PATTERNS.random;
  const mix = clamp(randomness, 0, 1);
  const pixels = [];

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const x = columns <= 1 ? 0.5 : column / (columns - 1);
      const y = rows <= 1 ? 0.5 : row / (rows - 1);
      const base = order(x, y);
      const random = noise(index + 1);

      pixels.push({
        id: index,
        left: originX + column * stride,
        top: originY + row * stride,
        offset: base === null ? random : base * (1 - mix) + random * mix,
      });
    }
  }

  return { pixels, size, gap, width, height };
};

// One shared keyframe list for the whole grid. Versi ReactBits juga membuat
// keyframe `content` (transformasi kebalikannya) karena tiap pixel memuat
// salinan konten; di overlay ini pixel tidak memuat konten, jadi tidak perlu.
const buildKeyframes = ({ ease, startScale, endScale, spin, fade }) => {
  const frames = [];

  for (let step = 0; step <= KEYFRAME_STEPS; step += 1) {
    const progress = step / KEYFRAME_STEPS;
    const eased = ease(progress);
    const scale = startScale + (endScale - startScale) * eased;
    const angle = spin * (1 - eased);

    frames.push({
      offset: progress,
      opacity: fade ? Math.min(1, eased * 1.6) : 1,
      transform: `rotate(${angle}deg) scale(${scale})`,
    });
  }

  return frames;
};

export default function PixelSwap({
  phase,
  targetTheme = null,
  pixelSize = 88,
  gap = 0,
  pixelRadius = 0,
  pixelSpin = 0,
  pixelScale = 0.35,
  fade = true,
  duration = 450,
  pixelDuration = 450,
  pattern = "random",
  randomness = 0,
  easing = "cubic-bezier(0.22, 1, 0.36, 1)",
  className = "",
}) {
  const getWindowSize = () => {
    if (typeof window === "undefined") return { width: 0, height: 0 };
    return { width: window.innerWidth, height: window.innerHeight };
  };

  const [box, setBox] = useState(getWindowSize);
  const containerRef = useRef(null);
  const pixelRefs = useRef([]);
  const animationsRef = useRef([]);
  const toneRef = useRef(null);

  // Ukur kotak overlay. Dilakukan sejak awal memakai dimensi jendela layar
  // agar grid siap seketika saat tema pertama kali diganti.
  useEffect(() => {
    const measure = () => {
      setBox(getWindowSize());
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const grid = useMemo(
    () =>
      buildGrid({
        width: box.width,
        height: box.height,
        pixelSize: Math.max(8, Math.round(pixelSize)),
        gap: Math.max(0, Math.round(gap)),
        pattern,
        randomness,
      }),
    [box.width, box.height, pixelSize, gap, pattern, randomness]
  );

  const stopAnimations = useCallback(() => {
    animationsRef.current.forEach((animation) => animation.cancel());
    animationsRef.current = [];
  }, []);

  useEffect(() => stopAnimations, [stopAnimations]);

  useEffect(() => {
    if (phase === "idle") {
      stopAnimations();
      toneRef.current = null;
      return undefined;
    }
    if (box.width <= 0 || !grid.pixels.length) return undefined;

    const total = Math.max(200, duration);
    const pixelMs = clamp(pixelDuration, 60, total);
    const spread = Math.max(0, total - pixelMs);
    const endScale = coverScale(grid.size, grid.gap, pixelRadius) * BLEED;
    const frames = buildKeyframes({
      ease: makeEasing(easing),
      startScale: clamp(pixelScale, 0.05, 1) * endScale,
      endScale,
      spin: pixelSpin,
      fade,
    });

    // Palet disusun saat MENUTUP saja, lalu dipertahankan saat membuka
    // supaya warna pixel tidak berubah di tengah animasi.
    // Palet = warna TEMA TUJUAN, jadi panel penutup sudah terlihat seperti
    // tema yang akan muncul (gelap → terang berarti panel putih). Dua warna:
    // warna latar tema tujuan, dan variannya yang digeser `TONE_MIX` ke arah
    // warna teks tema tujuan. Tiap pixel dipilih acak 50/50 jadi penutupnya
    // berbutir. Dijaga agar tidak disusun ulang selama satu transisi (kalau
    // tidak, butirannya berkedip saat layout berubah).
    if (
      phase === "cover" &&
      (!toneRef.current ||
        toneRef.current.target !== targetTheme ||
        toneRef.current.pick.length !== grid.pixels.length)
    ) {
      const styles = getComputedStyle(document.documentElement);
      const light = targetTheme === "light";
      const base =
        parseHex(styles.getPropertyValue(light ? "--color-canvas" : "--color-canvas-dark")) ||
        (light ? [247, 247, 253] : [12, 12, 34]);
      const ink =
        parseHex(styles.getPropertyValue(light ? "--color-ink" : "--color-ink-dark")) ||
        (light ? [4, 0, 99] : [255, 255, 255]);
      toneRef.current = {
        target: targetTheme,
        colors: [toCss(base), toCss(mixRgb(base, ink, TONE_MIX))],
        pick: grid.pixels.map(() => Math.random() < 0.5),
      };
    }

    const tone = toneRef.current;

    stopAnimations();
    grid.pixels.forEach((pixel, index) => {
      const element = pixelRefs.current[index];
      if (!element) return;
      if (tone) element.style.background = tone.pick[index] ? tone.colors[1] : tone.colors[0];
      animationsRef.current.push(
        element.animate(frames, {
          duration: pixelMs,
          delay: pixel.offset * spread,
          easing: "linear",
          fill: "both",
          direction: phase === "cover" ? "normal" : "reverse",
        })
      );
    });

    return stopAnimations;
  }, [
    phase,
    targetTheme,
    box.width,
    grid,
    duration,
    pixelDuration,
    pixelSpin,
    pixelScale,
    pixelRadius,
    fade,
    easing,
    stopAnimations,
  ]);

  const visible = phase !== "idle" && box.width > 0;

  return (
    <div
      ref={containerRef}
      className={`pixel-swap pixel-swap--overlay${className ? ` ${className}` : ""}`}
      data-phase={phase}
      aria-hidden="true"
    >
      {visible && (
        <div className="pixel-swap__grid">
          {grid.pixels.map((pixel, index) => (
            <div
              key={pixel.id}
              ref={(element) => {
                pixelRefs.current[index] = element;
              }}
              className="pixel-swap__pixel"
              style={{
                left: pixel.left,
                top: pixel.top,
                width: grid.size,
                height: grid.size,
                borderRadius: `${clamp(pixelRadius, 0, 50)}%`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
