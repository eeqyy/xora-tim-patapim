// ============================================================
// XOLEARN — Dashboard Filter Context
// frontend/src/context/DashboardFilterContext.jsx
// ------------------------------------------------------------
// Menyimpan konteks analitik (Kelas = subject, Siswa = learner)
// agar bisa dirender di header (Navbar) sekaligus dikonsumsi
// DashboardPage tanpa fetch ganda.
// ============================================================

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";
import { subjectsApi, conceptsApi, adminUsersApi } from "../services/api";

const SUBJECT_KEY = "xora_dashboard_subject";
const LEARNER_KEY = "xora_dashboard_learner";

const DashboardFilterContext = createContext(null);

function readSaved(key) {
  try {
    return localStorage.getItem(key) || "";
  } catch {
    return "";
  }
}

function saveValue(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    // Abaikan error storage.
  }
}

export function DashboardFilterProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

  const [subjects, setSubjects] = useState([]);
  const [learners, setLearners] = useState([]);
  const [conceptSubject, setConceptSubject] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(() => readSaved(SUBJECT_KEY));
  const [selectedLearnerId, setSelectedLearnerId] = useState("");

  // Muat referensi (kelas, peta konsep->kelas, daftar learner).
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let isMounted = true;

    const load = async () => {
      const [subjRes, conceptRes, learnersRes] = await Promise.allSettled([
        subjectsApi.getAll(),
        conceptsApi.getAll(),
        isAdmin ? adminUsersApi.list({ role: "LEARNER", limit: 100 }) : Promise.resolve(null),
      ]);

      if (!isMounted) return;

      if (subjRes.status === "fulfilled") {
        setSubjects(Array.isArray(subjRes.value?.data) ? subjRes.value.data : []);
      }
      if (conceptRes.status === "fulfilled") {
        const map = {};
        (conceptRes.value?.data || []).forEach((c) => {
          map[c.id] = c.subject_id;
        });
        setConceptSubject(map);
      }
      if (isAdmin && learnersRes.status === "fulfilled") {
        const payload = learnersRes.value?.data;
        const list = Array.isArray(payload) ? payload : payload?.items || [];
        setLearners(list);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, isAdmin]);

  // Tentukan learner terpilih: admin pilih dari daftar, learner = dirinya.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isAdmin) {
      setSelectedLearnerId(user?.id || "");
      return;
    }
    if (!learners.length) return;
    setSelectedLearnerId((prev) => {
      if (prev && learners.some((l) => l.id === prev)) return prev;
      const saved = readSaved(LEARNER_KEY);
      if (saved && learners.some((l) => l.id === saved)) return saved;
      return learners[0]?.id || "";
    });
  }, [isAuthenticated, isAdmin, learners, user?.id]);

  useEffect(() => {
    saveValue(SUBJECT_KEY, selectedSubject);
  }, [selectedSubject]);

  useEffect(() => {
    if (isAdmin) saveValue(LEARNER_KEY, selectedLearnerId);
  }, [isAdmin, selectedLearnerId]);

  const value = useMemo(
    () => ({
      isAdmin,
      subjects,
      learners,
      conceptSubject,
      selectedSubject,
      setSelectedSubject,
      selectedLearnerId,
      setSelectedLearnerId,
    }),
    [isAdmin, subjects, learners, conceptSubject, selectedSubject, selectedLearnerId]
  );

  return (
    <DashboardFilterContext.Provider value={value}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilter() {
  return useContext(DashboardFilterContext);
}
