// ============================================================
// XORA — Admin sub-navigation (tabs)
// frontend/src/components/ui/AdminNav.jsx
// ============================================================
// Deretan tab horizontal untuk area admin. Dipakai AdminAssessmentsPage,
// AdminSubjectsPage, AdminLevelsPage, AdminTopicsPage, AdminConceptsPage,
// dan AdminMaterialsPage.
// Memakai kelas legacy `btn` yang sudah ada — konsisten dengan area admin.

import React from "react";
import { useRouter } from "../../context/RouterContext";

const TABS = [
  { path: "/admin/assessments", label: "Asesmen" },
  { path: "/admin/subjects", label: "Subjek" },
  { path: "/admin/levels", label: "Level" },
  { path: "/admin/topics", label: "Topik" },
  { path: "/admin/concepts", label: "Konsep" },
  { path: "/admin/materials", label: "Materi" },
  { path: "/admin/users", label: "Pengguna" },
  { path: "/admin/learning-paths", label: "Learning Path" },
];

export default function AdminNav() {
  const { currentPath, navigate } = useRouter();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
      {TABS.map((tab) => {
        const active = currentPath.startsWith(tab.path);
        return (
          <button
            key={tab.path}
            type="button"
            className={`btn btn-sm ${active ? "btn-primary" : "btn-secondary"}`}
            onClick={() => navigate(tab.path)}
            aria-current={active ? "page" : undefined}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}