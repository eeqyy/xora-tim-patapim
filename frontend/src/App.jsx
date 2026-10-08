// ============================================================
// XORA — Main Application Entry Point
// frontend/src/App.jsx
// ============================================================

import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { RouterProvider, useRouter, ProtectedRoute } from "./context/RouterContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";

function AppContent() {
  const { currentPath } = useRouter();

  let pageContent;
  switch (currentPath) {
    case "/":
      pageContent = <HomePage />;
      break;
    case "/login":
      pageContent = <LoginPage />;
      break;
    case "/register":
      pageContent = <RegisterPage />;
      break;
    case "/profile":
      pageContent = (
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      );
      break;
    default:
      pageContent = <HomePage />;
      break;
  }

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">{pageContent}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}