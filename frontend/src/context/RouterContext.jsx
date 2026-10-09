// ============================================================
// XORA — Lightweight History Router & ProtectedRoute
// frontend/src/context/RouterContext.jsx
// ============================================================

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || "/");

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || "/");
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigate = (to) => {
    if (window.location.pathname !== to) {
      window.history.pushState({}, "", to);
      setCurrentPath(to);
    }
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}

export function Link({ to, children, className = "", style = {}, onClick }) {
  const { navigate } = useRouter();

  const handleClick = (e) => {
    e.preventDefault();
    if (onClick) onClick(e);
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} className={className} style={style}>
      {children}
    </a>
  );
}

/**
 * ProtectedRoute component
 * Ensures only authenticated users can access child views.
 * If auth is still checking (isLoading = true), displays a loading state without redirecting.
 * If unauthenticated, navigates to /login.
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#6b7280" }}>
        <p>Memeriksa autentikasi...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}

/**
 * AdminRoute component
 * Seperti ProtectedRoute, tapi juga mewajibkan role ADMIN.
 * Non-admin diarahkan ke beranda (bukan /login) karena ia sudah login.
 */
export function AdminRoute({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { navigate } = useRouter();

  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !isAdmin)) {
      navigate("/");
    }
  }, [isLoading, isAuthenticated, isAdmin, navigate]);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#6b7280" }}>
        <p>Memeriksa autentikasi...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return children;
}
