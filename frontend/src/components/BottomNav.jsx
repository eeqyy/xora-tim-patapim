// ============================================================
// XORA — Bottom Navigation (mobile-first)
// frontend/src/components/BottomNav.jsx
// ------------------------------------------------------------
// Hanya tampil di layar < 900px dan saat pengguna login.
// Learner: Dashboard / Evidence / Gaps / Remediation (section
// analitik). Admin: Panel / Asesmen / Pengguna / Sistem.
// ============================================================

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "../context/RouterContext";
import {
  IconChart,
  IconSearch,
  IconTarget,
  IconSparkles,
  IconLayers,
  IconUser,
  IconCompass,
} from "./Icons";

const LEARNER_ITEMS = [
  { key: "summary", label: "Dashboard", Icon: IconChart, to: "/dashboard", section: "summary" },
  { key: "evidence", label: "Evidence", Icon: IconSearch, to: "/dashboard", section: "evidence" },
  { key: "gap", label: "Gaps", Icon: IconTarget, to: "/dashboard", section: "gap" },
  {
    key: "remediation",
    label: "Remediation",
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

  // Lacak section analitik yang sedang terlihat di Dashboard.
  useEffect(() => {
    if (isAdmin || !isDashboard) return undefined;

    const onScroll = () => {
      const ids = LEARNER_ITEMS.map((item) => item.section);
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
    navigate(item.to);
    if (item.section) {
      window.setTimeout(() => {
        const el = document.getElementById(item.section);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 60);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const isActive = (item) => {
    if (isAdmin) {
      return item.exact
        ? currentPath === "/admin" || currentPath === "/admin/"
        : currentPath.startsWith(item.to);
    }
    return isDashboard && activeSection === item.section;
  };

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <button
            key={item.key}
            type="button"
            className={`bottom-nav-item ${active ? "bottom-nav-item-active" : ""}`}
            aria-current={active ? "page" : undefined}
            onClick={() => handleActivate(item)}
          >
            <span className="bottom-nav-icon">
              <item.Icon size={19} />
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
