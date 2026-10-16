// ============================================================
// XOLEARN — TransitionContext
// frontend/src/context/TransitionContext.jsx
// ------------------------------------------------------------
// Orkestrator transisi "pixel swap" untuk GANTI TEMA:
//   tutup (cover) → ganti tema → buka (reveal)
//
// Perpindahan halaman TIDAK memakai ini — navigasi sengaja dibuat
// seketika supaya terasa cepat.
//
// ATURAN PENTING: perubahan state TIDAK PERNAH dibatalkan.
// Bila animasi tidak memungkinkan (prefers-reduced-motion, atau
// ada transisi lain yang sedang berjalan), `fn` tetap dijalankan
// seketika — hanya animasinya yang dilewati.
// ============================================================

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import PixelTransition from "../components/PixelTransition";

const TransitionContext = createContext(null);

/* Durasi (ms).
   `COVER_MS`/`REVEAL_MS` = durasi TOTAL satu fase, dan itulah yang
   dikirim ke PixelSwap sebagai `duration`. `PIXEL_MS` = durasi satu
   pixel. Selisih keduanya (spread = total - PIXEL_MS) jadi jatah delay
   acak per pixel — itulah yang membuat kotak-kotak muncul berserakan
   seperti ReactBits. Kalau keduanya disamakan, spread = 0 dan semua
   kotak muncul seragam.
   Overlay dirender lebih lambat sedikit dari perintah React, jadi ada
   `SLACK` sebelum titik tukar supaya layar dipastikan sudah tertutup
   penuh saat tema berganti. */
const COVER_MS = 380;
const HOLD_MS = 240; // jeda saat layar tertutup penuh agar efek pixel terlihat jelas
const REVEAL_MS = 450;

/* Gaya pixel (ReactBits PixelSwap): sisi pixel & skala awalnya. */
const PIXEL_SIZE = 88;
const PIXEL_SCALE = 0.35;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Dua frame berturut-turut: memastikan React sudah commit DAN
   browser sudah melukis hasil commit tersebut. */
const nextPaint = () =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame !== "function") {
      setTimeout(resolve, 16);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function TransitionProvider({ children }) {
  const [phase, setPhase] = useState("idle");
  /* Tema TUJUAN (`light`/`dark`) untuk satu transisi. Dipakai PixelSwap
     supaya warna panel penutup = warna tema yang akan muncul: gelap →
     terang berarti panel putih, terang → gelap berarti panel gelap.
     Dengan begitu layar yang tertutup penuh sudah sewarna dengan tema
     baru, jadi saat tema berganti tidak ada kedipan sama sekali. */
  const [targetTheme, setTargetTheme] = useState(null);
  const runningRef = useRef(false);

  const run = useCallback(async (fn, options) => {
    if (typeof fn !== "function") return;
    if (runningRef.current) return;

    runningRef.current = true;
    try {
      setTargetTheme(options && options.targetTheme ? options.targetTheme : null);
      setPhase("cover");
      await wait(COVER_MS);
      fn();
      await nextPaint();
      await wait(HOLD_MS);
      setPhase("reveal");
      await wait(REVEAL_MS);
    } finally {
      setPhase("idle");
      runningRef.current = false;
    }
  }, []);

  const value = useMemo(() => ({ run, isAnimating: phase !== "idle" }), [run, phase]);

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <PixelTransition
        phase={phase}
        coverMs={COVER_MS}
        revealMs={REVEAL_MS}
      />
    </TransitionContext.Provider>
  );
}

/* Fallback aman: di luar provider, `run` hanya menjalankan aksinya. */
export function usePixelTransition() {
  const ctx = useContext(TransitionContext);
  return (
    ctx || {
      run: (fn) => {
        if (typeof fn === "function") fn();
      },
      isAnimating: false,
    }
  );
}
