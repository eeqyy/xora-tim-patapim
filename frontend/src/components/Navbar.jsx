// ============================================================
// XORA — Navigation Bar
// frontend/src/components/Navbar.jsx
// ============================================================

import React from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter, Link } from "../context/RouterContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { currentPath, navigate } = useRouter();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Link to="/" className="brand-logo">
            <span className="brand-dot"></span> Xora
          </Link>
        </div>

        <nav className="navbar-links">
          <Link
            to="/"
            className={`nav-link ${currentPath === "/" ? "nav-link-active" : ""}`}
          >
            Beranda
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/learning-path"
                className={`nav-link ${currentPath === "/learning-path" ? "nav-link-active" : ""}`}
              >
                Learning Path
              </Link>
              <Link
                to="/assessments"
                className={`nav-link ${currentPath.startsWith("/assessments") || currentPath.startsWith("/attempts") ? "nav-link-active" : ""}`}
              >
                Asesmen
              </Link>
              <Link
                to="/profile"
                className={`nav-link ${currentPath === "/profile" ? "nav-link-active" : ""}`}
              >
                Profil Saya
              </Link>
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
              >
                Masuk
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary">
                Daftar
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
