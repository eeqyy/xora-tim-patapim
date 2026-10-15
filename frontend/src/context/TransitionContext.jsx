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

/* Durasi tiap fase (ms). Overlay dirender lebih lambat sedikit dari
   perintah React, jadi ada `SLACK` sebelum titik tukar supaya layar
   dipastikan sudah tertutup penuh saat halaman berganti. */
const COVER_MS = 240;
const REVEAL_MS = 340;
const SLACK_MS = 40;

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
  const runningRef = useRef(false);

  const run = useCallback(async (fn) => {
    if (typeof fn !== "function") return;

    if (prefersReducedMotion() || runningRef.current) {
      fn();
      return;
    }

    runningRef.current = true;
    try {
      setPhase("cover");
      await wait(COVER_MS + SLACK_MS);
      fn();
      await nextPaint();
      await wait(SLACK_MS);
      setPhase("reveal");
      await wait(REVEAL_MS + SLACK_MS);
    } finally {
      setPhase("idle");
      runningRef.current = false;
    }
  }, []);

  const value = useMemo(() => ({ run, isAnimating: phase !== "idle" }), [run, phase]);

  return (
    <TransitionContext.Provider value={value}>
      {children}
      <PixelTransition phase={phase} coverMs={COVER_MS} revealMs={REVEAL_MS} />
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
