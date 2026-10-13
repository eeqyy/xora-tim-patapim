// ============================================================
// XORA — Bottom Navigation (Editorial System v2)
// frontend/src/components/BottomNav.jsx
// ------------------------------------------------------------
// Mobile (<768px): bar bawah dengan indikator pil untuk item
// aktif. Target sentuh >=56px.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import { IconChart, IconSearch, IconTarget, IconSparkles, IconLayers, IconUser, IconCompass } from "./Icons";
import { HAIRLINE, cx } from "./ui";

const LEARNER_ITEMS = [
  { key: "summary", label: "Ringkasan", Icon: IconChart, to: "/dashboard", section: "summary" },
  { key: "evidence", label: "Bukti", Icon: IconSearch, to: "/dashboard", section: "evidence" },
  { key: "gap", label: "Kesenjangan", Icon: IconTarget, to: "/dashboard", section: "gap" },
  {
    key: "remediation",
    label: "Remediasi",
    Icon: IconSparkles,
    to: "/dashboard",
    section: "remediation",
  },
];

const ADMIN_ITEMS = [
  { key: "panel", label: "Panel", Icon: IconChart, to: "/admin", exact: true },
  { key: "assessments", label: "Asesmen", Icon: IconLayers, to: "/admin/assessments" },
  { key: "users", label: "Pengguna", Icon: IconUser, to: "/admin/users" },
  { key: "system", label: "Sistem", Icon: IconCompass, to: "/admin/system" },
];

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
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= window.innerHeight * 0.35) {
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

  const items = isAdmin ? ADMIN_ITEMS : LEARNER_ITEMS;

  const handleActivate = (item) => {
    if (isAdmin) {
      navigate(item.to);
      return;
    }
    navigate(item.to);
    window.setTimeout(() => {
      const el = document.getElementById(item.section);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
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
                ? "text-brand"
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
