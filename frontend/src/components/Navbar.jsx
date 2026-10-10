// ============================================================
// XORA — Navigation Bar
// frontend/src/components/Navbar.jsx
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter, Link } from "../context/RouterContext";
import ThemeToggle from "./ui/ThemeToggle";

const INITIALS = (name = "") =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { currentPath, navigate } = useRouter();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === "/") return currentPath === "/";
    return currentPath === path || currentPath.startsWith(`${path}/`);
  };

  return (
    <header className="ui-navbar">
      <div className="ui-navbar-inner">
        <div className="ui-navbar-brand">
          <Link to="/" className="ui-navbar-logo" aria-label="Xora — beranda">
            <span className="ui-brand-dot" aria-hidden="true" />
            Xora
          </Link>
        </div>

        <nav className="ui-navbar-links" aria-label="Navigasi utama">
          <Link to="/" className={["ui-nav-link", isActive("/") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}>
            Beranda
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={["ui-nav-link", isActive("/dashboard") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
              >
                Dashboard
              </Link>
              <Link
                to="/learning-path"
                className={["ui-nav-link", isActive("/learning-path") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
              >
                Learning Path
              </Link>
              <Link
                to="/mastery"
                className={["ui-nav-link", isActive("/mastery") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
              >
                Mastery
              </Link>
              <Link
                to="/assessments"
                className={["ui-nav-link", isActive("/assessments") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
              >
                Asesmen
              </Link>
              <Link
                to="/gaps"
                className={["ui-nav-link", isActive("/gaps") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
              >
                Gap
              </Link>
              <Link
                to="/recommendations"
                className={["ui-nav-link", isActive("/recommendations") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
              >
                Rekomendasi
              </Link>
              <Link
                to="/practices"
                className={["ui-nav-link", isActive("/practices") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
              >
                Latihan
              </Link>
              <Link
                to="/history"
                className={["ui-nav-link", isActive("/history") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
              >
                Riwayat
              </Link>
              {isAdmin && (
                <Link
                  to="/admin/assessments"
                  className={["ui-nav-link", isActive("/admin") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
                >
                  Kelola
                </Link>
              )}
              {!isAdmin && (
                <Link
                  to="/profile"
                  className={["ui-nav-link", isActive("/profile") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
                >
                  Profil
                </Link>
              )}
              <div className="ui-nav-user">
                <span className="ui-nav-avatar" aria-hidden="true">
                  {INITIALS(user?.name)}
                </span>
                <span className="ui-nav-user-name">{user?.name}</span>
                {isAdmin && <span className="ui-nav-role">ADMIN</span>}
              </div>
              <button type="button" className="ui-btn ui-btn-ghost ui-btn-sm ui-nav-logout" onClick={handleLogout}>
                Keluar
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={["ui-nav-link", isActive("/login") ? "ui-nav-link-active" : ""].filter(Boolean).join(" ")}
              >
                Masuk
              </Link>
              <Link to="/register" className="ui-btn ui-btn-primary ui-btn-sm">
                Daftar
              </Link>
            </>
          )}

          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}