// ============================================================
// XORA — Main Application Entry Point
// frontend/src/App.jsx
// ============================================================

import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { RouterProvider, useRouter, ProtectedRoute, AdminRoute } from "./context/RouterContext";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import LearningPathPage from "./pages/LearningPathPage";
import AssessmentListPage from "./pages/AssessmentListPage";
import AssessmentPage from "./pages/AssessmentPage";
import AssessmentResultPage from "./pages/AssessmentResultPage";
import AdminAssessmentsPage from "./pages/AdminAssessmentsPage";
import AdminAssessmentEditorPage from "./pages/AdminAssessmentEditorPage";

function AppContent() {
  const { currentPath } = useRouter();

  let pageContent;

  if (currentPath === "/") {
    pageContent = <HomePage />;
  } else if (currentPath === "/login") {
    pageContent = <LoginPage />;
  } else if (currentPath === "/register") {
    pageContent = <RegisterPage />;
  } else if (currentPath === "/profile") {
    pageContent = (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    );
  } else if (currentPath === "/learning-path") {
    pageContent = (
      <ProtectedRoute>
        <LearningPathPage />
      </ProtectedRoute>
    );
  } else if (currentPath === "/assessments") {
    pageContent = (
      <ProtectedRoute>
        <AssessmentListPage />
      </ProtectedRoute>
    );
  } else if (currentPath.startsWith("/assessments/result/")) {
    const attemptId = currentPath.replace("/assessments/result/", "").split("?")[0];
    pageContent = (
      <ProtectedRoute>
        <AssessmentResultPage attemptId={attemptId} />
      </ProtectedRoute>
    );
  } else if (currentPath.startsWith("/attempts/")) {
    const attemptId = currentPath.replace("/attempts/", "").split("?")[0];
    pageContent = (
      <ProtectedRoute>
        <AssessmentResultPage attemptId={attemptId} />
      </ProtectedRoute>
    );
  } else if (currentPath.startsWith("/assessments/")) {
    const assessmentId = currentPath.replace("/assessments/", "").split("?")[0];
    pageContent = (
      <ProtectedRoute>
        <AssessmentPage assessmentId={assessmentId} />
      </ProtectedRoute>
    );
  } else if (currentPath === "/admin/assessments") {
    pageContent = (
      <AdminRoute>
        <AdminAssessmentsPage />
      </AdminRoute>
    );
  } else if (currentPath.startsWith("/admin/assessments/")) {
    const assessmentId = currentPath.replace("/admin/assessments/", "").split("?")[0];
    pageContent = (
      <AdminRoute>
        <AdminAssessmentEditorPage assessmentId={assessmentId} />
      </AdminRoute>
    );
  } else {
    pageContent = <HomePage />;
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