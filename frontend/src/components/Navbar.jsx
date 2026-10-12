// ============================================================
// XORA — Navigation Bar
// frontend/src/components/Navbar.jsx
// ------------------------------------------------------------
// Mobile-first: pada layar < 900px tautan disajikan lewat drawer
// yang dibuka tombol hamburger. Di desktop tetap horizontal.
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useRouter, Link } from "../context/RouterContext";
import { IconSun, IconMoon } from "./Icons";

// Item di dalam dropdown admin. `match` menentukan apakah item dianggap
// sedang aktif berdasarkan path saat ini.
const ADMIN_MENU = [
  {
    to: "/admin",
    label: "Panel Admin",
    match: (path) => path === "/admin" || path === "/admin/",
  },
  {
    to: "/admin/assessments",
    label: "Kelola Asesmen",
    match: (path) => path.startsWith("/admin/assessments"),
  },
  {
    to: "/admin/users",
    label: "Pengguna",
    match: (path) => path.startsWith("/admin/users"),
  },
  {
    to: "/admin/system",
    label: "Sistem",
    match: (path) => path.startsWith("/admin/system"),
  },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { currentPath, navigate } = useRouter();

  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

  const [adminOpen, setAdminOpen] = useState(false);
  const adminRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // Tutup dropdown & drawer setiap kali berpindah halaman.
  useEffect(() => {
    setAdminOpen(false);
    setMenuOpen(false);
  }, [currentPath]);

  // Tutup dropdown admin saat klik di luar area atau tekan Escape.
  useEffect(() => {
    if (!adminOpen) return undefined;

    const handleClickOutside = (e) => {
      if (adminRef.current && !adminRef.current.contains(e.target)) {
        setAdminOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setAdminOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [adminOpen]);

  // Tutup drawer dengan tombol Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <Link to="/" className="brand-logo" onClick={closeMenu}>
          <span className="brand-dot" aria-hidden="true" />
          Xora
        </Link>

        <div className="navbar-end">
          <nav
            id="nav-links"
            className={`navbar-links ${menuOpen ? "navbar-links-open" : ""}`}
          >
            <Link
              to="/"
              className={`nav-link ${currentPath === "/" ? "nav-link-active" : ""}`}
              onClick={closeMenu}
            >
              Beranda
            </Link>
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <Link
                    to="/dashboard"
                    className={`nav-link ${currentPath === "/dashboard" ? "nav-link-active" : ""}`}
                    onClick={closeMenu}
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  to="/learning-path"
                  className={`nav-link ${currentPath === "/learning-path" ? "nav-link-active" : ""}`}
                  onClick={closeMenu}
                >
                  Learning Path
                </Link>
                <Link
                  to="/assessments"
                  className={`nav-link ${currentPath === "/assessments" ? "nav-link-active" : ""}`}
                  onClick={closeMenu}
                >
                  Asesmen
                </Link>
                {isAdmin && (
                  <div className="nav-dropdown" ref={adminRef}>
                    <button
                      type="button"
                      className={`nav-dropdown-toggle ${currentPath.startsWith("/admin") ? "nav-link-active" : ""}`}
                      aria-expanded={adminOpen}
                      onClick={() => setAdminOpen((v) => !v)}
                    >
                      Menu Admin
                      <span
                        className={`nav-dropdown-caret ${adminOpen ? "nav-dropdown-caret-open" : ""}`}
                        aria-hidden="true"
                      >
                        ▾
                      </span>
                    </button>
                    {adminOpen && (
                      <div className="nav-dropdown-menu" aria-label="Menu admin">
                        {ADMIN_MENU.map((item) => (
                          <Link
                            key={item.to}
                            to={item.to}
                            className={`nav-dropdown-item ${item.match(currentPath) ? "nav-dropdown-item-active" : ""}`}
                            onClick={() => {
                              setAdminOpen(false);
                              closeMenu();
                            }}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {/* /profile dan /progress hanya untuk learner: admin tidak punya
                    learner_profiles sehingga endpoint-nya 404. */}
                {!isAdmin && (
                  <Link
                    to="/progress"
                    className={`nav-link ${currentPath === "/progress" || currentPath === "/history" ? "nav-link-active" : ""}`}
                    onClick={closeMenu}
                  >
                    Progres Belajar
                  </Link>
                )}
                {!isAdmin && (
                  <Link
                    to="/profile"
                    className={`nav-link ${currentPath === "/profile" ? "nav-link-active" : ""}`}
                    onClick={closeMenu}
                  >
                    Profil Saya
                  </Link>
                )}
                <div className="nav-user-pill">
                  <span className="nav-user-name">{user?.name}</span>
                  {Array.isArray(user?.roles) && user.roles.length > 0 && (
                    <span className="nav-user-role">{user.roles[0]}</span>
                  )}
                </div>
                <button onClick={handleLogout} className="btn btn-sm btn-outline">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`nav-link ${currentPath === "/login" ? "nav-link-active" : ""}`}
                  onClick={closeMenu}
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="btn btn-sm btn-primary"
                  onClick={closeMenu}
                >
                  Daftar
                </Link>
              </>
            )}
          </nav>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            title={isDark ? "Mode terang" : "Mode gelap"}
          >
            {isDark ? <IconSun size={17} /> : <IconMoon size={17} />}
          </button>

          <button
            type="button"
            className={`nav-hamburger ${menuOpen ? "nav-hamburger-open" : ""}`}
            aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
            aria-expanded={menuOpen}
            aria-controls="nav-links"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <div
        className={`nav-overlay ${menuOpen ? "nav-overlay-open" : ""}`}
        onClick={closeMenu}
        aria-hidden="true"
      />
    </header>
  );
}
