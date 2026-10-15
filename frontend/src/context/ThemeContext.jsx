// ============================================================
// XOLEARN — Theme Context (Light / Dark)
// frontend/src/context/ThemeContext.jsx
// ============================================================
// Menyimpan preferensi tema di localStorage ("xora_theme") dan
// menerapkannya lewat atribut <html data-theme="dark|light">.
// Nilai awal sudah dipasang oleh script anti-FOUC di index.html.

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { usePixelTransition } from "./TransitionContext";

const ThemeContext = createContext(null);
const THEME_KEY = "xora_theme";

function readInitialTheme() {
  if (typeof document === "undefined") return "light";
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // Abaikan error storage (mode privat, dsb.)
  }
  return "light";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitialTheme);
  const { run } = usePixelTransition();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Abaikan error storage
    }
  }, [theme]);

  /* Perubahan tema dijalankan di dalam penutup pixel supaya pergantian
     terang → gelap terasa seperti satu transisi, bukan kedipan. Warna
     pixel diambil SEBELUM tema berganti, sehingga proses buka tetap
     terlihat di atas tema yang baru. */
  const setTheme = useCallback(
    (next) => {
      const value = next === "dark" ? "dark" : "light";
      run(() => {
        setThemeState((prev) => (prev === value ? prev : value));
      });
    },
    [run]
  );

  const toggleTheme = useCallback(() => {
    run(() => {
      setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
    });
  }, [run]);

  return (
    <ThemeContext.Provider
      value={{ theme, isDark: theme === "dark", setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback aman bila dipakai di luar provider.
    return {
      theme: "light",
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
    };
  }
  return ctx;
}
