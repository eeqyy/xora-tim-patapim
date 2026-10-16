// ============================================================
// XOLEARN — PixelTransition
// frontend/src/components/PixelTransition.jsx
// ------------------------------------------------------------
// Overlay kanvas layar penuh: menutup halaman dengan kotak-kotak
// (pixel) lalu membukanya lagi saat mengganti tema gelap/terang.
// Komponen ini memakai canvas 2D berkepatan tinggi (60 FPS) tanpa
// meledakkan elemen DOM.
// ============================================================

import React, { useEffect, useRef } from "react";

/* Ukuran sisi sel (px CSS). Layar sempit memakai sel lebih kecil
   agar efek tetap rapat tanpa meledakkan jumlah sel. */
const CELL_DESKTOP = 48;
const CELL_MOBILE = 36;
const MOBILE_MAX_WIDTH = 767;

/* Tingkat kepekatan yang dipecah jadi beberapa langkah supaya
   `fillStyle` bisa dipakai dari tabel warna siap pakai. */
const LEVELS = 8;

/* Lebar ramp per sel: sel muncul/menghilang dalam rentang progres ini. */
const RAMP = 0.12;

function parseRgb(value) {
  const m = String(value || "").match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1]
    .split(/[\s,/]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some((n) => !Number.isFinite(n))) return null;
  return [parts[0], parts[1], parts[2]];
}

function mixRgb(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export default function PixelTransition({ phase, coverMs = 380, revealMs = 450 }) {
  const canvasRef = useRef(null);
  const dataRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    if (phase === "idle") {
      stop();
      dataRef.current = null;
      canvas.width = 1;
      canvas.height = 1;
      canvas.style.display = "none";
      return undefined;
    }

    // Fase `cover`: susun grid + palet dari warna tema yang sedang aktif.
    if (phase === "cover") {
      const styles = getComputedStyle(document.documentElement);
      const isDark = document.documentElement.getAttribute("data-theme") === "dark";
      const canvasRgb =
        parseRgb(styles.backgroundColor) || (isDark ? [12, 12, 34] : [247, 247, 253]);
      const inkRgb =
        parseRgb(styles.color) || (isDark ? [255, 255, 255] : [4, 0, 99]);

      const cell = window.innerWidth <= MOBILE_MAX_WIDTH ? CELL_MOBILE : CELL_DESKTOP;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cols = Math.max(1, Math.ceil(width / cell));
      const rows = Math.max(1, Math.ceil(height / cell));
      const count = cols * rows;

      canvas.style.display = "block";
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));

      // Kontras butiran pixel 20% agar tekstur mozaik terlihat tegas dan jelas
      const tones = [canvasRgb, mixRgb(canvasRgb, inkRgb, 0.20)];
      const palette = [];
      tones.forEach((tone) => {
        for (let l = 1; l <= LEVELS; l += 1) {
          palette.push(
            `rgba(${Math.round(tone[0])}, ${Math.round(tone[1])}, ${Math.round(tone[2])}, ${(
              l / LEVELS
            ).toFixed(3)})`
          );
        }
      });

      const x = new Float32Array(count);
      const y = new Float32Array(count);
      const tone = new Uint8Array(count);
      const tOut = new Float32Array(count);
      const tIn = new Float32Array(count);

      for (let i = 0; i < count; i += 1) {
        const col = i % cols;
        const row = (i - col) / cols;
        x[i] = col * cell;
        y[i] = row * cell;
        tone[i] = Math.random() < 0.5 ? 0 : 1;
        // Ambang batas = campuran acak + posisi diagonal untuk sapuan yang berisik & dinamis
        const diag = (col + row) / (cols + rows);
        tOut[i] = 0.02 + 0.8 * (0.55 * Math.random() + 0.45 * diag);
        tIn[i] = 0.18 + 0.8 * (0.55 * Math.random() + 0.45 * (1 - diag));
      }

      dataRef.current = { width, height, dpr, cell, count, x, y, tone, tOut, tIn, palette };
    }

    const data = dataRef.current;
    if (!data) return undefined;

    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const mode = phase === "cover" ? "cover" : "reveal";
    const duration = mode === "cover" ? coverMs : revealMs;
    const start = performance.now();

    const draw = (p) => {
      ctx.setTransform(data.dpr, 0, 0, data.dpr, 0, 0);
      ctx.clearRect(0, 0, data.width, data.height);
      for (let i = 0; i < data.count; i += 1) {
        let alpha;
        if (mode === "cover") {
          const t = data.tOut[i];
          if (p < t) continue;
          alpha = Math.min(1, (p - t) / RAMP);
        } else {
          const t = data.tIn[i];
          if (p >= t) continue;
          alpha = Math.min(1, (t - p) / RAMP);
        }
        const level = Math.max(1, Math.min(LEVELS, Math.round(alpha * LEVELS)));
        ctx.fillStyle = data.palette[data.tone[i] * LEVELS + (level - 1)];
        ctx.fillRect(data.x[i], data.y[i], data.cell, data.cell);
      }
    };

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      draw(p);
      rafRef.current = p < 1 ? requestAnimationFrame(tick) : 0;
    };

    stop();
    draw(0);
    rafRef.current = requestAnimationFrame(tick);

    return stop;
  }, [phase, coverMs, revealMs]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ display: "none" }}
    />
  );
}
