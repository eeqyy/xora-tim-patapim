// ============================================================
// XORA — Frontend API Client
// frontend/src/services/api.js
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const TOKEN_KEY = "xora_auth_token";

export const tokenStorage = {
  get: () => {
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (!raw) return null;
      // Handle cases where token was saved as JSON serialized object or string
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed === "string") return parsed.trim();
        if (parsed && typeof parsed === "object") {
          const val = parsed.token || parsed.accessToken || parsed.id || null;
          return val ? String(val).trim() : null;
        }
      } catch {
        return raw.trim();
      }
      return raw.trim();
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      if (token) {
        const tokenStr = typeof token === "object"
          ? (token.token || token.accessToken || JSON.stringify(token))
          : String(token).trim();
        localStorage.setItem(TOKEN_KEY, tokenStr);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};

/**
 * Core fetch wrapper with JSON serialization & error normalization
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Determine token: prioritize explicit string/object token, fallback to tokenStorage.get()
  let rawToken = options.token;
  if (!rawToken || (typeof rawToken === "string" && !rawToken.trim())) {
    rawToken = tokenStorage.get();
  } else if (typeof rawToken === "object") {
    rawToken = rawToken.token || rawToken.accessToken || rawToken.id || tokenStorage.get();
  }

  if (rawToken && typeof rawToken === "string") {
    let clean = rawToken.trim();
    if (clean.startsWith("Bearer ")) {
      clean = clean.slice(7).trim();
    }
    if (clean && clean !== "undefined" && clean !== "null" && clean !== "[object Object]") {
      headers["Authorization"] = `Bearer ${clean}`;
    }
  }

  const config = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  let res;
  try {
    res = await fetch(url, config);
  } catch (netErr) {
    throw new Error(`Koneksi ke backend gagal: ${netErr.message}`);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const errorMsg = json?.message || `Permintaan gagal dengan status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

export const authApi = {
  register: ({ name, email, password }) =>
    apiRequest("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    }),

  login: ({ email, password }) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  getMe: (token) =>
    apiRequest("/api/auth/me", {
      method: "GET",
      token,
    }),

  logout: (token) =>
    apiRequest("/api/auth/logout", {
      method: "POST",
      token,
    }),
};

export const profileApi = {
  getProfile: (token) =>
    apiRequest("/api/profile", {
      method: "GET",
      token,
    }),

  updateProfile: ({ name, learning_goal, experience_level, preferred_subject_id }, token) => {
    const body = {};
    if (name !== undefined) body.name = name;
    if (learning_goal !== undefined) body.learning_goal = learning_goal;
    if (experience_level !== undefined) body.experience_level = experience_level;
    if (preferred_subject_id !== undefined) body.preferred_subject_id = preferred_subject_id;

    return apiRequest("/api/profile", {
      method: "PATCH",
      body,
      token,
    });
  },

  completeOnboarding: (token) =>
    apiRequest("/api/profile/onboarding", {
      method: "PATCH",
      token,
    }),
};

export const subjectsApi = {
  getAll: () =>
    apiRequest("/api/subjects", {
      method: "GET",
    }),
};

// Daftar konsep (menyertakan subject_id) — dipakai untuk memetakan
// konsep ke "kelas" (subject) saat memfilter dashboard.
export const conceptsApi = {
  getAll: (token) => apiRequest("/api/concepts", { method: "GET", token }),
  getById: (id, token) => apiRequest(`/api/concepts/${id}`, { method: "GET", token }),
};

export const learningPathApi = {
  getPath: (subjectId, token) => {
    const endpoint = subjectId ? `/api/learning-path/${subjectId}` : "/api/learning-path";
    return apiRequest(endpoint, {
      method: "GET",
      token,
    });
  },
};

export const assessmentsApi = {
  getAll: (params = {}, token) => {
    const query = new URLSearchParams();
    if (params.subject_id) query.append("subject_id", params.subject_id);
    if (params.level_id) query.append("level_id", params.level_id);
    if (params.topic_id) query.append("topic_id", params.topic_id);
    if (params.type) query.append("type", params.type);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/assessments${qs}`, { method: "GET", token });
  },

  getById: (id, token) =>
    apiRequest(`/api/assessments/${id}`, { method: "GET", token }),

  getQuestions: (id, tokenOrAttemptId = null, maybeAttemptId = null) => {
    let token = null;
    let attemptId = null;

    if (maybeAttemptId) {
      token = tokenOrAttemptId;
      attemptId = maybeAttemptId;
    } else if (tokenOrAttemptId) {
      // Check if 2nd arg is an attemptId (UUID format) rather than a JWT/token
      if (typeof tokenOrAttemptId === "string" && tokenOrAttemptId.length === 36 && tokenOrAttemptId.includes("-")) {
        attemptId = tokenOrAttemptId;
      } else {
        token = tokenOrAttemptId;
      }
    }

    const qs = attemptId ? `?attemptId=${encodeURIComponent(attemptId)}` : "";
    return apiRequest(`/api/assessments/${id}/questions${qs}`, { method: "GET", token });
  },

  startAttempt: (id, token) =>
    apiRequest(`/api/assessments/${id}/attempts`, { method: "POST", token }),

  reassess: (id, token) =>
    apiRequest(`/api/assessments/${id}/reassess`, { method: "POST", token }),

  submitAttempt: (attemptId, answers, token) =>
    apiRequest(`/api/assessments/attempts/${attemptId}/submit`, {
      method: "POST",
      body: { answers },
      token,
    }),

  getAttempt: (attemptId, token) =>
    apiRequest(`/api/assessments/attempts/${attemptId}`, { method: "GET", token }),

  getLevelStatus: (token) =>
    apiRequest("/api/assessments/levels/status", { method: "GET", token }),

  retryGapAnalysis: (attemptId, token) =>
    apiRequest(`/api/assessments/attempts/${attemptId}/analyze-gap`, { method: "POST", token }),
};

export const attemptsApi = {
  getById: (id, token) =>
    apiRequest(`/api/attempts/${id}`, { method: "GET", token }),

  submit: (id, answers, token) =>
    apiRequest(`/api/attempts/${id}/submit`, {
      method: "POST",
      body: { answers },
      token,
    }),
};

/**
 * Data referensi untuk form admin (level / topik / konsep).
 * Endpoint ini publik, tanpa token.
 */
