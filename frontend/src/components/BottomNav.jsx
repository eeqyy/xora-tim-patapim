// ============================================================
// XOLEARN — Bottom Navigation (Editorial System v2)
// frontend/src/components/BottomNav.jsx
// ------------------------------------------------------------
// Mobile (<768px): bar bawah dengan indikator pil untuk item
// aktif. Target sentuh >=56px.
// Siswa: 4 rute utama (Ringkasan, Belajar, Asesmen, Progres)
// supaya jalur menuju soal selalu terlihat tanpa buka drawer.
// ============================================================

import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import {
  IconChart,
  IconCompass,
  IconClipboard,
  IconTrendingUp,
  IconUser,
  IconSettings,
} from "./Icons";
import { cx } from "./ui";

const LEARNER_ITEMS = [
  { key: "dashboard", label: "Ringkasan", Icon: IconChart, to: "/dashboard" },
  { key: "learning-path", label: "Belajar", Icon: IconCompass, to: "/learning-path" },
  { key: "assessments", label: "Asesmen", Icon: IconClipboard, to: "/assessments" },
  { key: "progress", label: "Progres", Icon: IconTrendingUp, to: "/progress" },
];

const ADMIN_ITEMS = [
  { key: "panel", label: "Panel", Icon: IconChart, to: "/admin", exact: true },
  { key: "assessments", label: "Asesmen", Icon: IconClipboard, to: "/admin/assessments" },
  { key: "users", label: "Pengguna", Icon: IconUser, to: "/admin/users" },
  { key: "system", label: "Sistem", Icon: IconSettings, to: "/admin/system" },
];

// Rute "sedang mengerjakan sesi" — bottom-nav disembunyikan agar
// progres asesmen/latihan tidak hilang karena salah tekan tab.
const SESSION_PREFIXES = ["/verification/", "/practice/", "/reassess/"];

function isSessionRoute(path) {
  if (path === "/assessments" || path === "/assessments/") return false;
  if (SESSION_PREFIXES.some((p) => path.startsWith(p))) return true;
  // Detail asesmen: /assessments/<id> (bukan daftar, bukan hasil).
  if (/^\/assessments\/[^/]+/.test(path) && !path.startsWith("/assessments/result")) {
    return true;
  }
  return false;
}

export default function BottomNav() {
  const { user, isAuthenticated } = useAuth();
  const { currentPath, navigate } = useRouter();

  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

  if (!isAuthenticated) return null;
  // Jangan tampilkan bar saat mengerjakan sesi (ubah tanpa tekan tab).
  if (isSessionRoute(currentPath)) return null;

  const items = isAdmin ? ADMIN_ITEMS : LEARNER_ITEMS;

  const isActive = (item) => {
    if (isAdmin) {
      return item.exact
        ? currentPath === item.to || currentPath === `${item.to}/`
        : currentPath.startsWith(item.to);
    }
    // Riwayat ikut menyalakan tab Progres.
    if (item.to === "/progress") {
      return currentPath === "/progress" || currentPath === "/history";
    }
    return currentPath === item.to || currentPath.startsWith(`${item.to}/`);
  };

  return (
    <nav
      className={cx(
        "fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t bg-canvas/95 backdrop-blur md:hidden",
        "border-hairline dark:border-hairline-dark dark:bg-canvas-dark/95"
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Navigasi bawah"
    >
      {items.map((item) => {
        const active = isActive(item);
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => navigate(item.to)}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex min-h-[60px] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold transition-colors",
              active
                ? "text-accent"
                : "text-muted hover:text-ink dark:text-muted-dark dark:hover:text-ink-dark"
            )}
          >
            <span
              className={cx(
                "flex h-8 w-12 items-center justify-center rounded-full transition-colors",
                active && "bg-brand-soft"
              )}
            >
              <item.Icon size={17} />
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
