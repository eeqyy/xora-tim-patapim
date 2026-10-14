// ============================================================
// XOLEARN — Sticky Header Bar (Editorial System v2)
// frontend/src/components/Navbar.jsx
// ------------------------------------------------------------
// Mobile-first: header 2 tingkat (baris 1 logo + toggle tema,
// baris 2 pemilih konteks Kelas/Siswa). Tautan navigasi pada
// layar < 768px disajikan lewat drawer dari kanan.
// Sudut pil untuk semua elemen interaktif.
// ============================================================

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useDashboardFilter } from "../context/DashboardFilterContext";
import { useRouter, Link } from "../context/RouterContext";
import { IconSun, IconMoon, IconChevronDown } from "./Icons";
import { MicroMeta, HAIRLINE, cx } from "./ui";

const ADMIN_MENU = [
  { to: "/admin", label: "Panel Admin", match: (p) => p === "/admin" || p === "/admin/" },
  { to: "/admin/assessments", label: "Kelola Asesmen", match: (p) => p.startsWith("/admin/assessments") },
  { to: "/admin/users", label: "Pengguna", match: (p) => p.startsWith("/admin/users") },
  { to: "/admin/ai", label: "AI & Model", match: (p) => p.startsWith("/admin/ai") },
  { to: "/admin/system", label: "Sistem", match: (p) => p.startsWith("/admin/system") },
];

const navLinkClass = (active) =>
  cx(
    "flex min-h-[44px] items-center gap-1 rounded-full px-4 text-[13px] font-semibold transition-colors",
    active
      ? "bg-brand-soft text-accent"
      : "text-muted hover:bg-cell hover:text-ink dark:text-muted-dark dark:hover:bg-cell-dark dark:hover:text-ink-dark"
  );

const drawerLinkClass = (active) =>
  cx(
    "mx-3 my-1 flex min-h-[52px] items-center rounded-2xl px-4 text-sm font-semibold transition-colors",
    active
      ? "bg-brand-soft text-accent"
      : "text-ink hover:bg-cell dark:text-ink-dark dark:hover:bg-cell-dark"
  );

const iconButtonClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-cell hover:text-ink dark:text-muted-dark dark:hover:bg-cell-dark dark:hover:text-ink-dark";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { currentPath } = useRouter();

  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

  const [adminOpen, setAdminOpen] = useState(false);
  const adminRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const drawerRef = React.useRef(null);
  const hamburgerRef = React.useRef(null);
  const headerRef = React.useRef(null);

  // Publikasikan tinggi <header> aktual sebagai CSS var `--header-h`.
  // SectionHeader (sticky) & BottomNav membacanya agar offset scroll
  // selalu pas — termasuk saat ContextPicker menambah satu baris di
  // /dashboard. ResizeObserver hanya menulis var (tidak memicu layout
  // yang mengubah tinggi header).
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return undefined;
    const apply = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) {
        document.documentElement.style.setProperty("--header-h", `${Math.round(h)}px`);
      }
    };
    apply();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", apply);
      return () => window.removeEventListener("resize", apply);
    }
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tutup dropdown & drawer setiap kali berpindah halaman.
  useEffect(() => {
    setAdminOpen(false);
    setMenuOpen(false);
  }, [currentPath]);

  // Tutup dropdown admin saat klik di luar / Escape.
  useEffect(() => {
    if (!adminOpen) return undefined;
    const handleClickOutside = (e) => {
      if (adminRef.current && !adminRef.current.contains(e.target)) setAdminOpen(false);
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

  // Tutup drawer dengan Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [menuOpen]);

  // Saat drawer terbuka: kunci scroll, fokus tautan pertama, kembalikan fokus.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const first = drawerRef.current?.querySelector("a, button");
    if (first) first.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      if (hamburgerRef.current) hamburgerRef.current.focus();
    };
  }, [menuOpen]);

  // Tutup drawer bila melewati breakpoint desktop.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e) => {
      if (e.matches) setMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <header
      ref={headerRef}
      className={cx(
        "sticky top-0 z-50 border-b bg-canvas/90 backdrop-blur-sm",
        "border-hairline dark:bg-canvas-dark/90 dark:border-hairline-dark"
      )}
    >
      <div className="mx-auto flex min-h-[68px] max-w-[1200px] items-center gap-3 px-5 py-2 md:px-8 xl:max-w-[1340px] xl:px-10 2xl:max-w-[1480px]">
        {/* Logo */}
        <Link
          to="/"
          className="mr-1 flex min-h-[44px] shrink-0 items-center gap-2.5 text-[17px] font-extrabold tracking-[-0.02em] text-ink dark:text-ink-dark"
        >
          <img
            src="/logo-mark.png"
            alt=""
            aria-hidden="true"
            className="logo-mark h-7 w-7 shrink-0 object-contain dark:hidden"
          />
          <img
            src="/logo-mark-light.png"
            alt=""
            aria-hidden="true"
            className="logo-mark hidden h-7 w-7 shrink-0 object-contain dark:block"
          />
          Xolearn
        </Link>

        {/* Navigasi desktop */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navigasi utama">
          <Link to="/" className={navLinkClass(currentPath === "/")}>
            Beranda
          </Link>

          {isAuthenticated ? (
            <>
              {!isAdmin && (
                <Link to="/dashboard" className={navLinkClass(currentPath === "/dashboard")}>
                  Dashboard
                </Link>
              )}
              <Link
                to="/learning-path"
                className={navLinkClass(currentPath === "/learning-path")}
              >
                Learning Path
              </Link>
              <Link to="/assessments" className={navLinkClass(currentPath === "/assessments")}>
                Asesmen
              </Link>

              {isAdmin && (
                <div className="relative flex items-center" ref={adminRef}>
                  <button
                    type="button"
                    className={navLinkClass(currentPath.startsWith("/admin"))}
                    aria-expanded={adminOpen}
                    onClick={() => setAdminOpen((v) => !v)}
                  >
                    Menu Admin
                    <span
                      className={cx("transition-transform", adminOpen && "rotate-180")}
                      aria-hidden="true"
                    >
                      <IconChevronDown size={14} />
                    </span>
                  </button>
                  {adminOpen && (
                    <div
                      className={cx(
                        "absolute left-0 top-[calc(100%+8px)] z-50 w-60 overflow-hidden rounded-2xl border bg-canvas p-2",
                        "border-hairline dark:border-hairline-dark dark:bg-canvas-dark"
                      )}
                      aria-label="Menu admin"
                    >
                      {ADMIN_MENU.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => {
                            setAdminOpen(false);
                            closeMenu();
                          }}
                          className={cx(
                            "block rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-colors",
                            item.match(currentPath)
                              ? "bg-brand-soft text-accent"
                              : "text-ink hover:bg-cell dark:text-ink-dark dark:hover:bg-cell-dark"
                          )}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isAdmin && (
                <Link
                  to="/progress"
                  className={navLinkClass(
                    currentPath === "/progress" || currentPath === "/history"
                  )}
                >
                  Progres
                </Link>
              )}
              {!isAdmin && (
                <Link to="/profile" className={navLinkClass(currentPath === "/profile")}>
                  Profil
                </Link>
              )}
            </>
          ) : null}
        </nav>

        <div className="flex-1" />

        {/* Akun (desktop) */}
        {isAuthenticated ? (
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right leading-tight">
              <p className="text-[13px] font-bold text-ink dark:text-ink-dark">{user?.name}</p>
              {Array.isArray(user?.roles) && user.roles.length > 0 && (
                <MicroMeta as="span">{user.roles[0]}</MicroMeta>
              )}
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={cx(
                "inline-flex min-h-[44px] items-center rounded-full border px-4 text-[13px] font-semibold transition-colors",
                "border-hairline text-ink hover:border-brand hover:text-accent",
                "dark:border-hairline-dark dark:text-ink-dark dark:hover:border-brand dark:hover:text-accent"
              )}
            >
              Keluar
            </button>
          </div>
        ) : (
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/login" className={navLinkClass(currentPath === "/login")}>
              Masuk
            </Link>
            <Link
              to="/register"
              className="inline-flex min-h-[44px] items-center rounded-full bg-brand px-5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Daftar
            </Link>
          </div>
        )}

        {/* Toggle tema */}
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          onClick={toggleTheme}
          aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
          title={isDark ? "Mode terang" : "Mode gelap"}
          className={iconButtonClass}
        >
          {isDark ? <IconSun size={18} /> : <IconMoon size={18} />}
        </button>

        {/* Hamburger (mobile) */}
        <button
          type="button"
          ref={hamburgerRef}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? "Tutup menu" : "Buka menu"}
          aria-expanded={menuOpen}
          aria-controls="nav-links"
          className={cx(iconButtonClass, "text-ink dark:text-ink-dark md:hidden")}
        >
          <span className="relative block h-3.5 w-5" aria-hidden="true">
            <span
              className={cx(
                "absolute left-0 top-0 block h-0.5 w-5 rounded-full bg-current transition-transform",
                menuOpen && "translate-y-[7px] rotate-45"
              )}
            />
            <span
              className={cx(
                "absolute left-0 top-1.5 block h-0.5 w-5 rounded-full bg-current transition-opacity",
                menuOpen && "opacity-0"
              )}
            />
            <span
              className={cx(
                "absolute bottom-0 left-0 block h-0.5 w-5 rounded-full bg-current transition-transform",
                menuOpen && "-translate-y-[7px] -rotate-45"
              )}
            />
          </span>
        </button>
      </div>

      {/* Baris 2: context picker (Kelas / Siswa) */}
      {currentPath === "/dashboard" && isAuthenticated ? <ContextPicker /> : null}

      {/* Overlay + Drawer mobile.
          Di-portal ke <body> karena `backdrop-blur` pada <header> membuat
          header menjadi containing block untuk elemen `fixed`, sehingga
          drawer akan terpotong setinggi header bila tetap di dalamnya. */}
      {createPortal(
        <>
          <div
            className={cx(
              "fixed inset-0 z-[55] bg-canvas-dark/60 transition-opacity md:hidden",
              menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={closeMenu}
            aria-hidden="true"
          />

          <nav
            id="nav-links"
            ref={drawerRef}
            className={cx(
              "fixed inset-y-0 right-0 z-[60] flex w-[min(340px,86%)] flex-col border-l",
              "border-hairline bg-canvas transition-transform duration-200 md:hidden",
              "dark:border-hairline-dark dark:bg-canvas-dark",
              menuOpen ? "translate-x-0" : "translate-x-full"
            )}
            aria-label="Navigasi"
          >
        <div className="flex min-h-[68px] shrink-0 items-center justify-between px-5">
          <div className="flex items-center gap-2">
            <img
              src="/logo-mark.png"
              alt=""
              aria-hidden="true"
              className="logo-mark h-6 w-6 shrink-0 object-contain dark:hidden"
            />
            <img
              src="/logo-mark-light.png"
              alt=""
              aria-hidden="true"
              className="logo-mark hidden h-6 w-6 shrink-0 object-contain dark:block"
            />
            <MicroMeta>MENU · XOLEARN</MicroMeta>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            className="-mr-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full px-3 text-[12px] font-semibold uppercase tracking-[0.14em] text-accent"
          >
            Tutup
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pb-4">
          <Link to="/" onClick={closeMenu} className={drawerLinkClass(currentPath === "/")}>
            Beranda
          </Link>

          {isAuthenticated ? (
            <>
              {!isAdmin && (
                <Link
                  to="/dashboard"
                  onClick={closeMenu}
                  className={drawerLinkClass(currentPath === "/dashboard")}
                >
                  Dashboard
                </Link>
              )}
              <Link
                to="/learning-path"
                onClick={closeMenu}
                className={drawerLinkClass(currentPath === "/learning-path")}
              >
                Learning Path
              </Link>
              <Link
                to="/assessments"
                onClick={closeMenu}
                className={drawerLinkClass(currentPath === "/assessments")}
              >
                Asesmen
              </Link>

              {isAdmin && (
                <>
                  <div className="mt-3 px-5 pb-1 pt-2">
                    <MicroMeta>MENU ADMIN</MicroMeta>
                  </div>
                  {ADMIN_MENU.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={closeMenu}
                      className={drawerLinkClass(item.match(currentPath))}
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}

              {!isAdmin && (
                <>
                  <Link
                    to="/progress"
                    onClick={closeMenu}
                    className={drawerLinkClass(
                      currentPath === "/progress" || currentPath === "/history"
                    )}
                  >
                    Progres Belajar
                  </Link>
                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    className={drawerLinkClass(currentPath === "/profile")}
                  >
                    Profil Saya
                  </Link>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={closeMenu}
                className={drawerLinkClass(currentPath === "/login")}
              >
                Masuk
              </Link>
              <Link
                to="/register"
                onClick={closeMenu}
                className={drawerLinkClass(currentPath === "/register")}
              >
                Daftar
              </Link>
            </>
          )}
        </div>

        {isAuthenticated ? (
          <div className={cx("border-t p-4", HAIRLINE)}>
            <p className="px-1 text-sm font-bold text-ink dark:text-ink-dark">{user?.name}</p>
            {Array.isArray(user?.roles) && user.roles.length > 0 && (
              <MicroMeta className="px-1">{user.roles[0]}</MicroMeta>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-brand px-6 text-[14px] font-semibold text-white transition-colors hover:bg-brand-hover"
            >
              Keluar
            </button>
          </div>
        ) : null}
          </nav>
        </>,
        document.body
      )}
    </header>
  );
}

/* ------------------------------------------------------------
   ContextPicker — pemilih Kelas (subject) & Siswa (learner)
   ------------------------------------------------------------ */
function ContextPicker() {
  const { user } = useAuth();
  const {
    isAdmin,
    subjects,
    learners,
    selectedSubject,
    setSelectedSubject,
    selectedLearnerId,
    setSelectedLearnerId,
  } = useDashboardFilter();

  const selectClass =
    "min-h-[44px] min-w-0 flex-1 truncate bg-transparent text-sm font-semibold text-ink focus:outline-none dark:text-ink-dark";
  const labelClass = cx(
    "flex min-h-[48px] min-w-0 flex-1 items-center gap-3 rounded-full border px-4",
    "border-hairline dark:border-hairline-dark"
  );

  return (
    <div className={cx("border-t", HAIRLINE)}>
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-5 py-3 md:flex-row md:px-8 xl:max-w-[1340px] xl:px-10 2xl:max-w-[1480px]">
        <label className={labelClass}>
          <MicroMeta className="whitespace-nowrap">KELAS</MicroMeta>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={selectClass}
          >
            <option value="">Semua Kelas</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className={labelClass}>
          <MicroMeta className="whitespace-nowrap">SISWA</MicroMeta>
          {isAdmin ? (
            <select
              value={selectedLearnerId}
              onChange={(e) => setSelectedLearnerId(e.target.value)}
              disabled={learners.length === 0}
              className={cx(selectClass, learners.length === 0 && "opacity-60")}
            >
              {learners.length === 0 ? (
                <option value="">Tidak ada siswa</option>
              ) : (
                learners.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))
              )}
            </select>
          ) : (
            <span className="flex-1 truncate text-sm font-semibold text-ink dark:text-ink-dark">
              {user?.name || "Diri sendiri"}
            </span>
          )}
        </label>
      </div>
    </div>
  );
}