export const referenceApi = {
  getLevels: () => apiRequest("/api/levels", { method: "GET" }),

  getTopics: () => apiRequest("/api/topics", { method: "GET" }),

  getConcepts: () => apiRequest("/api/concepts", { method: "GET" }),
};

/**
 * Admin CRUD assessment — butuh role ADMIN.
 * `getFull` mengembalikan assessment + seluruh soal termasuk kunci jawaban
 * (dipakai editor admin; peserta tetap memakai assessmentsApi.getQuestions).
 */
export const adminAssessmentsApi = {
  getFull: (id, token) =>
    apiRequest(`/api/assessments/admin/full/${id}`, { method: "GET", token }),

  create: (body, token) =>
    apiRequest("/api/assessments", { method: "POST", body, token }),

  update: (id, body, token) =>
    apiRequest(`/api/assessments/${id}`, { method: "PUT", body, token }),

  remove: (id, token) =>
    apiRequest(`/api/assessments/${id}`, { method: "DELETE", token }),
};

export const adminQuestionsApi = {
  create: (assessmentId, body, token) =>
    apiRequest(`/api/assessments/${assessmentId}/questions`, {
      method: "POST",
      body,
      token,
    }),

  update: (assessmentId, questionId, body, token) =>
    apiRequest(`/api/assessments/${assessmentId}/questions/${questionId}`, {
      method: "PUT",
      body,
      token,
    }),

  remove: (assessmentId, questionId, token) =>
    apiRequest(`/api/assessments/${assessmentId}/questions/${questionId}`, {
      method: "DELETE",
      token,
    }),

  reorder: (assessmentId, orderedIds, token) =>
    apiRequest(`/api/assessments/${assessmentId}/questions/reorder`, {
      method: "PUT",
      body: { orderedIds },
      token,
    }),
};

