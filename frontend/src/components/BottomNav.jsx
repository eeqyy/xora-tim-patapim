// ============================================================
// XOLEARN — Bottom Navigation (Editorial System v2)
// frontend/src/components/BottomNav.jsx
// ------------------------------------------------------------
// Mobile (<768px): bar bawah dengan indikator pil untuk item
// aktif. Target sentuh >=56px.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { IconChart, IconSearch, IconTarget, IconBandage, IconClipboard, IconUser, IconSettings } from "./Icons";
import { HAIRLINE, cx } from "./ui";

const LEARNER_ITEMS = [
  { key: "summary", label: "Ringkasan", Icon: IconChart, to: "/dashboard", section: "summary" },
  { key: "evidence", label: "Bukti", Icon: IconSearch, to: "/dashboard", section: "evidence" },
  { key: "gap", label: "Kesenjangan", Icon: IconTarget, to: "/dashboard", section: "gap" },
  {
    key: "remediation",
    label: "Remediasi",
    Icon: IconBandage,
    to: "/dashboard",
    section: "remediation",
  },
];

const ADMIN_ITEMS = [
  { key: "panel", label: "Panel", Icon: IconChart, to: "/admin", exact: true },
  { key: "assessments", label: "Asesmen", Icon: IconClipboard, to: "/admin/assessments" },
  { key: "users", label: "Pengguna", Icon: IconUser, to: "/admin/users" },
  { key: "system", label: "Sistem", Icon: IconSettings, to: "/admin/system" },
];

// Kompensasi tinggi header sticky. Dibaca dari CSS var `--header-h`
// yang di-set Navbar (tinggi <header> aktual, termasuk ContextPicker
// di /dashboard). Fallback 68px bila belum tersedia.
function headerOffset() {
  const el = document.querySelector("header");
  if (el) {
    const h = el.getBoundingClientRect().height;
    if (h > 0) return h;
  }
  const cssVar = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue("--header-h")
  );
  return Number.isFinite(cssVar) && cssVar > 0 ? cssVar : 68;
}

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

// Posisi statis elemen non-sticky di dokumen (jumlah offsetTop sepanjang
// rantai offsetParent). Dipakai untuk mengukur elemen konten, bukan
// SectionHeader yang position-nya sticky (lihat headerStaticTop).
function staticTop(el) {
  let y = 0;
  for (let node = el; node; node = node.offsetParent) {
    y += node.offsetTop;
  }
  return y;
}

// Posisi statis (non-sticky) sebuah SectionHeader.
// Header memakai position: sticky, sehingga saat sudah "menempel" di atas,
// offsetTop-nya mencerminkan posisi nempel (relatif ke posisi scroll saat
// itu) — bukan posisi statis di dokumen. Akibatnya target scroll jadi
// meleset hanya beberapa piksel dari posisi sekarang. Untuk itu ukur
// konten non-sticky tepat sesudah header (saudara berikutnya), lalu
// turunkan posisi header dari situ memakai tinggi + margin bawahnya.
function headerStaticTop(header) {
  const content = header.nextElementSibling;
  if (content) {
    const mb = parseFloat(window.getComputedStyle(header).marginBottom) || 0;
    return staticTop(content) - mb - header.offsetHeight;
  }
  return staticTop(header);
}

// Tunggu elemen target tersedia (mis. sesudah pindah dari halaman lain),
// lalu scroll dengan kompensasi header sticky.
function scrollToSection(id) {
  let attempts = 0;
  const tryScroll = () => {
    const el = document.getElementById(id);
    if (!el) {
      if (attempts < 60) {
        attempts += 1;
        window.requestAnimationFrame(tryScroll);
      }
      return;
    }
    window.scrollTo({
      top: Math.max(0, headerStaticTop(el) - headerOffset() - 8),
      behavior: "smooth",
    });
  };
  window.requestAnimationFrame(tryScroll);
}

export default function BottomNav() {
  const { user, isAuthenticated } = useAuth();
  const { currentPath, navigate } = useRouter();

  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");
  const isDashboard = currentPath === "/dashboard";

  const [activeSection, setActiveSection] = useState("summary");

  useEffect(() => {
    if (isAdmin || !isDashboard) return undefined;
    const ids = LEARNER_ITEMS.map((item) => item.section);
    const onScroll = () => {
      const threshold = window.scrollY + window.innerHeight * 0.35;
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && headerStaticTop(el) <= threshold) {
          current = id;
        }
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isAdmin, isDashboard]);

  if (!isAuthenticated) return null;
  // Jangan tampilkan bar saat mengerjakan sesi (ubah tanpa tekan tab).
  if (isSessionRoute(currentPath)) return null;

  const items = isAdmin ? ADMIN_ITEMS : LEARNER_ITEMS;

  const handleActivate = (item) => {
    if (isAdmin) {
      navigate(item.to);
      return;
    }
    navigate(item.to);
    scrollToSection(item.section);
  };

  const isActive = (item) => {
    if (isAdmin) {
      return item.exact ? currentPath === "/admin" || currentPath === "/admin/" : currentPath.startsWith(item.to);
    }
    return currentPath === "/dashboard" && activeSection === item.section;
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
            onClick={() => handleActivate(item)}
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
