// ============================================================
// XORA — Main Application Entry Point
// frontend/src/App.jsx
// ============================================================

import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import { DashboardFilterProvider } from "./context/DashboardFilterContext";
import { RouterProvider, useRouter, ProtectedRoute, AdminRoute } from "./context/RouterContext";
import Navbar from "./components/Navbar";
import BottomNav from "./components/BottomNav";
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
import AdminHomePage from "./pages/AdminHomePage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminSystemPage from "./pages/AdminSystemPage";
import DashboardPage from "./pages/DashboardPage";
import ProgressPage from "./pages/ProgressPage";
import NotFoundPage from "./pages/NotFoundPage";

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
  } else if (currentPath === "/dashboard") {
    pageContent = (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    );
  } else if (currentPath === "/progress" || currentPath === "/history") {
    pageContent = (
      <ProtectedRoute>
        <ProgressPage />
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
  } else if (currentPath.startsWith("/assessments/result/") || currentPath.startsWith("/assessments/results/")) {
    const attemptId = currentPath.replace(/^\/assessments\/results?\//, "");
    pageContent = (
      <ProtectedRoute>
        <AssessmentResultPage attemptId={attemptId} />
      </ProtectedRoute>
    );
  } else if (currentPath.startsWith("/attempts/")) {
    const attemptId = currentPath.replace("/attempts/", "");
    pageContent = (
      <ProtectedRoute>
        <AssessmentResultPage attemptId={attemptId} />
      </ProtectedRoute>
    );
  } else if (currentPath.startsWith("/verification/")) {
    const diagnosticId = currentPath.replace("/verification/", "");
    pageContent = (
      <ProtectedRoute>
        <AssessmentPage diagnosticId={diagnosticId} isVerification={true} />
      </ProtectedRoute>
    );
  } else if (currentPath.startsWith("/practice/")) {
    const actionId = currentPath.replace("/practice/", "");
    pageContent = (
      <ProtectedRoute>
        <AssessmentPage actionId={actionId} isPractice={true} />
      </ProtectedRoute>
    );
  } else if (currentPath.startsWith("/reassess/")) {
    const assessmentId = currentPath.replace("/reassess/", "");
    pageContent = (
      <ProtectedRoute>
        <AssessmentPage assessmentId={assessmentId} isReassessment={true} />
      </ProtectedRoute>
    );
  } else if (currentPath.startsWith("/assessments/")) {
    const assessmentId = currentPath.replace("/assessments/", "");
    pageContent = (
      <ProtectedRoute>
        <AssessmentPage assessmentId={assessmentId} />
      </ProtectedRoute>
    );
  } else if (currentPath === "/admin" || currentPath === "/admin/") {
    pageContent = (
      <AdminRoute>
        <AdminHomePage />
      </AdminRoute>
    );
  } else if (currentPath === "/admin/users") {
    pageContent = (
      <AdminRoute>
        <AdminUsersPage />
      </AdminRoute>
    );
  } else if (currentPath === "/admin/system") {
    pageContent = (
      <AdminRoute>
        <AdminSystemPage />
      </AdminRoute>
    );
  } else if (currentPath === "/admin/assessments") {
    pageContent = (
      <AdminRoute>
        <AdminAssessmentsPage />
      </AdminRoute>
    );
  } else if (currentPath.startsWith("/admin/assessments/")) {
    const assessmentId = currentPath.replace("/admin/assessments/", "");
    pageContent = (
      <AdminRoute>
        <AdminAssessmentEditorPage assessmentId={assessmentId} />
      </AdminRoute>
    );
  } else {
    pageContent = <NotFoundPage />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink dark:bg-canvas-dark dark:text-ink-dark">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">{pageContent}</main>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RouterProvider>
          <DashboardFilterProvider>
            <AppContent />
          </DashboardFilterProvider>
        </RouterProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}