export const adminQuestionBankApi = {
  list: (params = {}, token) => {
    const query = new URLSearchParams();
    if (params.material) query.append("material", params.material);
    if (params.difficulty) query.append("difficulty", params.difficulty);
    if (params.type) query.append("type", params.type);
    if (params.is_active !== undefined) query.append("is_active", params.is_active);
    if (params.search) query.append("search", params.search);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/assessments/admin/questions/bank${qs}`, { method: "GET", token });
  },

  create: (body, token) =>
    apiRequest("/api/assessments/admin/questions/bank", {
      method: "POST",
      body,
      token,
    }),

  getById: (id, token) =>
    apiRequest(`/api/assessments/admin/questions/bank/${id}`, { method: "GET", token }),

  update: (id, body, token) =>
    apiRequest(`/api/assessments/admin/questions/bank/${id}`, {
      method: "PUT",
      body,
      token,
    }),

  remove: (id, token) =>
    apiRequest(`/api/assessments/admin/questions/bank/${id}`, {
      method: "DELETE",
      token,
    }),

  toggleActive: (id, token) =>
    apiRequest(`/api/assessments/admin/questions/bank/${id}/toggle-active`, {
      method: "PATCH",
      token,
    }),
};

export const masteryApi = {
  getSummary: (token) =>
    apiRequest("/api/mastery", { method: "GET", token }),

  getConceptMastery: (conceptId, token) =>
    apiRequest(`/api/mastery/concepts/${conceptId}`, { method: "GET", token }),
};

export const gapsApi = {
  list: (token) =>
    apiRequest("/api/gaps", { method: "GET", token }),

  getDetail: (conceptId, token) =>
    apiRequest(`/api/gaps/${conceptId}`, { method: "GET", token }),

  diagnose: (conceptId, token) =>
    apiRequest(`/api/gaps/${conceptId}/diagnose`, { method: "POST", token }),
};

export const diagnosticsApi = {
  getDetail: (id, token) =>
    apiRequest(`/api/diagnostics/${id}`, { method: "GET", token }),

  startVerification: (id, token) =>
    apiRequest(`/api/diagnostics/${id}/verify/start`, { method: "POST", token }),
};

export const recommendationsApi = {
  list: (token) =>
    apiRequest("/api/recommendations", { method: "GET", token }),

  getNextStep: (token) =>
    apiRequest("/api/recommendations/next", { method: "GET", token }),

  getMaterials: (id, token) =>
    apiRequest(`/api/recommendations/${id}/materials`, { method: "GET", token }),

  start: (id, token) =>
    apiRequest(`/api/recommendations/${id}/start`, { method: "POST", token }),

  startPractice: (id, token) =>
    apiRequest(`/api/recommendations/${id}/start`, { method: "POST", token }),

  submit: (attemptId, answers, token) =>
    apiRequest(`/api/assessments/attempts/${attemptId}/submit`, {
      method: "POST",
      body: { answers },
      token,
    }),

  getResult: (attemptId, token) =>
    apiRequest(`/api/assessments/attempts/${attemptId}`, { method: "GET", token }),

  complete: (id, token) =>
    apiRequest(`/api/recommendations/${id}/complete`, { method: "POST", token }),

  skip: (id, token) =>
    apiRequest(`/api/recommendations/${id}/skip`, { method: "POST", token }),
};

export const practicesApi = {
  list: (params = {}, token) => {
    const query = new URLSearchParams();
    if (params.subjectId) query.append("subjectId", params.subjectId);
    if (params.levelId) query.append("levelId", params.levelId);
    if (params.conceptId) query.append("conceptId", params.conceptId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/practices${qs}`, { method: "GET", token });
  },

  getById: (id, token) =>
    apiRequest(`/api/practices/${id}`, { method: "GET", token }),

  start: (id, token) =>
    apiRequest(`/api/practices/${id}/start`, { method: "POST", token }),

  submit: (attemptId, answers, token) =>
    apiRequest(`/api/practices/attempts/${attemptId}/submit`, {
      method: "POST",
      body: { answers },
      token,
    }),

  getResult: (attemptId, token) =>
    apiRequest(`/api/practices/attempts/${attemptId}/result`, { method: "GET", token }),
};

export const historyApi = {
  getHistory: (params = {}, token) => {
    const query = new URLSearchParams();
    if (params.limit) query.append("limit", params.limit);
    if (params.offset) query.append("offset", params.offset);
    if (params.eventType) query.append("eventType", params.eventType);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/history${qs}`, { method: "GET", token });
  },

  getProgress: (params = {}, token) =>
    historyApi.getHistory(params, token),
};

export const systemApi = {
  getHealth: () =>
    apiRequest("/api/health", {
      method: "GET",
    }),
};

/**
 * Admin — kelola akun pengguna. Butuh role ADMIN.
 * Semua endpoint di bawah prefix /api/admin (lihat backend/routes/admin.js).
 */
export const adminUsersApi = {
  list: (params = {}, token) => {
    const query = new URLSearchParams();
    if (params.search) query.append("search", params.search);
    if (params.role) query.append("role", params.role);
    if (params.status) query.append("status", params.status);
    if (params.limit) query.append("limit", params.limit);
    if (params.offset) query.append("offset", params.offset);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/admin/users${qs}`, { method: "GET", token });
  },

  getById: (id, token) =>
    apiRequest(`/api/admin/users/${id}`, { method: "GET", token }),

  updateStatus: (id, status, token) =>
    apiRequest(`/api/admin/users/${id}/status`, {
      method: "PATCH",
      body: { status },
      token,
    }),

  updateRoles: (id, roles, token) =>
    apiRequest(`/api/admin/users/${id}/roles`, {
      method: "PUT",
      body: { roles },
      token,
    }),

  resetPassword: (id, newPassword, token) =>
    apiRequest(`/api/admin/users/${id}/reset-password`, {
      method: "POST",
      body: { newPassword },
      token,
    }),

  // Ringkasan analitik learner (read-only) untuk dashboard admin.
  getAnalytics: (id, token) =>
    apiRequest(`/api/admin/users/${id}/analytics`, { method: "GET", token }),
};

/**
 * Admin — pantau kesehatan sistem & data. Butuh role ADMIN.
 */
export const adminSystemApi = {
  getHealth: (token) =>
    apiRequest("/api/admin/system/health", { method: "GET", token }),

  getStats: (token) =>
    apiRequest("/api/admin/system/stats", { method: "GET", token }),

  getActivity: (params = {}, token) => {
    const query = new URLSearchParams();
    if (params.limit) query.append("limit", params.limit);
    if (params.offset) query.append("offset", params.offset);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/admin/system/activity${qs}`, { method: "GET", token });
  },

  getAnalytics: (token) =>
    apiRequest("/api/admin/system/analytics", { method: "GET", token }),
};

/**
 * Admin — konfigurasi AI (API key + model). Butuh role ADMIN.
 * API key mentah tidak pernah dikembalikan oleh backend.
 */
export const adminAiApi = {
  // Ringkasan: provider aktif + daftar provider + health.
  getStatus: (token) => apiRequest("/api/admin/ai", { method: "GET", token }),

  list: (token) => apiRequest("/api/admin/ai/providers", { method: "GET", token }),

  create: (body, token) =>
    apiRequest("/api/admin/ai/providers", { method: "POST", body, token }),

  update: (id, body, token) =>
    apiRequest(`/api/admin/ai/providers/${id}`, { method: "PUT", body, token }),

  remove: (id, token) =>
    apiRequest(`/api/admin/ai/providers/${id}`, { method: "DELETE", token }),

  activate: (id, token) =>
    apiRequest(`/api/admin/ai/providers/${id}/activate`, { method: "PATCH", token }),

  // Muat daftar model: pakai key yang dikirim (draft) atau provider tersimpan.
  fetchModels: (body, token) =>
    apiRequest("/api/admin/ai/models", { method: "POST", body, token }),

  fetchModelsForProvider: (id, token) =>
    apiRequest(`/api/admin/ai/providers/${id}/models`, { method: "POST", token }),

  // Uji koneksi (chat round-trip JSON). Bisa draft (body) atau provider tersimpan.
  test: (body, token) =>
    apiRequest("/api/admin/ai/test", { method: "POST", body, token }),

  testProvider: (id, body, token) =>
    apiRequest(`/api/admin/ai/providers/${id}/test`, { method: "POST", body, token }),
};
